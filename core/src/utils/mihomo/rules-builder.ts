import { applyGithubProxy } from "../gh-proxy";
import type { RouteRuleDefinition, RuleSetDefinition } from "../rules/types";

export function renderMihomoRules(
	rules: RouteRuleDefinition[],
	definitions: RuleSetDefinition[],
	finalMatch: string,
): string {
	const defMap = new Map(definitions.map((d) => [d.tag, d]));

	const yamlLines = rules
		.map((r) => {
			if (r.action !== "route" && r.action !== "reject") return null;

			const outbound = r.outbound || (r.action === "reject" ? "REJECT" : "DIRECT");

			if (r.type === "logical") {
				const subRules = r.rules
					?.map((sr) => {
						if (sr.protocol) {
							const proto = Array.isArray(sr.protocol) ? sr.protocol[0] : sr.protocol;
							return proto ? `(NETWORK,${proto.toUpperCase()})` : null;
						}
						if (sr.port) {
							return `(DST-PORT,${sr.port})`;
						}
						if (sr.rule_set) {
							const ruleSetTag = Array.isArray(sr.rule_set) ? sr.rule_set[0] : sr.rule_set;
							if (!ruleSetTag) return null;
							const def = defMap.get(ruleSetTag);
							if (def) {
								const type = "RULE-SET";
								const name = def.tag;
								const expr = `${type},${name}`;
								return sr.invert ? `(NOT,((${expr})))` : `(${expr})`;
							}
						}
						return null;
					})
					.filter(Boolean);

				if (subRules && subRules.length > 0) {
					const mode = r.mode?.toUpperCase() || "AND";
					return `  - ${mode},(${subRules.join(",")}),${outbound}`;
				}
			}

			if (r.rule_set) {
				const sets = Array.isArray(r.rule_set) ? r.rule_set : [r.rule_set];
				return sets
					.map((s) => {
						const def = defMap.get(s);
						if (!def) return null;
						const type = "RULE-SET";
						const name = def.tag;
						const noResolve = def.kind === "geoip" ? ",no-resolve" : "";
						return `  - ${type},${name},${outbound}${noResolve}`;
					})
					.filter(Boolean)
					.join("\n");
			}

			if (r.domain_suffix) {
				const suffixes = Array.isArray(r.domain_suffix) ? r.domain_suffix : [r.domain_suffix];
				return suffixes.map((s) => `  - DOMAIN-SUFFIX,${s},${outbound}`).join("\n");
			}

			if (r.ip_cidr) {
				const cidrs = Array.isArray(r.ip_cidr) ? r.ip_cidr : [r.ip_cidr];
				const noResolve = r.no_resolve ? ",no-resolve" : "";
				return cidrs.map((c) => `  - IP-CIDR,${c},${outbound}${noResolve}`).join("\n");
			}

			if (r.port) {
				const ports = Array.isArray(r.port) ? r.port : [r.port];
				return ports.map((p) => `  - DST-PORT,${p},${outbound}`).join("\n");
			}

			return null;
		})
		.filter(Boolean);

	return `rules:\n${yamlLines.join("\n")}\n  - MATCH,${finalMatch}`;
}

export function renderMihomoRuleProviders(
	definitions: RuleSetDefinition[],
	ghProxy?: string | null,
	isStash = false,
): string {
	let yaml = "rule-providers:\n";

	// mihomo footer references fake-ip-filter via `rule-set:fake-ip-filter` and
	// needs the rule-provider definition. The stash footer uses an inline
	// hardcoded fake-ip-filter list instead, so emitting the provider would
	// leave an unreferenced definition in the stash config.
	if (!isStash) {
		yaml += `  fake-ip-filter:
    type: http
    behavior: domain
    format: text
    interval: 86400
    url: "https://testingcf.jsdelivr.net/gh/juewuy/ShellCrash@dev/public/fake_ip_filter.list"
    path: ./ruleset/fake_ip_filter.list\n`;
	}

	definitions.forEach((d) => {
		if (d.tag === "fake-ip-filter") return;

		const behavior = d.kind === "geoip" ? "ipcidr" : "domain";
		const format = d.format === "source" ? "text" : "mrs"; // MRS is default for Mihomo

		let url = "";
		if (d.url) {
			// Map custom URL (e.g. replace .srs with .mrs and singbox with mihomo)
			url = d.url
				.replace(/adblocksingbox\.srs$/, "adblockmihomo.mrs")
				.replace(/\/singbox\//g, "/mihomo/")
				.replace(/\.srs$/, ".mrs")
				.replace(/\/sing\//g, "/meta/"); // E.g. MetaCubeX/meta-rules-dat/sing/ -> /meta/
		} else {
			const remoteName = d.remoteName || d.tag;
			url = `https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/${d.kind}/${remoteName}.mrs`;
		}

		url = applyGithubProxy(url, ghProxy);

		yaml += `  ${d.tag}:
    type: http
    behavior: ${behavior}
    format: ${format}
    interval: 86400
    url: "${url}"
    path: ./ruleset/${d.tag}.${format}\n`;
	});

	return yaml;
}
