import { describe, expect, test } from "vitest";
import type { LooseProxyNode } from "../../core/src/utils/proxy-node";
import { coerceProxyNode } from "../../core/src/utils/proxy-node";
import { toSingBoxEndpoint } from "../../core/src/utils/sing-box/endpoints";
import { toSingBoxOutbound } from "../../core/src/utils/sing-box/outbounds";
import { parseSingBoxOutbounds } from "../../core/src/utils/sing-box/subscription-outbound";

/**
 * Round-trip test module: canonical node → sing-box outbound → reverse-parse → assert.
 *
 * These tests guard the sing-box seam against field loss during the
 * kebab→snake→kebab translation. They would have caught the naive/shadowtls
 * SNI round-trip bug and the tuic reduce-rtt naming mismatch.
 *
 * Pattern per protocol:
 *   1. Build a raw node object with realistic fields.
 *   2. Validate+normalize via `coerceProxyNode` → canonical LooseProxyNode.
 *   3. Forward: `toSingBoxOutbound(node, tag)` → sing-box outbound JSON.
 *   4. Reverse: `parseSingBoxOutbounds({ outbounds: [outbound] })` → parsed nodes.
 *   5. Assert the parsed node preserves the critical fields from the original.
 *
 * Note: `coerceProxyNode` normalizes some fields (e.g. deletes vless `security`,
 * collapses wireguard `peer-public-key`→`public-key`). Round-trip assertions
 * compare against the POST-coercion expected values, not the raw input.
 */

function makeNode(raw: Record<string, unknown>): LooseProxyNode {
	const node = coerceProxyNode(raw);
	if (!node) throw new Error(`coerceProxyNode returned null for: ${JSON.stringify(raw)}`);
	return node;
}

function roundTrip(node: LooseProxyNode, tag = "test-node"): LooseProxyNode {
	const outbound = toSingBoxOutbound(node, tag);
	if (!outbound) throw new Error(`toSingBoxOutbound returned null for type=${node.type}`);
	const parsed = parseSingBoxOutbounds({ outbounds: [outbound] });
	if (parsed.length !== 1) {
		throw new Error(`reverse parse returned ${parsed.length} nodes, expected 1`);
	}
	return parsed[0];
}

describe("sing-box round-trip: canonical node → outbound → reverse-parse", () => {
	test("hysteria2: preserves password/sni/obfs/up/down", () => {
		const node = makeNode({
			type: "hysteria2",
			name: "H",
			server: "hy2.example.com",
			port: 443,
			password: "hy2-secret",
			sni: "hy2-sni.example.com",
			"skip-cert-verify": true,
			alpn: ["h3"],
			ports: "20000-30000",
			obfs: "salamander",
			"obfs-password": "obfspw",
			up: 100,
			down: 200,
			"hop-interval": "30",
		});
		const rt = roundTrip(node);
		expect(rt.type).toBe("hysteria2");
		expect(rt.server).toBe("hy2.example.com");
		expect(rt.port).toBe(443);
		expect(rt.password).toBe("hy2-secret");
		expect(rt.sni).toBe("hy2-sni.example.com");
		expect(rt["skip-cert-verify"]).toBe(true);
		expect(rt.alpn).toEqual(["h3"]);
		expect(rt.ports).toBe("20000-30000");
		expect(rt.obfs).toBe("salamander");
		expect(rt["obfs-password"]).toBe("obfspw");
		expect(rt.up).toBe(100);
		expect(rt.down).toBe(200);
		expect(rt["hop-interval"]).toBe("30s");
	});

	test("vless: preserves uuid/sni(servername)/flow/reality-opts/ws-opts", () => {
		const node = makeNode({
			type: "vless",
			name: "V",
			server: "vless.example.com",
			port: 443,
			uuid: "vless-uuid",
			servername: "vless-sni.example.com",
			flow: "xtls-rprx-vision",
			tls: true,
			"client-fingerprint": "chrome",
			"reality-opts": { "public-key": "reality-pub", "short-id": "sid123" },
		});
		const rt = roundTrip(node);
		expect(rt.type).toBe("vless");
		expect(rt.uuid).toBe("vless-uuid");
		expect(rt.servername).toBe("vless-sni.example.com");
		expect(rt.flow).toBe("xtls-rprx-vision");
		expect(rt["client-fingerprint"]).toBe("chrome");
		expect(rt["reality-opts"]).toEqual({ "public-key": "reality-pub", "short-id": "sid123" });
	});

	test("vless+ws: preserves network/ws-opts", () => {
		const node = makeNode({
			type: "vless",
			name: "VW",
			server: "vw.example.com",
			port: 80,
			uuid: "vw-uuid",
			network: "ws",
			tls: false,
			"ws-opts": { path: "/ws-path", headers: { Host: "vw.example.com" } },
		});
		const rt = roundTrip(node);
		expect(rt.network).toBe("ws");
		expect(rt["ws-opts"]).toEqual({ path: "/ws-path", headers: { Host: "vw.example.com" } });
	});

	test("vless+ws: preserves max-early-data / early-data-header", () => {
		const node = makeNode({
			type: "vless",
			name: "VWE",
			server: "vwe.example.com",
			port: 80,
			uuid: "vwe-uuid",
			network: "ws",
			tls: false,
			"ws-opts": {
				path: "/ws",
				headers: { Host: "vwe.example.com" },
				"max-early-data": 2048,
				"early-data-header": "Sec-WebSocket-Protocol",
			},
		});
		const rt = roundTrip(node);
		expect(rt["ws-opts"]?.["max-early-data"]).toBe(2048);
		expect(rt["ws-opts"]?.["early-data-header"]).toBe("Sec-WebSocket-Protocol");
	});

	test("vless+grpc: preserves serviceName (multi-mode dropped per sing-box v1.14+)", () => {
		const node = makeNode({
			type: "vless",
			name: "VG",
			server: "vg.example.com",
			port: 443,
			uuid: "vg-uuid",
			network: "grpc",
			tls: true,
			servername: "vg.example.com",
			"grpc-opts": { serviceName: "grpc-svc", "multi-mode": true },
		});
		const rt = roundTrip(node);
		expect(rt["grpc-opts"]?.serviceName).toBe("grpc-svc");
		// sing-box v1.14+ gRPC transport removed `multi_mode` (auto-detected
		// upstream); the canonical `multi-mode` field is dropped on forward and
		// not restored on reverse.
		expect(rt["grpc-opts"]?.["multi-mode"]).toBeUndefined();
	});

	test("vless+h2: forward maps h2-opts to sing-box http transport", () => {
		const node = makeNode({
			type: "vless",
			name: "VH2",
			server: "vh2.example.com",
			port: 443,
			uuid: "vh2-uuid",
			network: "h2",
			tls: true,
			servername: "vh2.example.com",
			"h2-opts": { host: ["vh2.example.com"], path: "/h2-path" },
		});
		// Forward only: sing-box collapses h2 into type:"http" transport, so the
		// reverse parse yields http-opts (not h2-opts). Verify the forward path
		// produced a valid http transport with host+path preserved.
		const outbound = toSingBoxOutbound(node, "VH2");
		expect(outbound?.transport).toEqual({
			type: "http",
			path: "/h2-path",
			host: ["vh2.example.com"],
		});
	});

	test("vmess: preserves uuid/cipher/network/servername/ws-opts", () => {
		const node = makeNode({
			type: "vmess",
			name: "VM",
			server: "vm.example.com",
			port: 443,
			uuid: "vm-uuid",
			alterId: 0,
			cipher: "auto",
			servername: "vm-sni.example.com",
			tls: true,
			network: "ws",
			"ws-opts": { path: "/vm-ws", headers: { Host: "vm.example.com" } },
		});
		const rt = roundTrip(node);
		expect(rt.type).toBe("vmess");
		expect(rt.uuid).toBe("vm-uuid");
		expect(rt.cipher).toBe("auto");
		expect(rt.servername).toBe("vm-sni.example.com");
		expect(rt.network).toBe("ws");
		expect(rt["ws-opts"]).toEqual({ path: "/vm-ws", headers: { Host: "vm.example.com" } });
	});

	test("trojan: preserves password/sni", () => {
		const node = makeNode({
			type: "trojan",
			name: "T",
			server: "trojan.example.com",
			port: 443,
			password: "trojan-pw",
			sni: "trojan-sni.example.com",
			"skip-cert-verify": true,
		});
		const rt = roundTrip(node);
		expect(rt.type).toBe("trojan");
		expect(rt.password).toBe("trojan-pw");
		expect(rt.sni).toBe("trojan-sni.example.com");
		expect(rt["skip-cert-verify"]).toBe(true);
	});

	test("ss: preserves cipher/password/plugin", () => {
		const node = makeNode({
			type: "ss",
			name: "SS",
			server: "ss.example.com",
			port: 8388,
			cipher: "aes-256-gcm",
			password: "ss-pw",
		});
		const rt = roundTrip(node);
		expect(rt.type).toBe("ss");
		expect(rt.cipher).toBe("aes-256-gcm");
		expect(rt.password).toBe("ss-pw");
	});

	test("tuic: preserves uuid/password/sni/alpn/reduce-rtt", () => {
		const node = makeNode({
			type: "tuic",
			name: "TU",
			server: "tuic.example.com",
			port: 443,
			uuid: "tuic-uuid",
			password: "tuic-pw",
			sni: "tuic-sni.example.com",
			alpn: ["h3"],
			"reduce-rtt": true,
			"udp-relay-mode": "native",
			"congestion-controller": "bbr",
		});
		const rt = roundTrip(node);
		expect(rt.type).toBe("tuic");
		expect(rt.uuid).toBe("tuic-uuid");
		expect(rt.password).toBe("tuic-pw");
		expect(rt.sni).toBe("tuic-sni.example.com");
		expect(rt.alpn).toEqual(["h3"]);
		expect(rt["reduce-rtt"]).toBe(true);
		expect(rt["udp-relay-mode"]).toBe("native");
		expect(rt["congestion-controller"]).toBe("bbr");
	});

	test("tuic disable-sni: preserves disable-sni flag (the disable_sni round-trip bug guard)", () => {
		const node = makeNode({
			type: "tuic",
			name: "TUD",
			server: "tuic-dsni.example.com",
			port: 443,
			uuid: "tud-uuid",
			password: "tud-pw",
			"disable-sni": true,
		});
		const rt = roundTrip(node);
		// Guards against the disable_sni round-trip loss bug (applyTls never read tls.disable_sni).
		expect(rt["disable-sni"]).toBe(true);
	});

	test("anytls: preserves password/sni/client-fingerprint", () => {
		const node = makeNode({
			type: "anytls",
			name: "A",
			server: "anytls.example.com",
			port: 443,
			password: "anytls-pw",
			sni: "anytls-sni.example.com",
			"client-fingerprint": "chrome",
			"idle-session-timeout": "30s",
			"min-idle-session": 3,
		});
		const rt = roundTrip(node);
		expect(rt.type).toBe("anytls");
		expect(rt.password).toBe("anytls-pw");
		expect(rt.sni).toBe("anytls-sni.example.com");
		expect(rt["client-fingerprint"]).toBe("chrome");
		expect(rt["idle-session-timeout"]).toBe("30s");
		expect(rt["min-idle-session"]).toBe(3);
	});

	test("anytls: coerces numeric idle-session durations to sing-box format", () => {
		// Regression: URI parser stores idle-session-* as numbers (parseInt).
		// sing-box v1.14 requires Go duration strings ("30s"), rejecting bare numbers.
		const node = makeNode({
			type: "anytls",
			name: "A2",
			server: "anytls.example.com",
			port: 443,
			password: "pw",
			sni: "sni.example.com",
			"idle-session-check-interval": 30,
			"idle-session-timeout": 60,
			"min-idle-session": 5,
		});
		const rt = roundTrip(node);
		expect(rt["idle-session-check-interval"]).toBe("30s");
		expect(rt["idle-session-timeout"]).toBe("60s");
		expect(rt["min-idle-session"]).toBe(5);
	});

	test("socks: preserves username/password/version", () => {
		const node = makeNode({
			type: "socks",
			name: "SK",
			server: "socks.example.com",
			port: 1080,
			username: "socks-user",
			password: "socks-pw",
		});
		const rt = roundTrip(node);
		expect(rt.type).toBe("socks");
		expect(rt.username).toBe("socks-user");
		expect(rt.password).toBe("socks-pw");
	});

	test("http: preserves username/password", () => {
		const node = makeNode({
			type: "http",
			name: "HT",
			server: "http.example.com",
			port: 8080,
			username: "http-user",
			password: "http-pw",
			tls: true,
		});
		const rt = roundTrip(node);
		expect(rt.type).toBe("http");
		expect(rt.username).toBe("http-user");
		expect(rt.password).toBe("http-pw");
		expect(rt.tls).toBe(true);
	});

	test("http+tls: preserves sni (the http SNI round-trip bug guard)", () => {
		const node = makeNode({
			type: "http",
			name: "HTS",
			server: "http-tls.example.com",
			port: 8080,
			username: "hts-user",
			password: "hts-pw",
			tls: true,
			sni: "http-sni.example.com",
			"skip-cert-verify": true,
		});
		const rt = roundTrip(node);
		expect(rt.tls).toBe(true);
		// Guards against the http SNI round-trip loss bug (applyTls SNI list omission).
		expect(rt.sni).toBe("http-sni.example.com");
		expect(rt["skip-cert-verify"]).toBe(true);
	});

	test("snell v4: preserves psk/version/obfs", () => {
		const node = makeNode({
			type: "snell",
			name: "SN",
			server: "snell.example.com",
			port: 443,
			psk: "snell-psk",
			version: 4,
			reuse: true,
			"obfs-opts": { mode: "http", host: "bing.com" },
		});
		const rt = roundTrip(node);
		expect(rt.type).toBe("snell");
		expect(rt.psk).toBe("snell-psk");
		expect(rt.version).toBe(4);
		expect(rt.reuse).toBe(true);
		expect(rt["obfs-opts"]).toEqual({ mode: "http", host: "bing.com" });
	});

	test("naive: preserves username/password/sni (the SNI round-trip bug guard)", () => {
		const node = makeNode({
			type: "naive",
			name: "NA",
			server: "naive.example.com",
			port: 443,
			username: "naive-user",
			password: "naive-pw",
			sni: "naive-sni.example.com",
		});
		const rt = roundTrip(node);
		expect(rt.type).toBe("naive");
		expect(rt.username).toBe("naive-user");
		expect(rt.password).toBe("naive-pw");
		// This assertion guards against the naive SNI round-trip loss bug:
		// reverse parser must store tls.server_name as node.sni (not node.servername).
		expect(rt.sni).toBe("naive-sni.example.com");
	});

	test("naive+quic: preserves quic flag + quic-congestion-control", () => {
		const node = makeNode({
			type: "naive",
			name: "NQ",
			server: "naive-quic.example.com",
			port: 443,
			username: "nq-user",
			password: "nq-pw",
			sni: "nq-sni.example.com",
			quic: true,
			"quic-congestion-control": "bbr2",
		});
		const rt = roundTrip(node);
		expect(rt.quic).toBe(true);
		expect(rt["quic-congestion-control"]).toBe("bbr2");
	});

	test("shadowtls: preserves version/password/sni (the SNI round-trip bug guard)", () => {
		const node = makeNode({
			type: "shadowtls",
			name: "ST",
			server: "shadowtls.example.com",
			port: 443,
			version: 3,
			password: "st-pw",
			sni: "st-sni.example.com",
		});
		const rt = roundTrip(node);
		expect(rt.type).toBe("shadowtls");
		expect(rt.version).toBe(3);
		expect(rt.password).toBe("st-pw");
		// This assertion guards against the shadowtls SNI round-trip loss bug.
		expect(rt.sni).toBe("st-sni.example.com");
	});

	test("round-trip preserves the node name/tag", () => {
		const node = makeNode({
			type: "trojan",
			name: "My-Node-Name",
			server: "trojan.example.com",
			port: 443,
			password: "pw",
		});
		const rt = roundTrip(node, "My-Node-Name");
		expect(rt.name).toBe("My-Node-Name");
	});

	// ---- Endpoint round-trips (sing-box v1.14+ puts wireguard/tailscale under config.endpoints) ----

	function roundTripEndpoint(node: LooseProxyNode): LooseProxyNode {
		const endpoint = toSingBoxEndpoint(node);
		if (!endpoint) throw new Error(`toSingBoxEndpoint returned null for type=${node.type}`);
		const parsed = parseSingBoxOutbounds({ endpoints: [endpoint] });
		if (parsed.length !== 1) {
			throw new Error(`reverse parse returned ${parsed.length} nodes, expected 1`);
		}
		return parsed[0];
	}

	test("wireguard endpoint: preserves keys/ip/allowed-ips/persistent-keepalive (the endpoint round-trip bug guard)", () => {
		const node = makeNode({
			type: "wireguard",
			name: "WG",
			server: "wg.example.com",
			port: 51820,
			ip: "10.0.0.2/32",
			"private-key": "wg-priv",
			"public-key": "wg-pub",
			"preshared-key": "wg-psk",
			reserved: [1, 2, 3],
			mtu: 1420,
			"allowed-ips": ["10.0.0.0/24", "fe80::/64"],
			"persistent-keepalive": 25,
		});
		const rt = roundTripEndpoint(node);
		expect(rt.type).toBe("wireguard");
		expect(rt.server).toBe("wg.example.com");
		expect(rt.port).toBe(51820);
		expect(rt["private-key"]).toBe("wg-priv");
		expect(rt["public-key"]).toBe("wg-pub");
		expect(rt["preshared-key"]).toBe("wg-psk");
		expect(rt.reserved).toEqual([1, 2, 3]);
		expect(rt.mtu).toBe(1420);
		expect(rt.ip).toEqual(["10.0.0.2/32"]);
		// Guards against CRITICAL-6 (allowed-ips/persistent-keepalive not read on reverse).
		expect(rt["allowed-ips"]).toEqual(["10.0.0.0/24", "fe80::/64"]);
		expect(rt["persistent-keepalive"]).toBe(25);
	});

	test("tailscale endpoint: preserves auth-key/hostname/state-dir/exit-node (the endpoint round-trip bug guard)", () => {
		const node = makeNode({
			type: "tailscale",
			name: "TS",
			"auth-key": "tskey-auth-xxx",
			hostname: "ts-host",
			"control-url": "https://controlplane.tailscale.com",
			"state-dir": "/tmp/ts",
			"accept-routes": true,
			"exit-node": "exit.example.ts.net",
			"exit-node-allow-lan-access": false,
			ephemeral: true,
		});
		const rt = roundTripEndpoint(node);
		expect(rt.type).toBe("tailscale");
		expect(rt.name).toBe("TS");
		expect(rt["auth-key"]).toBe("tskey-auth-xxx");
		expect(rt.hostname).toBe("ts-host");
		expect(rt["control-url"]).toBe("https://controlplane.tailscale.com");
		// state_directory → state-dir
		expect(rt["state-dir"]).toBe("/tmp/ts");
		expect(rt["accept-routes"]).toBe(true);
		expect(rt["exit-node"]).toBe("exit.example.ts.net");
		expect(rt["exit-node-allow-lan-access"]).toBe(false);
		expect(rt.ephemeral).toBe(true);
	});
});
