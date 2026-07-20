import { GEODATA_URLS, GEODATA_URLS_LITE } from "../../../templates/shared/geox";
import { applyGithubProxy } from "../gh-proxy";
import type { RouteRuleDefinition, RuleSetDefinition } from "../rules/types";
import {
	getReferencedRuleSetDefinitions,
	mapRouteRuleOutbounds,
	resolveFinalOutbound,
	resolveRouteRules,
} from "../rules-registry";

/**
 * Resolve the remote URL for a sing-box rule-set definition, applying the
 * optional ghProxy rewrite to github URLs.
 */
function buildRuleSetUrl(definition: RuleSetDefinition, ghProxy?: string | null): string {
	if (definition.url) return applyGithubProxy(definition.url, ghProxy);
	const remoteName = definition.remoteName || definition.tag;
	return applyGithubProxy(
		`https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/${definition.kind}/${remoteName}.srs`,
		ghProxy,
	);
}

interface BuildRouteOptions {
	isWhite?: boolean;
	isBlack?: boolean;
	isDual?: boolean;
	ghProxy?: string | null;
}

export interface SingBoxRoute {
	rules: RouteRuleDefinition[];
	rule_set: Record<string, unknown>[];
	final: string;
	auto_detect_interface: boolean;
	default_domain_resolver: {
		server: string;
	};
	default_http_client?: string;
}

export function buildRoute({
	isWhite = false,
	isBlack = false,
	isDual = false,
	ghProxy,
}: BuildRouteOptions = {}): SingBoxRoute {
	const selectedGeoUrls = isWhite || isBlack ? GEODATA_URLS_LITE : GEODATA_URLS;
	const activeRules = resolveRouteRules({ isWhite, isBlack, isDual });
	const filteredDefinitions = getReferencedRuleSetDefinitions(activeRules);

	const remoteRuleSets = filteredDefinitions.map((d) => {
		const remote: Record<string, unknown> = {
			type: "remote",
			tag: d.tag,
			format: d.format || "binary",
			url: buildRuleSetUrl(d, ghProxy),
			http_client: ghProxy ? "direct-client" : "proxy-client",
		};
		const geoUrlMap: Record<string, string> = {
			geosite: selectedGeoUrls.geosite,
			geoip: selectedGeoUrls.geoip,
		};
		const baseUrl = geoUrlMap[d.kind];
		// Only replace if baseUrl looks like a directory prefix (doesn't end in .dat or .mmdb)
		if (baseUrl && !baseUrl.endsWith(".dat") && !baseUrl.endsWith(".mmdb")) {
			remote.url = (remote.url as string).replace(
				/https:\/\/raw\.githubusercontent\.com\/MetaCubeX\/meta-rules-dat\/sing\/geo\/(geosite|geoip)\/.*\.srs/,
				`${baseUrl}/$1/${d.remoteName || d.tag}.srs`,
			);
		}
		return remote;
	});

	const activeRulesMapped = mapRouteRuleOutbounds(activeRules, "sing-box");

	const finalRoute = resolveFinalOutbound({ isWhite, isBlack, isDual }, "sing-box");
	return {
		rules: activeRulesMapped,
		rule_set: remoteRuleSets,
		final: finalRoute,
		auto_detect_interface: true,
		default_domain_resolver: {
			server: "local-dns",
		},
		default_http_client: ghProxy ? "direct-client" : "proxy-client",
	};
}
