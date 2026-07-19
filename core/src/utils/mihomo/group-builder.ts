import { DIRECT_TAG, GROUP_TAGS, HEALTH_CHECK_URL, REGION_GROUPS } from "../shared-constants";
import { MIHOMO_GROUP_DEFINITIONS } from "./definitions";
import type { MihomoGroupLayout } from "./types";

export interface GroupOptions {
	providerNames: string[];
	autoGroupNames: string[];
	selfHostedGroup?: string;
	tailscaleGroup?: string;
	isStash?: boolean;
	isSingleSub?: boolean;
}

// Aggressive junk-node filter applied at runtime to provider nodes.
// NOTE: sing-box's INFORMATIONAL_NAME_REGEX (sing-box/tags.ts) is a SUBSET of the
// subscription-status keywords here (流量/到期/expire/traffic). sing-box filters at
// build time against parsed nodes so it stays conservative; mihomo filters at runtime
// against provider nodes, where false positives are cheap, so it can be aggressive.
export const COMMON_PROXY_FILTER =
	"^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$";

function formatYamlList(items: Array<string | undefined>): string {
	return `[${items.filter((item): item is string => Boolean(item)).join(", ")}]`;
}

interface MihomoGroup {
	name: string;
	type: string;
	proxies?: string;
	use?: string;
	url?: string;
	interval?: number;
	tolerance?: number;
	filter?: string;
	"include-all-proxies"?: boolean;
}

function convertGroupsToYaml(groups: MihomoGroup[]): string {
	return `${groups
		.map((g) => {
			const parts = [
				`  - name: ${g.name}`,
				`    type: ${g.type}`,
				g.proxies ? `    proxies: ${g.proxies}` : "",
				g.use ? `    use: ${g.use}` : "",
				g.url ? `    url: ${g.url}` : "",
				g.interval ? `    interval: ${g.interval}` : "",
				g.tolerance ? `    tolerance: ${g.tolerance}` : "",
				g.filter ? `    filter: "${g.filter}"` : "",
				g["include-all-proxies"] ? "    include-all-proxies: true" : "",
			];
			return parts.filter(Boolean).join("\n");
		})
		.join("\n")}\n`;
}

// Build the `proxies` YAML-list string + flags for a scenario group based on
// its `MihomoGroupLayout`. Returns { proxies, use, filter } where `use`/`filter`
// are empty strings when the layout suppresses provider filtering.
function buildMihomoGroupOutbounds(
	layout: MihomoGroupLayout,
	scenarioProxies: string,
	providerList: string,
	autoGroupNames: string[],
): { proxies: string; use: string; filter: string } {
	switch (layout) {
		case "block-first":
			return {
				proxies: formatYamlList([
					GROUP_TAGS.REJECT,
					DIRECT_TAG,
					GROUP_TAGS.PROXY,
					...autoGroupNames,
				]),
				use: "",
				filter: "",
			};
		case "direct-first":
			return {
				proxies: formatYamlList([
					DIRECT_TAG,
					GROUP_TAGS.REJECT,
					GROUP_TAGS.PROXY,
					...autoGroupNames,
				]),
				use: providerList,
				filter: COMMON_PROXY_FILTER,
			};
		case "direct-proxy":
			return {
				proxies: formatYamlList([DIRECT_TAG, GROUP_TAGS.PROXY]),
				use: "",
				filter: "",
			};
		case "direct-proxy-rej":
			return {
				proxies: formatYamlList([
					DIRECT_TAG,
					GROUP_TAGS.PROXY,
					GROUP_TAGS.REJECT,
					...autoGroupNames,
				]),
				use: providerList,
				filter: COMMON_PROXY_FILTER,
			};
		case "proxy-direct":
			return {
				proxies: formatYamlList([GROUP_TAGS.PROXY, DIRECT_TAG, ...autoGroupNames]),
				use: providerList,
				filter: COMMON_PROXY_FILTER,
			};
		default:
			return { proxies: scenarioProxies, use: providerList, filter: COMMON_PROXY_FILTER };
	}
}

export function renderMihomoGroups(
	options: GroupOptions,
	airportGroupsYaml = "",
	isMinimal = false,
): string {
	const { providerNames, autoGroupNames, selfHostedGroup, tailscaleGroup, isStash, isSingleSub } =
		options;
	const effectiveProvidersForProxies = isSingleSub ? [] : providerNames;
	const autoTag = isStash ? "♻️ 自动选择" : "⚡ 自动选择";
	const providerList = formatYamlList(providerNames);
	const commonProxyChoices = [
		autoTag,
		DIRECT_TAG,
		GROUP_TAGS.REJECT,
		...REGION_GROUPS.map((r) => r.tag),
		...autoGroupNames,
		...effectiveProvidersForProxies,
		selfHostedGroup,
		tailscaleGroup,
	];
	const scenarioProxies = formatYamlList([GROUP_TAGS.PROXY, ...commonProxyChoices]);
	const defaultProxies = formatYamlList(commonProxyChoices);

	// 1. Core Top Groups
	const topGroups = [
		{
			name: GROUP_TAGS.PROXY,
			type: "select",
			proxies: defaultProxies,
			use: isSingleSub ? providerList : undefined,
		},
		{
			name: autoTag,
			type: "url-test",
			url: HEALTH_CHECK_URL,
			interval: 300,
			tolerance: 50,
			use: providerList,
			filter: COMMON_PROXY_FILTER,
			"include-all-proxies": isStash ? true : undefined,
		},
	];

	// 2. Region groups
	const regions = REGION_GROUPS.map((r) => ({ name: r.tag, filter: r.filter }));

	const regionGroups = regions.map((r) => ({
		name: r.name,
		type: "url-test",
		url: HEALTH_CHECK_URL,
		interval: 300,
		tolerance: 50,
		use: providerList,
		filter: r.filter,
		"include-all-proxies": isStash ? true : undefined,
	}));

	const scenarioGroups = isMinimal
		? [
				{
					name: GROUP_TAGS.CN_SERVICES,
					type: "select",
					proxies: formatYamlList([
						DIRECT_TAG,
						GROUP_TAGS.REJECT,
						GROUP_TAGS.PROXY,
						...autoGroupNames,
					]),
					use: providerList,
					"include-all-proxies": isStash ? true : undefined,
				},
				{
					name: GROUP_TAGS.AD_BLOCK,
					type: "select",
					proxies: formatYamlList([GROUP_TAGS.REJECT, DIRECT_TAG, GROUP_TAGS.PROXY]),
				},
				{
					name: GROUP_TAGS.FINAL,
					type: "select",
					proxies: formatYamlList([GROUP_TAGS.PROXY, ...commonProxyChoices]),
					use: providerList,
					"include-all-proxies": isStash ? true : undefined,
				},
			]
		: MIHOMO_GROUP_DEFINITIONS.map(({ name, layout }) => {
				const { proxies, use, filter } = buildMihomoGroupOutbounds(
					layout,
					scenarioProxies,
					providerList,
					autoGroupNames,
				);
				return {
					name,
					type: "select",
					proxies,
					use: use || undefined,
					filter: filter || undefined,
					"include-all-proxies": isStash && use ? true : undefined,
				};
			});

	// Combine in requested order: Top -> Airport -> Regions -> Scenarios
	let finalYaml = "proxy-groups:\n";
	finalYaml += convertGroupsToYaml(topGroups);
	if (airportGroupsYaml) {
		finalYaml += airportGroupsYaml;
	}
	finalYaml += convertGroupsToYaml(regionGroups);
	finalYaml += convertGroupsToYaml(scenarioGroups);

	return finalYaml;
}
