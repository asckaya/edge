import { describe, expect, test } from "vitest";
import YAML from "yaml";
import { buildProxyUri } from "../../core/src/utils/proxy-builder";
import { parseProxyLine, parseProxyUri } from "../../core/src/utils/proxy-parser";

describe("parseProxyUri", () => {
	test("handles empty string", () => {
		expect(parseProxyUri("")).toBe("");
	});

	test("parses vless protocol with reality", () => {
		const uri =
			"vless://uuid-1234@server.com:443?type=grpc&security=reality&pbk=public_key&sid=short_id&sni=sni.com&serviceName=g#VLESS-Node";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
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
				"grpc-service-name": "g",
			},
		});
	});

	test("parses hysteria2 protocol with port range", () => {
		const uri =
			"hysteria2://password@hy2.server.com:20000-40000?sni=sni.com&insecure=1&alpn=h3,h2&mport=20000-40000#Hy2-Node";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
			name: "Hy2-Node",
			type: "hysteria2",
			server: "hy2.server.com",
			port: 20000,
			password: "password",
			sni: "sni.com",
			"skip-cert-verify": true,
			alpn: ["h3", "h2"],
			ports: "20000-40000",
		});
	});

	test("parses tuic protocol", () => {
		const uri =
			"tuic://uuid:password@tuic.server.com:443?sni=sni.com&alpn=h3&congestion_control=bbr&udp_relay_mode=native#TUIC-Node";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
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
		});
	});

	test("parses wireguard protocol", () => {
		const uri =
			"wireguard://priv_key@wg.server.com:443?public-key=peer_pub&ip=10.0.0.2%2F24,fd00::2&mtu=1420&reserved=1,2,3#WG-Node";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
			name: "WG-Node",
			type: "wireguard",
			server: "wg.server.com",
			port: 443,
			"private-key": "priv_key",
			"public-key": "peer_pub",
			ip: ["10.0.0.2/24", "fd00::2"],
			mtu: 1420,
			reserved: [1, 2, 3],
		});
	});

	test("parses tailscale protocol", () => {
		const uri =
			"tailscale://tskey-auth-xxxx@controlplane.tailscale.com?hostname=mihomo&state-dir=.%2Fstate&accept-routes=true&exit-node=100.88.0.1&ephemeral=true&udp=true#Tailscale-Node";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
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
		});
	});

	test("handles invalid protocol gracefully by appending as-is", () => {
		const uri = "invalid://something?foo=bar#Node";
		const yamlString = parseProxyUri(uri);
		expect(yamlString).toContain("- invalid://something?foo=bar#Node");
	});

	test("parses and builds vmess protocol with non-ASCII and emojis (UTF-8 safety test)", () => {
		const rawVmessJson = JSON.stringify({
			v: "2",
			ps: "🇺🇸 美国 01",
			add: "server.com",
			port: 443,
			id: "uuid-1234",
			aid: 0,
			scy: "auto",
			net: "tcp",
			tls: "",
		});
		const base64Vmess = Buffer.from(rawVmessJson).toString("base64");
		const uri = `vmess://${base64Vmess}`;

		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);
		expect(parsed.proxies[0]).toMatchObject({
			name: "🇺🇸 美国 01",
			type: "vmess",
			server: "server.com",
			port: 443,
			uuid: "uuid-1234",
		});

		const rebuiltUris = buildProxyUri(parsed.proxies[0]);
		expect(rebuiltUris).toHaveLength(1);
		const rebuiltUri = rebuiltUris[0];
		expect(rebuiltUri).toContain("vmess://");

		const rebuiltBase64 = rebuiltUri.replace("vmess://", "");
		const decodedRebuilt = JSON.parse(Buffer.from(rebuiltBase64, "base64").toString("utf-8"));
		expect(decodedRebuilt.ps).toBe("🇺🇸 美国 01");
	});

	test("parses and builds anytls protocol", () => {
		const uri =
			"anytls://password-123@anytls.server.com:443?sni=sni.com&alpn=h2%2Chttp%2F1.1&insecure=1&idle-session-check-interval=30&idle-session-timeout=30&min-idle-session=0&client-fingerprint=chrome#AnyTLS-Node";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
			name: "AnyTLS-Node",
			type: "anytls",
			server: "anytls.server.com",
			port: 443,
			password: "password-123",
			sni: "sni.com",
			alpn: ["h2", "http/1.1"],
			"skip-cert-verify": true,
			"idle-session-check-interval": 30,
			"idle-session-timeout": 30,
			"min-idle-session": 0,
			"client-fingerprint": "chrome",
		});

		const rebuiltUris = buildProxyUri(parsed.proxies[0]);
		expect(rebuiltUris).toHaveLength(1);
		expect(rebuiltUris[0]).toBe(
			"anytls://password-123@anytls.server.com:443?sni=sni.com&alpn=h2%2Chttp%2F1.1&insecure=1&idle-session-check-interval=30&idle-session-timeout=30&min-idle-session=0&client-fingerprint=chrome#AnyTLS-Node",
		);
	});

	test("parses ss protocol with plugin and plugin-opts (SIP003)", () => {
		const base64Auth = Buffer.from("aes-256-gcm:password").toString("base64");
		const uri = `ss://${base64Auth}@ss.server.com:8388?plugin=obfs-local&plugin-opts=mode%3Dhttp%3Bhost%3Dexample.com#SS-Node`;
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
			name: "SS-Node",
			type: "ss",
			server: "ss.server.com",
			port: 8388,
			cipher: "aes-256-gcm",
			password: "password",
			plugin: "obfs-local",
			"plugin-opts": { mode: "http", host: "example.com" },
		});
	});

	test("parses vmess protocol with grpc serviceName", () => {
		const rawVmessJson = JSON.stringify({
			v: "2",
			ps: "VMess-GRPC",
			add: "server.com",
			port: 443,
			id: "uuid-1234",
			aid: 0,
			scy: "auto",
			net: "grpc",
			tls: "tls",
			sni: "sni.com",
			path: "grpc-service",
		});
		const base64Vmess = Buffer.from(rawVmessJson).toString("base64");
		const uri = `vmess://${base64Vmess}`;
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
			name: "VMess-GRPC",
			type: "vmess",
			server: "server.com",
			port: 443,
			uuid: "uuid-1234",
			network: "grpc",
			"grpc-opts": { "grpc-service-name": "grpc-service" },
		});

		const rebuiltUris = buildProxyUri(parsed.proxies[0]);
		const decoded = JSON.parse(
			Buffer.from(rebuiltUris[0].replace("vmess://", ""), "base64").toString("utf-8"),
		);
		expect(decoded.path).toBe("grpc-service");
	});

	test("parses vmess protocol with ws network and ws-opts", () => {
		// Merged from uri.test.ts: vmess over websocket with path + host.
		const rawVmessJson = JSON.stringify({
			v: "2",
			ps: "V-WS",
			add: "h",
			port: 443,
			id: "u",
			net: "ws",
			path: "/p",
			host: "h.com",
			tls: "tls",
		});
		const uri = `vmess://${Buffer.from(rawVmessJson).toString("base64")}`;
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);
		expect(parsed.proxies[0]).toMatchObject({
			type: "vmess",
			network: "ws",
		});
		expect(parsed.proxies[0]["ws-opts"].path).toBe("/p");
	});

	test("parses vless protocol with alpn", () => {
		const uri =
			"vless://uuid-1234@server.com:443?security=tls&sni=sni.com&alpn=h2,http/1.1#VLESS-ALPN";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
			name: "VLESS-ALPN",
			type: "vless",
			alpn: ["h2", "http/1.1"],
		});
	});

	test("parses vmess protocol with alpn and client-fingerprint", () => {
		const rawVmessJson = JSON.stringify({
			v: "2",
			ps: "VMess-ALPN",
			add: "server.com",
			port: 443,
			id: "uuid-1234",
			aid: 0,
			scy: "auto",
			net: "tcp",
			tls: "tls",
			sni: "sni.com",
			alpn: "h2,http/1.1",
			fp: "chrome",
		});
		const base64Vmess = Buffer.from(rawVmessJson).toString("base64");
		const uri = `vmess://${base64Vmess}`;
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
			name: "VMess-ALPN",
			type: "vmess",
			alpn: ["h2", "http/1.1"],
			"client-fingerprint": "chrome",
		});
	});

	test("parses trojan protocol with client-fingerprint and ws network", () => {
		const uri =
			"trojan://password@trojan.server.com:443?sni=sni.com&type=ws&path=%2Fws&host=host.com&fp=chrome#Trojan-WS";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
			name: "Trojan-WS",
			type: "trojan",
			password: "password",
			network: "ws",
			"ws-opts": { path: "/ws", headers: { Host: "host.com" } },
			"client-fingerprint": "chrome",
		});
	});

	test("parses http protocol with headers (base64 JSON)", () => {
		const headers = { "X-Custom": "value", Host: "host.com" };
		const headersB64 = Buffer.from(JSON.stringify(headers)).toString("base64");
		const uri = `http://user:pass@http.server.com:8080?tls=true&sni=sni.com&headers=${headersB64}#HTTP-Node`;
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
			name: "HTTP-Node",
			type: "http",
			username: "user",
			password: "pass",
			headers,
		});
	});

	test("parses wireguard protocol with allowed-ips", () => {
		const uri =
			"wireguard://priv_key@wg.server.com:443?public-key=peer_pub&ip=10.0.0.1%2F24&allowed-ips=10.0.0.0%2F24,192.168.0.0%2F16#WG-Allowed";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
			name: "WG-Allowed",
			type: "wireguard",
			"allowed-ips": ["10.0.0.0/24", "192.168.0.0/16"],
		});
	});

	test("hysteria2 without alpn param does not get hardcoded h3", () => {
		const uri = "hysteria2://password@hy2.server.com:443?sni=sni.com#Hy2-NoAlpn";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0].alpn).toBeUndefined();
	});

	test("tuic without alpn param does not get hardcoded h3", () => {
		const uri = "tuic://uuid:password@tuic.server.com:443?sni=sni.com#TUIC-NoAlpn";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0].alpn).toBeUndefined();
	});

	test("parses snell protocol (v4 with obfs)", () => {
		const uri =
			"snell://psk-secret@snell.server.com:443?version=4&reuse=1&obfs-opts=mode%3Dhttp%3Bhost%3Dbing.com&fp=chrome&udp=true#Snell-Node";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
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
		});
	});

	test("parses snell v6 with userkey and mode (stripped for mihomo)", () => {
		const uri =
			"snell://psk-secret@snell.server.com:443?version=6&userkey=ukey123&mode=unshaped#Snell-V6";
		const { node } = parseProxyLine(uri);

		// Canonical node preserves sing-box v6 fields.
		expect(node).toMatchObject({
			name: "Snell-V6",
			type: "snell",
			psk: "psk-secret",
			version: 6,
			userkey: "ukey123",
			mode: "unshaped",
		});

		// mihomo strips sing-box-only fields (userkey/mode not in mihomo snell doc).
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);
		expect(parsed.proxies[0]).toMatchObject({
			name: "Snell-V6",
			type: "snell",
			psk: "psk-secret",
			version: 6,
		});
		expect(parsed.proxies[0].userkey).toBeUndefined();
		expect(parsed.proxies[0].mode).toBeUndefined();
	});

	test("parses juicity protocol", () => {
		const uri =
			"juicity://uuid-1234:password@juicity.server.com:443?sni=sni.com&alpn=h3&congestion_control=bbr&pinned_certchain_sha256=sha256abc&allow_insecure=1#Juicity-Node";
		const { node } = parseProxyLine(uri);

		expect(node).toMatchObject({
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
		});
	});

	test("parses naive+https protocol", () => {
		const uri = "naive+https://user:pass@naive.server.com:443?sni=sni.com#Naive-HTTPS";
		const { node } = parseProxyLine(uri);

		expect(node).toMatchObject({
			name: "Naive-HTTPS",
			type: "naive",
			server: "naive.server.com",
			port: 443,
			username: "user",
			password: "pass",
			sni: "sni.com",
		});
		expect(node?.quic).toBeUndefined();
	});

	test("parses naive+quic protocol with cc and extra headers", () => {
		const headers = { "X-Custom": "value" };
		const headersB64 = Buffer.from(JSON.stringify(headers)).toString("base64");
		const uri = `naive+quic://user:pass@naive.server.com:443?sni=sni.com&cc=bbr2&insecure_concurrency=8&udp_over_tcp=1&extra_headers=${headersB64}#Naive-QUIC`;
		const { node } = parseProxyLine(uri);

		expect(node).toMatchObject({
			name: "Naive-QUIC",
			type: "naive",
			username: "user",
			password: "pass",
			sni: "sni.com",
			quic: true,
			"quic-congestion-control": "bbr2",
			"insecure-concurrency": 8,
			"udp-over-tcp": true,
			"extra-headers": headers,
		});
	});

	test("parses masque protocol", () => {
		const uri =
			"masque://priv_key@masque.server.com:443?public-key=peer_pub&ip=10.0.0.2%2F24&ipv6=fd00::2&mtu=1280&network=quic&sni=sni.com&insecure=1&congestion-controller=bbr&bbr-profile=default&handshake-timeout=10&dialer-proxy=proxy1&remote-dns-resolve=1&dns=1.1.1.1,8.8.8.8#Masque-Node";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
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
			"handshake-timeout": "10",
			"dialer-proxy": "proxy1",
			"remote-dns-resolve": true,
			dns: ["1.1.1.1", "8.8.8.8"],
		});
	});

	test("parses mieru protocol", () => {
		const uri =
			"mieru://user:pass@mieru.server.com:443?port-range=20000-40000&transport=tcp&multiplexing=true&traffic-pattern=pattern1#Mieru-Node";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
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
		});
	});

	test("parses trusttunnel protocol with quic", () => {
		const uri =
			"trusttunnel://user:pass@tt.server.com:443?quic=1&sni=sni.com&alpn=h3&insecure=1&pinned_certchain_sha256=sha256abc&congestion-controller=bbr&bbr-profile=default&max-connections=10&min-streams=2&max-streams=100#Trusttunnel-Node";
		const yamlString = parseProxyUri(uri);
		const parsed = YAML.parse(yamlString);

		expect(parsed.proxies[0]).toMatchObject({
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
			"congestion-controller": "bbr",
			"bbr-profile": "default",
			"max-connections": 10,
			"min-streams": 2,
			"max-streams": 100,
		});
		// mihomo strips `server-cert-fingerprint` (not in mihomo trusttunnel doc).
		expect(parsed.proxies[0]["server-cert-fingerprint"]).toBeUndefined();
	});

	test("parses shadowtls protocol v3", () => {
		const uri =
			"shadowtls://shadowtls.server.com:443?version=3&password=stlspass&sni=sni.com&insecure=1&detour=proxy1&pinned_certchain_sha256=sha256abc#ShadowTLS-Node";
		const { node } = parseProxyLine(uri);

		expect(node).toMatchObject({
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
		});
	});
});
