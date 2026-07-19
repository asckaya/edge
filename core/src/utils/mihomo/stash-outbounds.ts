import { makeKernelOutbound } from "../kernel-field-tables";

/**
 * Unified Stash outbound builder (Stash is a mihomo variant at the builder layer).
 *
 * Converts a canonical `LooseProxyNode` into a Stash-compatible YAML object.
 * Stash uses the same kebab-case convention as mihomo for most fields, but
 * diverges per-protocol (documented at https://stash.wiki/proxy-protocols/proxy-types).
 * Per-protocol field rewrites/strips live in
 * `core/src/utils/kernel-field-tables.ts` (`KERNEL_PROTOCOL_RULES`).
 *
 * Located under `mihomo/` because the mihomo builder (`mihomo/index.ts`) drives
 * stash config generation via an `isStash` flag — Stash shares mihomo's templates,
 * routing, and group layout, differing only in outbound field-shaping.
 *
 * Notable Stash divergences (see the table for the full list):
 *   - hysteria2: `password`→`auth`, `up`→`up-speed`, `down`→`down-speed`; strip `fingerprint`
 *   - tuic: force `version=5`; strip mihomo-only tuning fields
 *   - wireguard: `persistent-keepalive`→`keepalive`; strip `allowed-ips`/`remote-dns-resolve`/`peer-public-key`
 *   - socks: `socks`→`socks5`; strip `sni`/`fingerprint`
 *   - vless/vmess/trojan: `grpc-opts.serviceName`→`grpc-service-name`; strip mihomo-only fields
 *   - smux stripped from ALL protocols (no Stash docs)
 *
 * Protocol support is declared in `core/src/utils/protocol-registry.ts`
 * (`KERNEL_PROTOCOL_SUPPORT`). Returns `null` for genuinely unsupported types.
 *
 * Stash supports tailscale as a regular proxy (unlike sing-box, which treats
 * it as an endpoint), so tailscale passes through with stash-specific strips.
 */
export const toStashOutbound = makeKernelOutbound("stash");
