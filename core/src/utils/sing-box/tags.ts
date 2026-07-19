import { SINGBOX_OUTBOUND_TYPES } from "../protocol-registry";
import { coerceProxyNodes, type LooseProxyNode } from "../proxy-node";

// Conservative "subscription status" node detector (7 keywords).
// Applied at config-build time to drop placeholder nodes from expired subscriptions.
// NOTE: mihomo's COMMON_PROXY_FILTER (mihomo/group-builder.ts) is a SUPERSET of this
// list — it also filters promotional junk (官网/客服/邀请/返利/...) because mihomo
// applies its filter at runtime against provider nodes where false positives are cheap.
// sing-box applies this at build time against parsed nodes, so it stays conservative.
export const INFORMATIONAL_NAME_REGEX =
	/(?:剩余流量|距离下次重置|套餐到期|流量重置|到期时间|expire|traffic)/i;

const COUNTRY_NAME_MAP: Record<string, string> = {
	"united states": "US",
	usa: "US",
	"hong kong": "HK",
	taiwan: "TW",
	japan: "JP",
	singapore: "SG",
	korea: "KR",
	netherlands: "NL",
	deutschland: "DE",
	germany: "DE",
	france: "FR",
	italy: "IT",
	"united kingdom": "GB",
	britain: "GB",
	england: "GB",
	canada: "CA",
	australia: "AU",
	russia: "RU",
	india: "IN",
	turkey: "TR",
	malaysia: "MY",
	thailand: "TH",
	vietnam: "VN",
	philippines: "PH",
	indonesia: "ID",
};

// Built from COUNTRY_NAME_MAP keys so the two stay in sync automatically.
const COUNTRY_NAME_REGEX = new RegExp(
	`(${Object.keys(COUNTRY_NAME_MAP)
		.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
		.join("|")})`,
	"i",
);

// Built from COUNTRY_NAME_MAP values (the 2-letter codes) plus the UK alias,
// so the regex stays in sync with the map automatically.
const COUNTRY_CODES = Array.from(new Set([...Object.values(COUNTRY_NAME_MAP), "UK"]));
const COUNTRY_CODE_REGEX = new RegExp(
	`(?:^|[^A-Z])(${COUNTRY_CODES.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?:$|[^A-Z])`,
	"i",
);

export function createUniqueTag(base: string, used: Set<string>): string {
	let tag = base;
	let index = 2;
	while (used.has(tag)) {
		tag = `${base} (${index})`;
		index += 1;
	}
	used.add(tag);
	return tag;
}

export function toFlagEmoji(countryCode?: string | null): string {
	const code = String(countryCode || "")
		.trim()
		.toUpperCase();
	if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
	return String.fromCodePoint(0x1f1e6 + code.charCodeAt(0) - 65, 0x1f1e6 + code.charCodeAt(1) - 65);
}

export function extractCountryCodeFromFlag(name: string): string | null {
	const match = String(name || "").match(/\p{Regional_Indicator}{2}/u);
	if (!match) return null;
	const codes = [...match[0]].map((c) => c.codePointAt(0) || 0);
	const first = codes[0];
	const second = codes[1];
	if (first == null || second == null) return null;
	return String.fromCharCode(first - 0x1f1e6 + 65, second - 0x1f1e6 + 65);
}

export function extractCountryCodeFromName(name: string): string | null {
	const rawName = String(name || "").trim();
	if (!rawName) return null;
	const fromFlag = extractCountryCodeFromFlag(rawName);
	if (fromFlag) return fromFlag;
	const nameMatch = rawName.match(COUNTRY_NAME_REGEX);
	if (nameMatch?.[1]) {
		return COUNTRY_NAME_MAP[nameMatch[1].toLowerCase()] || null;
	}
	const codeMatch = rawName.match(COUNTRY_CODE_REGEX);
	if (codeMatch?.[1]) {
		const code = codeMatch[1].toUpperCase();
		return code === "UK" ? "GB" : code;
	}
	return null;
}

export function isInformationalNode(node: LooseProxyNode): boolean {
	const name = String(node.name || "").trim();
	return name ? INFORMATIONAL_NAME_REGEX.test(name) : false;
}

export function normalizeProxyList(nodes: LooseProxyNode[]): LooseProxyNode[] {
	return coerceProxyNodes(nodes).filter(
		(n) => SINGBOX_OUTBOUND_TYPES.has(n.type) && !isInformationalNode(n),
	);
}
