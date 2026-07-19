import { configModeFlags } from "../config-target";
import type { LooseProxyNode } from "../proxy-node";
import { routeTailscaleTraffic } from "../rules-registry";
import { CLASH_API_PORT, EXTERNAL_UI_URL, MIXED_PORT } from "../shared-constants";
import { buildDns } from "./dns";
import { toSingBoxEndpoint } from "./endpoints";
import { buildTaggedNodes } from "./groups";
import { buildOutbounds } from "./outbounds";
import { buildRoute } from "./route";
import { AUTO_SELECT_TAG, type BuildSingBoxOptions } from "./types";

export async function buildSingBoxConfig(
	options: BuildSingBoxOptions,
): Promise<Record<string, unknown>> {
	const { secret, subscriptions, customNodes, ghProxy, mode } = options;
	const { isWhite, isBlack, isDual } = configModeFlags(mode);
	const tailscaleNodes: LooseProxyNode[] = [];
	const wireguardNodes: LooseProxyNode[] = [];
	const otherCustomNodes: LooseProxyNode[] = [];
	for (const node of customNodes) {
		if (node.type === "tailscale") tailscaleNodes.push(node);
		else if (node.type === "wireguard") wireguardNodes.push(node);
		else otherCustomNodes.push(node);
	}

	const { taggedNodes, providerSelectors, selfHostedNodeTags, tailscaleNodeTags } =
		await buildTaggedNodes(subscriptions, otherCustomNodes, tailscaleNodes);

	if (taggedNodes.length === 0 && tailscaleNodes.length === 0 && wireguardNodes.length === 0) {
		throw new Error(
			"No supported sing-box nodes were produced from the provided subscriptions or proxies.",
		);
	}

	const outbounds = buildOutbounds(
		taggedNodes,
		providerSelectors,
		selfHostedNodeTags,
		tailscaleNodeTags,
		isWhite,
		isBlack,
		isDual,
	);
	const dns = buildDns(tailscaleNodes[0]?.name);
	const route = buildRoute({ isWhite, isBlack, isDual, ghProxy });

	// Filter DNS rules to only reference rule-sets that actually exist in route.rule_set
	if (dns.rules && Array.isArray(dns.rules)) {
		const validRuleSets = new Set(
			((route.rule_set as Record<string, unknown>[]) || []).map((r) => r.tag as string),
		);
		dns.rules = (dns.rules as Record<string, unknown>[])
			.map((rule) => {
				const ruleSet = rule.rule_set;
				if (ruleSet && Array.isArray(ruleSet)) {
					const filtered = (ruleSet as string[]).filter((tag) => validRuleSets.has(tag));
					if (filtered.length === 0) return null;
					return { ...rule, rule_set: filtered };
				}
				return rule;
			})
			.filter(Boolean) as Record<string, unknown>[];
	}

	if (tailscaleNodes.length > 0) {
		const tailscaleOutbound = tailscaleNodes[0]?.name;
		if (tailscaleOutbound) {
			route.rules = routeTailscaleTraffic(route.rules, tailscaleOutbound);
		}
	}

	const config: Record<string, unknown> = {
		log: { level: "info", timestamp: true },
		http_clients: [
			{
				tag: "proxy-client",
				detour: AUTO_SELECT_TAG,
			},
			{
				tag: "direct-client",
				detour: "direct",
			},
		],
		experimental: {
			clash_api: {
				external_controller: `0.0.0.0:${CLASH_API_PORT}`,
				external_ui: "zashboard",
				external_ui_download_url: EXTERNAL_UI_URL,
				external_ui_download_detour: AUTO_SELECT_TAG,
				secret: secret,
				default_mode: "rule",
			},
			cache_file: { enabled: true, store_fakeip: true, store_dns: true },
		},
		dns,
		inbounds: [{ type: "mixed", tag: "mixed-in", listen: "0.0.0.0", listen_port: MIXED_PORT }],
		outbounds,
		route,
	};

	const endpoints = [
		...tailscaleNodes.map(toSingBoxEndpoint).filter(Boolean),
		...wireguardNodes.map(toSingBoxEndpoint).filter(Boolean),
	];
	if (endpoints.length > 0) {
		config.endpoints = endpoints;
	}

	return config;
}
