import type { ConfigType } from "../../core/src/types";
import { KERNEL_PROTOCOL_SUPPORT } from "../../core/src/utils/protocol-registry";

export type KernelId = ConfigType;

/**
 * Extract the protocol scheme from a single proxy URI line.
 *
 * Accepts the project's custom URI schemes (snell://, masque://, mieru://,
 * trusttunnel://, shadowtls://, juicity://, naive+https://, naive+quic://)
 * plus the standard ones (vless://, vmess://, trojan://, ss://, ...).
 * Returns the canonical protocol key used in KERNEL_PROTOCOL_SUPPORT, or
 * null when the line is blank, a comment, or has no recognizable scheme.
 *
 * NOTE: this is a deliberately lightweight scan (no full URL parse) so it
 * stays cheap even for large pasted subscription blobs. It mirrors the
 * scheme-detection logic in core/src/utils/proxy-parser.ts but only needs
 * the scheme, not the parsed node.
 */
export function extractProtocol(line: string): string | null {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith("#")) return null;
	// Strip a leading "proxy://" wrapper some subscriptions use.
	const match = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
	if (!match?.[1]) return null;
	const scheme = match[1].toLowerCase();
	// Map URI schemes back to the canonical protocol keys in the registry.
	// Most schemes already match the key (vless, vmess, trojan, ...).
	// Only the aliases that differ need explicit remapping.
	const ALIASES: Record<string, string> = {
		ss: "ss",
		shadowsocks: "ss",
		wg: "wireguard",
		naive: "naive",
		"naive+https": "naive",
		"naive+quic": "naive",
	};
	return ALIASES[scheme] ?? scheme;
}

/**
 * Result of checking user-entered proxies against the selected kernel.
 *
 * `warnings` are non-blocking: the generated config is still valid, but
 * unsupported nodes will be silently filtered out by the backend, so we
 * surface them to the user up-front.
 */
export interface ProtocolSupportResult {
	/** Protocols found in the input that the selected kernel does not support. */
	unsupportedProtocols: string[];
	/** Human-readable warning lines (already localized), one per unique protocol. */
	warnings: string[];
}

const KERNEL_LABELS: Record<KernelId, { zh: string; en: string }> = {
	mihomo: { zh: "Mihomo", en: "Mihomo" },
	stash: { zh: "Stash", en: "Stash" },
	"sing-box": { zh: "sing-box", en: "sing-box" },
};

/**
 * Is `protocol` (a registry key) supported by `kernel` in any form?
 * For sing-box, both 'outbound' and 'endpoint' count as supported.
 */
function isSupportedByKernel(protocol: string, kernel: KernelId): boolean {
	const entry = (
		KERNEL_PROTOCOL_SUPPORT as Record<
			string,
			{ mihomo: true | null; stash: true | null; singbox: string | null }
		>
	)[protocol];
	if (!entry) return false;
	if (kernel === "sing-box") return entry.singbox != null;
	return entry[kernel] === true;
}

/**
 * Scan the raw proxies textarea and report any protocols the selected
 * kernel does not support. Pure function; safe to call in useMemo.
 */
export function checkProtocolSupport(
	proxiesText: string,
	kernel: KernelId,
	lang: "zh" | "en",
): ProtocolSupportResult {
	const trimmed = proxiesText.trim();
	if (!trimmed) return { unsupportedProtocols: [], warnings: [] };

	const found = new Set<string>();
	for (const line of trimmed.split(/\r?\n/)) {
		const protocol = extractProtocol(line);
		if (protocol && !isSupportedByKernel(protocol, kernel)) {
			found.add(protocol);
		}
	}

	if (found.size === 0) return { unsupportedProtocols: [], warnings: [] };

	const protocols = [...found];
	const kernelLabel = KERNEL_LABELS[kernel][lang];
	const warnings = protocols.map((protocol) =>
		lang === "zh"
			? `${kernelLabel} 不支持 ${protocol} 协议,该协议的节点将从生成的配置中过滤掉。`
			: `${kernelLabel} does not support the ${protocol} protocol; nodes using it will be filtered out of the generated config.`,
	);

	return { unsupportedProtocols: protocols, warnings };
}

/**
 * Is a single protocol supported by the given kernel? Used by NodeModal
 * to warn the user when they pick an unsupported protocol for the current
 * target kernel before injecting a node.
 */
export function isProtocolSupportedByKernel(protocol: string, kernel: KernelId): boolean {
	return isSupportedByKernel(protocol, kernel);
}
