import type { ConfigRules } from "../../types";
import {
	CORE_GROUPS,
	DIRECT_REDIRECT_GROUPS,
	GROUP_TAGS,
	SCENARIO_GROUPS,
} from "../shared-constants";
import { GRANULAR_SCENARIO_GROUPS } from "../rules/route-rules";
import type { MihomoGroupDefinition } from "./types";

export const REGION_SERVICE_LAYOUTS: Record<
	string,
	"jp-first" | "tw-first" | "hk-first" | "gb-first" | "us-first"
> = {
	// Category regional groups
	[GROUP_TAGS.JP_SERVICES]: "jp-first",
	[GROUP_TAGS.TW_SERVICES]: "tw-first",
	[GROUP_TAGS.HK_SERVICES]: "hk-first",
	[GROUP_TAGS.UK_SERVICES]: "gb-first",

	// Granular JP services
	DMM: "jp-first",
	TVer: "jp-first",
	AbemaTV: "jp-first",
	Radiko: "jp-first",
	"U-NEXT": "jp-first",
	Niconico: "jp-first",
	Cygames: "jp-first",
	eplus: "jp-first",
	Melonbooks: "jp-first",
	虎之穴: "jp-first",
	Mercari: "jp-first",
	d动漫商城: "jp-first",

	// Granular TW services
	巴哈姆特: "tw-first",
	KKTV: "tw-first",
	"LINE TV": "tw-first",
	CatchPlay: "tw-first",

	// Granular HK services
	TVB: "hk-first",
	"myTV SUPER": "hk-first",
	ViuTV: "hk-first",

	// Granular UK services
	"BBC iPlayer": "gb-first",
	ITVX: "gb-first",
	"Channel 4": "gb-first",

	// Granular US services
	Hulu: "us-first",
	Peacock: "us-first",
};

// Scenario group → layout. Groups not listed here use the `default` layout.
// Mirrors the sing-box GROUP_DEFINITIONS table (sing-box/definitions.ts) so
// both kernels share a single source of intent for per-group proxy ordering.
const GROUP_LAYOUTS: Record<string, MihomoGroupDefinition["layout"]> = {
	[GROUP_TAGS.AD_BLOCK]: "block-first",
	[GROUP_TAGS.CN_SERVICES]: "direct-first",
	[GROUP_TAGS.PRIVATE_NET]: "direct-first",
	[GROUP_TAGS.NTP_SERVICES]: "direct-proxy",
	[GROUP_TAGS.BT_PT]: "direct-proxy-rej",
	[GROUP_TAGS.SPEEDTEST]: "proxy-direct",
	...REGION_SERVICE_LAYOUTS,
};

export function getMihomoGroupDefinitions(
	rulesMode: ConfigRules = "category",
): MihomoGroupDefinition[] {
	const scenarios = rulesMode === "granular" ? GRANULAR_SCENARIO_GROUPS : SCENARIO_GROUPS;
	return [
		...scenarios,
		...DIRECT_REDIRECT_GROUPS,
		...CORE_GROUPS.filter(
			(g) => ![GROUP_TAGS.DIRECT, GROUP_TAGS.REJECT, GROUP_TAGS.PROXY].includes(g),
		),
	].map((name) => ({ name, layout: GROUP_LAYOUTS[name] ?? "default" }));
}

// Full-mode scenario group list for category rules
export const MIHOMO_GROUP_DEFINITIONS: MihomoGroupDefinition[] =
	getMihomoGroupDefinitions("category");
