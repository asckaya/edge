import { afterEach, describe, expect, test, vi } from "vitest";
import { coerceProxyNode } from "../../core/src/utils/proxy-node";
import { buildTaggedNodes } from "../../core/src/utils/sing-box/groups";

describe("sing-box group preparation", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("skips geo network lookups when node names already contain country hints", async () => {
		const fetchMock = vi.fn(() => Promise.resolve(new Response("{}", { status: 500 })));
		vi.stubGlobal("fetch", fetchMock);
		const node = coerceProxyNode({
			name: "🇯🇵 Tokyo 01",
			type: "trojan",
			server: "tokyo.example.com",
			port: 443,
			password: "secret",
			udp: true,
		});
		expect(node).not.toBeNull();
		if (node === null) throw new Error("test setup failed: node is null");

		const result = await buildTaggedNodes(
			[{ name: "Airport", url: "https://subscription.example.com", nodes: [node] }],
			[],
		);

		expect(fetchMock).not.toHaveBeenCalled();
		expect(result.taggedNodes[0].tag).toBe("🇯🇵 Airport 01 (🇯🇵 Tokyo 01)");
	});

	test("resolves unhinted node locations from the node host", async () => {
		const fetchMock = vi.fn((input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes("cloudflare-dns.com")) {
				return new Response(JSON.stringify({ Answer: [{ data: "1.1.1.1" }] }), {
					headers: { "Content-Type": "application/json" },
				});
			}
			return new Response(JSON.stringify({ country: "JP" }), {
				headers: { "Content-Type": "application/json" },
			});
		});
		vi.stubGlobal("fetch", fetchMock);
		const node = coerceProxyNode({
			name: "Node One",
			type: "trojan",
			server: "node.edgeengine.dev",
			port: 443,
			password: "secret",
			udp: true,
		});
		expect(node).not.toBeNull();
		if (node === null) throw new Error("test setup failed: node is null");

		const result = await buildTaggedNodes(
			[{ name: "Airport", url: "https://subscription.example.com", nodes: [node] }],
			[],
		);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(result.taggedNodes[0].tag).toBe("🇯🇵 Airport 01 (Node One)");
	});

	test("deduplicates concurrent geo lookups for the same host", async () => {
		const fetchMock = vi.fn((input: RequestInfo | URL) => {
			const url = String(input);
			return url.includes("cloudflare-dns.com")
				? new Response(JSON.stringify({ Answer: [{ data: "8.8.8.8" }] }), {
						headers: { "Content-Type": "application/json" },
					})
				: new Response(JSON.stringify({ country: "US" }), {
						headers: { "Content-Type": "application/json" },
					});
		});
		vi.stubGlobal("fetch", fetchMock);
		const server = `shared-${Date.now()}.edgeengine.dev`;
		const nodes = ["One", "Two"].map((name) => {
			const n = coerceProxyNode({
				name,
				type: "trojan",
				server,
				port: 443,
				password: "secret",
				udp: true,
			});
			if (n === null) throw new Error("test setup failed: coerceProxyNode returned null");
			return n;
		});

		const result = await buildTaggedNodes(
			[{ name: "Airport", url: "https://subscription.example.com", nodes }],
			[],
		);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(result.taggedNodes.map(({ tag }) => tag)).toEqual([
			"🇺🇸 Airport 01 (One)",
			"🇺🇸 Airport 02 (Two)",
		]);
	});
});
