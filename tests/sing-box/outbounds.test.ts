import { describe, expect, test } from "vitest";
import type { ProxyNode } from "../../core/src/types";
import { buildSingBoxConfig } from "../../core/src/utils/sing-box/index";
import { buildOutbounds, toSingBoxOutbound } from "../../core/src/utils/sing-box/outbounds";
import type { ProviderSelector, TaggedNode } from "../../core/src/utils/sing-box/types";

const taggedNodes: TaggedNode[] = [
	{
		tag: "Airport A HK 01",
		providerName: "Airport A",
		node: {
			name: "🇭🇰 HK 01",
			type: "trojan",
			server: "hk.example.com",
			port: 443,
			password: "secret",
		},
	},
	{
		tag: "Airport B JP 01",
		providerName: "Airport B",
		node: {
			name: "🇯🇵 JP 01",
			type: "trojan",
			server: "jp.example.com",
			port: 443,
			password: "secret",
		},
	},
];

const providerSelectors: ProviderSelector[] = [
	{
		providerName: "Airport A",
		selectTag: "📡 Airport A",
		autoTag: "⚡ Airport A 自动选择",
		nodeTags: ["Airport A HK 01"],
	},
	{
		providerName: "Airport B",
		selectTag: "📡 Airport B",
		autoTag: "⚡ Airport B 自动选择",
		nodeTags: ["Airport B JP 01"],
	},
];

function getGroupTags(isWhite = false, isBlack = false, isDual = false): string[] {
	return buildOutbounds(taggedNodes, providerSelectors, [], [], isWhite, isBlack, isDual)
		.filter((outbound) => outbound.type === "selector" || outbound.type === "urltest")
		.map((outbound) => String(outbound.tag));
}

describe("sing-box outbound group ordering", () => {
	test.each([
		["full", false, false, false],
		["dual", false, false, true],
		["white", true, false, false],
		["black", false, true, false],
	] as const)(
		"places provider selectors before region and scenario groups in %s mode",
		(_mode, isWhite, isBlack, isDual) => {
			expect(getGroupTags(isWhite, isBlack, isDual).slice(0, 8)).toEqual([
				"🚀 节点选择",
				"♻️ 自动选择",
				"📡 Airport A",
				"⚡ Airport A 自动选择",
				"📡 Airport B",
				"⚡ Airport B 自动选择",
				"🇭🇰 香港节点",
				"🇯🇵 日本节点",
			]);
		},
	);
});

describe("sing-box wireguard endpoint migration", () => {
	test("toSingBoxOutbound returns null for wireguard (no deprecated outbound)", () => {
		const node: ProxyNode = {
			name: "WG-Node",
			type: "wireguard",
			server: "wg.example.com",
			port: 51820,
			ip: "10.0.0.2/32",
			"private-key": "priv",
			"public-key": "pub",
			"preshared-key": "psk",
			reserved: [1, 2, 3],
			mtu: 1420,
			udp: true,
		};
		expect(toSingBoxOutbound(node, "WG-Node")).toBeNull();
	});

	test("buildSingBoxConfig emits wireguard as endpoint with peers[0] structure", async () => {
		const wgNode: ProxyNode = {
			name: "WG-Node",
			type: "wireguard",
			server: "wg.example.com",
			port: 51820,
			ip: "10.0.0.2/32",
			"private-key": "privKey",
			"public-key": "pubKey",
			"preshared-key": "pskKey",
			reserved: [1, 2, 3],
			mtu: 1420,
			udp: true,
		};
		const config = await buildSingBoxConfig({
			secret: "s",
			subscriptions: [],
			customNodes: [wgNode],
		});

		const endpoints = config.endpoints as unknown[];
		expect(Array.isArray(endpoints)).toBe(true);
		expect(endpoints).toHaveLength(1);

		const ep = endpoints[0];
		expect(ep.type).toBe("wireguard");
		expect(ep.tag).toBe("WG-Node");
		expect(ep.system).toBe(false);
		expect(ep.address).toEqual(["10.0.0.2/32"]);
		expect(ep.private_key).toBe("privKey");
		expect(ep.mtu).toBe(1420);

		expect(Array.isArray(ep.peers)).toBe(true);
		expect(ep.peers).toHaveLength(1);
		const peer = ep.peers[0];
		expect(peer.address).toBe("wg.example.com");
		expect(peer.port).toBe(51820);
		expect(peer.public_key).toBe("pubKey");
		expect(peer.pre_shared_key).toBe("pskKey");
		expect(peer.reserved).toEqual([1, 2, 3]);
		expect(peer.allowed_ips).toEqual(["0.0.0.0/0", "::/0"]);

		const outbounds = config.outbounds as unknown as Record<string, unknown>[];
		expect(outbounds.some((o) => o.type === "wireguard")).toBe(false);
	});
});
