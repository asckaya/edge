import { describe, expect, test } from "vitest";
import { AnyProxySchema } from "../../core/src/types";
import {
	ALL_PROTOCOL_TYPES,
	asProtocolType,
	hasKnownProtocol,
	isMihomoSupported,
	isSingBoxEndpoint,
	isSingBoxOutbound,
	isSingBoxSupported,
	isStashSupported,
	KERNEL_PROTOCOL_SUPPORT,
	type KernelProtocolSupport,
	type ProtocolType,
	SINGBOX_ENDPOINT_TYPES,
	SINGBOX_OUTBOUND_TYPES,
} from "../../core/src/utils/protocol-registry";
import type { LooseProxyNode } from "../../core/src/utils/proxy-node";

/**
 * Protocol-registry drift detection.
 *
 * `KERNEL_PROTOCOL_SUPPORT` is the single source of truth (per AGENTS.md) for
 * which proxy protocols each kernel supports. These tests guard against drift
 * between the registry, the valibot `AnyProxySchema` variant, and the derived
 * helper functions / Sets.
 */

const VALID_MIHOMO_STASH = [true, null] as const;
const VALID_SINGBOX = ["outbound", "endpoint", null] as const;

/** Extract the protocol `type` literal string from each AnyProxySchema variant. */
function schemaProtocolTypes(): string[] {
	const options = (
		AnyProxySchema as unknown as {
			options: Array<{
				entries: { type: { literal: string } };
			}>;
		}
	).options;
	return options.map((o) => o.entries.type.literal);
}

describe("KERNEL_PROTOCOL_SUPPORT shape", () => {
	test("every entry has the valid {mihomo, stash, singbox} shape", () => {
		for (const type of ALL_PROTOCOL_TYPES) {
			const entry = KERNEL_PROTOCOL_SUPPORT[type] as KernelProtocolSupport;
			expect(VALID_MIHOMO_STASH).toContain(entry.mihomo);
			expect(VALID_MIHOMO_STASH).toContain(entry.stash);
			expect(VALID_SINGBOX).toContain(entry.singbox);
		}
	});

	test("mihomo and stash only use `true | null` (never false)", () => {
		for (const type of ALL_PROTOCOL_TYPES) {
			const entry = KERNEL_PROTOCOL_SUPPORT[type];
			expect(entry.mihomo === true || entry.mihomo === null).toBe(true);
			expect(entry.stash === true || entry.stash === null).toBe(true);
		}
	});
});

describe("drift detection vs AnyProxySchema", () => {
	test("every protocol type in AnyProxySchema appears in KERNEL_PROTOCOL_SUPPORT", () => {
		const schemaTypes = new Set(schemaProtocolTypes());
		const registryTypes = new Set<string>(ALL_PROTOCOL_TYPES);
		const missing = [...schemaTypes].filter((t) => !registryTypes.has(t));
		expect(missing).toEqual([]);
	});

	test("every protocol type in KERNEL_PROTOCOL_SUPPORT appears in AnyProxySchema", () => {
		const schemaTypes = new Set(schemaProtocolTypes());
		const missing = ALL_PROTOCOL_TYPES.filter((t) => !schemaTypes.has(t));
		expect(missing).toEqual([]);
	});

	test("the two lists have the same length (no duplicates, no extras)", () => {
		expect(schemaProtocolTypes()).toHaveLength(ALL_PROTOCOL_TYPES.length);
		expect(new Set(schemaProtocolTypes()).size).toBe(schemaProtocolTypes().length);
	});
});

describe("helper functions are consistent with the table", () => {
	test("isMihomoSupported matches KERNEL_PROTOCOL_SUPPORT[*].mihomo", () => {
		for (const type of ALL_PROTOCOL_TYPES) {
			expect(isMihomoSupported(type)).toBe(KERNEL_PROTOCOL_SUPPORT[type].mihomo === true);
		}
	});

	test("isStashSupported matches KERNEL_PROTOCOL_SUPPORT[*].stash", () => {
		for (const type of ALL_PROTOCOL_TYPES) {
			expect(isStashSupported(type)).toBe(KERNEL_PROTOCOL_SUPPORT[type].stash === true);
		}
	});

	test("isSingBoxOutbound matches singbox === 'outbound'", () => {
		for (const type of ALL_PROTOCOL_TYPES) {
			expect(isSingBoxOutbound(type)).toBe(KERNEL_PROTOCOL_SUPPORT[type].singbox === "outbound");
		}
	});

	test("isSingBoxEndpoint matches singbox === 'endpoint'", () => {
		for (const type of ALL_PROTOCOL_TYPES) {
			expect(isSingBoxEndpoint(type)).toBe(KERNEL_PROTOCOL_SUPPORT[type].singbox === "endpoint");
		}
	});

	test("isSingBoxSupported matches singbox !== null", () => {
		for (const type of ALL_PROTOCOL_TYPES) {
			expect(isSingBoxSupported(type)).toBe(KERNEL_PROTOCOL_SUPPORT[type].singbox !== null);
		}
	});

	test("isSingBoxOutbound and isSingBoxEndpoint are mutually exclusive", () => {
		for (const type of ALL_PROTOCOL_TYPES) {
			expect(isSingBoxOutbound(type) && isSingBoxEndpoint(type)).toBe(false);
		}
	});

	test("helpers return false for unknown protocol types", () => {
		const unknown = "definitely-not-a-protocol";
		expect(isMihomoSupported(unknown)).toBe(false);
		expect(isStashSupported(unknown)).toBe(false);
		expect(isSingBoxOutbound(unknown)).toBe(false);
		expect(isSingBoxEndpoint(unknown)).toBe(false);
		expect(isSingBoxSupported(unknown)).toBe(false);
	});
});

describe("derived Sets", () => {
	test("SINGBOX_OUTBOUND_TYPES is exactly the set of singbox==='outbound' types", () => {
		const expected = new Set(
			ALL_PROTOCOL_TYPES.filter((t) => KERNEL_PROTOCOL_SUPPORT[t].singbox === "outbound"),
		);
		expect(SINGBOX_OUTBOUND_TYPES).toEqual(expected);
	});

	test("SINGBOX_ENDPOINT_TYPES is exactly the set of singbox==='endpoint' types", () => {
		const expected = new Set(
			ALL_PROTOCOL_TYPES.filter((t) => KERNEL_PROTOCOL_SUPPORT[t].singbox === "endpoint"),
		);
		expect(SINGBOX_ENDPOINT_TYPES).toEqual(expected);
	});

	test("the two Sets are disjoint", () => {
		for (const t of SINGBOX_OUTBOUND_TYPES) {
			expect(SINGBOX_ENDPOINT_TYPES.has(t)).toBe(false);
		}
		for (const t of SINGBOX_ENDPOINT_TYPES) {
			expect(SINGBOX_OUTBOUND_TYPES.has(t)).toBe(false);
		}
	});

	test("union of both Sets equals all singbox-supported types", () => {
		const union = new Set([...SINGBOX_OUTBOUND_TYPES, ...SINGBOX_ENDPOINT_TYPES]);
		const supported = new Set(
			ALL_PROTOCOL_TYPES.filter((t) => KERNEL_PROTOCOL_SUPPORT[t].singbox !== null),
		);
		expect(union).toEqual(supported);
	});

	test("wireguard and tailscale are endpoint types (per AGENTS.md sing-box v1.14+ migration)", () => {
		expect(SINGBOX_ENDPOINT_TYPES.has("wireguard")).toBe(true);
		expect(SINGBOX_ENDPOINT_TYPES.has("tailscale")).toBe(true);
		expect(isSingBoxOutbound("wireguard")).toBe(false);
		expect(isSingBoxOutbound("tailscale")).toBe(false);
	});

	test("juicity is stash-only (not mihomo, not sing-box)", () => {
		expect(KERNEL_PROTOCOL_SUPPORT.juicity).toEqual({ mihomo: null, stash: true, singbox: null });
	});

	test("naive and shadowtls are sing-box outbound-only", () => {
		expect(KERNEL_PROTOCOL_SUPPORT.naive).toEqual({
			mihomo: null,
			stash: null,
			singbox: "outbound",
		});
		expect(KERNEL_PROTOCOL_SUPPORT.shadowtls).toEqual({
			mihomo: null,
			stash: null,
			singbox: "outbound",
		});
	});

	test("masque and mieru are mihomo-only", () => {
		expect(KERNEL_PROTOCOL_SUPPORT.masque).toEqual({ mihomo: true, stash: null, singbox: null });
		expect(KERNEL_PROTOCOL_SUPPORT.mieru).toEqual({ mihomo: true, stash: null, singbox: null });
	});
});

describe("asProtocolType / hasKnownProtocol", () => {
	test("asProtocolType narrows known types and rejects unknown", () => {
		for (const type of ALL_PROTOCOL_TYPES) {
			expect(asProtocolType(type)).toBe(type as ProtocolType);
		}
		expect(asProtocolType("nope")).toBeNull();
		expect(asProtocolType(123)).toBeNull();
		expect(asProtocolType(undefined)).toBeNull();
	});

	test("hasKnownProtocol returns true for every known type", () => {
		for (const type of ALL_PROTOCOL_TYPES) {
			expect(hasKnownProtocol({ type } as LooseProxyNode)).toBe(true);
		}
		expect(hasKnownProtocol({ type: "unknown" } as unknown as LooseProxyNode)).toBe(false);
	});
});

describe("immutability", () => {
	test("KERNEL_PROTOCOL_SUPPORT is frozen (cannot be mutated at runtime)", () => {
		expect(Object.isFrozen(KERNEL_PROTOCOL_SUPPORT)).toBe(true);
	});

	test("each entry value is frozen", () => {
		for (const type of ALL_PROTOCOL_TYPES) {
			expect(Object.isFrozen(KERNEL_PROTOCOL_SUPPORT[type])).toBe(true);
		}
	});

	test("ALL_PROTOCOL_TYPES is frozen", () => {
		expect(Object.isFrozen(ALL_PROTOCOL_TYPES)).toBe(true);
	});

	test("SINGBOX_OUTBOUND_TYPES and SINGBOX_ENDPOINT_TYPES are ReadonlySet instances", () => {
		// ReadonlySet is a TS-only constraint; at runtime they are plain Sets.
		// We assert they are Sets and that their membership exactly matches the
		// table (so any drift in the table is reflected).
		expect(SINGBOX_OUTBOUND_TYPES).toBeInstanceOf(Set);
		expect(SINGBOX_ENDPOINT_TYPES).toBeInstanceOf(Set);
	});

	test("KERNEL_PROTOCOL_SUPPORT cannot be mutated (frozen)", () => {
		const type = ALL_PROTOCOL_TYPES[0];
		const entry = KERNEL_PROTOCOL_SUPPORT[type];
		const original = entry.mihomo;
		// In strict mode (ES modules), assigning to a frozen property throws.
		expect(() => {
			(entry as Record<string, unknown>).mihomo = "tampered";
		}).toThrow(TypeError);
		expect((entry as Record<string, unknown>).mihomo).toBe(original);
		// Adding a new protocol is also rejected.
		expect(() => {
			(KERNEL_PROTOCOL_SUPPORT as Record<string, unknown>).bogus = {
				mihomo: true,
				stash: true,
				singbox: "outbound",
			};
		}).toThrow(TypeError);
		expect("bogus" in KERNEL_PROTOCOL_SUPPORT).toBe(false);
	});
});
