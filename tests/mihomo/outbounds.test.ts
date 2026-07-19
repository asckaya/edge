import { describe, expect, test } from "vitest";
import { toMihomoOutbound } from "../../core/src/utils/mihomo/outbounds";
import { makeNode } from "../_helpers/make-node";

describe("toMihomoOutbound", () => {
	test("rewrites socks → socks5", () => {
		const node = makeNode({ type: "socks", name: "S", username: "u", password: "p" });
		const out = toMihomoOutbound(node);
		expect(out).not.toBeNull();
		expect(out?.type).toBe("socks5");
		expect(out?.username).toBe("u");
		expect(out?.password).toBe("p");
		// input not mutated
		expect(node.type).toBe("socks");
	});

	test("rewrites wireguard preshared-key → pre-shared-key", () => {
		const node = makeNode({
			type: "wireguard",
			name: "WG",
			ip: "10.0.0.2/32",
			"public-key": "peerPub",
			"private-key": "privKey",
			"preshared-key": "pskValue",
			reserved: [0, 0, 0],
			mtu: 1420,
		});
		const out = toMihomoOutbound(node);
		expect(out).not.toBeNull();
		expect(out?.["pre-shared-key"]).toBe("pskValue");
		expect(out?.["preshared-key"]).toBeUndefined();
		expect(out?.["public-key"]).toBe("peerPub");
		expect(out?.type).toBe("wireguard");
		// input not mutated
		expect(node["preshared-key"]).toBe("pskValue");
	});

	test("wireguard without preshared-key passes through unchanged", () => {
		const node = makeNode({
			type: "wireguard",
			name: "WG",
			ip: "10.0.0.2/32",
			"public-key": "peerPub",
			"private-key": "privKey",
		});
		const out = toMihomoOutbound(node);
		expect(out).not.toBeNull();
		expect(out?.["pre-shared-key"]).toBeUndefined();
		expect(out?.["preshared-key"]).toBeUndefined();
	});

	test("passes through tailscale unchanged (mihomo supports tailscale as a regular proxy)", () => {
		const node = makeNode({
			type: "tailscale",
			name: "TS",
			"auth-key": "tskey",
			"control-url": "https://controlplane.tailscale.com",
		});
		const out = toMihomoOutbound(node);
		expect(out).not.toBeNull();
		expect(out?.type).toBe("tailscale");
		expect(out?.["auth-key"]).toBe("tskey");
	});

	test("passes through other protocols unchanged", () => {
		const node = makeNode({
			type: "vless",
			name: "V",
			uuid: "uuid-here",
			servername: "www.apple.com",
			tls: true,
			"reality-opts": { "public-key": "pk", "short-id": "sid" },
		});
		const out = toMihomoOutbound(node);
		expect(out).not.toBeNull();
		expect(out?.type).toBe("vless");
		expect(out?.servername).toBe("www.apple.com");
		expect(out?.tls).toBe(true);
		expect(out?.["reality-opts"]).toEqual({ "public-key": "pk", "short-id": "sid" });
	});

	test("snell: strips sing-box-only fields (userkey/mode/server-cert-fingerprint)", () => {
		const node = makeNode({
			type: "snell",
			name: "SN",
			psk: "psk-val",
			version: 6,
			userkey: "ukey",
			mode: "unshaped",
			"server-cert-fingerprint": "sha256",
			"client-fingerprint": "chrome",
			"obfs-opts": { mode: "http", host: "bing.com" },
		});
		const out = toMihomoOutbound(node);
		expect(out).not.toBeNull();
		expect(out?.psk).toBe("psk-val");
		expect(out?.["obfs-opts"]).toEqual({ mode: "http", host: "bing.com" });
		// sing-box snell v6 fields — not in mihomo snell doc.
		expect(out?.userkey).toBeUndefined();
		expect(out?.mode).toBeUndefined();
		// snell has no TLS layer in mihomo.
		expect(out?.["server-cert-fingerprint"]).toBeUndefined();
		// client-fingerprint IS in mihomo snell doc — kept.
		expect(out?.["client-fingerprint"]).toBe("chrome");
	});

	test("trusttunnel: strips server-cert-fingerprint (not in mihomo doc)", () => {
		const node = makeNode({
			type: "trusttunnel",
			name: "TT",
			username: "u",
			password: "p",
			quic: true,
			sni: "sni.com",
			"server-cert-fingerprint": "sha256",
			"congestion-controller": "bbr",
		});
		const out = toMihomoOutbound(node);
		expect(out).not.toBeNull();
		expect(out?.username).toBe("u");
		expect(out?.quic).toBe(true);
		expect(out?.["congestion-controller"]).toBe("bbr");
		// server-cert-fingerprint not in mihomo trusttunnel doc.
		expect(out?.["server-cert-fingerprint"]).toBeUndefined();
	});

	test("http: strips path (mihomo http doc lists headers only)", () => {
		const node = makeNode({
			type: "http",
			name: "H",
			username: "u",
			password: "p",
			tls: true,
			path: "/some-path",
			headers: { Host: "example.com" },
		});
		const out = toMihomoOutbound(node);
		expect(out).not.toBeNull();
		expect(out?.headers).toEqual({ Host: "example.com" });
		expect(out?.path).toBeUndefined();
	});
});
