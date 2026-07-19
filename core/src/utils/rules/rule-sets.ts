import { GEOX_CATEGORIES } from "./categories";
import type { GeoXCategory, RuleSetDefinition } from "./types";

/**
 * RULE_SET_DEFINITIONS: Source of truth for sing-box and mihomo rule sets.
 * Derived automatically from GEOX_CATEGORIES.
 */
const CUSTOM_RULE_SETS: RuleSetDefinition[] = [
	{ kind: "geosite", tag: "advertising", remoteName: "category-ads-all" },
	{
		kind: "geosite",
		tag: "adblockfilters",
		url: "https://raw.githubusercontent.com/217heidai/adblockfilters/main/rules/adblocksingbox.srs",
	},
	{
		kind: "geosite",
		tag: "emby",
		url: "https://raw.githubusercontent.com/666OS/rules/release/singbox/domain/Emby.srs",
		format: "binary",
	},
	{
		kind: "geoip",
		tag: "emby-ip",
		remoteName: "emby",
		url: "https://raw.githubusercontent.com/666OS/rules/release/singbox/ip/Emby.srs",
		format: "binary",
	},
];

const DERIVED_RULE_SETS: RuleSetDefinition[] = [];
const processedTags = new Set(CUSTOM_RULE_SETS.map((s) => s.tag));

Object.values(GEOX_CATEGORIES).forEach((cat: GeoXCategory) => {
	(cat.geosite || []).forEach((t: string) => {
		if (!processedTags.has(t)) {
			DERIVED_RULE_SETS.push({ kind: "geosite", tag: t });
			processedTags.add(t);
		}
	});
	(cat.geoip || []).forEach((t: string) => {
		const tag = `${t}-ip`;
		if (!processedTags.has(tag)) {
			DERIVED_RULE_SETS.push({ kind: "geoip", tag, remoteName: t });
			processedTags.add(tag);
		}
	});
});

export const RULE_SET_DEFINITIONS: RuleSetDefinition[] = [
	...CUSTOM_RULE_SETS,
	...DERIVED_RULE_SETS,
];
