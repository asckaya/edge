import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { customAlphabet } from "nanoid";
import * as v from "valibot";
import type { EdgeEnv } from "../env";

export const shortlinkApp = new Hono<{ Bindings: EdgeEnv }>();

const SHORT_SLUG_LENGTH = 21;
const SHORT_SLUG_ALPHABET = customAlphabet(
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",
	SHORT_SLUG_LENGTH,
);

// Shared slug validation pattern: used both by the valibot POST schema (via
// .source, since valibot's v.regex needs a regex *literal source string*) and
// by the GET /s/:slug handler (as a RegExp test).
const SLUG_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * Ordinary links (random slug, no admin key) are self-cleaning: they expire after
 * three months without a single hit. Custom slugs created by the admin stay
 * forever unless the admin picks an explicit TTL.
 */
const ORDINARY_TTL_SECONDS = 90 * 24 * 60 * 60;

/** Renew the sliding expiry at most once per day to stay inside the KV write budget. */
const RENEW_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Per-isolate fixed-window limiter for link creation. KV read/write quotas are
 * the scarce resource here, so creation — the only path that writes without an
 * admin key — is throttled per client IP. Isolates are independent, which is
 * acceptable: this blunts floods rather than enforcing a global counter.
 */
const CREATE_LIMIT = 20;
const CREATE_WINDOW_MS = 60 * 60 * 1000;
const CREATE_LIMIT_MAX_ENTRIES = 5_000;
const createWindows = new Map<string, { count: number; resetAt: number }>();

function consumeCreateQuota(clientId: string): { allowed: boolean; retryAfter: number } {
	const now = Date.now();
	const bucket = createWindows.get(clientId);

	if (!bucket || bucket.resetAt <= now) {
		if (createWindows.size >= CREATE_LIMIT_MAX_ENTRIES) {
			for (const [key, value] of createWindows) {
				if (value.resetAt <= now) createWindows.delete(key);
			}
			if (createWindows.size >= CREATE_LIMIT_MAX_ENTRIES) createWindows.clear();
		}
		createWindows.set(clientId, { count: 1, resetAt: now + CREATE_WINDOW_MS });
		return { allowed: true, retryAfter: 0 };
	}

	if (bucket.count >= CREATE_LIMIT) {
		return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
	}

	bucket.count += 1;
	return { allowed: true, retryAfter: 0 };
}

/** Test hook: drop all throttling state between cases. */
export function resetCreateQuota(): void {
	createWindows.clear();
}

function clientId(c: { req: { header: (name: string) => string | undefined } }): string {
	return c.req.header("cf-connecting-ip") ?? c.req.header("x-real-ip") ?? "unknown";
}

const ShortenRequestSchema = v.object({
	target: v.pipe(v.string(), v.url()),
	slug: v.optional(
		v.pipe(v.string(), v.minLength(3), v.maxLength(64), v.regex(new RegExp(SLUG_PATTERN.source))),
	),
	accessKey: v.optional(v.pipe(v.string(), v.minLength(4), v.maxLength(128))),
	ttlSeconds: v.optional(v.pipe(v.number(), v.integer(), v.minValue(60), v.maxValue(31536000))),
});

shortlinkApp.post(
	"/api/shorten",
	sValidator("json", ShortenRequestSchema, (result, c) => {
		if (!result.success) {
			return c.json({ error: "Invalid parameters", issues: result.error }, 400);
		}
		return;
	}),
	async (c) => {
		const kv = c.env?.EDGE_KV;
		if (!kv) {
			return c.json({ error: "KV not bound" }, 500);
		}

		const { target, slug: customSlug, accessKey, ttlSeconds } = c.req.valid("json");

		const quota = consumeCreateQuota(clientId(c));
		if (!quota.allowed) {
			c.header("Retry-After", String(quota.retryAfter));
			return c.json({ error: "Too many short links created, slow down" }, 429);
		}

		// Custom slug (for personal fixed links) requires admin key
		if (customSlug) {
			const adminKey = c.env?.EDGE_ADMIN_KEY;
			if (!adminKey || c.req.header("x-admin-key") !== adminKey) {
				return c.json({ error: "Custom slug requires admin key" }, 403);
			}
		}

		const slug = customSlug ?? SHORT_SLUG_ALPHABET();

		// Reserve namespaced keys so we don't collide with future keys
		const recordKey = `sl:${slug}`;
		const existing = await kv.get(recordKey);
		if (existing !== null) {
			return c.json({ error: "Slug already exists" }, 409);
		}

		// Ordinary links are ephemeral by default; admin custom slugs are not.
		const effectiveTtl = ttlSeconds ?? (customSlug ? undefined : ORDINARY_TTL_SECONDS);
		const record: Record<string, unknown> = { target, createdAt: Date.now() };
		if (accessKey) {
			record.accessKey = accessKey;
		}
		if (effectiveTtl) {
			record.ttl = effectiveTtl;
		}

		const kvOptions: { expirationTtl?: number } = {};
		if (effectiveTtl) {
			kvOptions.expirationTtl = effectiveTtl;
		}
		await kv.put(recordKey, JSON.stringify(record), kvOptions);

		const shortUrl = new URL(c.req.url);
		shortUrl.pathname = `/s/${slug}`;
		shortUrl.search = "";

		return c.json({ slug, shortUrl: shortUrl.toString(), target });
	},
);

shortlinkApp.get("/s/:slug", async (c) => {
	const kv = c.env?.EDGE_KV;
	if (!kv) {
		return c.text("Short link service unavailable", 503);
	}

	const slug = c.req.param("slug");
	if (!(slug && SLUG_PATTERN.test(slug))) {
		return c.text("Not found", 404);
	}

	const raw = await kv.get(`sl:${slug}`);
	if (!raw) {
		return c.text("Not found", 404);
	}

	let record: {
		target?: string;
		accessKey?: string;
		ttl?: number;
		createdAt?: number;
		lastUsedAt?: number;
	};
	try {
		record = JSON.parse(raw);
	} catch {
		return c.text("Not found", 404);
	}

	if (!record.target) {
		return c.text("Not found", 404);
	}

	// Access-key-protected slug: verify ?key=
	if (record.accessKey) {
		const provided = new URL(c.req.url).searchParams.get("key");
		if (provided !== record.accessKey) {
			// Return 404 (not 401) to avoid confirming slug existence
			return c.text("Not found", 404);
		}
	}

	// Sliding expiry: a link that is actually used stays alive, an unused one is
	// garbage-collected by KV itself once its TTL elapses.
	if (record.ttl) {
		const last = record.lastUsedAt ?? record.createdAt ?? 0;
		if (Date.now() - last > RENEW_INTERVAL_MS) {
			const renewed = JSON.stringify({ ...record, lastUsedAt: Date.now() });
			const write = kv.put(`sl:${slug}`, renewed, { expirationTtl: record.ttl });
			try {
				c.executionCtx.waitUntil(write);
			} catch {
				void write;
			}
		}
	}

	// Merge access-time query params (except key) into the stored target URL.
	// This lets clients override type/mode without re-creating the short link,
	// keeping the stored target kernel-agnostic.
	const accessUrl = new URL(c.req.url);
	const targetUrl = new URL(record.target);
	for (const [k, v] of accessUrl.searchParams) {
		if (k === "key") continue;
		targetUrl.searchParams.set(k, v);
	}

	return Response.redirect(targetUrl.toString(), 302);
});

shortlinkApp.get("/api/expand/:slug", async (c) => {
	const kv = c.env?.EDGE_KV;
	if (!kv) {
		return c.json({ error: "KV not bound" }, 500);
	}
	const slug = c.req.param("slug");
	if (!SLUG_PATTERN.test(slug)) {
		return c.json({ error: "Not found" }, 404);
	}
	const raw = await kv.get(`sl:${slug}`);
	if (!raw) {
		return c.json({ error: "Not found" }, 404);
	}

	let record: { target?: string; accessKey?: string };
	try {
		record = JSON.parse(raw);
	} catch {
		return c.json({ error: "Not found" }, 404);
	}
	if (!record.target) {
		return c.json({ error: "Not found" }, 404);
	}

	// Accessibility parity with GET /s/:slug: a key-protected link must not reveal
	// its target just because the slug leaked. Admins bypass with x-admin-key.
	if (record.accessKey) {
		const adminKey = c.env?.EDGE_ADMIN_KEY;
		const isAdmin = Boolean(adminKey) && c.req.header("x-admin-key") === adminKey;
		if (!isAdmin && c.req.query("key") !== record.accessKey) {
			return c.json({ error: "Not found" }, 404);
		}
	}

	return c.json({ slug, target: record.target });
});

const ShortenUpdateSchema = v.object({
	target: v.optional(v.pipe(v.string(), v.url())),
	accessKey: v.optional(v.pipe(v.string(), v.minLength(4), v.maxLength(128))),
	ttlSeconds: v.optional(v.pipe(v.number(), v.integer(), v.minValue(60), v.maxValue(31536000))),
});

// Update an existing slug (requires admin key). Used for personal fixed links
// where the URL stays constant but the target config evolves.
shortlinkApp.put(
	"/api/shorten/:slug",
	sValidator("json", ShortenUpdateSchema, (result, c) => {
		if (!result.success) {
			return c.json({ error: "Invalid parameters", issues: result.error }, 400);
		}
		return;
	}),
	async (c) => {
		const kv = c.env?.EDGE_KV;
		if (!kv) {
			return c.json({ error: "KV not bound" }, 500);
		}

		const adminKey = c.env?.EDGE_ADMIN_KEY;
		if (!adminKey || c.req.header("x-admin-key") !== adminKey) {
			return c.json({ error: "Admin key required" }, 403);
		}

		const slug = c.req.param("slug");
		const recordKey = `sl:${slug}`;
		const existing = await kv.get(recordKey);
		if (existing === null) {
			return c.json({ error: "Slug not found" }, 404);
		}

		const body = c.req.valid("json");

		const prevRecord = JSON.parse(existing) as {
			target: string;
			accessKey?: string;
			createdAt?: number;
		};
		const nextRecord: Record<string, unknown> = {
			target: body.target ?? prevRecord.target,
			createdAt: prevRecord.createdAt ?? Date.now(),
			updatedAt: Date.now(),
		};
		// accessKey: if provided, update it; if omitted, keep the previous value.
		if (body.accessKey) {
			nextRecord.accessKey = body.accessKey;
		} else if (prevRecord.accessKey) {
			nextRecord.accessKey = prevRecord.accessKey;
		}

		const kvOptions: { expirationTtl?: number } = {};
		if (body.ttlSeconds) {
			kvOptions.expirationTtl = body.ttlSeconds;
		}
		await kv.put(recordKey, JSON.stringify(nextRecord), kvOptions);

		return c.json({ slug, updated: true });
	},
);

// Delete a slug (requires admin key).
shortlinkApp.delete("/api/shorten/:slug", async (c) => {
	const kv = c.env?.EDGE_KV;
	if (!kv) {
		return c.json({ error: "KV not bound" }, 500);
	}

	const adminKey = c.env?.EDGE_ADMIN_KEY;
	if (!adminKey || c.req.header("x-admin-key") !== adminKey) {
		return c.json({ error: "Admin key required" }, 403);
	}

	const slug = c.req.param("slug");
	const recordKey = `sl:${slug}`;
	const existing = await kv.get(recordKey);
	if (existing === null) {
		return c.json({ error: "Slug not found" }, 404);
	}
	await kv.delete(recordKey);
	return c.json({ slug, deleted: true });
});
