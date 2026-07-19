import type { LooseProxyNode } from "../../core/src/utils/proxy-node";

export const makeNode = (
	partial: Partial<LooseProxyNode> & { type: string; name: string },
): LooseProxyNode =>
	({
		server: "example.com",
		port: 443,
		udp: true,
		...partial,
	}) as LooseProxyNode;
