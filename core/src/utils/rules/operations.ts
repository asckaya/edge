import type { ConfigRules } from "../../types";
import {
	DIRECT_REDIRECT_GROUPS,
	DIRECT_TAG,
	GROUP_TAGS,
	PROXY_SELECTOR_TAG,
} from "../shared-constants";
import {
	GEOX_ALLOWED_BLACK,
	GEOX_ALLOWED_BLACK_GRANULAR,
	GEOX_ALLOWED_WHITE,
	GEOX_ALLOWED_WHITE_GRANULAR,
} from "./categories";
import { ROUTE_RULES_CATEGORY, ROUTE_RULES_GRANULAR } from "./route-rules";
import { RULE_SET_DEFINITIONS } from "./rule-sets";
import type { RouteRuleDefinition, RuleSetDefinition } from "./types";

/**
 * Routing kernel: controls outbound tag name format.
 * - 'mihomo' (also covers stash): uses canonical names (DIRECT, REJECT, etc.)
 * - 'sing-box': uses lowercase tags (direct, block)
 */
export type RouteKernel = "mihomo" | "sing-box";

/** Per-kernel outbound tag name remap. Mihomo/stash use canonical names as-is. */
const SINGBOX_OUTBOUND_TAG_MAP: Record<string, string> = {
	[DIRECT_TAG]: "direct",
	[GROUP_TAGS.REJECT]: "block",
};

const ALLOWED_WHITE_RULE_SETS_CATEGORY = new Set(GEOX_ALLOWED_WHITE);
const ALLOWED_WHITE_RULE_SETS_GRANULAR = new Set(GEOX_ALLOWED_WHITE_GRANULAR);
const ALLOWED_BLACK_RULE_SETS_CATEGORY = new Set(GEOX_ALLOWED_BLACK);
const ALLOWED_BLACK_RULE_SETS_GRANULAR = new Set(GEOX_ALLOWED_BLACK_GRANULAR);

const CORE_ROUTE_OUTBOUNDS = new Set([
	GROUP_TAGS.CN_SERVICES,
	GROUP_TAGS.AD_BLOCK,
	GROUP_TAGS.DIRECT,
	GROUP_TAGS.REJECT,
	GROUP_TAGS.PROXY,
]);
const DIRECT_REDIRECT_OUTBOUNDS = new Set(DIRECT_REDIRECT_GROUPS);

/**
 * Resolve a canonical outbound name to its kernel-specific tag.
 * - mihomo/stash: canonical name (DIRECT, REJECT, PROXY, etc.) used as-is.
 * - sing-box: DIRECT→direct, REJECT→block.
 *
 * Unknown names pass through unchanged.
 */
export function resolveOutboundTag(outbound: string, kernel: RouteKernel): string {
	if (kernel === "sing-box") {
		return SINGBOX_OUTBOUND_TAG_MAP[outbound] ?? outbound;
	}
	return outbound;
}

/**
 * Compute the "final match" outbound tag for a kernel given the routing mode.
 * - Black mode: default to DIRECT (direct-first).
 * - White/Dual mode: default to PROXY selector.
 * - Full mode: default to FINAL group (mihomo) or PROXY selector (sing-box).
 */
export function resolveFinalOutbound(options: RouteModeOptions, kernel: RouteKernel): string {
	if (options.isBlack) return resolveOutboundTag(DIRECT_TAG, kernel);
	if (options.isWhite || options.isDual) return resolveOutboundTag(PROXY_SELECTOR_TAG, kernel);
	return kernel === "sing-box" ? resolveOutboundTag(PROXY_SELECTOR_TAG, kernel) : GROUP_TAGS.FINAL;
}

/**
 * Recursively remap outbound tags in a rule tree to kernel-specific names.
 * Mihomo/stash is a no-op (rules already use canonical names); sing-box rewrites
 * DIRECT→direct, REJECT→block.
 */
export function mapRouteRuleOutbounds(
	rules: RouteRuleDefinition[],
	kernel: RouteKernel,
): RouteRuleDefinition[] {
	if (kernel === "mihomo") return rules;
	const visit = (rule: RouteRuleDefinition): RouteRuleDefinition => {
		const mapped = { ...rule };
		if (mapped.action === "route" && mapped.outbound) {
			mapped.outbound = resolveOutboundTag(mapped.outbound, kernel);
		}
		if (mapped.rules) {
			mapped.rules = mapped.rules.map((r) => visit(r as RouteRuleDefinition));
		}
		return mapped;
	};
	return rules.map(visit);
}

export function filterAndMapRouteRules(
	rules: RouteRuleDefinition[],
	allowedRuleSets: Set<string> | null,
	fallbackOutbound: string,
	coreOutbounds: Set<string>,
): RouteRuleDefinition[] {
	let filtered = rules;
	if (allowedRuleSets) {
		filtered = rules.filter(
			(r) =>
				!r.rule_set ||
				(typeof r.rule_set === "string"
					? allowedRuleSets.has(r.rule_set)
					: r.rule_set.some((s) => allowedRuleSets.has(s))),
		);
	}
	return filtered.map((r) => {
		if (r.action === "route" && r.outbound) {
			const outbound = r.outbound;
			if (DIRECT_REDIRECT_OUTBOUNDS.has(outbound)) {
				return { ...r, outbound: DIRECT_TAG };
			}
			if (!coreOutbounds.has(outbound)) {
				return { ...r, outbound: fallbackOutbound };
			}
		}
		return r;
	});
}

export interface RouteModeOptions {
	isWhite?: boolean;
	isBlack?: boolean;
	isDual?: boolean;
	rules?: ConfigRules;
}

type Mode = "full" | "white" | "black" | "dual";

function resolveMode({ isWhite = false, isBlack = false, isDual = false }: RouteModeOptions): Mode {
	if (isWhite) return "white";
	if (isBlack) return "black";
	if (isDual) return "dual";
	return "full";
}

const RESOLVED_RULES_BY_MODE = new Map<string, RouteRuleDefinition[]>();

export function resolveRouteRules(options: RouteModeOptions): RouteRuleDefinition[] {
	const mode = resolveMode(options);
	const rulesMode = options.rules ?? "category";
	const cacheKey = `${rulesMode}:${mode}`;
	const cached = RESOLVED_RULES_BY_MODE.get(cacheKey);
	if (cached) return cached;

	const baseRules = rulesMode === "granular" ? ROUTE_RULES_GRANULAR : ROUTE_RULES_CATEGORY;

	let rules: RouteRuleDefinition[];
	if (mode === "white") {
		const allowed =
			rulesMode === "granular"
				? ALLOWED_WHITE_RULE_SETS_GRANULAR
				: ALLOWED_WHITE_RULE_SETS_CATEGORY;
		rules = filterAndMapRouteRules(baseRules, allowed, DIRECT_TAG, CORE_ROUTE_OUTBOUNDS);
	} else if (mode === "black") {
		const allowed =
			rulesMode === "granular"
				? ALLOWED_BLACK_RULE_SETS_GRANULAR
				: ALLOWED_BLACK_RULE_SETS_CATEGORY;
		rules = filterAndMapRouteRules(baseRules, allowed, GROUP_TAGS.PROXY, CORE_ROUTE_OUTBOUNDS);
	} else if (mode === "dual") {
		rules = filterAndMapRouteRules(baseRules, null, GROUP_TAGS.PROXY, CORE_ROUTE_OUTBOUNDS);
	} else {
		rules = baseRules;
	}
	RESOLVED_RULES_BY_MODE.set(cacheKey, rules);
	return rules;
}

export function collectReferencedRuleSets(rules: RouteRuleDefinition[]): Set<string> {
	const referenced = new Set<string>();

	const visit = (rule: RouteRuleDefinition): void => {
		if (typeof rule.rule_set === "string") {
			referenced.add(rule.rule_set);
		} else if (Array.isArray(rule.rule_set)) {
			for (const tag of rule.rule_set) referenced.add(tag);
		}
		if (rule.rules) {
			for (const nestedRule of rule.rules) visit(nestedRule as RouteRuleDefinition);
		}
	};

	for (const rule of rules) visit(rule);
	return referenced;
}

export function getReferencedRuleSetDefinitions(rules: RouteRuleDefinition[]): RuleSetDefinition[] {
	const cached = REFERENCED_RULE_SETS_BY_RULES.get(rules);
	if (cached) return cached;

	const referenced = collectReferencedRuleSets(rules);
	const result = RULE_SET_DEFINITIONS.filter((definition) => referenced.has(definition.tag));
	REFERENCED_RULE_SETS_BY_RULES.set(rules, result);
	return result;
}

const REFERENCED_RULE_SETS_BY_RULES = new WeakMap<RouteRuleDefinition[], RuleSetDefinition[]>();
const FULL_MODE_REFERENCED_RULE_SETS = (() => {
	const referenced = collectReferencedRuleSets(ROUTE_RULES_CATEGORY);
	return RULE_SET_DEFINITIONS.filter((definition) => referenced.has(definition.tag));
})();
REFERENCED_RULE_SETS_BY_RULES.set(ROUTE_RULES_CATEGORY, FULL_MODE_REFERENCED_RULE_SETS);

export function routeTailscaleTraffic(
	rules: RouteRuleDefinition[],
	outbound: string,
	noResolve = false,
): RouteRuleDefinition[] {
	let hasTsNet = false;
	const rewrittenRules = rules.flatMap((rule) => {
		if (!rule.domain_suffix?.includes("ts.net")) return [rule];

		hasTsNet = true;
		const otherSuffixes = rule.domain_suffix.filter((suffix) => suffix !== "ts.net");
		const result: RouteRuleDefinition[] = [];
		if (otherSuffixes.length > 0) result.push({ ...rule, domain_suffix: otherSuffixes });
		result.push({ ...rule, domain_suffix: ["ts.net"], action: "route", outbound });
		return result;
	});

	if (!hasTsNet) {
		rewrittenRules.unshift({
			domain_suffix: ["ts.net"],
			action: "route",
			outbound,
		});
	}

	return [
		{
			ip_cidr: ["100.64.0.0/10", "fd7a:115c:a1e0::/48"],
			action: "route",
			outbound,
			...(noResolve ? { no_resolve: true } : {}),
		},
		...rewrittenRules,
	];
}
