import { describe, expect, test } from "vitest";
import type { ProxyNode } from "../../core/src/types";
import { buildProxyUri } from "../../core/src/utils/proxy-builder";

describe("buildProxyUri", () => {
	test("builds vless protocol", () => {
		const node: ProxyNode = {
			name: "VLESS-Node",
			type: "vless",
			server: "server.com",
			port: 443,
			uuid: "uuid-1234",
			tls: true,
			network: "grpc",
			servername: "sni.com",
			"reality-opts": {
				"public-key": "public_key",
				"short-id": "short_id",
			},
			"grpc-opts": {
				serviceName: "g",
			},
		};

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toMatch(
			new RegExp(`^${"vless://uuid-1234@server.com:443".replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`),
		);
		expect(uri).toContain("type=grpc");
		expect(uri).toContain("sni=sni.com");
		expect(uri).toContain("pbk=public_key");
		expect(uri).toContain("sid=short_id");
		expect(uri).toContain("serviceName=g");
		expect(uri).toContain("#VLESS-Node");
	});

	test("builds hysteria2 protocol with port range", () => {
		const node: ProxyNode = {
			name: "Hy2-Node",
			type: "hysteria2",
			server: "hy2.server.com",
			port: 20000,
			password: "password",
			sni: "sni.com",
			"skip-cert-verify": true,
			alpn: ["h3", "h2"],
			ports: "20000-40000",
		};

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toMatch(
			new RegExp(
				`^${"hysteria2://password@hy2.server.com:20000".replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`,
			),
		);
		expect(uri).toContain("mport=20000-40000");
		expect(uri).toContain("sni=sni.com");
		expect(uri).toContain("insecure=1");
		expect(uri).toContain("alpn=h3%2Ch2");
		expect(uri).toContain("#Hy2-Node");
	});

	test("builds tuic protocol", () => {
		const node: ProxyNode = {
			name: "TUIC-Node",
			type: "tuic",
			server: "tuic.server.com",
			port: 443,
			uuid: "uuid",
			password: "password",
			sni: "sni.com",
			alpn: ["h3"],
			"congestion-controller": "bbr",
			"udp-relay-mode": "native",
			"skip-cert-verify": true,
		};

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toMatch(
			new RegExp(
				`^${"tuic://uuid:password@tuic.server.com:443".replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`,
			),
		);
		expect(uri).toContain("sni=sni.com");
		expect(uri).toContain("congestion_control=bbr");
		expect(uri).toContain("udp_relay_mode=native");
		expect(uri).toContain("insecure=1");
		expect(uri).toContain("#TUIC-Node");
	});

	test("builds wireguard protocol", () => {
		const node: ProxyNode = {
			name: "WG-Node",
			type: "wireguard",
			server: "wg.server.com",
			port: 443,
			"private-key": "priv_key",
			"public-key": "peer_pub",
			ip: ["10.0.0.2/24", "fd00::2"],
			mtu: 1420,
			reserved: [1, 2, 3],
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toMatch(
			new RegExp(
				`^${"wireguard://priv_key@wg.server.com:443".replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`,
			),
		);
		expect(uri).toContain("public-key=peer_pub");
		expect(uri).toContain("ip=10.0.0.2%2F24%2Cfd00%3A%3A2");
		expect(uri).toContain("mtu=1420");
		expect(uri).toContain("reserved=1%2C2%2C3");
		expect(uri).toContain("#WG-Node");
	});

	test("builds tailscale protocol", () => {
		const node = {
			name: "Tailscale-Node",
			type: "tailscale",
			"auth-key": "tskey-auth-xxxx",
			hostname: "mihomo",
			"control-url": "https://controlplane.tailscale.com",
			"state-dir": "./state",
			"accept-routes": true,
			"exit-node": "100.88.0.1",
			ephemeral: true,
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toContain("tailscale://tskey-auth-xxxx@controlplane.tailscale.com");
		expect(uri).toContain("hostname=mihomo");
		expect(uri).toContain("control-url=https%3A%2F%2Fcontrolplane.tailscale.com");
		expect(uri).toContain("state-dir=.%2Fstate");
		expect(uri).toContain("accept-routes=true");
		expect(uri).toContain("exit-node=100.88.0.1");
		expect(uri).toContain("ephemeral=true");
		expect(uri).toContain("udp=true");
		expect(uri).toContain("#Tailscale-Node");
	});

	test("builds ss protocol with plugin and plugin-opts", () => {
		const node = {
			name: "SS-Node",
			type: "ss",
			server: "ss.server.com",
			port: 8388,
			cipher: "aes-256-gcm",
			password: "password",
			plugin: "obfs-local",
			"plugin-opts": { mode: "http", host: "example.com" },
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		const base64Auth = Buffer.from("aes-256-gcm:password").toString("base64");
		expect(uri).toContain(`ss://${base64Auth}@ss.server.com:8388`);
		expect(uri).toContain("plugin=obfs-local");
		expect(uri).toContain("plugin-opts=mode%3Dhttp%3Bhost%3Dexample.com");
		expect(uri).toContain("#SS-Node");
	});

	test("builds vmess protocol with grpc serviceName and alpn", () => {
		const node = {
			name: "VMess-GRPC",
			type: "vmess",
			server: "vmess.server.com",
			port: 443,
			uuid: "uuid-1234",
			network: "grpc",
			tls: true,
			sni: "sni.com",
			"grpc-opts": { serviceName: "grpc-service" },
			alpn: ["h2", "http/1.1"],
			"client-fingerprint": "chrome",
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];
		expect(uri).toContain("vmess://");

		const decoded = JSON.parse(
			Buffer.from(uri.replace("vmess://", ""), "base64").toString("utf-8"),
		);
		expect(decoded.net).toBe("grpc");
		expect(decoded.path).toBe("grpc-service");
		expect(decoded.alpn).toBe("h2,http/1.1");
		expect(decoded.fp).toBe("chrome");
	});

	test("builds vless protocol with alpn and client-fingerprint", () => {
		const node = {
			name: "VLESS-ALPN",
			type: "vless",
			server: "server.com",
			port: 443,
			uuid: "uuid-1234",
			tls: true,
			network: "tcp",
			servername: "sni.com",
			alpn: ["h2", "http/1.1"],
			"client-fingerprint": "chrome",
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toContain("alpn=h2%2Chttp%2F1.1");
		expect(uri).toContain("fp=chrome");
	});

	test("builds trojan protocol with client-fingerprint and network", () => {
		const node = {
			name: "Trojan-WS",
			type: "trojan",
			server: "trojan.server.com",
			port: 443,
			password: "password",
			sni: "sni.com",
			network: "ws",
			"ws-opts": { path: "/ws", headers: { Host: "host.com" } },
			"client-fingerprint": "chrome",
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toContain("type=ws");
		expect(uri).toContain("path=%2Fws");
		expect(uri).toContain("host=host.com");
		expect(uri).toContain("fp=chrome");
	});

	test("builds http protocol with headers", () => {
		const headers = { "X-Custom": "value", Host: "host.com" };
		const node = {
			name: "HTTP-Node",
			type: "http",
			server: "http.server.com",
			port: 8080,
			tls: true,
			sni: "sni.com",
			headers,
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		const headersParam = new URL(uri).searchParams.get("headers");
		expect(headersParam).toBeTruthy();
		if (headersParam === null) throw new Error("test setup failed: headersParam is null");
		expect(JSON.parse(Buffer.from(headersParam, "base64").toString("utf-8"))).toEqual(headers);
	});

	test("builds wireguard protocol with allowed-ips", () => {
		const node = {
			name: "WG-Allowed",
			type: "wireguard",
			server: "wg.server.com",
			port: 443,
			"private-key": "priv_key",
			"public-key": "peer_pub",
			ip: "10.0.0.1/24",
			"allowed-ips": ["10.0.0.0/24", "192.168.0.0/16"],
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toContain("allowed-ips=10.0.0.0%2F24%2C192.168.0.0%2F16");
	});

	test("builds hysteria2 protocol without hardcoded h3 alpn when absent", () => {
		const node = {
			name: "Hy2-NoAlpn",
			type: "hysteria2",
			server: "hy2.server.com",
			port: 443,
			password: "password",
			sni: "sni.com",
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).not.toContain("alpn=h3");
		expect(uri).not.toContain("alpn=");
	});

	test("builds tuic protocol without hardcoded h3 alpn when absent", () => {
		const node = {
			name: "TUIC-NoAlpn",
			type: "tuic",
			server: "tuic.server.com",
			port: 443,
			uuid: "uuid",
			password: "password",
			sni: "sni.com",
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).not.toContain("alpn=h3");
		expect(uri).not.toContain("alpn=");
	});

	test("builds snell v4 protocol with obfs", () => {
		const node = {
			name: "Snell-Node",
			type: "snell",
			server: "snell.server.com",
			port: 443,
			psk: "psk-secret",
			version: 4,
			reuse: true,
			"obfs-opts": { mode: "http", host: "bing.com" },
			"client-fingerprint": "chrome",
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toContain("snell://psk-secret@snell.server.com:443");
		expect(uri).toContain("version=4");
		expect(uri).toContain("reuse=1");
		expect(uri).toContain("obfs-opts=mode%3Dhttp%3Bhost%3Dbing.com");
		expect(uri).toContain("fp=chrome");
		expect(uri).toContain("udp=true");
		expect(uri).toContain("#Snell-Node");
	});

	test("builds snell v6 protocol with userkey and mode", () => {
		const node = {
			name: "Snell-V6",
			type: "snell",
			server: "snell.server.com",
			port: 443,
			psk: "psk-secret",
			version: 6,
			userkey: "ukey123",
			mode: "unshaped",
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toContain("version=6");
		expect(uri).toContain("userkey=ukey123");
		expect(uri).toContain("mode=unshaped");
	});

	test("builds juicity protocol", () => {
		const node = {
			name: "Juicity-Node",
			type: "juicity",
			server: "juicity.server.com",
			port: 443,
			uuid: "uuid-1234",
			password: "password",
			sni: "sni.com",
			alpn: ["h3"],
			"congestion-control": "bbr",
			"pinned-certchain-sha256": "sha256abc",
			"skip-cert-verify": true,
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toContain("juicity://uuid-1234:password@juicity.server.com:443");
		expect(uri).toContain("sni=sni.com");
		expect(uri).toContain("alpn=h3");
		expect(uri).toContain("congestion_control=bbr");
		expect(uri).toContain("pinned_certchain_sha256=sha256abc");
		expect(uri).toContain("allow_insecure=1");
		expect(uri).toContain("#Juicity-Node");
	});

	test("builds naive+https protocol", () => {
		const node = {
			name: "Naive-HTTPS",
			type: "naive",
			server: "naive.server.com",
			port: 443,
			username: "user",
			password: "pass",
			sni: "sni.com",
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri.startsWith("naive+https://")).toBe(true);
		expect(uri).toContain("user:pass@naive.server.com:443");
		expect(uri).toContain("sni=sni.com");
		expect(uri).toContain("#Naive-HTTPS");
	});

	test("builds naive+quic protocol with cc and extra headers", () => {
		const headers = { "X-Custom": "value" };
		const node = {
			name: "Naive-QUIC",
			type: "naive",
			server: "naive.server.com",
			port: 443,
			username: "user",
			password: "pass",
			sni: "sni.com",
			quic: true,
			"quic-congestion-control": "bbr2",
			"insecure-concurrency": 8,
			"udp-over-tcp": true,
			"extra-headers": headers,
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri.startsWith("naive+quic://")).toBe(true);
		expect(uri).toContain("user:pass@naive.server.com:443");
		expect(uri).toContain("sni=sni.com");
		expect(uri).toContain("cc=bbr2");
		expect(uri).toContain("insecure_concurrency=8");
		expect(uri).toContain("udp_over_tcp=1");
		const eh = new URL(uri).searchParams.get("extra_headers");
		expect(eh).toBeTruthy();
		if (eh === null) throw new Error("test setup failed: eh is null");
		expect(JSON.parse(Buffer.from(eh, "base64").toString("utf-8"))).toEqual(headers);
	});

	test("builds masque protocol", () => {
		const node = {
			name: "Masque-Node",
			type: "masque",
			server: "masque.server.com",
			port: 443,
			"private-key": "priv_key",
			"public-key": "peer_pub",
			ip: "10.0.0.2/24",
			ipv6: "fd00::2",
			mtu: 1280,
			network: "quic",
			sni: "sni.com",
			"skip-cert-verify": true,
			"congestion-controller": "bbr",
			"bbr-profile": "default",
			"handshake-timeout": 10,
			"dialer-proxy": "proxy1",
			"remote-dns-resolve": true,
			dns: ["1.1.1.1", "8.8.8.8"],
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toContain("masque://priv_key@masque.server.com:443");
		expect(uri).toContain("public-key=peer_pub");
		expect(uri).toContain("ip=10.0.0.2%2F24");
		expect(uri).toContain("ipv6=fd00%3A%3A2");
		expect(uri).toContain("mtu=1280");
		expect(uri).toContain("network=quic");
		expect(uri).toContain("sni=sni.com");
		expect(uri).toContain("insecure=1");
		expect(uri).toContain("congestion-controller=bbr");
		expect(uri).toContain("bbr-profile=default");
		expect(uri).toContain("handshake-timeout=10");
		expect(uri).toContain("dialer-proxy=proxy1");
		expect(uri).toContain("remote-dns-resolve=1");
		expect(uri).toContain("dns=1.1.1.1%2C8.8.8.8");
		expect(uri).toContain("#Masque-Node");
	});

	test("builds mieru protocol", () => {
		const node = {
			name: "Mieru-Node",
			type: "mieru",
			server: "mieru.server.com",
			port: 443,
			username: "user",
			password: "pass",
			"port-range": "20000-40000",
			transport: "tcp",
			multiplexing: "true",
			"traffic-pattern": "pattern1",
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toContain("mieru://user:pass@mieru.server.com:443");
		expect(uri).toContain("port-range=20000-40000");
		expect(uri).toContain("transport=tcp");
		expect(uri).toContain("multiplexing=true");
		expect(uri).toContain("traffic-pattern=pattern1");
		expect(uri).toContain("#Mieru-Node");
	});

	test("builds trusttunnel protocol with quic", () => {
		const node = {
			name: "Trusttunnel-Node",
			type: "trusttunnel",
			server: "tt.server.com",
			port: 443,
			username: "user",
			password: "pass",
			quic: true,
			sni: "sni.com",
			alpn: ["h3"],
			"skip-cert-verify": true,
			"server-cert-fingerprint": "sha256abc",
			"congestion-controller": "bbr",
			"bbr-profile": "default",
			"max-connections": 10,
			"min-streams": 2,
			"max-streams": 100,
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toContain("trusttunnel://user:pass@tt.server.com:443");
		expect(uri).toContain("quic=1");
		expect(uri).toContain("sni=sni.com");
		expect(uri).toContain("alpn=h3");
		expect(uri).toContain("insecure=1");
		expect(uri).toContain("pinned_certchain_sha256=sha256abc");
		expect(uri).toContain("congestion-controller=bbr");
		expect(uri).toContain("bbr-profile=default");
		expect(uri).toContain("max-connections=10");
		expect(uri).toContain("min-streams=2");
		expect(uri).toContain("max-streams=100");
		expect(uri).toContain("#Trusttunnel-Node");
	});

	test("builds shadowtls protocol v3", () => {
		const node = {
			name: "ShadowTLS-Node",
			type: "shadowtls",
			server: "shadowtls.server.com",
			port: 443,
			version: 3,
			password: "stlspass",
			sni: "sni.com",
			"skip-cert-verify": true,
			detour: "proxy1",
			"server-cert-fingerprint": "sha256abc",
			udp: true,
		} as unknown as ProxyNode;

		const uris = buildProxyUri(node);
		expect(uris).toHaveLength(1);
		const uri = uris[0];

		expect(uri).toContain("shadowtls://shadowtls.server.com:443");
		expect(uri).toContain("version=3");
		expect(uri).toContain("password=stlspass");
		expect(uri).toContain("sni=sni.com");
		expect(uri).toContain("insecure=1");
		expect(uri).toContain("detour=proxy1");
		expect(uri).toContain("pinned_certchain_sha256=sha256abc");
		expect(uri).toContain("#ShadowTLS-Node");
	});
});
