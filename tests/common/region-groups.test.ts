import { describe, expect, test } from "vitest";
import { REGION_GROUPS } from "../../core/src/utils/shared-constants";

describe("REGION_GROUPS configuration & filters", () => {
	test("contains all expected 8 regions including Australia, UK, and Germany", () => {
		const codes = REGION_GROUPS.map((r) => r.code);
		expect(codes).toEqual(["HK", "JP", "US", "SG", "TW", "AU", "GB", "DE"]);
	});

	test.each([
		["AU", "🇦🇺 澳大利亚 01", true],
		["AU", "澳洲专线 02", true],
		["AU", "Sydney 03", true],
		["AU", "Melbourne-AU-04", true],
		["AU", "US-Node", false],

		["GB", "🇬🇧 英国 01", true],
		["GB", "London Premium 02", true],
		["GB", "UK-Server-03", true],
		["GB", "JP-Node", false],

		["DE", "🇩🇪 德国 01", true],
		["DE", "Frankfurt 02", true],
		["DE", "DE-Server-03", true],
		["DE", "HK-Node", false],
	])("region %s filter tests for node name '%s'", (code, nodeName, shouldMatch) => {
		const region = REGION_GROUPS.find((r) => r.code === code);
		expect(region).toBeDefined();
		if (!region) return;
		const filterPattern = region.filter.replace("(?i)", "");
		const regex = new RegExp(filterPattern, "i");
		expect(regex.test(nodeName)).toBe(shouldMatch);
	});
});

import { renderMihomoGroups } from "../../core/src/utils/mihomo/group-builder";
import { getMihomoGroupDefinitions } from "../../core/src/utils/mihomo/definitions";
import { buildGroupOutbounds } from "../../core/src/utils/sing-box/groups";
import { getSingBoxGroupDefinitions } from "../../core/src/utils/sing-box/definitions";
import { GROUP_TAGS } from "../../core/src/utils/shared-constants";
import { resolveRouteRules } from "../../core/src/utils/rules/operations";

describe("Regional service groups default proxy ordering", () => {
	test("Category mode regional groups have corresponding region-first layouts in Mihomo", () => {
		const defs = getMihomoGroupDefinitions("category");
		const jpDef = defs.find((d) => d.name === GROUP_TAGS.JP_SERVICES);
		const twDef = defs.find((d) => d.name === GROUP_TAGS.TW_SERVICES);
		const hkDef = defs.find((d) => d.name === GROUP_TAGS.HK_SERVICES);
		const ukDef = defs.find((d) => d.name === GROUP_TAGS.UK_SERVICES);

		expect(jpDef?.layout).toBe("jp-first");
		expect(twDef?.layout).toBe("tw-first");
		expect(hkDef?.layout).toBe("hk-first");
		expect(ukDef?.layout).toBe("gb-first");
	});

	test("Granular mode regional services have region-first layouts in Mihomo", () => {
		const defs = getMihomoGroupDefinitions("granular");
		const dmmDef = defs.find((d) => d.name === "DMM");
		const tverDef = defs.find((d) => d.name === "TVer");
		const bahaDef = defs.find((d) => d.name === "巴哈姆特");
		const tvbDef = defs.find((d) => d.name === "TVB");
		const bbcDef = defs.find((d) => d.name === "BBC iPlayer");
		const huluDef = defs.find((d) => d.name === "Hulu");

		expect(dmmDef?.layout).toBe("jp-first");
		expect(tverDef?.layout).toBe("jp-first");
		expect(bahaDef?.layout).toBe("tw-first");
		expect(tvbDef?.layout).toBe("hk-first");
		expect(bbcDef?.layout).toBe("gb-first");
		expect(huluDef?.layout).toBe("us-first");
	});

	test("Mihomo YAML renders regional node group at first position for regional services", () => {
		const yaml = renderMihomoGroups(
			{
				providerNames: ["Airport"],
				autoGroupNames: ["⚡ Airport 自动选择"],
			},
			"",
			false,
			"category",
		);

		// JP Services proxies list starts with 🇯🇵 日本节点
		expect(yaml).toMatch(/name: 🇯🇵 日本服务[\s\S]*?proxies: \[🇯🇵 日本节点, 🚀 节点选择/);
		// TW Services proxies list starts with 🇹🇼 台湾节点
		expect(yaml).toMatch(/name: 🇹🇼 台湾服务[\s\S]*?proxies: \[🇹🇼 台湾节点, 🚀 节点选择/);
		// HK Services proxies list starts with 🇭🇰 香港节点
		expect(yaml).toMatch(/name: 🇭🇰 香港服务[\s\S]*?proxies: \[🇭🇰 香港节点, 🚀 节点选择/);
		// UK Services proxies list starts with 🇬🇧 英国节点
		expect(yaml).toMatch(/name: 🇬🇧 英国服务[\s\S]*?proxies: \[🇬🇧 英国节点, 🚀 节点选择/);
	});

	test("Sing-box outbounds place regional node group at first position", () => {
		const sampleChoices = [
			"🚀 节点选择",
			"direct",
			"block",
			"♻️ 自动选择",
			"🇭🇰 香港节点",
			"🇯🇵 日本节点",
			"🇺🇸 美国节点",
			"🇹🇼 台湾节点",
			"🇬🇧 英国节点",
		];

		const jpOutbounds = buildGroupOutbounds("jp-first", sampleChoices);
		expect(jpOutbounds[0]).toBe("🇯🇵 日本节点");
		expect(jpOutbounds[1]).toBe("🚀 节点选择");

		const twOutbounds = buildGroupOutbounds("tw-first", sampleChoices);
		expect(twOutbounds[0]).toBe("🇹🇼 台湾节点");
		expect(twOutbounds[1]).toBe("🚀 节点选择");

		const hkOutbounds = buildGroupOutbounds("hk-first", sampleChoices);
		expect(hkOutbounds[0]).toBe("🇭🇰 香港节点");
		expect(hkOutbounds[1]).toBe("🚀 节点选择");

		const gbOutbounds = buildGroupOutbounds("gb-first", sampleChoices);
		expect(gbOutbounds[0]).toBe("🇬🇧 英国节点");
		expect(gbOutbounds[1]).toBe("🚀 节点选择");

		const usOutbounds = buildGroupOutbounds("us-first", sampleChoices);
		expect(usOutbounds[0]).toBe("🇺🇸 美国节点");
		expect(usOutbounds[1]).toBe("🚀 节点选择");
	});

	test("Sing-box group definitions assign region layouts to regional groups", () => {
		const defs = getSingBoxGroupDefinitions("category");
		const jpGroup = defs.find((g) => g.tag === GROUP_TAGS.JP_SERVICES);
		expect(jpGroup?.layout).toBe("jp-first");
	});

	test("Dual mode routes regional locked services to regional node groups", () => {
		const dualCategoryRules = resolveRouteRules({ isDual: true, rules: "category" });
		const jpRule = dualCategoryRules.find((r) => r.rule_set === "dmm");
		const twRule = dualCategoryRules.find((r) => r.rule_set === "bahamut");
		const hkRule = dualCategoryRules.find((r) => r.rule_set === "tvb");
		const ukRule = dualCategoryRules.find((r) => r.rule_set === "bbc");

		expect(jpRule?.outbound).toBe("🇯🇵 日本节点");
		expect(twRule?.outbound).toBe("🇹🇼 台湾节点");
		expect(hkRule?.outbound).toBe("🇭🇰 香港节点");
		expect(ukRule?.outbound).toBe("🇬🇧 英国节点");

		const dualGranularRules = resolveRouteRules({ isDual: true, rules: "granular" });
		const dmmRule = dualGranularRules.find((r) => r.rule_set === "dmm");
		const bahaRule = dualGranularRules.find((r) => r.rule_set === "bahamut");
		const tvbRule = dualGranularRules.find((r) => r.rule_set === "tvb");
		const bbcRule = dualGranularRules.find((r) => r.rule_set === "bbc");

		expect(dmmRule?.outbound).toBe("🇯🇵 日本节点");
		expect(bahaRule?.outbound).toBe("🇹🇼 台湾节点");
		expect(tvbRule?.outbound).toBe("🇭🇰 香港节点");
		expect(bbcRule?.outbound).toBe("🇬🇧 英国节点");
	});
});
