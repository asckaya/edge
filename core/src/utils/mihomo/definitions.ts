import type { ConfigRules } from "../../types";
import {
	CORE_GROUPS,
	DIRECT_REDIRECT_GROUPS,
	GROUP_TAGS,
	SCENARIO_GROUPS,
} from "../shared-constants";
import { GRANULAR_SCENARIO_GROUPS } from "../rules/route-rules";
import type { MihomoGroupDefinition } from "./types";

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
