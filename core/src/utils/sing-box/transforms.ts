/**
 * Sing-box ↔ canonical LooseProxyNode transform pair.
 *
 * This file co-locates the forward transform (canonical → sing-box) and its
 * inverse (sing-box → canonical) so that any field mapping change is visible
 * side-by-side. The two directions are NOT derived from a shared declarative
 * table because each direction has intentional asymmetries:
 *
 *   - `buildTls` synthesizes a TLS object from sparse canonical signals
 *     (tls===true, security==='tls', sni, alpn, utls.enabled, reality-opts…).
 *   - `applyTls` reads a rich sing-box TLS object and dispatches `server_name`
 *     back to `sni` or `servername` depending on the protocol.
 *
 * If you add/rename a field on one side, update the matching branch on the
 * other side. The `tests/sing-box/round-trip.test.ts` suite verifies the pair
 * stays consistent for every protocol.
 */

import { isSingBoxOutbound } from "../protocol-registry";
import { coerceProxyNode, type LooseProxyNode } from "../proxy-node";

// ---------------------------------------------------------------------------
// Shared coercion helpers (used by the forward direction only)
// ---------------------------------------------------------------------------

// Coerce hysteria2 up/down values (e.g. "100 Mbps", 100, "100") to an integer
// Mbps number for sing-box's up_mbps/down_mbps. Returns null if not coercible.
const MBPS_NUM_RE = /(\d+(?:\.\d+)?)/;
// sing-box duration fields (e.g. tuic heartbeat, hysteria2 hop_interval) use
// Go time.ParseDuration format which rejects bare numbers. toDuration coerces
// numeric values to seconds-suffixed strings ("10" -> "10s") and leaves valid
// duration strings ("10s", "500ms", "1m") unchanged.
const DURATION_RE = /^\d+(\.\d+)?(ns|us|µs|ms|s|m|h)$/;
const BARE_NUM_RE = /^\d+(\.\d+)?$/;

function toMbps(v: unknown): number | null {
	if (v == null) return null;
	if (typeof v === "number") return Number.isFinite(v) ? v : null;
	const s = String(v).trim();
	if (!s) return null;
	const m = s.match(MBPS_NUM_RE);
	if (!m) return null;
	const n = Number(m[1]);
	return Number.isFinite(n) ? Math.round(n) : null;
}

function toDuration(v: unknown): string | undefined {
	if (v == null || v === "") return undefined;
	if (typeof v === "number") return Number.isFinite(v) ? `${v}s` : undefined;
	const s = String(v).trim();
	if (!s) return undefined;
	if (DURATION_RE.test(s)) return s;
	if (BARE_NUM_RE.test(s)) return `${s}s`;
	return s;
}

// ---------------------------------------------------------------------------
// Forward: canonical → sing-box (buildTls / buildTransport)
// ---------------------------------------------------------------------------

export function buildTls(node: LooseProxyNode): Record<string, unknown> | undefined {
	const utls = node.utls as Record<string, unknown> | undefined;
	const enabled =
		node.tls === true ||
		node.security === "tls" ||
		node.security === "reality" ||
		Boolean(node.sni) ||
		Boolean(node.servername) ||
		Boolean(node.alpn) ||
		node["disable-sni"] === true ||
		Boolean(node["client-fingerprint"] || node.fingerprint || utls?.enabled === true) ||
		Boolean(node["reality-opts"]);
	if (!enabled) return undefined;
	const tls: Record<string, unknown> = { enabled: true };
	if (node["disable-sni"]) {
		tls.disable_sni = true;
	} else {
		tls.server_name = node.sni || node.servername || node.server;
	}
	if (node["skip-cert-verify"]) tls.insecure = true;
	// sing-box TLS has no sha256 cert-pin field (uses certificate/certificate_path
	// for PEM pins), so server-cert-fingerprint is intentionally not mapped here.
	if (Array.isArray(node.alpn) && node.alpn.length > 0) tls.alpn = node.alpn;
	const realityOpts = node["reality-opts"] as Record<string, unknown> | undefined;
	const pk = node["public-key"] || realityOpts?.["public-key"];
	const sid = node["short-id"] || realityOpts?.["short-id"];
	const fp =
		utls?.fingerprint ||
		node["client-fingerprint"] ||
		node.client_fingerprint ||
		node.fingerprint ||
		node.fp;
	if (utls?.enabled === true || fp)
		tls.utls = { enabled: true, ...(fp ? { fingerprint: String(fp) } : {}) };
	if (pk || sid) {
		tls.reality = { enabled: true, public_key: pk || "", short_id: sid || "" };
		if (!tls.utls) tls.utls = { enabled: true };
	}
	return tls;
}

export function buildTransport(node: LooseProxyNode): Record<string, unknown> | undefined {
	if (node.network === "ws") {
		const ws = node["ws-opts"] as Record<string, unknown> | undefined;
		const t: Record<string, unknown> = { type: "ws", path: ws?.path || "/" };
		if (ws?.headers && typeof ws.headers === "object") t.headers = ws.headers;
		if (ws?.["max-early-data"] != null) t.max_early_data = Number(ws["max-early-data"]);
		if (ws?.["early-data-header"]) t.early_data_header = String(ws["early-data-header"]);
		return t;
	}
	if (node.network === "grpc") {
		const grpc = node["grpc-opts"] as Record<string, unknown> | undefined;
		// sing-box v1.14+ gRPC transport exposes `service_name` only;
		// `multi_mode` was removed (auto-detected upstream). The canonical
		// `multi-mode` field is intentionally dropped on forward.
		return {
			type: "grpc",
			service_name: grpc?.serviceName || grpc?.["grpc-service-name"] || "",
		};
	}
	if (node.network === "h2") {
		const h2 = node["h2-opts"] as Record<string, unknown> | undefined;
		return {
			type: "http",
			path: h2?.path || "/",
			...(Array.isArray(h2?.host) ? { host: h2.host } : {}),
		};
	}
	if (node.network === "http") {
		const http = node["http-opts"] as Record<string, unknown> | undefined;
		return {
			type: "http",
			path: http?.path || "/",
			...(Array.isArray(http?.host) ? { host: http.host } : {}),
		};
	}
	if (node.network === "httpupgrade") {
		const opts = (node["httpupgrade-opts"] || node["ws-opts"]) as
			| Record<string, unknown>
			| undefined;
		return {
			type: "httpupgrade",
			path: opts?.path || "/",
			...(opts?.headers ? { headers: opts.headers } : {}),
		};
	}
	if (node.network === "quic") {
		return { type: "quic" };
	}
	return undefined;
}

function normalizeShadowsocksPluginName(plugin: unknown): string | undefined {
	const v = String(plugin || "").trim();
	if (!v) return undefined;
	if (v === "obfs" || v === "simple-obfs") return "obfs-local";
	if (v === "v2ray") return "v2ray-plugin";
	return v;
}

function serializePluginOptionValue(v: unknown): string | null {
	if (v == null) return null;
	if (Array.isArray(v)) return v.map(serializePluginOptionValue).filter(Boolean).join(",") || null;
	return typeof v === "object" ? null : String(v);
}

function buildShadowsocksPluginOpts(plugin: string | undefined, raw: unknown): string | undefined {
	if (typeof raw === "string") return raw.trim() || undefined;
	if (!raw || typeof raw !== "object" || Array.isArray(raw))
		return serializePluginOptionValue(raw) || undefined;
	const opts = raw as Record<string, unknown>;
	if (plugin === "obfs-local") {
		const parts: string[] = [];
		const mode = serializePluginOptionValue(opts.mode ?? opts.obfs);
		const host = serializePluginOptionValue(opts.host ?? opts["obfs-host"]);
		const uri = serializePluginOptionValue(opts.uri ?? opts["obfs-uri"]);
		if (mode) parts.push(`obfs=${mode}`);
		if (host) parts.push(`obfs-host=${host}`);
		if (uri) parts.push(`obfs-uri=${uri}`);
		return parts.length > 0 ? parts.join(";") : undefined;
	}
	const parts = Object.entries(opts)
		.map(([k, v]) => {
			const s = serializePluginOptionValue(v);
			return s ? `${k}=${s}` : null;
		})
		.filter(Boolean);
	return parts.length > 0 ? parts.join(";") : undefined;
}

// ---------------------------------------------------------------------------
// Forward: canonical → sing-box (toSingBoxOutbound)
//
// INVERSE: parseOutbound below. Each `if (node.x) o.y = …` here has a matching
// `if (source.y != null) node.x = source.y` in parseOutbound.
// ---------------------------------------------------------------------------

export function toSingBoxOutbound(
	node: LooseProxyNode,
	tag: string,
): Record<string, unknown> | null {
	// Protocol support is declared in `core/src/utils/protocol-registry.ts`.
	// Endpoint-only types (wireguard, tailscale) and unsupported types return null here.
	if (!isSingBoxOutbound(node.type)) return null;
	const server = String(node.server);
	const port = typeof node.port === "number" ? node.port : parseInt(String(node.port), 10);
	if (!Number.isFinite(port)) return null;

	if (node.type === "hysteria2") {
		const o: Record<string, unknown> = {
			type: "hysteria2",
			tag,
			server,
			server_port: port,
			password: node.password,
			tls: buildTls(node) || { enabled: true },
		};
		if (node.ports) o.server_ports = [String(node.ports)];
		if (node.obfs) o.obfs = { type: node.obfs, password: node["obfs-password"] || "" };
		const upNum = toMbps(node.up);
		if (upNum != null) o.up_mbps = upNum;
		const downNum = toMbps(node.down);
		if (downNum != null) o.down_mbps = downNum;
		const hopInterval = toDuration(node["hop-interval"]);
		if (hopInterval) o.hop_interval = hopInterval;
		return o;
	}
	if (node.type === "vless" || node.type === "vmess") {
		const type = node.type === "vless" ? "vless" : "vmess";
		const o: Record<string, unknown> = { type, tag, server, server_port: port, uuid: node.uuid };
		if (type === "vless" && node.flow) o.flow = node.flow;
		if (type === "vmess") {
			o.security = node.cipher || "auto";
			o.alter_id = Number(node.alterId || 0);
			if (node["global-padding"] != null) o.global_padding = node["global-padding"];
			if (node["authenticated-length"] != null)
				o.authenticated_length = node["authenticated-length"];
		}
		if (node["packet-encoding"]) o.packet_encoding = node["packet-encoding"];
		const tls = buildTls(node);
		if (tls) o.tls = tls;
		const transport = buildTransport(node);
		if (transport) o.transport = transport;
		return o;
	}
	if (node.type === "trojan") {
		const o: Record<string, unknown> = {
			type: "trojan",
			tag,
			server,
			server_port: port,
			password: node.password,
			tls: buildTls(node) || { enabled: true },
		};
		const transport = buildTransport(node);
		if (transport) o.transport = transport;
		return o;
	}
	if (node.type === "ss") {
		const o: Record<string, unknown> = {
			type: "shadowsocks",
			tag,
			server,
			server_port: port,
			method: node.cipher,
			password: node.password,
		};
		const p = normalizeShadowsocksPluginName(node.plugin);
		const po = buildShadowsocksPluginOpts(p, node["plugin-opts"] ?? node.plugin_opts);
		if (p) o.plugin = p;
		if (po) o.plugin_opts = po;
		if (node["udp-over-tcp"] === true) o.udp_over_tcp = true;
		return o;
	}
	if (node.type === "tuic") {
		const o: Record<string, unknown> = {
			type: "tuic",
			tag,
			server,
			server_port: port,
			uuid: node.uuid,
			password: node.password,
			congestion_control: node["congestion-controller"] || "cubic",
			udp_relay_mode: node["udp-relay-mode"] || "native",
			tls: buildTls(node) || { enabled: true },
		};
		const heartbeat = toDuration(node["heartbeat-interval"]);
		if (heartbeat) o.heartbeat = heartbeat;
		if (node["reduce-rtt"] === true) o.zero_rtt_handshake = true;
		if (node["udp-over-stream"] != null) o.udp_over_stream = node["udp-over-stream"];
		return o;
	}
	if (node.type === "anytls") {
		const o: Record<string, unknown> = {
			type: "anytls",
			tag,
			server,
			server_port: port,
			password: node.password,
			tls: buildTls(node) || { enabled: true },
		};
		const checkInterval = toDuration(node["idle-session-check-interval"]);
		if (checkInterval) o.idle_session_check_interval = checkInterval;
		const idleTimeout = toDuration(node["idle-session-timeout"]);
		if (idleTimeout) o.idle_session_timeout = idleTimeout;
		if (node["min-idle-session"] != null) o.min_idle_session = Number(node["min-idle-session"]);
		return o;
	}
	if (node.type === "socks" || node.type === "http") {
		const o: Record<string, unknown> = { type: node.type, tag, server, server_port: port };
		if (node.username || node.password) {
			o.username = node.username || "";
			o.password = node.password || "";
		}
		if (node.type === "socks" && node.version != null) o.version = node.version;
		if (node.type === "http") {
			if (node.path) o.path = node.path;
			if (node.headers && typeof node.headers === "object") o.headers = node.headers;
		}
		const tls = buildTls(node);
		if (tls) o.tls = tls;
		return o;
	}
	if (node.type === "snell") {
		const o: Record<string, unknown> = {
			type: "snell",
			tag,
			server,
			server_port: port,
			version: Number(node.version || 4),
			psk: String(node.psk || ""),
		};
		if (node.userkey) o.userkey = node.userkey;
		if (node.reuse === true) o.reuse = true;
		if (node.network) o.network = node.network;
		const v = Number(node.version || 4);
		if (v >= 6) {
			if (node.mode) o.mode = node.mode;
		} else {
			const obfs = node["obfs-opts"] as Record<string, unknown> | undefined;
			if (obfs && typeof obfs === "object") {
				if (obfs.mode) o.obfs_mode = obfs.mode;
				if (obfs.host) o.obfs_host = obfs.host;
			}
		}
		return o;
	}
	if (node.type === "naive") {
		const o: Record<string, unknown> = {
			type: "naive",
			tag,
			server,
			server_port: port,
			tls: buildTls(node) || { enabled: true, server_name: node.sni || node.server },
		};
		if (node.username) o.username = node.username;
		if (node.password) o.password = node.password;
		if (node.quic === true) {
			o.quic = true;
			if (node["quic-congestion-control"])
				o.quic_congestion_control = node["quic-congestion-control"];
		}
		if (node["insecure-concurrency"] != null)
			o.insecure_concurrency = Number(node["insecure-concurrency"]);
		if (node["extra-headers"] != null && typeof node["extra-headers"] === "object")
			o.extra_headers = node["extra-headers"];
		if (node["udp-over-tcp"] === true) o.udp_over_tcp = true;
		return o;
	}
	if (node.type === "shadowtls") {
		const o: Record<string, unknown> = {
			type: "shadowtls",
			tag,
			server,
			server_port: port,
			version: Number(node.version || 1),
			tls: buildTls(node) || { enabled: true, server_name: node.sni || node.server },
		};
		if (node.password) o.password = node.password;
		if (node.detour) o.detour = node.detour;
		return o;
	}
	return null;
}

// ---------------------------------------------------------------------------
// Inverse: sing-box → canonical (applyTls / applyTransport / parseOutbound)
//
// INVERSE: toSingBoxOutbound above. Each `if (source.y != null) node.x = …`
// here has a matching forward assignment in toSingBoxOutbound.
// ---------------------------------------------------------------------------

function applyTls(
	node: Record<string, unknown>,
	outbound: Record<string, unknown>,
	protocol: string,
): void {
	const tls = outbound.tls as Record<string, unknown> | undefined;
	if (tls?.enabled !== true) return;

	node.tls = true;
	if (tls.insecure) node["skip-cert-verify"] = true;
	if (Array.isArray(tls.alpn) && tls.alpn.length > 0) node.alpn = tls.alpn;
	if (tls.disable_sni === true) node["disable-sni"] = true;

	if (tls.server_name) {
		if (
			protocol === "trojan" ||
			protocol === "hysteria2" ||
			protocol === "tuic" ||
			protocol === "naive" ||
			protocol === "shadowtls" ||
			protocol === "anytls" ||
			protocol === "socks" ||
			protocol === "http"
		)
			node.sni = tls.server_name;
		else node.servername = tls.server_name;
	}

	const utls = tls.utls as Record<string, unknown> | undefined;
	if (utls?.enabled === true) {
		node.utls = { enabled: true, ...(utls.fingerprint ? { fingerprint: utls.fingerprint } : {}) };
		if (utls.fingerprint) node["client-fingerprint"] = utls.fingerprint;
	}

	const reality = tls.reality as Record<string, unknown> | undefined;
	if (reality?.enabled === true) {
		node.security = "reality";
		node["reality-opts"] = {
			"public-key": reality.public_key || "",
			"short-id": reality.short_id || "",
		};
	} else if (protocol === "vless") {
		node.security = "tls";
	}
}

function applyTransport(node: Record<string, unknown>, outbound: Record<string, unknown>): void {
	const transport = outbound.transport as Record<string, unknown> | undefined;
	if (!transport) return;

	if (transport.type === "ws") {
		node.network = "ws";
		node["ws-opts"] = {
			path: transport.path || "/",
			...(transport.headers && typeof transport.headers === "object"
				? { headers: transport.headers }
				: {}),
			...(transport.max_early_data == null ? {} : { "max-early-data": transport.max_early_data }),
			...(transport.early_data_header ? { "early-data-header": transport.early_data_header } : {}),
		};
	} else if (transport.type === "grpc") {
		node.network = "grpc";
		node["grpc-opts"] = {
			serviceName: transport.service_name || "",
		};
	} else if (transport.type === "http") {
		node.network = "http";
		node["http-opts"] = {
			path: transport.path || "/",
			...(transport.host
				? { host: Array.isArray(transport.host) ? transport.host : [transport.host] }
				: {}),
		};
	} else if (transport.type === "httpupgrade") {
		node.network = "httpupgrade";
		node["httpupgrade-opts"] = {
			path: transport.path || "/",
			...(transport.headers && typeof transport.headers === "object"
				? { headers: transport.headers }
				: {}),
		};
	} else if (transport.type === "quic") {
		node.network = "quic";
	}
}

export function parseOutbound(outbound: unknown): LooseProxyNode | null {
	if (!outbound || typeof outbound !== "object") return null;
	const source = outbound as Record<string, unknown>;
	const rawType = String(source.type || "").toLowerCase();
	const tag = String(source.tag || "").trim();

	if (rawType === "wireguard" && Array.isArray(source.peers) && source.peers.length > 0) {
		const peer = (source.peers[0] as Record<string, unknown>) || {};
		const node: Record<string, unknown> = {
			name: tag,
			type: "wireguard",
			server: String(peer.address || ""),
			port: peer.port,
			udp: true,
		};
		node["private-key"] = source.private_key || "";
		node["public-key"] = peer.public_key || "";
		if (peer.pre_shared_key) node["preshared-key"] = peer.pre_shared_key;
		if (Array.isArray(peer.allowed_ips) && peer.allowed_ips.length > 0)
			node["allowed-ips"] = peer.allowed_ips;
		if (peer.persistent_keepalive_interval != null)
			node["persistent-keepalive"] = peer.persistent_keepalive_interval;
		const rawAddress = source.address;
		const allAddrs = Array.isArray(rawAddress)
			? rawAddress.map(String)
			: rawAddress
				? [String(rawAddress)]
				: [];
		const ipv4Addrs = allAddrs.filter((a) => !a.includes(":"));
		const ipv6Addrs = allAddrs.filter((a) => a.includes(":"));
		node.ip = ipv4Addrs.length > 0 ? ipv4Addrs : ["10.0.0.2/32"];
		if (ipv6Addrs.length > 0) node.ipv6 = ipv6Addrs[0];
		if (Array.isArray(peer.reserved)) node.reserved = peer.reserved;
		if (source.mtu) node.mtu = source.mtu;
		return coerceProxyNode(node);
	}

	// Tailscale endpoints have no server/server_port (TailscaleSchema omits BaseProxySchema).
	if (rawType === "tailscale") {
		const node: Record<string, unknown> = {
			name: tag,
			type: "tailscale",
			"auth-key": source.auth_key || "",
			udp: true,
		};
		if (source.hostname) node.hostname = source.hostname;
		if (source.control_url) node["control-url"] = source.control_url;
		if (source.state_directory) node["state-dir"] = source.state_directory;
		if (source.accept_routes !== undefined) node["accept-routes"] = source.accept_routes;
		if (source.exit_node) node["exit-node"] = source.exit_node;
		if (source.exit_node_allow_lan_access !== undefined)
			node["exit-node-allow-lan-access"] = source.exit_node_allow_lan_access;
		if (source.ephemeral !== undefined) node.ephemeral = source.ephemeral;
		return coerceProxyNode(node);
	}

	if (!(tag && source.server) || source.server_port == null) return null;

	const node: Record<string, unknown> = {
		name: tag,
		type: rawType === "shadowsocks" ? "ss" : rawType,
		server: String(source.server),
		port: source.server_port,
		udp: true,
	};

	switch (rawType) {
		case "hysteria2":
			node.password = source.password || "";
			if (Array.isArray(source.server_ports) && source.server_ports.length > 0)
				node.ports = source.server_ports.join(",");
			if (source.obfs && typeof source.obfs === "object") {
				const obfs = source.obfs as Record<string, unknown>;
				node.obfs = obfs.type;
				if (obfs.password) node["obfs-password"] = obfs.password;
			}
			if (source.up_mbps != null) node.up = source.up_mbps;
			if (source.down_mbps != null) node.down = source.down_mbps;
			if (source.hop_interval) node["hop-interval"] = source.hop_interval;
			break;
		case "vless":
			node.uuid = source.uuid || "";
			if (source.flow) node.flow = source.flow;
			if (source.packet_encoding) node["packet-encoding"] = source.packet_encoding;
			break;
		case "vmess":
			node.uuid = source.uuid || "";
			node.alterId = source.alter_id || 0;
			if (source.security) node.cipher = source.security;
			if (source.packet_encoding) node["packet-encoding"] = source.packet_encoding;
			if (source.global_padding != null) node["global-padding"] = source.global_padding;
			if (source.authenticated_length != null)
				node["authenticated-length"] = source.authenticated_length;
			break;
		case "trojan":
			node.password = source.password || "";
			break;
		case "shadowsocks":
			node.cipher = source.method || "";
			node.password = source.password || "";
			if (source.plugin) node.plugin = source.plugin;
			if (source.plugin_opts) {
				if (typeof source.plugin_opts === "string") {
					const opts: Record<string, unknown> = {};
					for (const pair of source.plugin_opts.split(";")) {
						const trimmed = pair.trim();
						if (!trimmed) continue;
						const eq = trimmed.indexOf("=");
						if (eq === -1) opts[trimmed] = "";
						else {
							const key = trimmed.slice(0, eq).trim();
							if (key) opts[key] = trimmed.slice(eq + 1).trim();
						}
					}
					node["plugin-opts"] = opts;
				} else {
					node["plugin-opts"] = source.plugin_opts;
				}
			}
			if (
				source.udp_over_tcp === true ||
				(source.udp_over_tcp && typeof source.udp_over_tcp === "object")
			)
				node["udp-over-tcp"] = true;
			break;
		case "tuic":
			node.uuid = source.uuid || "";
			node.password = source.password || "";
			if (source.congestion_control) node["congestion-controller"] = source.congestion_control;
			if (source.udp_relay_mode) node["udp-relay-mode"] = source.udp_relay_mode;
			if (source.heartbeat) node["heartbeat-interval"] = source.heartbeat;
			if (source.zero_rtt_handshake) node["reduce-rtt"] = true;
			if (source.udp_over_stream != null) node["udp-over-stream"] = source.udp_over_stream;
			break;
		case "anytls":
			node.password = source.password || "";
			if (source.idle_session_check_interval)
				node["idle-session-check-interval"] = source.idle_session_check_interval;
			if (source.idle_session_timeout) node["idle-session-timeout"] = source.idle_session_timeout;
			if (source.min_idle_session != null) node["min-idle-session"] = source.min_idle_session;
			break;
		case "socks":
			if (source.username != null) node.username = source.username;
			if (source.password != null) node.password = source.password;
			if (source.version != null) node.version = source.version;
			break;
		case "http":
			if (source.username != null) node.username = source.username;
			if (source.password != null) node.password = source.password;
			if (source.path) node.path = source.path;
			if (source.headers && typeof source.headers === "object") node.headers = source.headers;
			break;
		case "wireguard":
			node["private-key"] = source.private_key || "";
			node["public-key"] = source.peer_public_key || source["public-key"] || "";
			node["preshared-key"] = source.pre_shared_key || undefined;
			node.ip = source.local_address || source.address || "10.0.0.1/24";
			if (source.mtu) node.mtu = source.mtu;
			if (Array.isArray(source.reserved)) node.reserved = source.reserved;
			break;
		case "snell":
			node.psk = source.psk || "";
			if (source.version != null) node.version = source.version;
			if (source.userkey) node.userkey = source.userkey;
			if (source.reuse === true) node.reuse = true;
			if (source.network) node.network = source.network;
			if (source.mode) node.mode = source.mode;
			if (source.obfs_mode || source.obfs_host) {
				node["obfs-opts"] = {
					...(source.obfs_host ? { host: source.obfs_host } : {}),
					...(source.obfs_mode ? { mode: source.obfs_mode } : {}),
				};
			}
			break;
		case "naive":
			if (source.username != null) node.username = source.username;
			if (source.password != null) node.password = source.password;
			if (source.quic === true) node.quic = true;
			if (source.quic_congestion_control)
				node["quic-congestion-control"] = source.quic_congestion_control;
			if (source.insecure_concurrency != null)
				node["insecure-concurrency"] = source.insecure_concurrency;
			if (source.extra_headers && typeof source.extra_headers === "object")
				node["extra-headers"] = source.extra_headers;
			if (
				source.udp_over_tcp === true ||
				(source.udp_over_tcp && typeof source.udp_over_tcp === "object")
			)
				node["udp-over-tcp"] = true;
			break;
		case "shadowtls":
			if (source.version != null) node.version = source.version;
			if (source.password) node.password = source.password;
			if (source.detour) node.detour = source.detour;
			break;
		default:
			return null;
	}

	applyTls(node, source, rawType);
	applyTransport(node, source);
	return coerceProxyNode(node);
}
