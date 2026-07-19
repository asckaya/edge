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
}

export const KERNEL_PROTOCOL_RULES: Record<string, KernelProtocolRule> = {
	socks: {
		// mihomo+stash both rename socks -> socks5 (their socks5 outbound type).
		typeRename: { mihomo: "socks5", stash: "socks5" },
		// stash socks5 docs: username/password/tls/skip-cert-verify only.
		strip: { stash: ["sni", "fingerprint"] },
	},
	wireguard: {
		// mihomo docs use the hyphenated `pre-shared-key`; canonical uses `preshared-key`.
		// stash docs use `preshared-key` verbatim and `keepalive` (not `persistent-keepalive`).
		fieldRenames: {
			mihomo: { "preshared-key": "pre-shared-key" },
			stash: { "persistent-keepalive": "keepalive" },
		},
		strip: { stash: ["allowed-ips", "remote-dns-resolve", "peer-public-key"] },
	},
	vless: {
		// Both kernels use `grpc-service-name` (hyphenated) for gRPC transport.
		nestedRenames: {
			mihomo: { "grpc-opts": { serviceName: "grpc-service-name" } },
			stash: { "grpc-opts": { serviceName: "grpc-service-name" } },
		},
		// vless keeps client-fingerprint + reality-opts in stash (vless-only features).
		strip: { stash: ["packet-encoding", "fingerprint"] },
	},
	vmess: {
		nestedRenames: {
			mihomo: { "grpc-opts": { serviceName: "grpc-service-name" } },
			stash: { "grpc-opts": { serviceName: "grpc-service-name" } },
		},
		// stash: client-fingerprint + reality-opts are vless-only; rest are mihomo-only.
		strip: {
			stash: [
				"client-fingerprint",
				"packet-encoding",
				"global-padding",
				"authenticated-length",
				"reality-opts",
				"fingerprint",
			],
		},
	},
	trojan: {
		nestedRenames: {
			mihomo: { "grpc-opts": { serviceName: "grpc-service-name" } },
			stash: { "grpc-opts": { serviceName: "grpc-service-name" } },
		},
		// stash: client-fingerprint + reality-opts are vless-only in stash.
		strip: { stash: ["client-fingerprint", "reality-opts", "fingerprint"] },
	},
	hysteria2: {
		// stash hysteria2 uses `auth`/`up-speed`/`down-speed` instead of password/up/down.
		fieldRenames: { stash: { password: "auth", up: "up-speed", down: "down-speed" } },
		strip: { stash: ["fingerprint"] },
	},
	tuic: {
		// stash only supports tuic v5; forces version=5 when absent.
		defaults: { stash: { version: 5 } },
		// `udp-over-stream` is sing-box-only; strip from mihomo+stash to avoid leakage.
		// `token` is tuic v4; mihomo supports v4 (keep), stash is v5-only (strip).
		// stash tuic only supports uuid/password/sni/alpn/skip-cert-verify/version.
		strip: {
			mihomo: ["udp-over-stream"],
			stash: [
				"disable-sni",
				"reduce-rtt",
				"fast-open",
				"udp-relay-mode",
				"udp-over-stream",
				"congestion-controller",
				"ip",
				"heartbeat-interval",
				"request-timeout",
				"max-udp-relay-packet-size",
				"max-open-streams",
				"token",
			],
		},
	},
	anytls: {
		// stash anytls only supports password + common TLS fields.
		strip: {
			stash: [
				"client-fingerprint",
				"idle-session-check-interval",
				"idle-session-timeout",
				"min-idle-session",
				"fingerprint",
			],
		},
	},
	http: {
		// mihomo http docs: `headers` only (no `path`). stash http docs: same.
		strip: { mihomo: ["path"], stash: ["sni", "fingerprint", "path"] },
	},
	snell: {
		// mihomo: strip sing-box v6 fields (userkey/mode) + server-cert-fingerprint (snell has no TLS in mihomo).
		// stash: strip client-fingerprint/server-cert-fingerprint/reuse/userkey/mode (not in stash snell docs).
		strip: {
			mihomo: ["userkey", "mode", "server-cert-fingerprint"],
			stash: ["client-fingerprint", "server-cert-fingerprint", "reuse", "userkey", "mode"],
		},
	},
	ss: {
		// stash ss docs: cipher/password/plugin/plugin-opts only.
		strip: { stash: ["udp-over-tcp", "udp-over-tcp-version"] },
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
	}

	if (globalStrip) for (const f of globalStrip) delete copy[f];

	return copy;
}
