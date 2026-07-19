import type { LooseProxyNode } from "./proxy-node";

/**
 * Kernel protocol support registry.
 *
 * Single source of truth for which proxy protocols each kernel supports, and
 * how. Replaces 5 previously-scattered declaration sites:
 *   - inline `return null` lists in `toMihomoOutbound` (mihomo/outbounds.ts)
 *   - inline `return null` lists in `toStashOutbound` (mihomo/stash-outbounds.ts)
 *   - fallthrough `return null` in `toSingBoxOutbound` (sing-box/outbounds.ts)
 *   - endpoint dispatch in `toSingBoxEndpoint` (sing-box/endpoints.ts)
 *
 * `mihomo` / `stash`: `true` = supported as outbound, `null` = not supported.
 * `singbox`: `'outbound'` = regular outbound, `'endpoint'` = endpoint-only
 * (sing-box v1.14+ migrated wireguard/tailscale to the endpoint system),
 * `null` = not supported.
 *
 * Verifiable against official docs:
 *   - mihomo: https://wiki.metacubex.one/en/config/proxies/
 *   - stash:  https://stash.wiki/en/proxy-protocols/proxy-types
 *   - sing-box v1.14+: https://sing-box.sagernet.org/configuration/outbound/
 *                      https://sing-box.sagernet.org/configuration/endpoint/
 */
export type SingBoxSupport = "outbound" | "endpoint" | null;
export type MihomoStashSupport = true | null;

export interface KernelProtocolSupport {
	mihomo: MihomoStashSupport;
	stash: MihomoStashSupport;
	singbox: SingBoxSupport;
}

export const KERNEL_PROTOCOL_SUPPORT = {
	hysteria2: { mihomo: true, stash: true, singbox: "outbound" },
	vless: { mihomo: true, stash: true, singbox: "outbound" },
	trojan: { mihomo: true, stash: true, singbox: "outbound" },
	ss: { mihomo: true, stash: true, singbox: "outbound" },
	vmess: { mihomo: true, stash: true, singbox: "outbound" },
	tuic: { mihomo: true, stash: true, singbox: "outbound" },
	anytls: { mihomo: true, stash: true, singbox: "outbound" },
	socks: { mihomo: true, stash: true, singbox: "outbound" },
	http: { mihomo: true, stash: true, singbox: "outbound" },
	snell: { mihomo: true, stash: true, singbox: "outbound" },
	wireguard: { mihomo: true, stash: true, singbox: "endpoint" },
	tailscale: { mihomo: true, stash: true, singbox: "endpoint" },
	// mihomo-only protocols
	masque: { mihomo: true, stash: null, singbox: null },
	mieru: { mihomo: true, stash: null, singbox: null },
	// stash-only protocols
	juicity: { mihomo: null, stash: true, singbox: null },
	trusttunnel: { mihomo: true, stash: true, singbox: null },
	// sing-box-only protocols
	naive: { mihomo: null, stash: null, singbox: "outbound" },
	shadowtls: { mihomo: null, stash: null, singbox: "outbound" },
} as const satisfies Record<string, KernelProtocolSupport>;

/**
 * Deep-freeze the registry so it cannot be mutated at runtime. `as const` only
 * provides TypeScript-level immutability; this enforces it at runtime too.
 */
function deepFreeze<T>(value: T): T {
	if (value && typeof value === "object") {
		for (const key of Reflect.ownKeys(value as object)) {
			deepFreeze((value as Record<string | symbol, unknown>)[key]);
		}
		Object.freeze(value);
	}
	return value;
}
deepFreeze(KERNEL_PROTOCOL_SUPPORT);

export type ProtocolType = keyof typeof KERNEL_PROTOCOL_SUPPORT;

/** All protocol types supported by the canonical schema (exhaustive). */
export const ALL_PROTOCOL_TYPES = Object.freeze(
	Object.keys(KERNEL_PROTOCOL_SUPPORT) as ProtocolType[],
);

/** Is `type` supported by the mihomo kernel (as a regular outbound)? */
export function isMihomoSupported(type: string): boolean {
	const entry = (KERNEL_PROTOCOL_SUPPORT as Record<string, KernelProtocolSupport>)[type];
	return entry?.mihomo === true;
}

/** Is `type` supported by the stash kernel (as a regular outbound)? */
export function isStashSupported(type: string): boolean {
	const entry = (KERNEL_PROTOCOL_SUPPORT as Record<string, KernelProtocolSupport>)[type];
	return entry?.stash === true;
}

/** Is `type` a sing-box outbound (not endpoint)? */
export function isSingBoxOutbound(type: string): boolean {
	const entry = (KERNEL_PROTOCOL_SUPPORT as Record<string, KernelProtocolSupport>)[type];
	return entry?.singbox === "outbound";
}

/** Is `type` a sing-box endpoint (not a regular outbound)? */
export function isSingBoxEndpoint(type: string): boolean {
	const entry = (KERNEL_PROTOCOL_SUPPORT as Record<string, KernelProtocolSupport>)[type];
	return entry?.singbox === "endpoint";
}

/** Is `type` supported by sing-box in any form (outbound or endpoint)? */
export function isSingBoxSupported(type: string): boolean {
	const entry = (KERNEL_PROTOCOL_SUPPORT as Record<string, KernelProtocolSupport>)[type];
	return entry?.singbox != null;
}

/** Set of sing-box outbound protocol types (for `normalizeProxyList` filtering). */
export const SINGBOX_OUTBOUND_TYPES: ReadonlySet<string> = new Set(
	ALL_PROTOCOL_TYPES.filter((t) => KERNEL_PROTOCOL_SUPPORT[t].singbox === "outbound"),
);

/** Set of sing-box endpoint protocol types. */
export const SINGBOX_ENDPOINT_TYPES: ReadonlySet<string> = new Set(
	ALL_PROTOCOL_TYPES.filter((t) => KERNEL_PROTOCOL_SUPPORT[t].singbox === "endpoint"),
);

/**
 * Narrow a loose node's `type` to a known protocol. Used by builders that need
 * a typed dispatch but receive `LooseProxyNode` (widened with `Record<string, unknown>`).
 */
export function asProtocolType(type: unknown): ProtocolType | null {
	return typeof type === "string" && type in KERNEL_PROTOCOL_SUPPORT
		? (type as ProtocolType)
		: null;
}

/**
 * Type guard: does the node have a known protocol type?
 */
export function hasKnownProtocol(
	node: LooseProxyNode,
): node is LooseProxyNode & { type: ProtocolType } {
	return node.type in KERNEL_PROTOCOL_SUPPORT;
}
