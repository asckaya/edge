import type { LooseProxyNode } from "../proxy-node";
import { extractCountryCodeFromName, toFlagEmoji } from "./tags";

export function buildGeoNodeLabel(
	providerName: string,
	sequence: number,
	node: LooseProxyNode,
): string {
	const originalName = String(node.name || "").trim();
	const countryCode = extractCountryCodeFromName(originalName);
	const flag = toFlagEmoji(countryCode);
	return `${flag} ${providerName} ${String(sequence).padStart(2, "0")} (${originalName})`;
}
