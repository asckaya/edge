import { afterEach, describe, expect, test, vi } from "vitest";
import { coerceProxyNode } from "../../core/src/utils/proxy-node";
import { buildTaggedNodes } from "../../core/src/utils/sing-box/groups";

describe("sing-box group preparation", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("extracts country flags offline without geo network lookups", () => {
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

		const result = buildTaggedNodes(
			[{ name: "Airport", url: "https://subscription.example.com", nodes: [node] }],
			[],
		);

		expect(fetchMock).not.toHaveBeenCalled();
		expect(result.taggedNodes[0].tag).toBe("🇯🇵 Airport 01 (🇯🇵 Tokyo 01)");
	});

	test("handles unhinted node locations purely offline without network calls", () => {
		const fetchMock = vi.fn();
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

		const result = buildTaggedNodes(
			[{ name: "Airport", url: "https://subscription.example.com", nodes: [node] }],
			[],
		);

		expect(fetchMock).not.toHaveBeenCalled();
		expect(result.taggedNodes[0].tag).toBe("🏳️ Airport 01 (Node One)");
	});
});
