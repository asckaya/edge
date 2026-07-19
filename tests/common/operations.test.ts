import { describe, expect, test } from "vitest";
import { GEOX_ALLOWED_BLACK, GEOX_ALLOWED_WHITE } from "../../core/src/utils/rules/categories";
import { ROUTE_RULES } from "../../core/src/utils/rules/route-rules";
import { RULE_SET_DEFINITIONS } from "../../core/src/utils/rules/rule-sets";
import type { RouteRuleDefinition } from "../../core/src/utils/rules/types";
import {
	collectReferencedRuleSets,
	filterAndMapRouteRules,
	getReferencedRuleSetDefinitions,
	mapRouteRuleOutbounds,
	resolveFinalOutbound,
	resolveOutboundTag,
	resolveRouteRules,
	routeTailscaleTraffic,
} from "../../core/src/utils/rules-registry";
import {
	DIRECT_REDIRECT_GROUPS,
	DIRECT_TAG,
	GROUP_TAGS,
	PROXY_SELECTOR_TAG,
} from "../../core/src/utils/shared-constants";

const CORE_OUTBOUNDS = new Set([
	GROUP_TAGS.CN_SERVICES,
	GROUP_TAGS.AD_BLOCK,
	GROUP_TAGS.DIRECT,
	GROUP_TAGS.REJECT,
	GROUP_TAGS.PROXY,
]);

describe("resolveOutboundTag", () => {
	test("mihomo passes canonical names through unchanged", () => {
		expect(resolveOutboundTag(DIRECT_TAG, "mihomo")).toBe(DIRECT_TAG);
		expect(resolveOutboundTag(GROUP_TAGS.REJECT, "mihomo")).toBe(GROUP_TAGS.REJECT);
		expect(resolveOutboundTag(PROXY_SELECTOR_TAG, "mihomo")).toBe(PROXY_SELECTOR_TAG);
	});

	test("sing-box maps DIRECT→direct and REJECT→block", () => {
		expect(resolveOutboundTag(DIRECT_TAG, "sing-box")).toBe("direct");
		expect(resolveOutboundTag(GROUP_TAGS.REJECT, "sing-box")).toBe("block");
	});

	test("sing-box passes unknown names through unchanged", () => {
		expect(resolveOutboundTag(PROXY_SELECTOR_TAG, "sing-box")).toBe(PROXY_SELECTOR_TAG);
		expect(resolveOutboundTag("🧲 BT/PT", "sing-box")).toBe("🧲 BT/PT");
		expect(resolveOutboundTag("Custom Tag", "sing-box")).toBe("Custom Tag");
	});
});

describe("resolveFinalOutbound", () => {
	test.each([
		[{ isBlack: true }, "mihomo", DIRECT_TAG],
		[{ isBlack: true }, "sing-box", "direct"],
		[{ isWhite: true }, "mihomo", PROXY_SELECTOR_TAG],
		[{ isWhite: true }, "sing-box", PROXY_SELECTOR_TAG],
		[{ isDual: true }, "mihomo", PROXY_SELECTOR_TAG],
		[{ isDual: true }, "sing-box", PROXY_SELECTOR_TAG],
		[{}, "mihomo", GROUP_TAGS.FINAL],
		[{}, "sing-box", PROXY_SELECTOR_TAG],
	] as const)("mode=%j kernel=%s → %s", (opts, kernel, expected) => {
		expect(resolveFinalOutbound(opts, kernel)).toBe(expected);
	});

	test("black mode takes precedence over white/dual flags", () => {
		expect(resolveFinalOutbound({ isBlack: true, isWhite: true, isDual: true }, "mihomo")).toBe(
			DIRECT_TAG,
		);
	});

	test("white mode takes precedence over dual flag", () => {
		expect(resolveFinalOutbound({ isWhite: true, isDual: true }, "mihomo")).toBe(
			PROXY_SELECTOR_TAG,
		);
	});
});

describe("mapRouteRuleOutbounds", () => {
	test("mihomo is a no-op (returns same array reference)", () => {
		const rules = resolveRouteRules({});
		expect(mapRouteRuleOutbounds(rules, "mihomo")).toBe(rules);
	});

	test("sing-box rewrites DIRECT→direct and REJECT→block on route rules", () => {
		const rules: RouteRuleDefinition[] = [
			{ rule_set: "private", action: "route", outbound: DIRECT_TAG },
			{ rule_set: "ads", action: "route", outbound: GROUP_TAGS.REJECT },
			{ rule_set: "ai", action: "route", outbound: PROXY_SELECTOR_TAG },
		];
		const mapped = mapRouteRuleOutbounds(rules, "sing-box");
		expect(mapped[0].outbound).toBe("direct");
		expect(mapped[1].outbound).toBe("block");
		expect(mapped[2].outbound).toBe(PROXY_SELECTOR_TAG);
	});

	test("does not remap outbound on non-route actions (sniff/reject/hijack-dns)", () => {
		const rules: RouteRuleDefinition[] = [
			{ action: "sniff" },
			{ action: "reject", rule_set: "quic" },
			{ action: "hijack-dns" },
		];
		const mapped = mapRouteRuleOutbounds(rules, "sing-box");
		expect(mapped[0].outbound).toBeUndefined();
		expect(mapped[1].outbound).toBeUndefined();
		expect(mapped[2].outbound).toBeUndefined();
	});

	test("recursively rewrites nested logical rules", () => {
		const rules: RouteRuleDefinition[] = [
			{
				type: "logical",
				mode: "and",
				action: "route",
				outbound: DIRECT_TAG,
				rules: [
					{ protocol: "udp", action: "route", outbound: GROUP_TAGS.REJECT },
					{
						type: "logical",
						mode: "or",
						action: "route",
						outbound: PROXY_SELECTOR_TAG,
						rules: [{ rule_set: "cn-ip", action: "route", outbound: DIRECT_TAG }],
					},
				],
			},
		];
		const mapped = mapRouteRuleOutbounds(rules, "sing-box");
		expect(mapped[0].outbound).toBe("direct");
		const rules0 = mapped[0].rules;
		expect(rules0?.[0]?.outbound).toBe("block");
		expect(rules0?.[1]?.outbound).toBe(PROXY_SELECTOR_TAG);
		const nestedLeaf = rules0?.[1]?.rules?.[0];
		expect(nestedLeaf?.outbound).toBe("direct");
	});

	test("does not mutate the input array", () => {
		const rules: RouteRuleDefinition[] = [{ rule_set: "x", action: "route", outbound: DIRECT_TAG }];
		mapRouteRuleOutbounds(rules, "sing-box");
		expect(rules[0].outbound).toBe(DIRECT_TAG);
	});
});

describe("filterAndMapRouteRules", () => {
	test("returns rules unchanged when allowedRuleSets is null (dual mode)", () => {
		const rules: RouteRuleDefinition[] = [
			{ rule_set: "any", action: "route", outbound: PROXY_SELECTOR_TAG },
		];
		const filtered = filterAndMapRouteRules(rules, null, PROXY_SELECTOR_TAG, CORE_OUTBOUNDS);
		expect(filtered).toEqual(rules);
	});

	test("filters out rules whose rule_set is not in allowedRuleSets", () => {
		const rules: RouteRuleDefinition[] = [
			{ rule_set: "keep-me", action: "route", outbound: PROXY_SELECTOR_TAG },
			{ rule_set: "drop-me", action: "route", outbound: PROXY_SELECTOR_TAG },
			{ action: "sniff" },
		];
		const allowed = new Set(["keep-me"]);
		const filtered = filterAndMapRouteRules(rules, allowed, DIRECT_TAG, CORE_OUTBOUNDS);
		expect(filtered).toHaveLength(2);
		expect(filtered[0].rule_set).toBe("keep-me");
		expect(filtered[1].action).toBe("sniff");
	});

	test("keeps rule with array rule_set if any element is allowed", () => {
		const rules: RouteRuleDefinition[] = [
			{ rule_set: ["drop-me", "keep-me"], action: "route", outbound: PROXY_SELECTOR_TAG },
		];
		const allowed = new Set(["keep-me"]);
		const filtered = filterAndMapRouteRules(rules, allowed, DIRECT_TAG, CORE_OUTBOUNDS);
		expect(filtered).toHaveLength(1);
	});

	test("keeps rules without a rule_set (sniff/hijack-dns/logical)", () => {
		const rules: RouteRuleDefinition[] = [
			{ action: "sniff" },
			{ action: "hijack-dns" },
			{ type: "logical", mode: "and", rules: [], action: "reject" },
		];
		const filtered = filterAndMapRouteRules(rules, new Set(), DIRECT_TAG, CORE_OUTBOUNDS);
		expect(filtered).toHaveLength(3);
	});

	test("remaps DIRECT_REDIRECT outbounds to DIRECT", () => {
		const redirectOutbound = DIRECT_REDIRECT_GROUPS[0];
		const rules: RouteRuleDefinition[] = [
			{ rule_set: "bt", action: "route", outbound: redirectOutbound },
		];
		const filtered = filterAndMapRouteRules(rules, null, PROXY_SELECTOR_TAG, CORE_OUTBOUNDS);
		expect(filtered[0].outbound).toBe(DIRECT_TAG);
	});

	test("remaps non-core outbounds to fallback", () => {
		const rules: RouteRuleDefinition[] = [
			{ rule_set: "ai", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
			{ rule_set: "youtube", action: "route", outbound: GROUP_TAGS.YOUTUBE },
		];
		const filtered = filterAndMapRouteRules(rules, null, PROXY_SELECTOR_TAG, CORE_OUTBOUNDS);
		expect(filtered[0].outbound).toBe(PROXY_SELECTOR_TAG);
		expect(filtered[1].outbound).toBe(PROXY_SELECTOR_TAG);
	});

	test("keeps core outbounds unchanged", () => {
		const rules: RouteRuleDefinition[] = [
			{ rule_set: "cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
			{ rule_set: "ads", action: "route", outbound: GROUP_TAGS.AD_BLOCK },
			{ rule_set: "private", action: "route", outbound: DIRECT_TAG },
			{ rule_set: "quic", action: "route", outbound: GROUP_TAGS.REJECT },
		];
		const filtered = filterAndMapRouteRules(rules, null, PROXY_SELECTOR_TAG, CORE_OUTBOUNDS);
		expect(filtered[0].outbound).toBe(GROUP_TAGS.CN_SERVICES);
		expect(filtered[1].outbound).toBe(GROUP_TAGS.AD_BLOCK);
		expect(filtered[2].outbound).toBe(DIRECT_TAG);
		expect(filtered[3].outbound).toBe(GROUP_TAGS.REJECT);
	});

	test("does not mutate the input array", () => {
		const rules: RouteRuleDefinition[] = [
			{ rule_set: "ai", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
		];
		filterAndMapRouteRules(rules, null, PROXY_SELECTOR_TAG, CORE_OUTBOUNDS);
		expect(rules[0].outbound).toBe(GROUP_TAGS.AI_SERVICES);
	});
});

describe("resolveRouteRules (per-mode memoization)", () => {
	test("full mode returns ROUTE_RULES unchanged", () => {
		expect(resolveRouteRules({})).toBe(ROUTE_RULES);
	});

	test("white mode returns a filtered array (subset of full rules)", () => {
		const whiteRules = resolveRouteRules({ isWhite: true });
		expect(whiteRules).not.toBe(ROUTE_RULES);
		expect(whiteRules.length).toBeLessThan(ROUTE_RULES.length);
		for (const rule of whiteRules) {
			if (rule.rule_set) {
				const sets = Array.isArray(rule.rule_set) ? rule.rule_set : [rule.rule_set];
				for (const s of sets) {
					expect(GEOX_ALLOWED_WHITE).toContain(s);
				}
			}
		}
	});

	test("black mode returns a filtered array (subset of full rules)", () => {
		const blackRules = resolveRouteRules({ isBlack: true });
		expect(blackRules).not.toBe(ROUTE_RULES);
		expect(blackRules.length).toBeLessThan(ROUTE_RULES.length);
		for (const rule of blackRules) {
			if (rule.rule_set) {
				const sets = Array.isArray(rule.rule_set) ? rule.rule_set : [rule.rule_set];
				for (const s of sets) {
					expect(GEOX_ALLOWED_BLACK).toContain(s);
				}
			}
		}
	});

	test("dual mode returns same length as full (no filtering)", () => {
		const dualRules = resolveRouteRules({ isDual: true });
		expect(dualRules.length).toBe(ROUTE_RULES.length);
	});

	test("white mode remaps all non-core outbounds to DIRECT", () => {
		const whiteRules = resolveRouteRules({ isWhite: true });
		for (const rule of whiteRules) {
			if (rule.action === "route" && rule.outbound) {
				expect([
					DIRECT_TAG,
					GROUP_TAGS.CN_SERVICES,
					GROUP_TAGS.AD_BLOCK,
					GROUP_TAGS.REJECT,
				]).toContain(rule.outbound);
			}
		}
	});

	test("black mode remaps all non-core outbounds to PROXY", () => {
		const blackRules = resolveRouteRules({ isBlack: true });
		for (const rule of blackRules) {
			if (rule.action === "route" && rule.outbound) {
				expect([
					PROXY_SELECTOR_TAG,
					GROUP_TAGS.CN_SERVICES,
					GROUP_TAGS.AD_BLOCK,
					GROUP_TAGS.DIRECT,
					GROUP_TAGS.REJECT,
				]).toContain(rule.outbound);
			}
		}
	});

	test("dual mode remaps all non-core outbounds to PROXY", () => {
		const dualRules = resolveRouteRules({ isDual: true });
		for (const rule of dualRules) {
			if (rule.action === "route" && rule.outbound) {
				expect([
					PROXY_SELECTOR_TAG,
					GROUP_TAGS.CN_SERVICES,
					GROUP_TAGS.AD_BLOCK,
					GROUP_TAGS.DIRECT,
					GROUP_TAGS.REJECT,
				]).toContain(rule.outbound);
			}
		}
	});

	test("memoizes per mode (returns same reference on second call)", () => {
		expect(resolveRouteRules({ isWhite: true })).toBe(resolveRouteRules({ isWhite: true }));
		expect(resolveRouteRules({ isBlack: true })).toBe(resolveRouteRules({ isBlack: true }));
		expect(resolveRouteRules({ isDual: true })).toBe(resolveRouteRules({ isDual: true }));
		expect(resolveRouteRules({})).toBe(resolveRouteRules({}));
	});
});

describe("collectReferencedRuleSets", () => {
	test("collects flat rule_set tags", () => {
		const rules: RouteRuleDefinition[] = [
			{ rule_set: "a", action: "route", outbound: "X" },
			{ rule_set: "b", action: "route", outbound: "Y" },
		];
		expect([...collectReferencedRuleSets(rules)].sort()).toEqual(["a", "b"]);
	});

	test("collects array rule_set tags", () => {
		const rules: RouteRuleDefinition[] = [{ rule_set: ["a", "b"], action: "route", outbound: "X" }];
		expect([...collectReferencedRuleSets(rules)].sort()).toEqual(["a", "b"]);
	});

	test("collects nested logical rule_set tags", () => {
		const rules: RouteRuleDefinition[] = [
			{
				type: "logical",
				mode: "and",
				rules: [
					{ rule_set: "nested-a", action: "route", outbound: "X" },
					{
						type: "logical",
						mode: "or",
						rules: [{ rule_set: "nested-b", action: "route", outbound: "Y" }],
					},
				],
				action: "route",
				outbound: "Z",
			},
		];
		expect([...collectReferencedRuleSets(rules)].sort()).toEqual(["nested-a", "nested-b"]);
	});

	test("returns empty set for rules without rule_set", () => {
		const rules: RouteRuleDefinition[] = [{ action: "sniff" }, { action: "reject", port: 443 }];
		expect(collectReferencedRuleSets(rules).size).toBe(0);
	});
});

describe("getReferencedRuleSetDefinitions", () => {
	test("returns full-mode definitions for ROUTE_RULES (fast-path)", () => {
		const defs = getReferencedRuleSetDefinitions(ROUTE_RULES);
		expect(defs.length).toBeGreaterThan(0);
		const referenced = collectReferencedRuleSets(ROUTE_RULES);
		expect(defs.every((d) => referenced.has(d.tag))).toBe(true);
	});

	test("memoizes by rule array reference", () => {
		const defs1 = getReferencedRuleSetDefinitions(ROUTE_RULES);
		const defs2 = getReferencedRuleSetDefinitions(ROUTE_RULES);
		expect(defs1).toBe(defs2);
	});

	test("returns subset for white-mode rules", () => {
		const whiteRules = resolveRouteRules({ isWhite: true });
		const whiteDefs = getReferencedRuleSetDefinitions(whiteRules);
		const fullDefs = getReferencedRuleSetDefinitions(ROUTE_RULES);
		expect(whiteDefs.length).toBeLessThanOrEqual(fullDefs.length);
		const referenced = collectReferencedRuleSets(whiteRules);
		expect(whiteDefs.every((d) => referenced.has(d.tag))).toBe(true);
	});
});

describe("routeTailscaleTraffic", () => {
	test("prepends Tailscale CGNAT CIDR as first rule", () => {
		const result = routeTailscaleTraffic([], "Tailscale Node");
		expect(result[0]).toMatchObject({
			ip_cidr: ["100.64.0.0/10", "fd7a:115c:a1e0::/48"],
			action: "route",
			outbound: "Tailscale Node",
		});
	});

	test("sets no_resolve when requested", () => {
		const result = routeTailscaleTraffic([], "Tailscale Node", true);
		expect(result[0].no_resolve).toBe(true);
	});

	test("omits no_resolve by default", () => {
		const result = routeTailscaleTraffic([], "Tailscale Node");
		expect(result[0].no_resolve).toBeUndefined();
	});

	test("rewrites ts.net domain_suffix rule to specified outbound", () => {
		const rules: RouteRuleDefinition[] = [
			{ domain_suffix: ["ts.net"], action: "route", outbound: DIRECT_TAG },
		];
		const result = routeTailscaleTraffic(rules, "Tailscale Node");
		const tsRule = result.find(
			(r) => r.domain_suffix?.length === 1 && r.domain_suffix[0] === "ts.net",
		);
		expect(tsRule).toBeDefined();
		expect(tsRule?.outbound).toBe("Tailscale Node");
	});

	test("splits ts.net from sibling suffixes preserving original outbound for siblings", () => {
		const rules: RouteRuleDefinition[] = [
			{ domain_suffix: ["ts.net", "example.com"], action: "route", outbound: "Original" },
		];
		const result = routeTailscaleTraffic(rules, "Tailscale Node");
		const siblings = result.find(
			(r) => r.domain_suffix?.includes("example.com") && !r.domain_suffix.includes("ts.net"),
		);
		expect(siblings).toBeDefined();
		expect(siblings?.outbound).toBe("Original");
		expect(siblings?.domain_suffix).toEqual(["example.com"]);
	});

	test("does not rewrite rules without ts.net", () => {
		const rules: RouteRuleDefinition[] = [
			{ domain_suffix: ["example.com"], action: "route", outbound: "Original" },
		];
		const result = routeTailscaleTraffic(rules, "Tailscale Node");
		expect(result[1]).toEqual(rules[0]);
	});

	test("does not mutate input array", () => {
		const rules: RouteRuleDefinition[] = [
			{ domain_suffix: ["ts.net"], action: "route", outbound: DIRECT_TAG },
		];
		routeTailscaleTraffic(rules, "Tailscale Node");
		expect(rules[0].outbound).toBe(DIRECT_TAG);
	});
});

describe("ROUTE_RULES drift detection (vs RULE_SET_DEFINITIONS)", () => {
	test("every rule_set referenced in ROUTE_RULES exists in RULE_SET_DEFINITIONS", () => {
		const referenced = collectReferencedRuleSets(ROUTE_RULES);
		const defined = new Set(RULE_SET_DEFINITIONS.map((d) => d.tag));
		const missing = [...referenced].filter((tag) => !defined.has(tag));
		expect(missing).toEqual([]);
	});

	test("every rule_set referenced in white-mode rules exists in RULE_SET_DEFINITIONS", () => {
		const whiteRules = resolveRouteRules({ isWhite: true });
		const referenced = collectReferencedRuleSets(whiteRules);
		const defined = new Set(RULE_SET_DEFINITIONS.map((d) => d.tag));
		const missing = [...referenced].filter((tag) => !defined.has(tag));
		expect(missing).toEqual([]);
	});

	test("every rule_set referenced in black-mode rules exists in RULE_SET_DEFINITIONS", () => {
		const blackRules = resolveRouteRules({ isBlack: true });
		const referenced = collectReferencedRuleSets(blackRules);
		const defined = new Set(RULE_SET_DEFINITIONS.map((d) => d.tag));
		const missing = [...referenced].filter((tag) => !defined.has(tag));
		expect(missing).toEqual([]);
	});

	test("every outbound referenced in ROUTE_RULES is a known group tag", () => {
		const knownOutbounds = new Set<string>([
			DIRECT_TAG,
			...Object.values(GROUP_TAGS),
			PROXY_SELECTOR_TAG,
		]);
		const unknown: string[] = [];
		const visit = (rule: RouteRuleDefinition): void => {
			if (rule.outbound && !knownOutbounds.has(rule.outbound)) unknown.push(rule.outbound);
			for (const r of rule.rules || []) visit(r as RouteRuleDefinition);
		};
		for (const rule of ROUTE_RULES) visit(rule);
		expect(unknown).toEqual([]);
	});

	test("ROUTE_RULES starts with sniff action", () => {
		expect(ROUTE_RULES[0]).toEqual({ action: "sniff" });
	});

	test("ROUTE_RULES has the DNS hijack logical rule as second entry", () => {
		expect(ROUTE_RULES[1]).toMatchObject({
			type: "logical",
			mode: "or",
			action: "hijack-dns",
		});
	});

	test("full-mode rules reference cn-ip (used for no-resolve DNS leak prevention)", () => {
		// Merged from registry.test.ts: cn-ip is a critical rule_set that must
		// remain referenced in full mode (it carries no-resolve to prevent DNS leaks).
		const referenced = collectReferencedRuleSets(resolveRouteRules({}));
		expect(referenced.has("cn-ip")).toBe(true);
	});

	test("routeTailscaleTraffic rewrites both CGNAT CIDR and ts.net on real ROUTE_RULES", () => {
		// Merged from registry.test.ts: integration check that the shared Tailscale
		// rewrite path produces both the CGNAT ip_cidr rule and the ts.net
		// domain_suffix rewrite when applied to the real full-mode rule set.
		const rules = routeTailscaleTraffic(resolveRouteRules({}), "Tailscale Node", true);
		expect(rules[0]).toMatchObject({
			ip_cidr: ["100.64.0.0/10", "fd7a:115c:a1e0::/48"],
			outbound: "Tailscale Node",
			no_resolve: true,
		});
		expect(rules).toContainEqual(
			expect.objectContaining({
				domain_suffix: ["ts.net"],
				outbound: "Tailscale Node",
			}),
		);
	});
});
