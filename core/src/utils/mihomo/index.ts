import YAML from "yaml";
import { configMihomoFooter } from "../../../templates/mihomo/footer";
import { configMihomoHeader } from "../../../templates/mihomo/header";
import { GEODATA_URLS, GEODATA_URLS_LITE } from "../../../templates/shared/geox";
import { configStashFooter } from "../../../templates/stash/footer";
import { configStashHeader } from "../../../templates/stash/header";
import { configModeFlags } from "../config-target";
import {
	getReferencedRuleSetDefinitions,
	resolveFinalOutbound,
	resolveRouteRules,
	routeTailscaleTraffic,
} from "../rules-registry";
import { HEALTH_CHECK_URL } from "../shared-constants";
import { COMMON_PROXY_FILTER, renderMihomoGroups } from "./group-builder";
import { renderMihomoRuleProviders, renderMihomoRules } from "./rules-builder";
import { toStashOutbound } from "./stash-outbounds";
import type { BuildMihomoOptions } from "./types";

export function buildMihomoConfig(options: BuildMihomoOptions): string {
	const {
		secret,
		subscriptions,
		customProxies,
		customProxyNodes,
		customProxyNames,
		ghProxy,
		isStash,
		mode,
	} = options;
	const { isWhite, isBlack, isDual } = configModeFlags(mode);

	// Extract Tailscale proxy names early
	const tailscaleProxyNames = customProxyNodes
		.filter((proxy) => proxy.type === "tailscale")
		.map((proxy) => proxy.name);

	// Filter custom proxy names to exclude Tailscale nodes
	const tailscaleProxyNameSet = new Set(tailscaleProxyNames);
	const filteredCustomProxyNames = customProxyNames.filter(
		(name) => !tailscaleProxyNameSet.has(name),
	);

	// Build proxy-providers and subscription-specific groups
	const userAgent = "mihomo";
	const isSingleSub = subscriptions.length === 1;

	const providerNames = subscriptions.map((sub) => sub.name);
	const autoGroupNames = isSingleSub ? [] : subscriptions.map((sub) => `⚡ ${sub.name} 自动选择`);

	const proxyProvidersSection =
		subscriptions.length === 0
			? "proxy-providers:\n"
			: "proxy-providers:\n" +
				subscriptions
					.map((sub) => {
						const safeName = sub.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
						return `  ${sub.name}:
    type: http
    url: "${sub.url}"
    path: ./providers/${safeName}.yaml
    interval: 3600
    health-check:
      enable: true
      url: "${HEALTH_CHECK_URL}"
      interval: 300
      lazy: true
    header:
      User-Agent:
        - "${userAgent}"`;
					})
					.join("\n") +
				"\n";

	const subGroupsSection = isSingleSub
		? ""
		: `${subscriptions
				.map((sub) => {
					const autoGroupName = `⚡ ${sub.name} 自动选择`;
					return `  - name: ${sub.name}
    type: select
    use: [${sub.name}]
    filter: "${COMMON_PROXY_FILTER}"
  - name: ${autoGroupName}
    type: url-test
    use: [${sub.name}]
    url: ${HEALTH_CHECK_URL}
    interval: 300
    lazy: false
    filter: "${COMMON_PROXY_FILTER}"`;
				})
				.join("\n")}\n`;

	const selfHostedPlaceholder = filteredCustomProxyNames.length > 0 ? "Self-Hosted" : "";
	const tailscalePlaceholder = tailscaleProxyNames.length > 0 ? "Tailscale" : "";

	const useMinimalTemplates = isWhite || isBlack || isDual;
	const selectedGeoUrls = isWhite || isBlack ? GEODATA_URLS_LITE : GEODATA_URLS;
	const tplHeader = (isStash ? configStashHeader : configMihomoHeader)
		.replace(/{{SECRET}}/g, secret)
		.replace(/{{GEOIP_URL}}/g, selectedGeoUrls.geoip)
		.replace(/{{GEOSITE_URL}}/g, selectedGeoUrls.geosite)
		.replace(/{{MMDB_URL}}/g, selectedGeoUrls.mmdb)
		.replace(/{{ASN_URL}}/g, selectedGeoUrls.asn);

	let activeRules = resolveRouteRules({ isWhite, isBlack, isDual });
	const activeDefinitions = getReferencedRuleSetDefinitions(activeRules);

	const tplFooter = isStash ? configStashFooter : configMihomoFooter;
	const tplRuleProviders = renderMihomoRuleProviders(activeDefinitions, ghProxy, isStash);

	// 1. Prepare airport and self-hosted groups
	let airportAndSelfHostedYaml = "";

	// Add Self-Hosted group first in this sub-section
	if (filteredCustomProxyNames.length > 0) {
		airportAndSelfHostedYaml += `  - name: Self-Hosted\n    type: select\n    proxies: [${filteredCustomProxyNames.join(", ")}]\n`;
	}

	// Add Tailscale group next in this sub-section
	if (tailscaleProxyNames.length > 0) {
		airportAndSelfHostedYaml += `  - name: Tailscale\n    type: select\n    proxies: [${tailscaleProxyNames.join(", ")}]\n`;
	}

	// Add subscription groups
	if (!isSingleSub) {
		airportAndSelfHostedYaml += subGroupsSection;
	}

	// 2. Generate all groups in the requested order
	const proxyGroupsSection = renderMihomoGroups(
		{
			providerNames,
			autoGroupNames,
			selfHostedGroup: selfHostedPlaceholder,
			tailscaleGroup: tailscalePlaceholder,
			isStash,
			isSingleSub,
		},
		airportAndSelfHostedYaml,
		useMinimalTemplates,
	);

	if (tailscaleProxyNames.length > 0) {
		activeRules = routeTailscaleTraffic(activeRules, tailscaleProxyNames[0] as string, true);
	}

	const finalMatch = resolveFinalOutbound({ isWhite, isBlack, isDual }, "mihomo");
	const tplRules = renderMihomoRules(activeRules, activeDefinitions, finalMatch);

	let finalCustomProxies = customProxies;
	if (isStash && customProxyNodes.length > 0) {
		const filtered = customProxyNodes
			.map(toStashOutbound)
			.filter((p): p is Record<string, unknown> => p !== null);
		finalCustomProxies =
			filtered.length > 0
				? "proxies:\n" +
					YAML.stringify(filtered)
						.split("\n")
						.map((line) => (line ? `  ${line}` : line))
						.join("\n")
				: "";
	}

	const finalYaml = [
		tplHeader,
		subscriptions.length > 0 ? proxyProvidersSection : "",
		finalCustomProxies ? `${finalCustomProxies}\n` : "",
		proxyGroupsSection,
		tplFooter,
		tplRuleProviders,
		tplRules,
	].join("\n");

	return finalYaml;
}
