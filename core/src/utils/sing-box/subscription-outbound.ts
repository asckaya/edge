import type { LooseProxyNode } from "../proxy-node";
import { parseOutbound } from "./transforms";

/**
 * Parse a sing-box subscription config into canonical `LooseProxyNode[]`.
 *
 * The per-protocol inverse transforms (`parseOutbound`, `applyTls`,
 * `applyTransport`) live in `./transforms.ts` alongside their forward
 * counterparts (`toSingBoxOutbound`, `buildTls`, `buildTransport`) so any
 * field change is visible side-by-side.
 */
export function parseSingBoxOutbounds(input: unknown): LooseProxyNode[] {
	if (!input || typeof input !== "object") return [];
	const root = input as Record<string, unknown>;
	const nodes: LooseProxyNode[] = [];

	const outbounds = root.outbounds;
	if (Array.isArray(outbounds)) {
		for (const outbound of outbounds) {
			const node = parseOutbound(outbound);
			if (node) nodes.push(node);
		}
	}

	// sing-box v1.14+ puts wireguard/tailscale under `endpoints`, not `outbounds`.
	const endpoints = root.endpoints;
	if (Array.isArray(endpoints)) {
		for (const endpoint of endpoints) {
			const node = parseOutbound(endpoint);
			if (node) nodes.push(node);
		}
	}

	return nodes;
}
