import type { ConfigMode } from "../../types";
import type { LooseProxyNode } from "../proxy-node";
import type { ResolvedSubscription } from "../subscription-parser";

export const DOWNLOAD_SELECTOR_TAG = "📦 资源下载";
export const SELF_HOSTED_GROUP_TAG = "Self-Hosted";
export const TAILSCALE_GROUP_TAG = "Tailscale";
export const SINGBOX_DIRECT_TAG = "direct";
export const SINGBOX_BLOCK_TAG = "block";
export const LOCAL_DNS_TAG = "local-dns";
export const REMOTE_DNS_TAG = "remote-dns";
export const FAKEIP_DNS_TAG = "fakeip-dns";
export const AUTO_SELECT_TAG = "♻️ 自动选择";

export interface GroupDefinition {
	tag: string;
	layout:
		| "default"
		| "direct-first"
		| "block-first"
		| "direct-only"
		| "main-direct"
		| "direct-main";
}

export interface BuildSingBoxOptions {
	secret: string;
	subscriptions: ResolvedSubscription[];
	customNodes: LooseProxyNode[];
	ghProxy?: string | null;
	mode: ConfigMode;
}

export interface TaggedNode {
	tag: string;
	providerName: string;
	node: LooseProxyNode;
}

export interface ProviderSelector {
	providerName: string;
	selectTag: string;
	autoTag: string;
	nodeTags: string[];
}
