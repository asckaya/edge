import { makeKernelOutbound } from "../kernel-field-tables";

/**
 * Unified mihomo outbound builder.
 *
 * Converts a canonical `LooseProxyNode` (kebab-case, post-`coerceProxyNode`)
 * into a mihomo-compatible YAML object. Mihomo and the canonical node share
 * the same field naming (kebab-case), so this is a near-identity transform
 * with output-layer rewrites/strips. Per-protocol rules live in
 * `core/src/utils/kernel-field-tables.ts` (`KERNEL_PROTOCOL_RULES`).
 *
 * Applied rewrites (see the table for full detail):
 *   - `socks` → `socks5` (mihomo socks outbound type)
 *   - `wireguard.preshared-key` → `pre-shared-key` (mihomo doc field name)
 *   - `grpc-opts.serviceName` → `grpc-opts.grpc-service-name` (vmess/vless/trojan+grpc)
 *   - Strip sing-box-only fields with no mihomo doc equivalent (snell v6
 *     fields, trusttunnel server-cert-fingerprint, http path).
 *
 * Protocol support is declared in `core/src/utils/protocol-registry.ts`
 * (`KERNEL_PROTOCOL_SUPPORT`). Returns `null` for genuinely unsupported types;
 * callers should `.filter(Boolean)`.
 */
export const toMihomoOutbound = makeKernelOutbound("mihomo");
