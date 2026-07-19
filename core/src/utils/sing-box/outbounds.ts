import { GROUP_TAGS, PROXY_SELECTOR_TAG, SCENARIO_GROUPS } from "../shared-constants";
import { GROUP_DEFINITIONS } from "./definitions";
import {
	buildGroupChoices,
	buildGroupOutbounds,
	buildRegionGroups,
	buildSelector,
	buildUrlTest,
} from "./groups";
import { toSingBoxOutbound } from "./transforms";
import {
	AUTO_SELECT_TAG,
	DOWNLOAD_SELECTOR_TAG,
	type ProviderSelector,
	SELF_HOSTED_GROUP_TAG,
	SINGBOX_BLOCK_TAG,
	SINGBOX_DIRECT_TAG,
	TAILSCALE_GROUP_TAG,
	type TaggedNode,
} from "./types";

// Re-export so existing imports from './outbounds' keep working.
export { toSingBoxOutbound } from "./transforms";

export function buildOutbounds(
	taggedNodes: TaggedNode[],
	providerSelectors: ProviderSelector[],
	selfHostedNodeTags: string[],
	tailscaleNodeTags: string[],
	isWhite = false,
	isBlack = false,
	isDual = false,
): Record<string, unknown>[] {
	const nodeOutbounds = taggedNodes
		.map((tn) => toSingBoxOutbound(tn.node, tn.tag))
		.filter((o): o is Record<string, unknown> => o !== null);
	const regionGroups = buildRegionGroups(taggedNodes);
	const allNodeTags = taggedNodes.map((tn) => tn.tag);
	const { mainChoices, proxyChoices, downloadChoices } = buildGroupChoices(
		providerSelectors,
		regionGroups,
		selfHostedNodeTags,
		tailscaleNodeTags,
		allNodeTags,
	);
	const downloadDefault =
		downloadChoices.find((t) => t !== SINGBOX_DIRECT_TAG) || SINGBOX_DIRECT_TAG;

	const selectorOutbounds: Record<string, unknown>[] = [
		buildSelector(PROXY_SELECTOR_TAG, mainChoices, AUTO_SELECT_TAG),
		buildUrlTest(AUTO_SELECT_TAG, allNodeTags),
	];

	// Match Mihomo's display order: top groups -> provider groups -> regions -> scenarios.
	for (const p of providerSelectors) {
		if (p.selectTag) selectorOutbounds.push(buildSelector(p.selectTag, p.nodeTags, p.nodeTags[0]));
		if (p.autoTag) selectorOutbounds.push(buildUrlTest(p.autoTag, p.nodeTags));
	}

	selectorOutbounds.push(...regionGroups.map((r) => buildUrlTest(r.tag, r.nodeTags)));

	let groups = GROUP_DEFINITIONS;
	if (isDual || isWhite || isBlack) {
		const scenarioSet = new Set(SCENARIO_GROUPS);
		groups = GROUP_DEFINITIONS.filter((g) => !scenarioSet.has(g.tag));
	}

	for (const g of groups) {
		const outbounds = buildGroupOutbounds(g.layout, proxyChoices);
		const def =
			g.layout === "block-first"
				? GROUP_TAGS.AD_BLOCK
				: g.layout.startsWith("direct")
					? SINGBOX_DIRECT_TAG
					: PROXY_SELECTOR_TAG;
		selectorOutbounds.push(buildSelector(g.tag, outbounds, def));
	}

	selectorOutbounds.push(buildSelector(DOWNLOAD_SELECTOR_TAG, downloadChoices, downloadDefault));
	if (selfHostedNodeTags.length > 0)
		selectorOutbounds.push(
			buildSelector(SELF_HOSTED_GROUP_TAG, selfHostedNodeTags, selfHostedNodeTags[0]),
		);
	if (tailscaleNodeTags.length > 0)
		selectorOutbounds.push(
			buildSelector(TAILSCALE_GROUP_TAG, tailscaleNodeTags, tailscaleNodeTags[0]),
		);

	return [
		{ type: "direct", tag: SINGBOX_DIRECT_TAG },
		{ type: "block", tag: SINGBOX_BLOCK_TAG },
		...selectorOutbounds,
		...nodeOutbounds,
	];
}
