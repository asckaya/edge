import { describe, expect, test } from "vitest";
import { buildProxyUri } from "../../core/src/utils/proxy-builder";
import type { LooseProxyNode } from "../../core/src/utils/proxy-node";
import { parseProxyLine } from "../../core/src/utils/proxy-parser";

/**
 * URI round-trip tests: parseProxyLine(uri) → buildProxyUri(node) → parseProxyLine(uri2).
 *
 * The URI parser (`proxy-protocol-parsers.ts`) and URI builder
 * (`proxy-builder.ts`) are inverses written independently. These tests guard
 * against drift between them, mirroring `sing-box/round-trip.test.ts` which
 * guards the sing-box forward/reverse pair.
 *
 * For each protocol we assert that a freshly-built URI round-trips back to a
 * node equivalent to the original (modulo normalization), checking the fields
 * that have non-trivial URI encoding (base64, CSV, JSON, query aliases).
 */

function parseFirst(uri: string): LooseProxyNode {
	const result = parseProxyLine(uri);
	if (!result.node) throw new Error(`Failed to parse URI: ${uri}`);
	return result.node;
}

function buildFirst(node: LooseProxyNode): string {
	const uris = buildProxyUri(node);
	if (uris.length === 0) throw new Error(`No URI built for node type ${node.type}`);
	return uris[0];
}

/** Round-trip: parse → build → parse, then return [original, round-tripped] nodes. */
function roundTrip(uri: string): { rt: LooseProxyNode; rebuiltUri: string } {
	const original = parseFirst(uri);
	const rebuiltUri = buildFirst(original);
	const rt = parseFirst(rebuiltUri);
	return { rt, rebuiltUri };
}

describe("URI round-trip — vmess", () => {
	test("vmess ws + tls + alpn + client-fingerprint", () => {
		const uri = `vmess://${Buffer.from(
			JSON.stringify({
				v: "2",
				ps: "V-WS",
				add: "h.example",
				port: 443,
				id: "uuid-1234",
				aid: 2,
				scy: "auto",
				net: "ws",
				path: "/p",
				host: "h.example",
				tls: "tls",
				sni: "h.example",
				alpn: "h2,http/1.1",
				fp: "chrome",
			}),
		).toString("base64")}`;
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("vmess");
		expect(rt.name).toBe("V-WS");
		expect(rt.server).toBe("h.example");
		expect(rt.port).toBe(443);
		expect(rt.uuid).toBe("uuid-1234");
		expect(rt.alterId).toBe(2);
		expect(rt.cipher).toBe("auto");
		expect(rt.network).toBe("ws");
		expect(rt["ws-opts"].path).toBe("/p");
		expect(rt["ws-opts"].headers.Host).toBe("h.example");
		expect(rt.tls).toBe(true);
		expect(rt.servername).toBe("h.example");
		expect(rt.alpn).toEqual(["h2", "http/1.1"]);
		expect(rt["client-fingerprint"]).toBe("chrome");
	});

	test("vmess grpc", () => {
		const uri = `vmess://${Buffer.from(
			JSON.stringify({
				v: "2",
				ps: "V-gRPC",
				add: "h2.example",
				port: 443,
				id: "uuid-grpc",
				aid: 2,
				scy: "aes-128-gcm",
				net: "grpc",
				path: "gunpath",
				tls: "tls",
				sni: "h2.example",
			}),
		).toString("base64")}`;
		const { rt } = roundTrip(uri);
		expect(rt.network).toBe("grpc");
		expect(rt["grpc-opts"].serviceName).toBe("gunpath");
		expect(rt.cipher).toBe("aes-128-gcm");
		expect(rt.alterId).toBe(2);
	});
});

describe("URI round-trip — ss (shadowsocks)", () => {
	test("ss base64 userinfo + sip003 plugin", () => {
		// aes-256-gcm:pass1
		// SIP003 format: `plugin=<plugin-name>;plugin-opts=<k=v;k2=v2>` is WRONG —
		// the convention is two separate query params: `plugin=<name>` and
		// `plugin-opts=<k=v;k2=v2>`. The parser reads them independently.
		const userinfo = Buffer.from("aes-256-gcm:pass1").toString("base64");
		const uri = `ss://${userinfo}@h.example:443/?plugin=obfs-local&plugin-opts=obfs-host%3Dbing.com#SS`;
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("ss");
		expect(rt.server).toBe("h.example");
		expect(rt.port).toBe(443);
		expect(rt.cipher).toBe("aes-256-gcm");
		expect(rt.password).toBe("pass1");
		expect(rt.name).toBe("SS");
		expect(rt.plugin).toBe("obfs-local");
		expect(rt["plugin-opts"]["obfs-host"]).toBe("bing.com");
	});

	test("ss no plugin", () => {
		const userinfo = Buffer.from("chacha20-ietf-poly1305:secret").toString("base64");
		const uri = `ss://${userinfo}@h.example:8388#Plain-SS`;
		const { rt } = roundTrip(uri);
		expect(rt.cipher).toBe("chacha20-ietf-poly1305");
		expect(rt.password).toBe("secret");
		expect(rt.plugin).toBeUndefined();
	});
});

describe("URI round-trip — vless", () => {
	test("vless reality + grpc", () => {
		const uri =
			"vless://uuid-reality@h.example:443?security=reality&pbk=pk123&sid=shortid&sni=s.com&type=grpc&serviceName=gun&fp=chrome&alpn=h2#V-Reality";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("vless");
		expect(rt.uuid).toBe("uuid-reality");
		expect(rt.server).toBe("h.example");
		expect(rt.port).toBe(443);
		expect(rt.tls).toBe(true);
		expect(rt["reality-opts"]).toBeDefined();
		expect(rt["reality-opts"]["public-key"]).toBe("pk123");
		expect(rt["reality-opts"]["short-id"]).toBe("shortid");
		expect(rt.network).toBe("grpc");
		expect(rt["grpc-opts"].serviceName).toBe("gun");
		expect(rt["client-fingerprint"]).toBe("chrome");
		expect(rt.servername).toBe("s.com");
		expect(rt.alpn).toEqual(["h2"]);
	});

	test("vless ws + tls", () => {
		const uri =
			"vless://uuid-ws@h.example:443?type=ws&path=/ws&host=h.example&security=tls&sni=h.example&alpn=h2,http/1.1#V-WS";
		const { rt } = roundTrip(uri);
		expect(rt.network).toBe("ws");
		expect(rt["ws-opts"].path).toBe("/ws");
		expect(rt["ws-opts"].headers.Host).toBe("h.example");
		expect(rt.tls).toBe(true);
		expect(rt.servername).toBe("h.example");
		expect(rt.alpn).toEqual(["h2", "http/1.1"]);
	});

	test("vless flow (xtls-rprx-vision)", () => {
		const uri =
			"vless://uuid-flow@h.example:443?flow=xtls-rprx-vision&security=tls&sni=s.com#V-Flow";
		const { rt } = roundTrip(uri);
		expect(rt.flow).toBe("xtls-rprx-vision");
	});
});

describe("URI round-trip — trojan", () => {
	test("trojan ws + tls + alpn", () => {
		const uri =
			"trojan://pass-trojan@h.example:443?type=ws&path=/t&host=h.example&sni=s.com&alpn=h2#T";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("trojan");
		expect(rt.password).toBe("pass-trojan");
		expect(rt.sni).toBe("s.com");
		expect(rt.network).toBe("ws");
		expect(rt["ws-opts"].path).toBe("/t");
		expect(rt["ws-opts"].headers.Host).toBe("h.example");
		expect(rt.alpn).toEqual(["h2"]);
	});

	test("trojan grpc + insecure", () => {
		const uri = "trojan://pwd@h.example:443?type=grpc&serviceName=gun&insecure=1&sni=s.com#T-gRPC";
		const { rt } = roundTrip(uri);
		expect(rt.network).toBe("grpc");
		expect(rt["grpc-opts"].serviceName).toBe("gun");
		expect(rt["skip-cert-verify"]).toBe(true);
	});
});

describe("URI round-trip — tuic", () => {
	test("tuic v5 with congestion + udp relay mode", () => {
		const uri =
			"tuic://uuid-tuic:pass-tuic@h.example:443?congestion_control=bbr&udp_relay_mode=quic&alpn=h3&sni=s.com&insecure=1&reduce_rtt=1#TUIC";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("tuic");
		expect(rt.uuid).toBe("uuid-tuic");
		expect(rt.password).toBe("pass-tuic");
		expect(rt.sni).toBe("s.com");
		expect(rt["congestion-controller"]).toBe("bbr");
		expect(rt["udp-relay-mode"]).toBe("quic");
		expect(rt.alpn).toEqual(["h3"]);
		expect(rt["skip-cert-verify"]).toBe(true);
		expect(rt["reduce-rtt"]).toBe(true);
		// `disable-sni` is not set in the URI; parser only sets it when `disable_sni=1`,
		// so it stays undefined (NOT false). Don't assert on absence.
	});
});

describe("URI round-trip — wireguard", () => {
	test("wireguard with reserved + allowed-ips + ipv6", () => {
		const uri =
			"wireguard://priv-key@h.example:443?public-key=pub-key&ip=10.0.0.2/32&ipv6=fd00::2/128&reserved=1,2,3&mtu=1450&allowed-ips=10.0.0.0/24,fd00::/64&preshared_key=psk&persistent-keepalive=25&remote-dns-resolve=1&dns=1.1.1.1,8.8.8.8#WG";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("wireguard");
		expect(rt.server).toBe("h.example");
		expect(rt.port).toBe(443);
		expect(rt["private-key"]).toBe("priv-key");
		expect(rt["public-key"]).toBe("pub-key");
		expect(rt.ip).toBe("10.0.0.2/32");
		expect(rt.ipv6).toBe("fd00::2/128");
		expect(rt.reserved).toEqual([1, 2, 3]);
		expect(rt.mtu).toBe(1450);
		expect(rt["allowed-ips"]).toEqual(["10.0.0.0/24", "fd00::/64"]);
		expect(rt["preshared-key"]).toBe("psk");
		// wireguard parser stores persistent-keepalive as the raw URL string ('25'),
		// and the schema accepts `union([number, string])`. Round-trip preserves the string form.
		expect(rt["persistent-keepalive"]).toBe("25");
		expect(rt["remote-dns-resolve"]).toBe(true);
		expect(rt.dns).toEqual(["1.1.1.1", "8.8.8.8"]);
	});
});

describe("URI round-trip — snell", () => {
	test("snell v4 with obfs-opts", () => {
		// snell obfs-opts is serialized by builder as `mode=<v>;host=<v>` and
		// parsed back via parseSip003PluginOpts which produces `{mode, host}`.
		const uri =
			"snell://psk-value@h.example:443?version=4&reuse=1&obfs-opts=mode%3Dhttp%3Bhost%3Dbing.com&fp=chrome#Snell";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("snell");
		expect(rt.psk).toBe("psk-value");
		expect(rt.version).toBe(4);
		expect(rt.reuse).toBe(true);
		expect(rt["obfs-opts"]).toBeDefined();
		expect(rt["obfs-opts"].mode).toBe("http");
		expect(rt["obfs-opts"].host).toBe("bing.com");
		expect(rt["client-fingerprint"]).toBe("chrome");
	});
});

describe("URI round-trip — hysteria2", () => {
	test("hysteria2 with obfs + ports range + up/down", () => {
		const uri =
			"hysteria2://auth-pass@h.example:443?sni=s.com&alpn=h3&insecure=1&obfs=salamander&obfs-password=obp&mport=2000-3000&up=100&down=200&hop-interval=30s&fingerprint=chrome#Hy2";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("hysteria2");
		expect(rt.password).toBe("auth-pass");
		expect(rt.sni).toBe("s.com");
		expect(rt.alpn).toEqual(["h3"]);
		expect(rt["skip-cert-verify"]).toBe(true);
		expect(rt.obfs).toBe("salamander");
		expect(rt["obfs-password"]).toBe("obp");
		expect(rt.ports).toBe("2000-3000");
		expect(rt.up).toBe("100");
		expect(rt.down).toBe("200");
		expect(rt["hop-interval"]).toBe("30s");
		expect(rt.fingerprint).toBe("chrome");
	});
});

describe("URI round-trip — anytls", () => {
	test("anytls with idle-session fields", () => {
		const uri =
			"anytls://anytls-pass@h.example:443?sni=s.com&alpn=h2&insecure=1&idle-session-check-interval=30&idle-session-timeout=60&min-idle-session=3&client-fingerprint=chrome#AnyTLS";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("anytls");
		expect(rt.password).toBe("anytls-pass");
		expect(rt.sni).toBe("s.com");
		expect(rt.alpn).toEqual(["h2"]);
		expect(rt["skip-cert-verify"]).toBe(true);
		// intOrStrParam coerces bare numeric strings to numbers.
		expect(rt["idle-session-check-interval"]).toBe(30);
		expect(rt["idle-session-timeout"]).toBe(60);
		expect(rt["min-idle-session"]).toBe(3);
		expect(rt["client-fingerprint"]).toBe("chrome");
	});
});

describe("URI round-trip — socks + http", () => {
	test("socks5 with tls", () => {
		// socks parser only sets tls when `tls=true` (literal string), not `tls=1`.
		const uri =
			"socks://user:pass@h.example:1080?tls=true&sni=s.com&insecure=1&fingerprint=chrome#Socks";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("socks");
		expect(rt.username).toBe("user");
		expect(rt.password).toBe("pass");
		expect(rt.tls).toBe(true);
		expect(rt.sni).toBe("s.com");
		expect(rt["skip-cert-verify"]).toBe(true);
		expect(rt.fingerprint).toBe("chrome");
	});

	test("http with headers", () => {
		// http parser only sets tls when `tls=true` (literal string), not `tls=1`.
		const headersB64 = Buffer.from(JSON.stringify({ "X-Custom": "value" })).toString("base64");
		const uri = `http://user:pass@h.example:8080?tls=true&sni=s.com&insecure=1&headers=${headersB64}#HTTP`;
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("http");
		expect(rt.username).toBe("user");
		expect(rt.password).toBe("pass");
		expect(rt.tls).toBe(true);
		expect(rt.sni).toBe("s.com");
		expect(rt["skip-cert-verify"]).toBe(true);
		expect(rt.headers).toEqual({ "X-Custom": "value" });
	});
});

describe("URI round-trip — juicity", () => {
	test("juicity with pinned-certchain-sha256", () => {
		const uri =
			"juicity://uuid-juicity:pass-juicity@h.example:443?sni=s.com&alpn=h2&congestion_control=bbr&pinned_certchain_sha256=sha256:abc&allow_insecure=1#Juicity";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("juicity");
		expect(rt.uuid).toBe("uuid-juicity");
		expect(rt.password).toBe("pass-juicity");
		expect(rt.sni).toBe("s.com");
		expect(rt.alpn).toEqual(["h2"]);
		expect(rt["congestion-control"]).toBe("bbr");
		expect(rt["pinned-certchain-sha256"]).toBe("sha256:abc");
		expect(rt["skip-cert-verify"]).toBe(true);
	});
});

describe("URI round-trip — naive", () => {
	test("naive+https with extra-headers", () => {
		const ehB64 = Buffer.from(JSON.stringify({ "X-Test": "1" })).toString("base64");
		const uri = `naive+https://user:pass@h.example:443?sni=s.com&cc=bbr&insecure_concurrency=4&extra_headers=${ehB64}#Naive`;
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("naive");
		expect(rt.username).toBe("user");
		expect(rt.password).toBe("pass");
		expect(rt.sni).toBe("s.com");
		expect(rt["quic-congestion-control"]).toBe("bbr");
		expect(rt["insecure-concurrency"]).toBe(4);
		expect(rt["extra-headers"]).toEqual({ "X-Test": "1" });
		// `quic` is not explicitly set on the node for naive+https; the parser
		// only sets `quic=true` when scheme is `naive+quic`. For naive+https
		// the field stays undefined. Don't assert false.
	});

	test("naive+quic sets quic flag", () => {
		const uri = "naive+quic://user:pass@h.example:443?sni=s.com&cc=bbr#Naive-Quic";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("naive");
		expect(rt.quic).toBe(true);
	});
});

describe("URI round-trip — masque", () => {
	test("masque with bbr-profile + congestion-controller", () => {
		// masque parser reads public-key from `?public-key=` query param.
		// userinfo (before @) is the private-key. So we put pub-key in query.
		const uri =
			"masque://priv-key@h.example:443?public-key=pub-key&ip=10.0.0.2/32&ipv6=fd00::2/128&mtu=1280&network=quic&sni=s.com&insecure=1&congestion-controller=bbr&bbr-profile=default&handshake-timeout=10s&dialer-proxy=p&remote-dns-resolve=1&dns=1.1.1.1#Masque";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("masque");
		expect(rt["private-key"]).toBe("priv-key");
		expect(rt["public-key"]).toBe("pub-key");
		expect(rt.ip).toBe("10.0.0.2/32");
		expect(rt.ipv6).toBe("fd00::2/128");
		expect(rt.mtu).toBe(1280);
		expect(rt.network).toBe("quic");
		expect(rt.sni).toBe("s.com");
		expect(rt["skip-cert-verify"]).toBe(true);
		expect(rt["congestion-controller"]).toBe("bbr");
		expect(rt["bbr-profile"]).toBe("default");
		expect(rt["handshake-timeout"]).toBe("10s");
		expect(rt["dialer-proxy"]).toBe("p");
		expect(rt["remote-dns-resolve"]).toBe(true);
		expect(rt.dns).toBe("1.1.1.1");
	});
});

describe("URI round-trip — mieru", () => {
	test("mieru with all transport fields", () => {
		const uri =
			"mieru://user:pass@h.example:443?port-range=2000-3000&transport=tcp&multiplexing=smux&handshake-mode=fast&traffic-pattern=standard#Mieru";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("mieru");
		expect(rt.username).toBe("user");
		expect(rt.password).toBe("pass");
		expect(rt["port-range"]).toBe("2000-3000");
		expect(rt.transport).toBe("tcp");
		expect(rt.multiplexing).toBe("smux");
		expect(rt["handshake-mode"]).toBe("fast");
		expect(rt["traffic-pattern"]).toBe("standard");
	});
});

describe("URI round-trip — trusttunnel", () => {
	test("trusttunnel with tuning fields", () => {
		const uri =
			"trusttunnel://user:pass@h.example:443?quic=1&sni=s.com&alpn=h2&insecure=1&fp=chrome&health-check=1&name-cert-verify=strict&congestion-controller=bbr&bbr-profile=default&max-connections=10&min-streams=2&max-streams=20#TT";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("trusttunnel");
		expect(rt.username).toBe("user");
		expect(rt.password).toBe("pass");
		expect(rt.quic).toBe(true);
		expect(rt.sni).toBe("s.com");
		expect(rt.alpn).toEqual(["h2"]);
		expect(rt["skip-cert-verify"]).toBe(true);
		expect(rt["client-fingerprint"]).toBe("chrome");
		expect(rt["health-check"]).toBe(true);
		expect(rt["name-cert-verify"]).toBe("strict");
		expect(rt["congestion-controller"]).toBe("bbr");
		expect(rt["bbr-profile"]).toBe("default");
		expect(rt["max-connections"]).toBe(10);
		expect(rt["min-streams"]).toBe(2);
		expect(rt["max-streams"]).toBe(20);
	});
});

describe("URI round-trip — shadowtls", () => {
	test("shadowtls v3 with detour + password in query", () => {
		// shadowtls has no userinfo; password is passed as `?password=` query param.
		const uri =
			"shadowtls://h.example:443?version=3&password=shadow-pass&sni=s.com&insecure=1&detour=inbound-shadowtls#ShadowTLS";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("shadowtls");
		expect(rt.version).toBe(3);
		expect(rt.password).toBe("shadow-pass");
		expect(rt.sni).toBe("s.com");
		expect(rt["skip-cert-verify"]).toBe(true);
		expect(rt.detour).toBe("inbound-shadowtls");
	});
});

describe("URI round-trip — tailscale", () => {
	test("tailscale with all fields (=true form)", () => {
		const uri =
			"tailscale://auth-key-value@controlplane.tailscale.com?hostname=node-name&control-url=https://controlplane.tailscale.com&state-dir=/var/ts&accept-routes=true&exit-node=exit.example&ephemeral=true&exit-node-allow-lan-access=true#TS";
		const { rt } = roundTrip(uri);
		expect(rt.type).toBe("tailscale");
		expect(rt["auth-key"]).toBe("auth-key-value");
		expect(rt.hostname).toBe("node-name");
		expect(rt["control-url"]).toBe("https://controlplane.tailscale.com");
		expect(rt["state-dir"]).toBe("/var/ts");
		expect(rt["accept-routes"]).toBe(true);
		expect(rt["exit-node"]).toBe("exit.example");
		expect(rt.ephemeral).toBe(true);
		expect(rt["exit-node-allow-lan-access"]).toBe(true);
	});

	test("tailscale boolean params accept =1 form (parser/builder symmetry)", () => {
		// The parser accepts both `=1` and `=true` for tailscale boolean params.
		const uri =
			"tailscale://auth-key-value@controlplane.tailscale.com?hostname=node-name&accept-routes=1&ephemeral=1&exit-node-allow-lan-access=1&udp=true#TS";
		const { rt } = roundTrip(uri);
		expect(rt["accept-routes"]).toBe(true);
		expect(rt.ephemeral).toBe(true);
		expect(rt["exit-node-allow-lan-access"]).toBe(true);
		expect(rt.udp).toBe(true);
	});
});

describe("URI round-trip — stability (rebuild is idempotent)", () => {
	test("building twice from the same node yields the same URI", () => {
		const uri =
			"vless://uuid-stable@h.example:443?security=reality&pbk=pk&sid=sid&sni=s.com&type=grpc&serviceName=gun&fp=chrome#Stable";
		const node = parseFirst(uri);
		const rebuilt1 = buildFirst(node);
		const node2 = parseFirst(rebuilt1);
		const rebuilt2 = buildFirst(node2);
		expect(rebuilt2).toBe(rebuilt1);
	});
});
