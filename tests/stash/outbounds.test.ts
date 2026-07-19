import { describe, expect, test } from "vitest";
import { toStashOutbound } from "../../core/src/utils/mihomo/stash-outbounds";
import { makeNode } from "../_helpers/make-node";

describe("toStashOutbound", () => {
	test("vless: servername kept (Stash uses servername), grpc-opts.serviceName → grpc-service-name", () => {
		const node = makeNode({
			type: "vless",
			name: "V",
			uuid: "uuid",
			servername: "sni.example.com",
			network: "grpc",
			"grpc-opts": { serviceName: "grpc-service" },
		});
		const out = toStashOutbound(node);
		expect(out).not.toBeNull();
		expect(out?.servername).toBe("sni.example.com");
		expect(out?.sni).toBeUndefined();
		expect(out?.["grpc-opts"]).toEqual({ "grpc-service-name": "grpc-service" });
	});

	test("vless: existing sni is not overwritten by servername", () => {
		const node = makeNode({
			type: "vless",
			name: "V",
			uuid: "uuid",
			servername: "other.example.com",
			sni: "keep.this",
		});
		const out = toStashOutbound(node);
		expect(out?.sni).toBe("keep.this");
		expect(out?.servername).toBe("other.example.com"); // both kept (Stash supports both)
	});

	test("vmess: servername kept (Stash uses servername), grpc-opts.serviceName → grpc-service-name", () => {
		const node = makeNode({
			type: "vmess",
			name: "V",
			uuid: "uuid",
			alterId: 0,
			cipher: "auto",
			servername: "vmess-sni.example.com",
			network: "grpc",
			"grpc-opts": { serviceName: "svc" },
		});
		const out = toStashOutbound(node);
		expect(out?.servername).toBe("vmess-sni.example.com");
		expect(out?.sni).toBeUndefined();
		expect(out?.["grpc-opts"]).toEqual({ "grpc-service-name": "svc" });
	});

	test("trojan: grpc-opts.serviceName → grpc-service-name (trojan has no servername)", () => {
		const node = makeNode({
			type: "trojan",
			name: "T",
			password: "pw",
			network: "grpc",
			"grpc-opts": { serviceName: "trojan-svc" },
		});
		const out = toStashOutbound(node);
		expect(out?.["grpc-opts"]).toEqual({ "grpc-service-name": "trojan-svc" });
	});

	test("hysteria2: password → auth, up → up-speed, down → down-speed", () => {
		const node = makeNode({
			type: "hysteria2",
			name: "H",
			password: "hy2pw",
			up: "100 Mbps",
			down: "200 Mbps",
			obfs: "salamander",
			"obfs-password": "obfspw",
		});
		const out = toStashOutbound(node);
		expect(out?.auth).toBe("hy2pw");
		expect(out?.password).toBeUndefined();
		expect(out?.["up-speed"]).toBe("100 Mbps");
		expect(out?.up).toBeUndefined();
		expect(out?.["down-speed"]).toBe("200 Mbps");
		expect(out?.down).toBeUndefined();
		// obfs fields preserved
		expect(out?.obfs).toBe("salamander");
		expect(out?.["obfs-password"]).toBe("obfspw");
	});

	test("tuic: version forced to 5; strips 10 mihomo-only fields", () => {
		const node = makeNode({
			type: "tuic",
			name: "TU",
			uuid: "uuid",
			password: "tuicpw",
			"disable-sni": false,
			"reduce-rtt": true,
			"fast-open": true,
			"udp-relay-mode": "native",
			"congestion-controller": "bbr",
			ip: "1.2.3.4",
			"heartbeat-interval": "10s",
			"request-timeout": "5s",
			"max-udp-relay-packet-size": 1500,
			"max-open-streams": 20,
			sni: "tuic.example.com",
			alpn: ["h3"],
		});
		const out = toStashOutbound(node);
		expect(out?.version).toBe(5);
		// all 10 stripped
		expect(out?.["disable-sni"]).toBeUndefined();
		expect(out?.["reduce-rtt"]).toBeUndefined();
		expect(out?.["fast-open"]).toBeUndefined();
		expect(out?.["udp-relay-mode"]).toBeUndefined();
		expect(out?.["congestion-controller"]).toBeUndefined();
		expect(out?.ip).toBeUndefined();
		expect(out?.["heartbeat-interval"]).toBeUndefined();
		expect(out?.["request-timeout"]).toBeUndefined();
		expect(out?.["max-udp-relay-packet-size"]).toBeUndefined();
		expect(out?.["max-open-streams"]).toBeUndefined();
		// kept
		expect(out?.uuid).toBe("uuid");
		expect(out?.password).toBe("tuicpw");
		expect(out?.sni).toBe("tuic.example.com");
	});

	test("tuic: existing version preserved", () => {
		const node = makeNode({ type: "tuic", name: "TU", uuid: "u", password: "p", version: 5 });
		expect(toStashOutbound(node)?.version).toBe(5);
	});

	test("anytls: strips client-fingerprint + idle-session fields", () => {
		const node = makeNode({
			type: "anytls",
			name: "A",
			password: "anypw",
			"client-fingerprint": "chrome",
			"idle-session-check-interval": "30s",
			"idle-session-timeout": "30s",
			"min-idle-session": 3,
			sni: "anytls.example.com",
		});
		const out = toStashOutbound(node);
		expect(out?.["client-fingerprint"]).toBeUndefined();
		expect(out?.["idle-session-check-interval"]).toBeUndefined();
		expect(out?.["idle-session-timeout"]).toBeUndefined();
		expect(out?.["min-idle-session"]).toBeUndefined();
		// kept
		expect(out?.password).toBe("anypw");
		expect(out?.sni).toBe("anytls.example.com");
	});

	test("wireguard: persistent-keepalive → keepalive; strips allowed-ips/remote-dns-resolve; keeps preshared-key", () => {
		const node = makeNode({
			type: "wireguard",
			name: "WG",
			ip: "10.0.0.2/32",
			"public-key": "peerPub",
			"private-key": "privKey",
			"preshared-key": "psk",
			"persistent-keepalive": 25,
			"allowed-ips": ["10.0.0.0/24"],
			"remote-dns-resolve": true,
			reserved: [1, 2, 3],
			mtu: 1420,
		});
		const out = toStashOutbound(node);
		expect(out?.keepalive).toBe(25);
		expect(out?.["persistent-keepalive"]).toBeUndefined();
		expect(out?.["allowed-ips"]).toBeUndefined();
		expect(out?.["remote-dns-resolve"]).toBeUndefined();
		expect(out?.["preshared-key"]).toBe("psk");
		expect(out?.["pre-shared-key"]).toBeUndefined();
		// kept
		expect(out?.["public-key"]).toBe("peerPub");
		expect(out?.["private-key"]).toBe("privKey");
		expect(out?.reserved).toEqual([1, 2, 3]);
	});

	test("socks: type → socks5", () => {
		const node = makeNode({ type: "socks", name: "S", username: "u", password: "p" });
		const out = toStashOutbound(node);
		expect(out?.type).toBe("socks5");
		expect(out?.username).toBe("u");
	});

	test("http: passes through unchanged (no stash-specific rewrite)", () => {
		const node = makeNode({
			type: "http",
			name: "H",
			username: "u",
			password: "p",
			tls: true,
			headers: { "X-Custom": "val" },
		});
		const out = toStashOutbound(node);
		expect(out?.type).toBe("http");
		expect(out?.headers).toEqual({ "X-Custom": "val" });
		expect(out?.tls).toBe(true);
	});

	test("tailscale: passes through unchanged (stash supports tailscale)", () => {
		const node = makeNode({
			type: "tailscale",
			name: "TS",
			"auth-key": "tskey",
			"control-url": "https://controlplane.tailscale.com",
			hostname: "mihomo",
			ephemeral: true,
		});
		const out = toStashOutbound(node);
		expect(out).not.toBeNull();
		expect(out?.type).toBe("tailscale");
		expect(out?.["auth-key"]).toBe("tskey");
		expect(out?.ephemeral).toBe(true);
	});

	test("input node is not mutated", () => {
		const node = makeNode({
			type: "hysteria2",
			name: "H",
			password: "pw",
			up: "50 Mbps",
		});
		toStashOutbound(node);
		expect(node.password).toBe("pw");
		expect(node.up).toBe("50 Mbps");
		expect(node.auth).toBeUndefined();
	});
});
