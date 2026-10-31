import { isMihomoSupported, isStashSupported } from "./protocol-registry";
import type { LooseProxyNode } from "./proxy-node";

/**
 * Per-protocol field rewrite rules shared by the mihomo and stash outbound
 * builders. Both kernels consume canonical `LooseProxyNode` objects (kebab-
 * case, post-`coerceProxyNode`) and emit kernel-specific YAML; the only
 * differences are field renames, nested renames, default values, and field
 * strips. Centralizing these as data makes the two kernels' field knowledge
 * co-located and diffable, and keeps round-trip symmetry visible in one
 * place.
 *
 * Field-name conventions:
 *  - mihomo: kebab-case (matches mihomo docs); `socks` type renamed to `socks5`.
 *  - stash:  kebab-case; uses `auth`/`up-speed`/`down-speed` for hysteria2,
 *    `keepalive` for wireguard, and `socks5` for socks.
 *
 * Protocol support itself (which protocols each kernel accepts) is declared
 * in `protocol-registry.ts` (`KERNEL_PROTOCOL_SUPPORT`); this table only
 * governs field-level rewrites for supported protocols.
 */
export type Kernel = "mihomo" | "stash";

const KERNEL_SUPPORT_GATE: Record<Kernel, (type: string) => boolean> = {
	mihomo: isMihomoSupported,
	stash: isStashSupported,
};

/**
 * Build a per-kernel outbound builder: gates on kernel protocol support,
 * then applies the kernel's per-protocol field rewrite rules. Returns `null`
 * for unsupported types. Mihomo and stash share identical builder structure;
 * the only differences live in `KERNEL_PROTOCOL_RULES` + `KERNEL_GLOBAL_STRIP`.
 */
export function makeKernelOutbound(kernel: Kernel) {
	const isSupported = KERNEL_SUPPORT_GATE[kernel];
	return function toKernelOutbound(node: LooseProxyNode): Record<string, unknown> | null {
		if (!isSupported(node.type)) return null;
		return applyKernelRules(node, kernel);
	};
}

interface KernelProtocolRule {
	/** Override outbound `type` (e.g., 'socks' -> 'socks5'). */
	typeRename?: Partial<Record<Kernel, string>>;
	/** Top-level field renames: { 'preshared-key': 'pre-shared-key' }. Applied only when source present. */
	fieldRenames?: Partial<Record<Kernel, Record<string, string>>>;
	/** Nested field renames: { 'grpc-opts': { serviceName: 'grpc-service-name' } }. Applied only when source present. */
	nestedRenames?: Partial<Record<Kernel, Record<string, Record<string, string>>>>;
	/** Fields to set if absent (e.g., tuic.version=5 for stash). */
	defaults?: Partial<Record<Kernel, Record<string, unknown>>>;
	/** Fields to delete from the outbound. */
	strip?: Partial<Record<Kernel, string[]>>;
	/** Post-strip shape fix for kernels with strict scalar types (see mihomo's decoder). */
	normalize?: Partial<Record<Kernel, (node: Record<string, unknown>) => void>>;
}

/**
 * mihomo/stash decode `ip` as a single string — an array is a hard decode error
 * (`expected type 'string', got unconvertible type '[]interface {}'`). Canonical
 * nodes may carry the CSV form (`["10.0.0.1/24", "fd00::1/128"]`) from URI
 * parsing, so fold the first entry into `ip` and the rest into `ipv6`.
 */
function normalizeIpField(node: Record<string, unknown>): void {
	const ip = node.ip;
	if (!Array.isArray(ip)) return;
	const values = ip.filter((value): value is string => typeof value === "string");
	const [first, ...rest] = values;
	if (!first) return;
	node.ip = first;
	if (node.ipv6 == null && rest.length > 0) node.ipv6 = rest[0];
}

/**
 * mihomo rejects `port` + `port-range` together (`port and port-range cannot be
 * set at the same time`) and requires `transport` to be exactly `TCP`/`UDP`.
 */
function normalizeMieru(node: Record<string, unknown>): void {
	if (node["port-range"]) delete node.port;
	const transport = node.transport;
	if (typeof transport === "string") node.transport = transport.toUpperCase();
	else node.transport = "TCP";
}

export const KERNEL_PROTOCOL_RULES: Record<string, KernelProtocolRule> = {
	socks: {
		// mihomo+stash both rename socks -> socks5 (their socks5 outbound type).
		typeRename: { mihomo: "socks5", stash: "socks5" },
		// mihomo Socks5Option has no SNI field; stash socks5 docs list username/
		// password/tls/skip-cert-verify only.
		strip: { mihomo: ["sni"], stash: ["sni", "fingerprint", "name-cert-verify"] },
	},
	wireguard: {
		// mihomo docs use the hyphenated `pre-shared-key`; canonical uses `preshared-key`.
		// stash docs use `preshared-key` verbatim and `keepalive` (not `persistent-keepalive`).
		fieldRenames: {
			mihomo: { "preshared-key": "pre-shared-key" },
			stash: { "persistent-keepalive": "keepalive" },
		},
		strip: { stash: ["allowed-ips", "remote-dns-resolve", "peer-public-key"] },
		normalize: { mihomo: normalizeIpField, stash: normalizeIpField },
	},
	vless: {
		// Both kernels use `grpc-service-name` (hyphenated) for gRPC transport.
		nestedRenames: {
			mihomo: { "grpc-opts": { serviceName: "grpc-service-name" } },
			stash: { "grpc-opts": { serviceName: "grpc-service-name" } },
		},
		// vless keeps client-fingerprint + reality-opts in stash (vless-only features).
		// `name-cert-verify` is a mihomo-only key (MetaCubeX/mihomo 5677fd3).
		strip: { stash: ["fingerprint", "name-cert-verify"] },
	},
	vmess: {
		nestedRenames: {
			mihomo: { "grpc-opts": { serviceName: "grpc-service-name" } },
			stash: { "grpc-opts": { serviceName: "grpc-service-name" } },
		},
		// stash lives: client-fingerprint is only documented for vlESS; the rest are
		// mihomo-only. Stash does document packet-encoding and reality-opts (3.6+).
		strip: {
			stash: [
				"client-fingerprint",
				"global-padding",
				"authenticated-length",
				"fingerprint",
				"name-cert-verify",
			],
		},
	},
	trojan: {
		nestedRenames: {
			mihomo: { "grpc-opts": { serviceName: "grpc-service-name" } },
			stash: { "grpc-opts": { serviceName: "grpc-service-name" } },
		},
		// stash documents trojan-over-REALITY (3.6+); client-fingerprint stays out
		// (undocumented for trojan). `h2-opts` is not a trojan transport in mihomo.
		strip: {
			mihomo: ["h2-opts"],
			stash: ["client-fingerprint", "fingerprint", "name-cert-verify"],
		},
	},
	hysteria2: {
		// stash hysteria2 uses `auth`/`up-speed`/`down-speed` instead of password/up/down.
		fieldRenames: { stash: { password: "auth", up: "up-speed", down: "down-speed" } },
		// mihomo has no `fast-open` on hysteria2 (it is `tfo` in BasicOption).
		strip: {
			mihomo: ["fast-open"],
			stash: ["fingerprint", "name-cert-verify"],
		},
	},
	tuic: {
		// Do NOT force `version` (Stash supports v4 and v5; a v4 node carries `token`
		// and no uuid/password, so pinning v5 makes it unusable).
		// `udp-over-stream` is supported by mihomo (TuicOption) and stash — keep it.
		strip: {
			stash: [
				"disable-sni",
				"reduce-rtt",
				"fast-open",
				"udp-relay-mode",
				"udp-over-stream",
				"ip",
				"heartbeat-interval",
				"request-timeout",
				"max-udp-relay-packet-size",
				"max-open-streams",
				"name-cert-verify",
			],
		},
		normalize: { mihomo: normalizeIpField, stash: normalizeIpField },
	},
	anytls: {
		// mihomo explicitly rejects AnyTLS+REALITY (docs: "will not support this
		// combination in the future") and silently ignores the field; Stash has no
		// AnyTLS REALITY section either. Only sing-box consumes `reality-opts` here.
		strip: {
			mihomo: ["reality-opts"],
			stash: [
				"client-fingerprint",
				"reality-opts",
				"idle-session-check-interval",
				"idle-session-timeout",
				"min-idle-session",
				"fingerprint",
				"name-cert-verify",
			],
		},
	},
	http: {
		// mihomo http docs: `headers` only (no `path`). stash http docs: same.
		strip: { mihomo: ["path"], stash: ["sni", "fingerprint", "path", "name-cert-verify"] },
	},
	snell: {
		// mihomo: strip sing-box v6 fields (userkey/mode) + server-cert-fingerprint (snell has no TLS in mihomo).
		// stash: documents reuse/mode/userkey (v4-v6) but not the TLS fields.
		strip: {
			mihomo: ["userkey", "mode", "server-cert-fingerprint"],
			stash: ["client-fingerprint", "server-cert-fingerprint"],
		},
	},
	ss: {
		// stash documents `udp-over-tcp` / `udp-over-tcp-version` (3.1.1+/4.1+) and
		// the same plugin surface, so nothing needs stripping for either kernel.
	},
	juicity: {
		// stash juicity only supports uuid/password/sni/alpn/skip-cert-verify.
		strip: { stash: ["server-cert-fingerprint", "pinned-certchain-sha256", "congestion-control"] },
	},
	trusttunnel: {
		// mihomo: server-cert-fingerprint not in mihomo trusttunnel doc.
		// stash: strips 8 mihomo-only tuning fields.
		strip: {
			mihomo: ["server-cert-fingerprint"],
			stash: [
				"client-fingerprint",
				"health-check",
				"name-cert-verify",
				"congestion-controller",
				"bbr-profile",
				"max-connections",
				"min-streams",
				"max-streams",
			],
		},
	},
	tailscale: {
		// stash tailscale only supports auth-key/hostname/control-url/ephemeral/exit-node.
		strip: { stash: ["state-dir", "accept-routes", "exit-node-allow-lan-access"] },
	},
	masque: {
		// stash masque supports server/port/private-key/public-key/ip/ipv6/dns/network/sni/mtu
		// plus the generic `dialer-proxy`. Strip mihomo-only tuning fields.
		strip: {
			stash: ["congestion-controller", "bbr-profile", "handshake-timeout", "remote-dns-resolve"],
		},
	},
	mieru: {
		// mihomo validates port vs port-range and the TCP/UDP transport enum.
		normalize: { mihomo: normalizeMieru, stash: normalizeMieru },
	},
};

/** Fields stripped from ALL protocols for a given kernel. */
export const KERNEL_GLOBAL_STRIP: Partial<Record<Kernel, string[]>> = {
	// stash has no smux docs; strip from every outbound.
	stash: ["smux"],
};

/**
 * Apply per-protocol kernel rewrite rules to a canonical node. Performs a
 * shallow copy and applies (in order): typeRename, fieldRenames,
 * nestedRenames, defaults, per-protocol strip, then global strip.
 *
 * Caller is responsible for the kernel-support gate (`isMihomoSupported` /
 * `isStashSupported`); this function does not reject unsupported types.
 */
export function applyKernelRules(node: LooseProxyNode, kernel: Kernel): Record<string, unknown> {
	const rule = KERNEL_PROTOCOL_RULES[node.type];
	const globalStrip = KERNEL_GLOBAL_STRIP[kernel];

	// Fast path: no per-protocol rule and no global strip — return the node
	// itself without copying. Caller treats result as read-only after this.
	if (!(rule || globalStrip)) return node;

	const copy: Record<string, unknown> = { ...node };

	if (rule) {
		const typeRename = rule.typeRename?.[kernel];
		if (typeRename) copy.type = typeRename;

		const fieldRenames = rule.fieldRenames?.[kernel];
		if (fieldRenames) {
			for (const [from, to] of Object.entries(fieldRenames)) {
				if (copy[from] != null) {
					copy[to] = copy[from];
					delete copy[from];
				}
			}
		}

		const nestedRenames = rule.nestedRenames?.[kernel];
		if (nestedRenames) {
			for (const [containerKey, innerMap] of Object.entries(nestedRenames)) {
				const container = copy[containerKey];
				if (container != null && typeof container === "object") {
					const rewritten: Record<string, unknown> = { ...(container as Record<string, unknown>) };
					for (const [from, to] of Object.entries(innerMap)) {
						if (rewritten[from] != null) {
							rewritten[to] = rewritten[from];
							delete rewritten[from];
						}
					}
					copy[containerKey] = rewritten;
				}
			}
		}

		const defaults = rule.defaults?.[kernel];
		if (defaults) {
			for (const [k, v] of Object.entries(defaults)) {
				if (copy[k] == null) copy[k] = v;
			}
		}

		const strip = rule.strip?.[kernel];
		if (strip) for (const f of strip) delete copy[f];

		const normalize = rule.normalize?.[kernel];
		if (normalize) normalize(copy);
	}

	if (globalStrip) for (const f of globalStrip) delete copy[f];

	return copy;
}
