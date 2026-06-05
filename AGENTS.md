# Edge Engine — AI Assistant Reference (AGENTS.md)

This document provides a highly consolidated, zero-fluff context reference for AI code assistants working on the Edge project.

---

## 1. Core Architecture (Registry-Driven)

All routing, rules, and layout configurations are governed by central registry components:

- **Rules Registry (`rules-registry.ts`)**:
  - `GEOX_CATEGORIES`: The single source of truth for categories (rulesets/tags/matching logic).
  - `ROUTE_RULES`: Connects traffic classes to specific outbound group templates.
- **Group Builders & Constants (`group-builder.ts` / `shared-constants.ts`)**:
  - `SCENARIO_GROUPS`: Defines scenario outbounds (e.g. AI, Media, Dev) dynamically rendered across all target kernels.
  - `CORE_GROUPS`: Core routing targets (Proxy, Direct, Reject).

---

## 2. Kernel Features & Orchestration Modes

The system operates across 3 target kernels with 4 orchestration depth settings (12 total permutations):

| Mode | Behavior |
|---|---|
| `*-full` | Granular routing across all 20+ scenario-specific outbounds. |
| `*-dual` | Consolidates all foreign scenario outbounds into a single `🚀 节点选择` group (Recommended). |
| `*-white` | Domestic-first: Proxies only defined rules; everything else defaults to `DIRECT`. |
| `*-black` | Proxy-first: Directs only domestic rules; everything else defaults to proxies. |

### Single Subscription Optimization:
- **Multiple Subscriptions**: Renders independent `[Airport]` and auto-select groups per provider.
- **Single Subscription**: Bypasses airport-named groups entirely. Provider nodes are injected directly into `🚀 节点选择` and auto-select groups.

---

## 3. Core Principles & Platform Specifics

- **Stash / Mihomo**: Templates reside in `functions/_templates/` (YAML based).
- **sing-box**: Configurations are generated programmatically (TS object) in `functions/_src/utils/sing-box/`. Supports `isMinimal` (removes extra group tabs to fit 50MB extension limits) and automatic `.srs` rule-set mapping.
- **GeoX Rules**: Native `GEOSITE` / `GEOIP` preferred. Explicitly keep `cn-ip` and `private-ip` with `no-resolve` on to prevent DNS leaks.
- **Custom Protocols**: Supports `tailscale` and `hysteria2` alongside basic VMess/VLESS/SS/Trojan nodes.
- **UTF-8 / Unicode**: Emoji flag extraction uses native regex `/\p{Regional_Indicator}{2}/u`. Node parsing/building uses standard `Buffer.from(..., 'base64')` (do NOT use `atob`/`btoa` as they crash on UTF-8 characters).

---

## 4. Scripts, Commands & Testing

- **`package.json` Commands**:
  - `pnpm dev`: Simulates Cloudflare Pages environment (Wrangler).
  - `pnpm dev:local`: Runs the Next.js Web UI wrapper.
  - `pnpm local [--type <type>] [--output <file>]`: Runs local preview generator (`yaml-to-config.ts`).
  - `pnpm gen [--type <type>] [--gh-proxy <url>]`: Generates URL parameter preview (`gen-url.ts`).
  - `pnpm test`: Runs entire Vitest suite (`tests/`).
  - `pnpm vitest tests/mihomo/kernel.test.ts`: Runs Mihomo bare kernel verification test.

- **Test Layout**:
  - `tests/mihomo/`, `tests/stash/`, `tests/sing-box/`: Kernel configuration validation tests.
  - `tests/common/`: Unit tests for parser, builders, and routing core.
