import * as v from "valibot";
import { AnyProxySchema, type ProxyNode } from "../types";

export type LooseProxyNode = ProxyNode & Record<string, unknown>;

function normalizeType(type: unknown): string {
	const value = String(type || "").toLowerCase();
	if (value === "shadowsocks") return "ss";
	if (value === "wg") return "wireguard";
	if (value === "socks5") return "socks";
	return value;
}

function normalizePort(port: unknown): number | string | undefined {
	if (typeof port === "number") return port;
	if (typeof port === "string") {
		if (/^\d+$/.test(port)) return parseInt(port, 10);
		return port;
	}
	return undefined;
}

/**
 * snake_case → kebab-case key mappings for proxy node fields.
 *
 * Sources that produce snake_case (sing-box reverse parser, some YAML
 * subscriptions) and camelCase (some YAML subscriptions) are normalized to
 * the kebab-case canonical form declared in `AnyProxySchema` (`types.ts`).
 *
 * The table is exported so tests can validate it against the schema
 * (every target key must be a real schema field; every multi-word kebab
 * schema field that has a snake_case counterpart elsewhere should have an
 * entry here). See `tests/common/coerce-mappings.test.ts`.
 */
export const KEY_MAPPINGS: Record<string, string> = {
	peer_public_key: "peer-public-key",
	pre_shared_key: "preshared-key",
	auth_key: "auth-key",
	authKey: "auth-key",
	control_url: "control-url",
	controlUrl: "control-url",
	state_dir: "state-dir",
	stateDir: "state-dir",
	accept_routes: "accept-routes",
	acceptRoutes: "accept-routes",
	exit_node: "exit-node",
	exitNode: "exit-node",
	idle_session_check_interval: "idle-session-check-interval",
	idle_session_timeout: "idle-session-timeout",
	min_idle_session: "min-idle-session",
	client_fingerprint: "client-fingerprint",
	pinned_certchain_sha256: "pinned-certchain-sha256",
	insecure_concurrency: "insecure-concurrency",
	extra_headers: "extra-headers",
	udp_over_tcp: "udp-over-tcp",
	quic_congestion_control: "quic-congestion-control",
	bbr_profile: "bbr-profile",
	congestion_controller: "congestion-controller",
	handshake_timeout: "handshake-timeout",
	dialer_proxy: "dialer-proxy",
	remote_dns_resolve: "remote-dns-resolve",
	traffic_pattern: "traffic-pattern",
	port_range: "port-range",
	max_connections: "max-connections",
	min_streams: "min-streams",
	max_streams: "max-streams",
	server_cert_fingerprint: "server-cert-fingerprint",
};

export function coerceProxyNode(input: unknown): LooseProxyNode | null {
	if (!input || typeof input !== "object") return null;

	const node: Record<string, unknown> = { ...(input as Record<string, unknown>) };

	if (!node.name && node.tag) node.name = String(node.tag);
	if (node.server_port != null && node.port == null) node.port = node.server_port;

	for (const [fromKey, toKey] of Object.entries(KEY_MAPPINGS)) {
		if (node[fromKey] !== undefined && node[toKey] === undefined) {
			node[toKey] = node[fromKey];
		}
	}

	node.type = normalizeType(node.type);
	node.port = normalizePort(node.port);

	if (node.type === "hysteria2") {
		if (!node.port && typeof node.ports === "string") {
			node.port = normalizePort((node.ports as string).split("-")[0]);
		}
		if (typeof node.port === "string" && node.port.includes("-") && !node.ports) {
			node.ports = node.port;
			node.port = normalizePort(node.port.split("-")[0]);
		}
	}

	if (node.type === "vless") {
		const isReality =
			node.security === "reality" ||
			!!(node["reality-opts"] as Record<string, unknown> | undefined)?.["public-key"] ||
			!!node["public-key"];
		if (isReality && node.tls == null) node.tls = true;
		if (node.security != null) delete node.security;
		if (node.cipher != null) delete node.cipher;
	}

	if (node.type === "wireguard") {
		if (!node["public-key"] && node["peer-public-key"]) {
			node["public-key"] = node["peer-public-key"];
		}
		if (node["peer-public-key"] != null) delete node["peer-public-key"];
		if (!node["public-key"]) node["public-key"] = "";
	}

	if (node.type === "masque") {
		if (node.mtu == null) node.mtu = 1280;
		if (!node.network) node.network = "quic";
	}

	const parsed = v.safeParse(AnyProxySchema, node);
	if (!parsed.success) return null;

	return {
		...node,
		...parsed.output,
	};
}

export function coerceProxyNodes(inputs: unknown[]): LooseProxyNode[] {
	const nodes: LooseProxyNode[] = [];
	for (const input of inputs) {
		const node = coerceProxyNode(input);
		if (node) nodes.push(node);
	}
	return nodes;
}
