import { beforeEach, describe, expect, test } from "vitest";
import { shortlinkApp } from "../../core/src/routes/shortlink";

/**
 * Minimal in-memory KV mock implementing the subset of the Cloudflare KV API
 * that shortlink.ts uses: get / put / delete. State persists within a test and
 * is reset between tests via beforeEach.
 */
function createKvMock() {
	const store = new Map<string, string>();
	return {
		store,
		get: (key: string) => Promise.resolve(store.get(key) ?? null),
		put: (key: string, value: string) => {
			store.set(key, value);
			return Promise.resolve();
		},
		delete: (key: string) => {
			store.delete(key);
			return Promise.resolve();
		},
	};
}

const ADMIN_KEY = "test-admin-key";

function envWith(kv: ReturnType<typeof createKvMock>) {
	return { EDGE_KV: kv, EDGE_ADMIN_KEY: ADMIN_KEY };
}

describe("Shortlink API", () => {
	let kv: ReturnType<typeof createKvMock>;

	beforeEach(() => {
		kv = createKvMock();
	});

	// ---------- POST /api/shorten (random slug) ----------
	describe("POST /api/shorten (random slug)", () => {
		test("creates a short link and returns the slug", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ target: "https://example.com/?type=mihomo&mode=dual" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(200);
			const json = (await res.json()) as Record<string, unknown>;
			expect(json.slug).toBeTruthy();
			expect(json.target).toBe("https://example.com/?type=mihomo&mode=dual");
			expect(json.shortUrl).toContain(`/s/${json.slug}`);
			// persisted in KV
			expect(kv.store.has(`sl:${json.slug}`)).toBe(true);
		});

		test("validates that target URL is required", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				},
				envWith(kv),
			);
			expect(res.status).toBe(400);
		});

		test("validates target must be a URL", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ target: "not-a-url" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(400);
		});

		test("rejects slug shorter than 3 chars", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ target: "https://example.com", slug: "ab" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(400);
		});

		test("rejects slug longer than 64 chars", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ target: "https://example.com", slug: "a".repeat(65) }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(400);
		});

		test("rejects slug with invalid characters", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ target: "https://example.com", slug: "has space!" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(400);
		});

		test("accepts slug with alphanumeric, underscore, hyphen", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ target: "https://example.com", slug: "My_Link-01" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(200);
		});

		test("rejects ttlSeconds below 60", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ target: "https://example.com", ttlSeconds: 59 }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(400);
		});

		test("rejects ttlSeconds above 31536000", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ target: "https://example.com", ttlSeconds: 31536001 }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(400);
		});

		test("accepts ttlSeconds at bounds (60 and 31536000)", async () => {
			for (const ttl of [60, 31536000]) {
				const kv2 = createKvMock();
				const res = await shortlinkApp.request(
					"/api/shorten",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ target: "https://example.com", ttlSeconds: ttl }),
					},
					envWith(kv2),
				);
				expect(res.status).toBe(200);
			}
		});

		test("returns 500 when KV is not bound", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ target: "https://example.com" }),
				},
				{},
			);
			expect(res.status).toBe(500);
		});

		test("returns 400 for invalid JSON body", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: "{not json",
				},
				envWith(kv),
			);
			expect(res.status).toBe(400);
		});
	});

	// ---------- POST /api/shorten (custom slug) ----------
	describe("POST /api/shorten (custom slug)", () => {
		test("requires x-admin-key header matching EDGE_ADMIN_KEY", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ target: "https://example.com", slug: "my-link" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(403);
		});

		test("returns 403 with wrong admin key", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json", "x-admin-key": "wrong" },
					body: JSON.stringify({ target: "https://example.com", slug: "my-link" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(403);
		});

		test("creates a custom slug with valid admin key", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ target: "https://example.com", slug: "my-link" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(200);
			const json = (await res.json()) as Record<string, unknown>;
			expect(json.slug).toBe("my-link");
		});

		test("returns 409 on slug collision", async () => {
			// First create
			await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ target: "https://example.com", slug: "collide" }),
				},
				envWith(kv),
			);
			// Second create with same slug
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ target: "https://other.com", slug: "collide" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(409);
		});

		test("returns 403 when EDGE_ADMIN_KEY is not configured", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten",
				{
					method: "POST",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ target: "https://example.com", slug: "my-link" }),
				},
				{ EDGE_KV: kv },
			);
			expect(res.status).toBe(403);
		});
	});

	// ---------- GET /s/:slug ----------
	describe("GET /s/:slug", () => {
		test("returns 302 redirect to target", async () => {
			kv.store.set("sl:abc", JSON.stringify({ target: "https://target.com/?type=mihomo" }));
			const res = await shortlinkApp.request("/s/abc", {}, envWith(kv));
			expect(res.status).toBe(302);
			expect(res.headers.get("location")).toBe("https://target.com/?type=mihomo");
		});

		test("returns 404 for non-existent slug", async () => {
			const res = await shortlinkApp.request("/s/nonexistent", {}, envWith(kv));
			expect(res.status).toBe(404);
		});

		test("returns 404 (not 401) for wrong access key", async () => {
			kv.store.set(
				"sl:protected",
				JSON.stringify({ target: "https://target.com", accessKey: "secret" }),
			);
			const res = await shortlinkApp.request("/s/protected", {}, envWith(kv));
			expect(res.status).toBe(404);
		});

		test("redirects with correct access key", async () => {
			kv.store.set(
				"sl:protected",
				JSON.stringify({ target: "https://target.com", accessKey: "secret" }),
			);
			const res = await shortlinkApp.request("/s/protected?key=secret", {}, envWith(kv));
			expect(res.status).toBe(302);
			expect(res.headers.get("location")).toBe("https://target.com/");
		});

		test("merges query params (type/mode override works)", async () => {
			kv.store.set(
				"sl:abc",
				JSON.stringify({ target: "https://target.com/?type=mihomo&mode=full" }),
			);
			const res = await shortlinkApp.request("/s/abc?type=sing-box&mode=dual", {}, envWith(kv));
			expect(res.status).toBe(302);
			const location = new URL(res.headers.get("location") ?? "");
			expect(location.searchParams.get("type")).toBe("sing-box");
			expect(location.searchParams.get("mode")).toBe("dual");
		});

		test("strips key param from merged query", async () => {
			kv.store.set(
				"sl:protected",
				JSON.stringify({ target: "https://target.com", accessKey: "secret" }),
			);
			const res = await shortlinkApp.request(
				"/s/protected?key=secret&type=sing-box",
				{},
				envWith(kv),
			);
			expect(res.status).toBe(302);
			const location = new URL(res.headers.get("location") ?? "");
			expect(location.searchParams.has("key")).toBe(false);
			expect(location.searchParams.get("type")).toBe("sing-box");
		});

		test("returns 404 for slug with invalid characters", async () => {
			const res = await shortlinkApp.request("/s/has space", {}, envWith(kv));
			expect(res.status).toBe(404);
		});

		test("returns 503 when KV is not bound", async () => {
			const res = await shortlinkApp.request("/s/abc", {}, {});
			expect(res.status).toBe(503);
		});

		test("returns 404 when stored record has no target", async () => {
			kv.store.set("sl:bad", JSON.stringify({}));
			const res = await shortlinkApp.request("/s/bad", {}, envWith(kv));
			expect(res.status).toBe(404);
		});

		test("returns 404 when stored record is invalid JSON", async () => {
			kv.store.set("sl:corrupt", "not json{");
			const res = await shortlinkApp.request("/s/corrupt", {}, envWith(kv));
			expect(res.status).toBe(404);
		});
	});

	// ---------- GET /api/expand/:slug ----------
	describe("GET /api/expand/:slug", () => {
		test("returns JSON {slug, target}", async () => {
			kv.store.set("sl:abc", JSON.stringify({ target: "https://target.com" }));
			const res = await shortlinkApp.request("/api/expand/abc", {}, envWith(kv));
			expect(res.status).toBe(200);
			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toEqual({ slug: "abc", target: "https://target.com" });
		});

		test("returns 404 for non-existent slug", async () => {
			const res = await shortlinkApp.request("/api/expand/nope", {}, envWith(kv));
			expect(res.status).toBe(404);
		});

		test("returns null target when record has no target", async () => {
			kv.store.set("sl:empty", JSON.stringify({}));
			const res = await shortlinkApp.request("/api/expand/empty", {}, envWith(kv));
			expect(res.status).toBe(200);
			const json = (await res.json()) as Record<string, unknown>;
			expect(json.target).toBeNull();
		});

		test("returns 500 when KV is not bound", async () => {
			const res = await shortlinkApp.request("/api/expand/abc", {}, {});
			expect(res.status).toBe(500);
		});
	});

	// ---------- PUT /api/shorten/:slug (admin) ----------
	describe("PUT /api/shorten/:slug (admin)", () => {
		test("requires admin key", async () => {
			kv.store.set("sl:abc", JSON.stringify({ target: "https://old.com" }));
			const res = await shortlinkApp.request(
				"/api/shorten/abc",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ target: "https://new.com" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(403);
		});

		test("updates target", async () => {
			kv.store.set("sl:abc", JSON.stringify({ target: "https://old.com", createdAt: 1000 }));
			const res = await shortlinkApp.request(
				"/api/shorten/abc",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ target: "https://new.com" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(200);
			const json = (await res.json()) as Record<string, unknown>;
			expect(json.updated).toBe(true);
			const storedRaw = kv.store.get("sl:abc");
			if (storedRaw === undefined) throw new Error("test setup failed: missing stored record");
			const stored = JSON.parse(storedRaw);
			expect(stored.target).toBe("https://new.com");
			expect(stored.createdAt).toBe(1000);
			expect(stored.updatedAt).toBeDefined();
		});

		test("updates accessKey", async () => {
			kv.store.set("sl:abc", JSON.stringify({ target: "https://old.com" }));
			await shortlinkApp.request(
				"/api/shorten/abc",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ accessKey: "newpass" }),
				},
				envWith(kv),
			);
			const storedRaw = kv.store.get("sl:abc");
			if (storedRaw === undefined) throw new Error("test setup failed: missing stored record");
			const stored = JSON.parse(storedRaw);
			expect(stored.accessKey).toBe("newpass");
		});

		test("rejects accessKey shorter than 4 chars (cannot be used to remove)", async () => {
			// The PUT schema requires minLength(4), so an empty string is rejected
			// with 400 rather than removing the accessKey.
			kv.store.set("sl:abc", JSON.stringify({ target: "https://old.com", accessKey: "oldpass" }));
			const res = await shortlinkApp.request(
				"/api/shorten/abc",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ accessKey: "" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(400);
			// original accessKey unchanged
			const storedRaw = kv.store.get("sl:abc");
			if (storedRaw === undefined) throw new Error("test setup failed: missing stored record");
			const stored = JSON.parse(storedRaw);
			expect(stored.accessKey).toBe("oldpass");
		});

		test("preserves existing accessKey when not provided", async () => {
			kv.store.set("sl:abc", JSON.stringify({ target: "https://old.com", accessKey: "keepme" }));
			await shortlinkApp.request(
				"/api/shorten/abc",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ target: "https://new.com" }),
				},
				envWith(kv),
			);
			const storedRaw = kv.store.get("sl:abc");
			if (storedRaw === undefined) throw new Error("test setup failed: missing stored record");
			const stored = JSON.parse(storedRaw);
			expect(stored.accessKey).toBe("keepme");
		});

		test("returns 404 for non-existent slug", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten/nope",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ target: "https://new.com" }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(404);
		});

		test("updates TTL", async () => {
			kv.store.set("sl:abc", JSON.stringify({ target: "https://old.com" }));
			const res = await shortlinkApp.request(
				"/api/shorten/abc",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
					body: JSON.stringify({ ttlSeconds: 3600 }),
				},
				envWith(kv),
			);
			expect(res.status).toBe(200);
		});
	});

	// ---------- DELETE /api/shorten/:slug (admin) ----------
	describe("DELETE /api/shorten/:slug (admin)", () => {
		test("requires admin key", async () => {
			kv.store.set("sl:abc", JSON.stringify({ target: "https://old.com" }));
			const res = await shortlinkApp.request("/api/shorten/abc", { method: "DELETE" }, envWith(kv));
			expect(res.status).toBe(403);
			expect(kv.store.has("sl:abc")).toBe(true);
		});

		test("deletes the record", async () => {
			kv.store.set("sl:abc", JSON.stringify({ target: "https://old.com" }));
			const res = await shortlinkApp.request(
				"/api/shorten/abc",
				{ method: "DELETE", headers: { "x-admin-key": ADMIN_KEY } },
				envWith(kv),
			);
			expect(res.status).toBe(200);
			const json = (await res.json()) as Record<string, unknown>;
			expect(json.deleted).toBe(true);
			expect(kv.store.has("sl:abc")).toBe(false);
		});

		test("returns 404 for non-existent slug", async () => {
			const res = await shortlinkApp.request(
				"/api/shorten/nope",
				{ method: "DELETE", headers: { "x-admin-key": ADMIN_KEY } },
				envWith(kv),
			);
			expect(res.status).toBe(404);
		});
	});
});
