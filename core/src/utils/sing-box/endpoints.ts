import { isSingBoxEndpoint } from "../protocol-registry";
import type { LooseProxyNode } from "../proxy-node";

/**
 * Unified sing-box endpoint builder.
 *
 * sing-box v1.14+ requires tailscale and wireguard to be emitted as
 * `config.endpoints` entries (not `config.outbounds`). This function
 * dispatches on `node.type` and returns the endpoint-shaped object, or
 * `null` for non-endpoint types (which should be emitted as outbounds via
 * `toSingBoxOutbound` instead).
 *
 * Protocol support is declared in `core/src/utils/protocol-registry.ts`
 * (`KERNEL_PROTOCOL_SUPPORT`): types with `singbox: 'endpoint'` are handled here.
 */
export function toSingBoxEndpoint(node: LooseProxyNode): Record<string, unknown> | null {
	if (!isSingBoxEndpoint(node.type)) return null;
	if (node.type === "tailscale") return buildTailscaleEndpoint(node);
	if (node.type === "wireguard") return buildWireGuardEndpoint(node);
	return null;
}

function buildTailscaleEndpoint(node: LooseProxyNode): Record<string, unknown> {
	const endpoint: Record<string, unknown> = {
		type: "tailscale",
		tag: node.name,
		auth_key: node["auth-key"],
	};

	if (node.hostname) endpoint.hostname = node.hostname;
	if (node["control-url"]) endpoint.control_url = node["control-url"];
	if (node["state-dir"]) endpoint.state_directory = node["state-dir"];
	if (node["accept-routes"] !== undefined) endpoint.accept_routes = node["accept-routes"];
	if (node["exit-node"]) endpoint.exit_node = node["exit-node"];
	if (node["exit-node-allow-lan-access"] !== undefined)
		endpoint.exit_node_allow_lan_access = node["exit-node-allow-lan-access"];
	if (node.ephemeral !== undefined) endpoint.ephemeral = node.ephemeral;
	return endpoint;
}

function buildWireGuardEndpoint(node: LooseProxyNode): Record<string, unknown> {
	const baseIps = Array.isArray(node.ip) ? node.ip : node.ip ? [String(node.ip)] : [];
	const address = node.ipv6
		? [...baseIps, String(node.ipv6)]
		: baseIps.length > 0
			? baseIps
			: ["10.0.0.2/32"];
	const port = typeof node.port === "number" ? node.port : parseInt(String(node.port), 10);
	const allowedIps =
		Array.isArray(node["allowed-ips"]) && node["allowed-ips"].length > 0
			? node["allowed-ips"]
			: ["0.0.0.0/0", "::/0"];
	const peer: Record<string, unknown> = {
		address: String(node.server),
		port: Number.isFinite(port) ? port : 51820,
		public_key: node["public-key"] || "",
		allowed_ips: allowedIps,
	};
	if (node["preshared-key"]) peer.pre_shared_key = node["preshared-key"];
	if (Array.isArray(node.reserved) && node.reserved.length > 0) peer.reserved = node.reserved;
	if (node["persistent-keepalive"] != null)
		peer.persistent_keepalive_interval = Number(node["persistent-keepalive"]);
	const endpoint: Record<string, unknown> = {
		type: "wireguard",
		tag: node.name,
		system: false,
		address,
		private_key: node["private-key"] || "",
		peers: [peer],
	};
	if (node.mtu != null && node.mtu !== "") endpoint.mtu = Number(node.mtu);
	return endpoint;
}
