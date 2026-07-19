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

		const record: Record<string, unknown> = { target, createdAt: Date.now() };
		if (accessKey) {
			record.accessKey = accessKey;
		}

		const kvOptions: { expirationTtl?: number } = {};
		if (ttlSeconds) {
			kvOptions.expirationTtl = ttlSeconds;
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

	let record: { target?: string; accessKey?: string };
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
	const raw = await kv.get(`sl:${slug}`);
	if (!raw) {
		return c.json({ error: "Not found" }, 404);
	}
	const record = JSON.parse(raw) as { target?: string };
	return c.json({ slug, target: record.target ?? null });
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
