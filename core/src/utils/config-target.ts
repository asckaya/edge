import type { ConfigMode, ConfigType } from "../types";

const LEGACY_CONFIG_TYPE_PATTERN = /^(mihomo|stash|sing-box)(?:-(full|dual|white|black))?$/i;

export function inferConfigTypeFromUserAgent(userAgent: string): ConfigType {
	if (/clash|mihomo/i.test(userAgent)) return "mihomo";
	if (/sing[-_ ]?box/i.test(userAgent)) return "sing-box";
	if (/stash/i.test(userAgent)) return "stash";
	return "mihomo";
}

export function normalizeConfigTarget(
	rawType: string | null | undefined,
	rawMode: string | null | undefined,
	userAgent = "",
): { type: string; mode: string } {
	const requestedType = rawType?.trim();
	const requestedMode = rawMode?.trim().toLowerCase();
	const legacyMatch = requestedType?.match(LEGACY_CONFIG_TYPE_PATTERN);

	if (legacyMatch?.[1]) {
		return {
			type: legacyMatch[1].toLowerCase(),
			mode: requestedMode || legacyMatch[2]?.toLowerCase() || "full",
		};
	}

	return {
		type: requestedType || inferConfigTypeFromUserAgent(userAgent),
		mode: requestedMode || "full",
	};
}

export function configModeFlags(mode: ConfigMode) {
	return {
		isWhite: mode === "white",
		isBlack: mode === "black",
		isDual: mode === "dual",
	};
}
