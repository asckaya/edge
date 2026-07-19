import type { ProxyNode } from "../types";
import type { LooseProxyNode } from "./proxy-node";

type ProtocolBuilder = (p: LooseProxyNode, name: string) => string[];

// Coerce an unknown-indexed LooseProxyNode field to string.
// LooseProxyNode is `{specific union} & Record<string, unknown>`, so indexing
// any non-literal key yields `unknown`. Every field read here is expected to be
// a string (or string-coercible) config value; this helper centralizes the cast.
const str = (v: unknown): string => (v == null ? "" : String(v));

// Read a nested opts object (ws-opts, grpc-opts, reality-opts, obfs-opts) as a
// Record<string, unknown> | undefined. The schema types these as `unknown`
// (valibot v.unknown()), so a cast is needed to index into them.
const opts = (v: unknown): Record<string, unknown> | undefined =>
	v == null ? undefined : (v as Record<string, unknown>);

// Join an array field to CSV, or stringify a scalar. Used for alpn/reserved/ip/etc.
const joinCsv = (v: unknown): string => (Array.isArray(v) ? v.map(String).join(",") : str(v));

// For each field name, if `p[field]` is truthy, set `q[field] = str(p[field])`.
// Replaces the verbose `if (p.x) q.set('x', str(p.x));` pattern.
function setQueryStr(p: LooseProxyNode, q: URLSearchParams, ...fields: string[]): void {
	for (const f of fields) {
		const v = p[f];
		if (v) q.set(f, str(v));
	}
}

function encodeSmux(smux: unknown): string {
	if (smux == null) return "";
	if (typeof smux === "string") return smux;
	return Buffer.from(JSON.stringify(smux)).toString("base64");
}

function serializeSip003PluginOpts(opts: unknown): string {
	if (typeof opts === "string") return opts;
	if (!opts || typeof opts !== "object" || Array.isArray(opts)) return "";
	const entries = Object.entries(opts as Record<string, unknown>)
		.filter(([, v]) => v != null && v !== "")
		.map(([k, v]) => {
			const s = Array.isArray(v) ? v.join(",") : String(v);
			return `${k}=${s}`;
		});
	return entries.join(";");
}

function encodeHeaders(headers: unknown): string {
	if (headers == null) return "";
	if (typeof headers === "string") return headers;
	return Buffer.from(JSON.stringify(headers)).toString("base64");
}

const PROTOCOL_BUILDERS: Record<string, ProtocolBuilder> = {
	hysteria2: (p, name) => {
		const auth = p.password || p.auth || "";
		const server = p.server || "";
		const port = p.port || str(p.ports).split("-")[0] || "443";
		const q = new URLSearchParams();
		setQueryStr(p, q, "sni");
		if (p.alpn) q.set("alpn", joinCsv(p.alpn));
		if (p["skip-cert-verify"] || p.insecure) q.set("insecure", "1");
		setQueryStr(p, q, "obfs", "obfs-password");
		const portRange = p.ports || (typeof p.port === "string" && p.port.includes("-") ? p.port : "");
		if (portRange) q.set("mport", str(portRange));
		setQueryStr(p, q, "up", "down", "hop-interval", "fingerprint");
		q.set("udp", "true");
		return [`hysteria2://${auth}@${server}:${port}?${q.toString()}#${name}`];
	},
	vless: (p, name) => {
		const uuid = p.uuid || "";
		const server = p.server || "";
		const port = p.port || "443";
		const q = new URLSearchParams();
		setQueryStr(p, q, "flow");
		if (p.network) q.set("type", str(p.network));
		if (p.sni || p.servername) q.set("sni", str(p.sni || p.servername));
		const realityOpts = opts(p["reality-opts"]);
		const hasReality =
			p.security === "reality" || !!realityOpts?.["public-key"] || !!p["public-key"];
		if (hasReality) {
			q.set("security", "reality");
		} else if (p.tls === true) {
			q.set("security", "tls");
		}
		if (p["public-key"] || realityOpts?.["public-key"]) {
			q.set("pbk", str(p["public-key"] || realityOpts?.["public-key"]));
		}
		if (p["short-id"] || realityOpts?.["short-id"]) {
			q.set("sid", str(p["short-id"] || realityOpts?.["short-id"]));
		}
		if (p["client-fingerprint"] || p.client_fingerprint || p.fp) {
			q.set("fp", str(p["client-fingerprint"] || p.client_fingerprint || p.fp));
		}
		if (p.alpn) q.set("alpn", joinCsv(p.alpn));
		setQueryStr(p, q, "packet-encoding", "fingerprint");
		if (p.smux != null) {
			const smuxStr = encodeSmux(p.smux);
			if (smuxStr) q.set("smux", smuxStr);
		}
		if (p["skip-cert-verify"] === true || p.insecure) q.set("allowInsecure", "1");
		const wsOpts = opts(p["ws-opts"]);
		const grpcOpts = opts(p["grpc-opts"]);
		if (wsOpts?.path) q.set("path", str(wsOpts.path));
		if (wsOpts?.headers) {
			const host = opts(wsOpts.headers)?.Host;
			if (host) q.set("host", str(host));
		}
		if (grpcOpts?.serviceName || grpcOpts?.["grpc-service-name"])
			q.set("serviceName", str(grpcOpts.serviceName || grpcOpts?.["grpc-service-name"]));
		return [`vless://${uuid}@${server}:${port}?${q.toString()}#${name}`];
	},
	trojan: (p, name) => {
		const pw = p.password || "";
		const server = p.server || "";
		const port = p.port || "443";
		const q = new URLSearchParams();
		setQueryStr(p, q, "sni");
		if (p.alpn) q.set("alpn", joinCsv(p.alpn));
		if (p["skip-cert-verify"] || p.insecure) q.set("insecure", "1");
		if (p["client-fingerprint"] || p.client_fingerprint || p.fp) {
			q.set("fp", str(p["client-fingerprint"] || p.client_fingerprint || p.fp));
		}
		if (p.network) q.set("type", str(p.network));
		const wsOpts = opts(p["ws-opts"]);
		const grpcOpts = opts(p["grpc-opts"]);
		if (wsOpts?.path) q.set("path", str(wsOpts.path));
		if (wsOpts?.headers) {
			const host = opts(wsOpts.headers)?.Host;
			if (host) q.set("host", str(host));
		}
		if (grpcOpts?.serviceName || grpcOpts?.["grpc-service-name"])
			q.set("serviceName", str(grpcOpts.serviceName || grpcOpts?.["grpc-service-name"]));
		const realityOpts = opts(p["reality-opts"]);
		const hasReality =
			p.security === "reality" || !!realityOpts?.["public-key"] || !!p["public-key"];
		if (hasReality) {
			q.set("security", "reality");
			if (p["public-key"] || realityOpts?.["public-key"]) {
				q.set("pbk", str(p["public-key"] || realityOpts?.["public-key"]));
			}
			if (p["short-id"] || realityOpts?.["short-id"]) {
				q.set("sid", str(p["short-id"] || realityOpts?.["short-id"]));
			}
		}
		setQueryStr(p, q, "fingerprint");
		if (p.smux != null) {
			const smuxStr = encodeSmux(p.smux);
			if (smuxStr) q.set("smux", smuxStr);
		}
		return [`trojan://${pw}@${server}:${port}?${q.toString()}#${name}`];
	},
	ss: (p, name) => {
		const cipher = p.cipher || "aes-256-gcm";
		const pw = p.password || "";
		const server = p.server || "";
		const port = p.port || "443";
		const base64Auth = Buffer.from(`${cipher}:${pw}`).toString("base64");
		const q = new URLSearchParams();
		setQueryStr(p, q, "plugin");
		const pluginOptsStr = serializeSip003PluginOpts(p["plugin-opts"]);
		if (pluginOptsStr) q.set("plugin-opts", pluginOptsStr);
		if (p["udp-over-tcp"] === true) q.set("udp-over-tcp", "1");
		setQueryStr(p, q, "udp-over-tcp-version");
		if (p.smux != null) {
			const smuxStr = encodeSmux(p.smux);
			if (smuxStr) q.set("smux", smuxStr);
		}
		const qs = q.toString();
		return [`ss://${base64Auth}@${server}:${port}${qs ? `?${qs}` : ""}#${name}`];
	},
	vmess: (p) => {
		const network = p.network || "tcp";
		const grpcOpts = opts(p["grpc-opts"]);
		const wsOpts = opts(p["ws-opts"]);
		const pathValue =
			network === "grpc"
				? str(grpcOpts?.serviceName || grpcOpts?.["grpc-service-name"] || p.path || "")
				: str(wsOpts?.path || p.path || "");
		const host = wsOpts?.headers ? opts(wsOpts.headers)?.Host : undefined;
		const obj: Record<string, unknown> = {
			v: "2",
			ps: p.name,
			add: p.server,
			port: p.port,
			id: p.uuid,
			aid: p.alterId || "0",
			scy: p.cipher || "auto",
			net: network,
			tls: p.tls ? "tls" : "",
			sni: p.sni || p.servername || "",
			path: pathValue,
			host: str(host || p.host || ""),
			allowInsecure: p["skip-cert-verify"] === true || p.insecure === true ? "1" : "",
		};
		if (p.alpn) obj.alpn = joinCsv(p.alpn);
		if (p["client-fingerprint"] || p.client_fingerprint || p.fp) {
			obj.fp = str(p["client-fingerprint"] || p.client_fingerprint || p.fp);
		}
		if (p["packet-encoding"]) obj["packet-encoding"] = str(p["packet-encoding"]);
		if (p["global-padding"] != null) obj["global-padding"] = p["global-padding"];
		if (p["authenticated-length"] != null) obj["authenticated-length"] = p["authenticated-length"];
		if (p["reality-opts"]) obj["reality-opts"] = p["reality-opts"];
		if (p.fingerprint) obj.fingerprint = str(p.fingerprint);
		if (p.smux != null) obj.smux = p.smux;
		const base64Obj = Buffer.from(JSON.stringify(obj)).toString("base64");
		return [`vmess://${base64Obj}`];
	},
	tuic: (p, name) => {
		const uuid = p.uuid || "";
		const pw = p.password || "";
		const server = p.server || "";
		const port = p.port || "443";
		const q = new URLSearchParams();
		if (p.sni) q.set("sni", str(p.sni));
		if (p.alpn) q.set("alpn", joinCsv(p.alpn));
		if (p["congestion-controller"]) q.set("congestion_control", str(p["congestion-controller"]));
		if (p["udp-relay-mode"]) q.set("udp_relay_mode", str(p["udp-relay-mode"]));
		if (p.ip) q.set("ip", str(p.ip));
		if (p["disable-sni"] === true) q.set("disable_sni", "1");
		if (p["reduce-rtt"] === true) q.set("reduce_rtt", "1");
		if (p["fast-open"] === true) q.set("fast_open", "1");
		if (p["skip-cert-verify"] || p.insecure) q.set("insecure", "1");
		if (p["heartbeat-interval"] != null) q.set("heartbeat-interval", str(p["heartbeat-interval"]));
		if (p["request-timeout"] != null) q.set("request-timeout", str(p["request-timeout"]));
		if (p["max-udp-relay-packet-size"] != null)
			q.set("max-udp-relay-packet-size", str(p["max-udp-relay-packet-size"]));
		if (p["max-open-streams"] != null) q.set("max-open-streams", str(p["max-open-streams"]));
		return [`tuic://${uuid}:${pw}@${server}:${port}?${q.toString()}#${name}`];
	},
	wireguard: (p, name) => {
		const privateKey = p["private-key"] || "";
		const server = p.server || "";
		const port = p.port || "443";
		const peerPub = p["public-key"] || p["peer-public-key"];
		const q = new URLSearchParams();
		if (peerPub) q.set("public-key", str(peerPub));
		if (p["preshared-key"]) q.set("preshared_key", str(p["preshared-key"]));
		if (p.mtu) q.set("mtu", String(p.mtu));
		if (p.reserved) q.set("reserved", joinCsv(p.reserved));
		if (p.ip) q.set("ip", joinCsv(p.ip));
		if (p["allowed-ips"]) q.set("allowed-ips", joinCsv(p["allowed-ips"]));
		if (p.ipv6) q.set("ipv6", str(p.ipv6));
		if (p["persistent-keepalive"] != null)
			q.set("persistent-keepalive", str(p["persistent-keepalive"]));
		if (p["remote-dns-resolve"] === true) q.set("remote-dns-resolve", "1");
		if (p.dns) q.set("dns", joinCsv(p.dns));
		return [`wireguard://${privateKey}@${server}:${port}?${q.toString()}#${name}`];
	},
	tailscale: (p, name) => {
		const authKey = p["auth-key"] || "";
		const q = new URLSearchParams();
		if (p.hostname) q.set("hostname", str(p.hostname));
		if (p["control-url"]) q.set("control-url", str(p["control-url"]));
		if (p["state-dir"]) q.set("state-dir", str(p["state-dir"]));
		if (p["accept-routes"] !== undefined) q.set("accept-routes", String(p["accept-routes"]));
		if (p["exit-node"]) q.set("exit-node", str(p["exit-node"]));
		if (p.ephemeral !== undefined) q.set("ephemeral", String(p.ephemeral));
		if (p["exit-node-allow-lan-access"] !== undefined)
			q.set("exit-node-allow-lan-access", String(p["exit-node-allow-lan-access"]));
		q.set("udp", p.udp === false ? "false" : "true");

		const controlUrl = str(p["control-url"]);
		let host = "controlplane.tailscale.com";
		if (controlUrl) {
			try {
				host = new URL(controlUrl).host;
			} catch {
				/* fall back to default */
			}
		}
		return [`tailscale://${authKey}@${host}?${q.toString()}#${name}`];
	},
	anytls: (p, name) => {
		const pw = p.password || "";
		const server = p.server || "";
		const port = p.port || "443";
		const q = new URLSearchParams();
		setQueryStr(p, q, "sni");
		if (p.alpn) q.set("alpn", joinCsv(p.alpn));
		if (p["skip-cert-verify"] || p.insecure) q.set("insecure", "1");
		if (p["idle-session-check-interval"])
			q.set("idle-session-check-interval", String(p["idle-session-check-interval"]));
		if (p["idle-session-timeout"]) q.set("idle-session-timeout", String(p["idle-session-timeout"]));
		if (p["min-idle-session"] != null) q.set("min-idle-session", String(p["min-idle-session"]));
		if (p["client-fingerprint"] || p.client_fingerprint)
			q.set("client-fingerprint", str(p["client-fingerprint"] || p.client_fingerprint));
		setQueryStr(p, q, "fingerprint");
		if (p.smux != null) {
			const smuxStr = encodeSmux(p.smux);
			if (smuxStr) q.set("smux", smuxStr);
		}
		if (p.udp === false) q.set("udp", "false");
		return [`anytls://${pw}@${server}:${port}?${q.toString()}#${name}`];
	},
	socks: (p, name) => {
		const user = p.username || "";
		const pw = p.password || "";
		const server = p.server || "";
		const port = p.port || "1080";
		const auth = user && pw ? `${user}:${pw}@` : user ? `${user}@` : "";
		const q = new URLSearchParams();
		if (p.tls === true) q.set("tls", "true");
		setQueryStr(p, q, "sni", "fingerprint");
		if (p["skip-cert-verify"] || p.insecure) q.set("insecure", "1");
		const qs = q.toString();
		return [`socks://${auth}${server}:${port}${qs ? `?${qs}` : ""}#${name}`];
	},
	http: (p, name) => {
		const user = p.username || "";
		const pw = p.password || "";
		const server = p.server || "";
		const port = p.port || "80";
		const auth = user && pw ? `${user}:${pw}@` : user ? `${user}@` : "";
		const q = new URLSearchParams();
		if (p.tls === true) q.set("tls", "true");
		setQueryStr(p, q, "sni");
		if (p["skip-cert-verify"] || p.insecure) q.set("insecure", "1");
		if (p.headers != null) {
			const headersStr = encodeHeaders(p.headers);
			if (headersStr) q.set("headers", headersStr);
		}
		setQueryStr(p, q, "fingerprint");
		const qs = q.toString();
		return [`http://${auth}${server}:${port}${qs ? `?${qs}` : ""}#${name}`];
	},
	snell: (p, name) => {
		const psk = str(p.psk);
		const server = p.server || "";
		const port = p.port || "443";
		const q = new URLSearchParams();
		if (p.version != null) q.set("version", str(p.version));
		if (p.reuse === true) q.set("reuse", "1");
		setQueryStr(p, q, "userkey", "mode");
		const obfs = p["obfs-opts"] as Record<string, unknown> | string | undefined;
		if (obfs) {
			const obfsStr =
				typeof obfs === "string"
					? obfs
					: Object.entries(obfs)
							.filter(([, v]) => v != null && v !== "")
							.map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : String(v)}`)
							.join(";");
			if (obfsStr) q.set("obfs-opts", obfsStr);
		}
		if (p["client-fingerprint"]) q.set("fp", str(p["client-fingerprint"]));
		q.set("udp", p.udp === false ? "false" : "true");
		return [`snell://${encodeURIComponent(psk)}@${server}:${port}?${q.toString()}#${name}`];
	},
	juicity: (p, name) => {
		const uuid = str(p.uuid);
		const pw = str(p.password);
		const server = p.server || "";
		const port = p.port || "443";
		const q = new URLSearchParams();
		setQueryStr(p, q, "sni");
		if (p.alpn) q.set("alpn", joinCsv(p.alpn));
		if (p["congestion-control"]) q.set("congestion_control", str(p["congestion-control"]));
		if (p["pinned-certchain-sha256"])
			q.set("pinned_certchain_sha256", str(p["pinned-certchain-sha256"]));
		else if (p["server-cert-fingerprint"])
			q.set("pinned_certchain_sha256", str(p["server-cert-fingerprint"]));
		if (p["skip-cert-verify"] || p.insecure) q.set("allow_insecure", "1");
		return [
			`juicity://${uuid}:${encodeURIComponent(pw)}@${server}:${port}?${q.toString()}#${name}`,
		];
	},
	naive: (p, name) => {
		const user = str(p.username);
		const pw = str(p.password);
		const server = p.server || "";
		const port = p.port || "443";
		const q = new URLSearchParams();
		setQueryStr(p, q, "sni");
		if (p["quic-congestion-control"]) q.set("cc", str(p["quic-congestion-control"]));
		if (p["insecure-concurrency"] != null)
			q.set("insecure_concurrency", str(p["insecure-concurrency"]));
		if (p["udp-over-tcp"] === true) q.set("udp_over_tcp", "1");
		if (p["extra-headers"] != null) {
			const h = encodeHeaders(p["extra-headers"]);
			if (h) q.set("extra_headers", h);
		}
		const scheme = p.quic === true ? "naive+quic" : "naive+https";
		const auth =
			user && pw
				? `${encodeURIComponent(user)}:${encodeURIComponent(pw)}@`
				: user
					? `${encodeURIComponent(user)}@`
					: "";
		return [`${scheme}://${auth}${server}:${port}?${q.toString()}#${name}`];
	},
	masque: (p, name) => {
		const priv = str(p["private-key"]);
		const server = p.server || "";
		const port = p.port || "443";
		const q = new URLSearchParams();
		setQueryStr(p, q, "public-key", "ip", "ipv6");
		if (p.mtu != null) q.set("mtu", str(p.mtu));
		setQueryStr(p, q, "network", "sni");
		if (p["skip-cert-verify"] === true) q.set("insecure", "1");
		setQueryStr(p, q, "congestion-controller", "bbr-profile");
		if (p["handshake-timeout"] != null) q.set("handshake-timeout", str(p["handshake-timeout"]));
		setQueryStr(p, q, "dialer-proxy");
		if (p["remote-dns-resolve"] === true) q.set("remote-dns-resolve", "1");
		if (p.dns) q.set("dns", joinCsv(p.dns));
		return [`masque://${encodeURIComponent(priv)}@${server}:${port}?${q.toString()}#${name}`];
	},
	mieru: (p, name) => {
		const user = str(p.username);
		const pw = str(p.password);
		const server = p.server || "";
		const port = p.port || str(p["port-range"]) || "443";
		const q = new URLSearchParams();
		setQueryStr(
			p,
			q,
			"port-range",
			"transport",
			"multiplexing",
			"handshake-mode",
			"traffic-pattern",
		);
		return [
			`mieru://${encodeURIComponent(user)}:${encodeURIComponent(pw)}@${server}:${port}?${q.toString()}#${name}`,
		];
	},
	trusttunnel: (p, name) => {
		const user = str(p.username);
		const pw = str(p.password);
		const server = p.server || "";
		const port = p.port || "443";
		const q = new URLSearchParams();
		if (p.quic === true) q.set("quic", "1");
		setQueryStr(p, q, "sni");
		if (p.alpn) q.set("alpn", joinCsv(p.alpn));
		if (p["skip-cert-verify"] === true) q.set("insecure", "1");
		if (p["client-fingerprint"]) q.set("fp", str(p["client-fingerprint"]));
		if (p["health-check"] === true) q.set("health-check", "1");
		setQueryStr(p, q, "name-cert-verify");
		if (p["server-cert-fingerprint"])
			q.set("pinned_certchain_sha256", str(p["server-cert-fingerprint"]));
		setQueryStr(p, q, "congestion-controller", "bbr-profile");
		if (p["max-connections"] != null) q.set("max-connections", str(p["max-connections"]));
		if (p["min-streams"] != null) q.set("min-streams", str(p["min-streams"]));
		if (p["max-streams"] != null) q.set("max-streams", str(p["max-streams"]));
		return [
			`trusttunnel://${encodeURIComponent(user)}:${encodeURIComponent(pw)}@${server}:${port}?${q.toString()}#${name}`,
		];
	},
	shadowtls: (p, name) => {
		const server = p.server || "";
		const port = p.port || "443";
		const q = new URLSearchParams();
		if (p.version != null) q.set("version", str(p.version));
		setQueryStr(p, q, "password", "sni");
		if (p["skip-cert-verify"] === true) q.set("insecure", "1");
		setQueryStr(p, q, "detour");
		if (p["server-cert-fingerprint"])
			q.set("pinned_certchain_sha256", str(p["server-cert-fingerprint"]));
		return [`shadowtls://${server}:${port}?${q.toString()}#${name}`];
	},
};

// Aliases
PROTOCOL_BUILDERS.wg = PROTOCOL_BUILDERS.wireguard as ProtocolBuilder;
PROTOCOL_BUILDERS.shadowsocks = PROTOCOL_BUILDERS.ss as ProtocolBuilder;

export function buildProxyUri(node: ProxyNode): string[] {
	const p = node as LooseProxyNode;
	const name = encodeURIComponent(p.name);
	const proto = p.type || "";

	const builder = PROTOCOL_BUILDERS[proto];
	if (builder) {
		return builder(p, name);
	}

	console.warn(`\x1b[33m⚠ Unknown protocol "${proto}" for proxy "${p.name}", skipping\x1b[0m`);
	return [];
}
