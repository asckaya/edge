import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchSubscriptionNodes } from "../../core/src/utils/subscription-parser";

describe("subscription cache initialization", () => {
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.unstubAllGlobals();
	});

	test("opens the Cache API once for concurrent subscriptions", async () => {
		const cache = {
			match: vi.fn(async () => undefined),
			put: vi.fn(async () => undefined),
		};
		const open = vi.fn(async () => cache);
		vi.stubGlobal("caches", { open });
		globalThis.fetch = vi.fn(
			async () =>
				new Response("trojan://password@127.0.0.1:443#Test", {
					headers: { "Content-Type": "text/plain" },
				}),
		) as unknown as typeof fetch;

		const resolved = await fetchSubscriptionNodes(
			[
				{ name: "One", url: "https://one.example.com/sub" },
				{ name: "Two", url: "https://two.example.com/sub" },
			],
			"sing-box",
		);

		expect(open).toHaveBeenCalledTimes(1);
		expect(resolved.every((subscription) => subscription.nodes.length === 1)).toBe(true);
	});

	test("handles fetch error gracefully without throwing", async () => {
		vi.stubGlobal("caches", undefined); // disable cache
		globalThis.fetch = vi.fn(() =>
			Promise.reject(new Error("Network error or 500 status")),
		) as unknown as typeof fetch;

		const resolved = await fetchSubscriptionNodes(
			[{ name: "BrokenSub", url: "https://broken.example.com/sub" }],
			"sing-box",
		);

		expect(resolved.length).toBe(1);
		expect(resolved[0].name).toBe("BrokenSub");
		expect(resolved[0].nodes.length).toBe(1);
		expect(resolved[0].nodes[0].name).toContain("BrokenSub 订阅加载失败");
		expect(resolved[0].nodes[0].__subscriptionAlert).toBe(true);
	});

	test("dedups identical subscription URLs (fetch+parse once, map back to each sub)", async () => {
		const cache = {
			match: vi.fn(async () => undefined),
			put: vi.fn(async () => undefined),
		};
		const open = vi.fn(async () => cache);
		vi.stubGlobal("caches", { open });
		const fetchFn = vi.fn(
			async () =>
				new Response("trojan://password@127.0.0.1:443#Test", {
					headers: { "Content-Type": "text/plain" },
				}),
		);
		globalThis.fetch = fetchFn as unknown as typeof fetch;

		const resolved = await fetchSubscriptionNodes(
			[
				{ name: "One", url: "https://same.example.com/sub" },
				{ name: "Two", url: "https://same.example.com/sub" },
				{ name: "Three", url: "https://other.example.com/sub" },
			],
			"sing-box",
		);

		// Two unique URLs => two fetches (not three).
		expect(fetchFn).toHaveBeenCalledTimes(2);
		// Each sub still gets its own resolved entry with parsed nodes.
		expect(resolved.length).toBe(3);
		expect(resolved.every((s) => s.nodes.length === 1)).toBe(true);
		expect(resolved.map((s) => s.name)).toEqual(["One", "Two", "Three"]);
	});
});
