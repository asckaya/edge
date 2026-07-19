import pc from "picocolors";
import { CONFIG_MODES, CONFIG_TYPES } from "../../core/src/types";
import { normalizeConfigTarget } from "../../core/src/utils/config-target";

/**
 * Normalize and validate the --type / --mode CLI options.
 * Calls `process.exit(1)` on invalid values, preserving the original
 * console.error behavior of both gen-url and yaml-to-config scripts.
 */
export function validateTarget(
	type: string | undefined,
	mode: string | undefined,
): { configType: string; configMode: string } {
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

	return { configType, configMode };
}
