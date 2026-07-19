import type { ConfigMode, Subscription } from "../../types";
import type { LooseProxyNode } from "../proxy-node";

export interface BuildMihomoOptions {
	secret: string;
	subscriptions: Subscription[];
	customProxies: string;
	customProxyNodes: LooseProxyNode[];
	customProxyNames: string[];
	ghProxy?: string | null;
	isStash: boolean;
	mode: ConfigMode;
}

// Mihomo scenario-group layout selector. Mirrors the sing-box `layout` concept
// (sing-box/types.ts GroupDefinition['layout']) but covers mihomo-specific
// proxy-list orderings.
//
//   default          → [PROXY, ...commonProxyChoices]                 use=provider, filter=common
//   block-first      → [REJECT, DIRECT, PROXY, ...autoGroupNames]     use=none,    filter=none
//   direct-first     → [DIRECT, REJECT, PROXY, ...autoGroupNames]     use=provider, filter=common
//   direct-proxy     → [DIRECT, PROXY]                                use=none,    filter=none
//   direct-proxy-rej → [DIRECT, PROXY, REJECT, ...autoGroupNames]     use=provider, filter=common
//   proxy-direct     → [PROXY, DIRECT, ...autoGroupNames]             use=provider, filter=common
export type MihomoGroupLayout =
	| "default"
	| "block-first"
	| "direct-first"
	| "direct-proxy"
	| "direct-proxy-rej"
	| "proxy-direct";

export interface MihomoGroupDefinition {
	name: string;
	layout: MihomoGroupLayout;
}
