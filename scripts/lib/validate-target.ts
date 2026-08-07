import pc from "picocolors";
import { CONFIG_MODES, CONFIG_RULES, CONFIG_TYPES, type ConfigRules } from "../../core/src/types";
import { normalizeConfigTarget } from "../../core/src/utils/config-target";

/**
 * Normalize and validate the --type / --mode / --rules CLI options.
 * Calls `process.exit(1)` on invalid values, preserving the original
 * console.error behavior of CLI scripts.
 */
export function validateTarget(
	type: string | undefined,
	mode: string | undefined,
	rules: string | undefined = "category",
): { configType: string; configMode: string; configRules: ConfigRules } {
	const { type: configType, mode: configMode } = normalizeConfigTarget(type, mode);

	if (!CONFIG_TYPES.some((t) => t === configType)) {
		console.error(
			pc.red(`\n✘ Unknown --type "${configType}". Valid values: ${CONFIG_TYPES.join(", ")}`),
		);
		process.exit(1);
	}
	if (!CONFIG_MODES.some((m) => m === configMode)) {
		console.error(
			pc.red(`\n✘ Unknown --mode "${configMode}". Valid values: ${CONFIG_MODES.join(", ")}`),
		);
		process.exit(1);
	}
	const configRules = (rules || "category") as ConfigRules;
	if (!CONFIG_RULES.some((r) => r === configRules)) {
		console.error(
			pc.red(`\n✘ Unknown --rules "${configRules}". Valid values: ${CONFIG_RULES.join(", ")}`),
		);
		process.exit(1);
	}

	return { configType, configMode, configRules };
}
