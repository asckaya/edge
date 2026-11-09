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

	test("falls back to mihomo clash.meta User-Agent when sing-box UA fails with HTTP error", async () => {
		vi.stubGlobal("caches", undefined);
		const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const reqHeaders =
				input instanceof Request
					? input.headers
					: init?.headers instanceof Headers
						? init.headers
						: new Headers(init?.headers as Record<string, string> | undefined);
			const ua = reqHeaders.get("user-agent") || "";

			if (ua === "sing-box") {
				return new Response("Not Found / Unsupported Client", { status: 404 });
			}
			if (ua === "mihomo clash.meta") {
				const clashYaml = `
proxies:
  - name: "Clash Trojan Node"
    type: trojan
    server: 1.2.3.4
    port: 443
    password: secret
`;
				return new Response(clashYaml, {
					status: 200,
					headers: { "Content-Type": "text/yaml" },
				});
			}
			return new Response("Unhandled", { status: 500 });
		});
		globalThis.fetch = mockFetch as unknown as typeof fetch;

		const resolved = await fetchSubscriptionNodes(
			[{ name: "FallbackSub", url: "https://airport.example.com/sub" }],
			"sing-box",
		);

		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(resolved.length).toBe(1);
		expect(resolved[0].nodes.length).toBe(1);
		expect(resolved[0].nodes[0].name).toBe("Clash Trojan Node");
		expect(resolved[0].nodes[0].type).toBe("trojan");
	});

	test("falls back to mihomo clash.meta User-Agent when sing-box UA returns HTML or 0 valid nodes", async () => {
		vi.stubGlobal("caches", undefined);
		const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const reqHeaders =
				input instanceof Request
					? input.headers
					: init?.headers instanceof Headers
						? init.headers
						: new Headers(init?.headers as Record<string, string> | undefined);
			const ua = reqHeaders.get("user-agent") || "";

			if (ua === "sing-box") {
				// Returns HTTP 200 with an HTML error page
				return new Response("<!DOCTYPE html><html><body>Client Not Supported</body></html>", {
					status: 200,
					headers: { "Content-Type": "text/html" },
				});
			}
			if (ua === "mihomo clash.meta") {
				const clashYaml = `
proxies:
  - name: "HK Reality Node"
    type: vless
    server: 1.2.3.4
    port: 443
    uuid: 00000000-0000-0000-0000-000000000000
`;
				return new Response(clashYaml, {
					status: 200,
					headers: { "Content-Type": "text/yaml" },
				});
			}
			return new Response("Unhandled", { status: 500 });
		});
		globalThis.fetch = mockFetch as unknown as typeof fetch;

		const resolved = await fetchSubscriptionNodes(
			[{ name: "HtmlErrorSub", url: "https://airport.example.com/sub" }],
			"sing-box",
		);

		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(resolved.length).toBe(1);
		expect(resolved[0].nodes.length).toBe(1);
		expect(resolved[0].nodes[0].name).toBe("HK Reality Node");
		expect(resolved[0].nodes[0].type).toBe("vless");
	});

	test("falls back to mihomo clash.meta User-Agent when sing-box UA returns only alert placeholder nodes", async () => {
		vi.stubGlobal("caches", undefined);
		const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const reqHeaders =
				input instanceof Request
					? input.headers
					: init?.headers instanceof Headers
						? init.headers
						: new Headers(init?.headers as Record<string, string> | undefined);
			const ua = reqHeaders.get("user-agent") || "";

			if (ua === "sing-box") {
				// Returns loopback alert node saying "unsupported / warning"
				return new Response(
					JSON.stringify({
						outbounds: [
							{
								type: "shadowsocks",
								tag: "⚠️ warning: 订阅不受支持",
								server: "127.0.0.1",
								server_port: 1,
								method: "aes-128-gcm",
								password: "pw",
							},
						],
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
			if (ua === "mihomo clash.meta") {
				const clashYaml = `
proxies:
  - name: "Working Clash Node"
    type: trojan
    server: 5.6.7.8
    port: 443
    password: secret
`;
				return new Response(clashYaml, {
					status: 200,
					headers: { "Content-Type": "text/yaml" },
				});
			}
			return new Response("Unhandled", { status: 500 });
		});
		globalThis.fetch = mockFetch as unknown as typeof fetch;

		const resolved = await fetchSubscriptionNodes(
			[{ name: "AlertSub", url: "https://airport.example.com/sub" }],
			"sing-box",
		);

		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(resolved.length).toBe(1);
		expect(resolved[0].nodes.length).toBe(1);
		expect(resolved[0].nodes[0].name).toBe("Working Clash Node");
		expect(resolved[0].nodes[0].type).toBe("trojan");
	});

	test("collapses loopback alert placeholder nodes with non-standard ports (e.g. 6666)", async () => {
		vi.stubGlobal("caches", undefined);
		const mockFetch = vi.fn(async () => {
			const yamlWithAlerts = `
proxies:
  - { name: "不支持您的代理软件", type: ss, server: 127.0.0.1, port: 6666, cipher: aes-128-gcm, password: pw }
  - { name: "请换用支持的代理软件", type: ss, server: 127.0.0.1, port: 6666, cipher: aes-128-gcm, password: pw }
  - { name: "官网地址:https://example.com", type: ss, server: 127.0.0.1, port: 6666, cipher: aes-128-gcm, password: pw }
`;
			return new Response(yamlWithAlerts, {
				status: 200,
				headers: { "Content-Type": "text/yaml" },
			});
		});
		globalThis.fetch = mockFetch as unknown as typeof fetch;

		const resolved = await fetchSubscriptionNodes(
			[{ name: "MySub", url: "https://airport.example.com/sub" }],
			"clash",
		);

		expect(resolved.length).toBe(1);
		expect(resolved[0].nodes.length).toBe(1);
		expect(resolved[0].nodes[0].name).toContain("MySub 订阅失效");
	});
});
