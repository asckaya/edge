import type { ConfigRules } from "../../types";
import { GROUP_TAGS, REGION_GROUPS, SCENARIO_GROUPS } from "../shared-constants";
import { REGION_SERVICE_LAYOUTS } from "../mihomo/definitions";
import { GRANULAR_SCENARIO_GROUPS } from "../rules/route-rules";
import type { GroupDefinition } from "./types";

export const REGION_DEFINITIONS: Array<{ code: string; tag: string }> = REGION_GROUPS.map((r) => ({
	code: r.code,
	tag: r.tag,
}));

export function getSingBoxGroupDefinitions(rulesMode: ConfigRules = "category"): GroupDefinition[] {
	const scenarios = rulesMode === "granular" ? GRANULAR_SCENARIO_GROUPS : SCENARIO_GROUPS;
	return [
		{ tag: GROUP_TAGS.CN_SERVICES, layout: "direct-main" },
		{ tag: GROUP_TAGS.PRIVATE_NET, layout: "direct-main" },
		{ tag: GROUP_TAGS.AD_BLOCK, layout: "block-first" },
		{ tag: GROUP_TAGS.NTP_SERVICES, layout: "direct-main" },
		{ tag: GROUP_TAGS.BT_PT, layout: "direct-main" },
		...scenarios.map((tag) => ({
			tag,
			layout: REGION_SERVICE_LAYOUTS[tag] ?? ("main-direct" as const),
		})),
	];
}

export const GROUP_DEFINITIONS: GroupDefinition[] = getSingBoxGroupDefinitions("category");
