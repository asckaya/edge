import type { LooseProxyNode } from "../proxy-node";
import { HEALTH_CHECK_URL, PROXY_SELECTOR_TAG } from "../shared-constants";
import type { ResolvedSubscription } from "../subscription-parser";
import { getSingBoxGroupDefinitions, REGION_DEFINITIONS } from "./definitions";
import { buildGeoNodeLabel } from "./geo";
import { createUniqueTag, extractCountryCodeFromName, normalizeProxyList } from "./tags";
import {
	AUTO_SELECT_TAG,
	DOWNLOAD_SELECTOR_TAG,
	FAKEIP_DNS_TAG,
	type GroupDefinition,
	LOCAL_DNS_TAG,
	type ProviderSelector,
	REMOTE_DNS_TAG,
	SELF_HOSTED_GROUP_TAG,
	SINGBOX_BLOCK_TAG,
	SINGBOX_DIRECT_TAG,
	TAILSCALE_GROUP_TAG,
	type TaggedNode,
} from "./types";

export function buildRegionGroups(
	taggedNodes: TaggedNode[],
): { tag: string; nodeTags: string[] }[] {
	const regionMap = new Map<string, string[]>();
	for (const region of REGION_DEFINITIONS) regionMap.set(region.code, []);
	for (const tagged of taggedNodes) {
		const code = extractCountryCodeFromName(tagged.node.name);
		if (code && regionMap.has(code)) regionMap.get(code)?.push(tagged.tag);
	}
	return REGION_DEFINITIONS.map((r) => ({
		tag: r.tag,
		nodeTags: regionMap.get(r.code) || [],
	})).filter((g) => g.nodeTags.length > 0);
}

export function buildGroupChoices(
	providerSelectors: { selectTag: string; autoTag: string }[],
	regionGroups: { tag: string }[],
	selfHostedNodeTags: string[],
	tailscaleNodeTags: string[],
	allNodeTags: string[],
) {
	const autoTags = providerSelectors.map((p) => p.autoTag).filter(Boolean);
	const selectTags = providerSelectors.map((p) => p.selectTag).filter(Boolean);
	const regionTags = regionGroups.map((g) => g.tag);
	const selfHostedTags = selfHostedNodeTags.length > 0 ? [SELF_HOSTED_GROUP_TAG] : [];
	const tailscaleTags = tailscaleNodeTags.length > 0 ? [TAILSCALE_GROUP_TAG] : [];

	const groupChoices = [
		AUTO_SELECT_TAG,
		...regionTags,
		...autoTags,
		...selectTags,
		...selfHostedTags,
		...tailscaleTags,
	];
	const allChoices = [...groupChoices, ...allNodeTags];

	return {
		mainChoices: [DOWNLOAD_SELECTOR_TAG, SINGBOX_DIRECT_TAG, SINGBOX_BLOCK_TAG, ...allChoices],
		proxyChoices: [PROXY_SELECTOR_TAG, SINGBOX_DIRECT_TAG, SINGBOX_BLOCK_TAG, ...groupChoices],
		downloadChoices: [
			...autoTags,
			...selectTags,
			...selfHostedTags,
			...tailscaleTags,
			SINGBOX_DIRECT_TAG,
		],
	};
}

export function buildSelector(
	tag: string,
	outbounds: string[],
	defaultTag?: string,
): Record<string, unknown> {
	const unique = Array.from(new Set(outbounds.filter(Boolean)));
	const s: Record<string, unknown> = { type: "selector", tag, outbounds: unique };
	if (defaultTag && unique.includes(defaultTag)) s.default = defaultTag;
	return s;
}

export function buildUrlTest(tag: string, outbounds: string[]): Record<string, unknown> {
	return {
		type: "urltest",
		tag,
		outbounds,
		url: HEALTH_CHECK_URL,
		interval: "5m",
		tolerance: 50,
		idle_timeout: "30m",
	};
}

export function buildGroupOutbounds(
	layout: GroupDefinition["layout"],
	proxyChoices: string[],
): string[] {
	if (layout === "direct-only" || layout === "direct-main")
		return [SINGBOX_DIRECT_TAG, PROXY_SELECTOR_TAG];
	if (layout === "main-direct")
		return [
			PROXY_SELECTOR_TAG,
			SINGBOX_DIRECT_TAG,
			...proxyChoices.filter(
				(t) => ![PROXY_SELECTOR_TAG, SINGBOX_DIRECT_TAG, SINGBOX_BLOCK_TAG].includes(t),
			),
		];
	if (layout === "direct-first") return [SINGBOX_DIRECT_TAG, SINGBOX_BLOCK_TAG, ...proxyChoices];
	if (layout === "block-first") return [SINGBOX_BLOCK_TAG, SINGBOX_DIRECT_TAG, ...proxyChoices];
	if (
		layout === "jp-first" ||
		layout === "tw-first" ||
		layout === "hk-first" ||
		layout === "gb-first" ||
		layout === "us-first"
	) {
		const tagMap: Record<"jp-first" | "tw-first" | "hk-first" | "gb-first" | "us-first", string> = {
			"jp-first": "🇯🇵 日本节点",
			"tw-first": "🇹🇼 台湾节点",
			"hk-first": "🇭🇰 香港节点",
			"gb-first": "🇬🇧 英国节点",
			"us-first": "🇺🇸 美国节点",
		};
		const regionTag = tagMap[layout];
		return [
			regionTag,
			PROXY_SELECTOR_TAG,
			SINGBOX_DIRECT_TAG,
			...proxyChoices.filter(
				(t) => ![regionTag, PROXY_SELECTOR_TAG, SINGBOX_DIRECT_TAG, SINGBOX_BLOCK_TAG].includes(t),
			),
		];
	}
	return proxyChoices;
}

export function buildTaggedNodes(
	subscriptions: ResolvedSubscription[],
	customNodes: LooseProxyNode[],
	tailscaleNodes: LooseProxyNode[] = [],
	rulesMode: "category" | "granular" = "category",
) {
	const groupDefs = getSingBoxGroupDefinitions(rulesMode);
	const usedTags = new Set<string>([
		PROXY_SELECTOR_TAG,
		DOWNLOAD_SELECTOR_TAG,
		SELF_HOSTED_GROUP_TAG,
		TAILSCALE_GROUP_TAG,
		AUTO_SELECT_TAG,
		...REGION_DEFINITIONS.map((r) => r.tag),
		SINGBOX_DIRECT_TAG,
		SINGBOX_BLOCK_TAG,
		LOCAL_DNS_TAG,
		REMOTE_DNS_TAG,
		FAKEIP_DNS_TAG,
		...groupDefs.map((g) => g.tag),
	]);
	const taggedNodes: TaggedNode[] = [];
	const providerSelectors: ProviderSelector[] = [];
	const isSingleSub = subscriptions.length === 1;

	for (const sub of subscriptions) {
		const nodes = normalizeProxyList(sub.nodes);
		if (nodes.length === 0) continue;
		const labels = nodes.map((node, index) =>
			node.__subscriptionAlert ? String(node.name) : buildGeoNodeLabel(sub.name, index + 1, node),
		);
		const selectTag = isSingleSub ? "" : createUniqueTag(`📡 ${sub.name}`, usedTags);
		const autoTag = isSingleSub ? "" : createUniqueTag(`⚡ ${sub.name} 自动选择`, usedTags);
		const nodeTags = nodes.map((n, i) => {
			const t = createUniqueTag(labels[i] ?? String(n.name), usedTags);
			taggedNodes.push({ tag: t, providerName: sub.name, node: n });
			return t;
		});
		providerSelectors.push({ providerName: sub.name, selectTag, autoTag, nodeTags });
	}

	const selfHostedNodeTags = normalizeProxyList(customNodes).map((n) => {
		const t = createUniqueTag(String(n.name), usedTags);
		taggedNodes.push({ tag: t, providerName: SELF_HOSTED_GROUP_TAG, node: n });
		return t;
	});

	const tailscaleNodeTags = normalizeProxyList(tailscaleNodes).map((n) => {
		const t = createUniqueTag(String(n.name), usedTags);
		return t;
	});

	return { taggedNodes, providerSelectors, selfHostedNodeTags, tailscaleNodeTags };
}
