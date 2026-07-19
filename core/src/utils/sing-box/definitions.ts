import { GROUP_TAGS, REGION_GROUPS, SCENARIO_GROUPS } from "../shared-constants";
import type { GroupDefinition } from "./types";

export const REGION_DEFINITIONS: Array<{ code: string; tag: string }> = REGION_GROUPS.map((r) => ({
	code: r.code,
	tag: r.tag,
}));

export const GROUP_DEFINITIONS: GroupDefinition[] = [
	{ tag: GROUP_TAGS.CN_SERVICES, layout: "direct-main" },
	{ tag: GROUP_TAGS.PRIVATE_NET, layout: "direct-main" },
	{ tag: GROUP_TAGS.AD_BLOCK, layout: "block-first" },
	{ tag: GROUP_TAGS.NTP_SERVICES, layout: "direct-main" },
	{ tag: GROUP_TAGS.BT_PT, layout: "direct-main" },
	...SCENARIO_GROUPS.map((tag) => ({ tag, layout: "main-direct" as const })),
];
