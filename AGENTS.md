# Edge Engine — AI Assistant Reference (AGENTS.md)

This document provides a highly consolidated, zero-fluff context reference for AI code assistants working on the Edge project.

---

## 1. Core Architecture (Worker-First, Registry-Driven)

Single CF Worker entrypoint (`src/server.ts`) routes:

- `/api/*`, `/s/*`, or any request **with query params** → Hono app (`core/[[path]].ts`)
- Everything else (no query: `/`, static assets) → TanStack Start handler (prerendered SSR)

All routing, rules, and layout configurations are governed by central registry components:

- **Rules Registry (`rules-registry.ts`)** is the stable public facade for modules in `utils/rules/`:
  - `categories.ts`: `GEOX_CATEGORIES` and mode-specific allowed tags.
  - `rule-sets.ts`: Derived rule-set definitions shared by every kernel.
  - `route-rules.ts`: `ROUTE_RULES`, connecting traffic classes to outbound groups.
  - `operations.ts`: Mode mapping, referenced-set collection, and Tailscale rewrites.
- **Group Builders & Constants (`group-builder.ts` / `shared-constants.ts`)**:
  - `SCENARIO_GROUPS`: Defines scenario outbounds (e.g. Regional JP/TW/HK/UK, AI, Media, Dev) dynamically rendered across all target kernels.
  - `CORE_GROUPS`: Core routing targets (Proxy, Direct, Reject).
  - Region-first layouts (`jp-first`, `tw-first`, `hk-first`, `gb-first`, `us-first`): Automatically places the corresponding regional node group at the first position in selector outbounds/proxies.
- **Protocol Registry (`protocol-registry.ts`)**:
  - `KERNEL_PROTOCOL_SUPPORT`: 18-entry table mapping protocol → `{mihomo, stash, singbox}` support. Deep-frozen at runtime; covered by a drift-detection test (`tests/common/protocol-registry.test.ts`).
  - Helpers: `isMihomoSupported`, `isStashSupported`, `isSingBoxOutbound`, `isSingBoxEndpoint`, `isSingBoxSupported`, `asProtocolType`, `hasKnownProtocol`.
  - Also imported by the frontend (`src/lib/protocol-support.ts`) to warn users when a protocol is unsupported by the selected kernel — pure data, no CF Workers dependency.
- **Kernel Field Tables (`kernel-field-tables.ts`)**:
  - `makeKernelOutbound(kernel)`: Factory eliminating mihomo/stash duplication via `KERNEL_PROTOCOL_RULES` table (type renames, field renames, nested renames, defaults, strip lists).
  - `applyKernelRules(node, kernel)`: Fast-path returns node as-is if no rule applies; otherwise shallow-copy + apply transforms in order.

---

## 2. Kernel Features & Orchestration Modes

The system operates across 3 target kernels with 4 orchestration depth settings and 2 rule granularity options. Kernel, mode, and rules are separate request parameters:

- `type`: `mihomo`, `stash`, or `sing-box`.
- `mode`: `full`, `dual`, `white`, or `black` (defaults to `full`).
- `rules`: `category` or `granular` (defaults to `category`).

| Mode    | Behavior                                                                                     |
| ------- | -------------------------------------------------------------------------------------------- |
| `full`  | Granular routing across all 20+ scenario-specific outbounds.                                 |
| `dual`  | Consolidates all foreign scenario outbounds into a single `🚀 节点选择` group (Recommended). |
| `white` | Domestic-first: Proxies only defined rules; everything else defaults to `DIRECT`.            |
| `black` | Proxy-first: Directs only domestic rules; everything else defaults to proxies.               |

| Rules      | Behavior                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `category` | Aggregated category rule-sets (`category-ai-chat-!cn`, `category-media`, `category-dev`, etc.) |
| `granular` | Fine-grained per-service rule-sets (`openai`, `twitter`, `spotify`, `github`, `steam`, etc.)   |

### Request Target Resolution:

- Explicit `type` takes precedence over User-Agent detection.
- Without `type`, UA matching is case-insensitive: `clash`/`mihomo` -> `mihomo`, `stash` -> `stash`, `sing-box`/`singbox` -> `sing-box`.
- Unknown UAs default to `mihomo`.
- Legacy combined values such as `type=mihomo-dual` remain supported; new URLs must use `type=mihomo&mode=dual`.

### Single Subscription Optimization:

- **Multiple Subscriptions**: Renders independent `[Airport]` and auto-select groups per provider. sing-box displays groups in Mihomo order: top selectors -> provider selectors -> regions -> scenarios.
- **Single Subscription**: Bypasses airport-named groups entirely. Provider nodes are injected directly into `🚀 节点选择` and auto-select groups.

### Builder Option Shape:

- Both `BuildMihomoOptions` and `BuildSingBoxOptions` use a single `mode: ConfigMode` ('full'|'dual'|'white'|'black') discriminator field. Each builder derives `{ isWhite, isBlack, isDual }` booleans via `configModeFlags(mode)` internally — downstream functions receive these booleans for branch logic.

---

## 3. Core Principles & Platform Specifics

### Engineering Principles:

- **No Backward Compatibility Burden**: Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- **Simplicity First**: Choose the simplest implementation that fully meets current requirements. Avoid speculative abstractions, configuration, and indirection.
- **Layered Growth**: Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- **Modular Architecture**: Keep components modular and concerns clearly separated.
- **Prefer Established Libraries**: Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- **Leverage Existing Dependencies**: Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- **Long-Term Architecture**: Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.

### Tech Stack & Platform Specifics:

- **Frontend**: TanStack Start (Vite + Nitro + TanStack Router) on CF Workers. `src/app/__root.tsx` (root route), `src/app/index.tsx` (`/` route), `src/router.tsx` (createRouter + `getRouter` export for type registration), `src/server.ts` (custom Worker entrypoint). React Compiler enabled via Vite babel plugin. Fonts via `@fontsource-variable/inter` + `outfit`. `@/` alias resolves to `src/` (configured in both `tsconfig.json` paths and `vite.config.ts` resolve.alias — Vite does not read tsconfig paths).
- **Backend**: Hono Worker. `core/[[path]].ts` (main app, ~150 lines), `core/src/routes/shortlink.ts` (5 routes, `@hono/standard-validator` + valibot), `core/src/utils/` (14 files).
- **Stash / Mihomo**: Templates reside in `core/templates/` (YAML based).
- **sing-box**: Configurations are generated programmatically (TS object) in `core/src/utils/sing-box/`. Targets **sing-box v1.14+** (enables `snell`/`naive`/`shadowtls` outbounds; `juicity` is NOT supported by sing-box — stash-only). `wireguard` is NOT emitted as a sing-box outbound — sing-box 1.11+ deprecated the WireGuard outbound (removed in 1.13+), migrating it to the Endpoint system; use `toSingBoxEndpoint` for wireguard instead. Supports `isMinimal` (removes extra group tabs to fit 50MB extension limits) and automatic `.srs` rule-set mapping. gRPC transport no longer emits `multi_mode` (dropped in sing-box v1.14+, auto-detected). h2 network folds to `{type:"http"}` transport (one-way forward, no strict round-trip).
- **GeoX Rules**: Native `GEOSITE` / `GEOIP` preferred. Explicitly keep `cn-ip` and `private-ip` with `no-resolve` on to prevent DNS leaks.
- **Supported Proxy Protocols** (kernel matrix, 18 total):
  - mihomo+stash+sing-box (outbound): `vmess`/`vless`/`ss`/`trojan`/`hysteria2`/`tuic`/`socks`/`http`/`anytls`/`snell`.
  - mihomo+stash only (not sing-box outbound): `wireguard` (sing-box v1.14+ migrated to Endpoint), `tailscale`, `trusttunnel`.
  - mihomo-only: `masque`, `mieru`.
  - sing-box-only: `naive`, `shadowtls`.
  - stash-only: `juicity`.
  - URI schemes invented for protocols lacking official specs: `snell://`, `masque://`, `mieru://`, `trusttunnel://`, `shadowtls://`, `juicity://`, `naive+https://`/`naive+quic://`.
- **UTF-8 / Unicode**: Emoji flag extraction uses native regex `/\p{Regional_Indicator}{2}/u`. Node parsing/building uses standard `Buffer.from(..., 'base64')` (do NOT use `atob`/`btoa` as they crash on UTF-8 characters).
- **Linting/Formatting**: Biome 2.5 (`biome.json`), strict config — `noExplicitAny` is a global error (no overrides), `noNonNullAssertion` is warn. Pre-commit hook (husky + lint-staged) runs `biome check --write` on staged files.
- **TypeScript**: TS 6, `strict: true` + 9 strict options including `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`.

---

## 4. Scripts, Commands & Testing

- **`package.json` Commands**:
  - `vpr dev` / `pnpm dev`: Vite dev server (SSR + HMR; `vpr` is Vite-Plus's script runner interface).
  - `vpr build` / `vp build`: Vite production build (prerenders `/` and `/GUIDE.md` to `.output/public`).
  - `vpr preview` / `vp preview`: Preview the production build.
  - `vpr deploy` / `pnpm deploy`: `vp run build && wrangler deploy` to CF Workers.
  - `vpr local` / `vp local [--type <type>] [--mode <mode>] [--rules <rules>] [--output <file>]`: Local config generator (`scripts/yaml-to-config.ts`, in-process `onRequest` call; needs `proxy.yaml`).
  - `vpr gen` / `vp gen [--type <type>] [--mode <mode>] [--rules <rules>] [--gh-proxy <url>]`: URL parameter preview (`scripts/gen-url.ts`).
  - `vpr short` / `vp short`: Short-link CRUD CLI (`scripts/gen-short.ts`, calls `/api/shorten`).
  - `vpr test` / `vp test`: Runs entire Vitest suite (26 files / 360 tests).
  - `vpr check` / `vp check`: Unified static analysis (format, lint, and type check).
  - `vpr lint` / `vp lint`: Oxlint code linter.
  - `vpr fmt` / `vp fmt`: Oxfmt code formatter.
  - `vp cf-typegen`: Generate CF Workers types via `wrangler types`.
  - `vpr test tests/mihomo/kernel.test.ts`: Runs a specific test file.

- **Test Layout**:
  - `tests/_helpers/`: Shared test helpers — `callWorker(url, ua?, env?)` (Hono `app.request` wrapper), `runBareKernelTest(options, type)` (binary validation harness), `createKernelMockFetch({dnsIp?})` (shared fetch mock), `makeNode(partial)` (node fixture factory).
  - `tests/common/`: Unit tests — parser, builder, coerce-mappings, URI round-trip, config-target, base64, subscriptions, subscription-cache, operations (rules-registry drift detection), protocol-registry (drift detection), protocol-support (frontend kernel-support warnings), shortlink (auth/CRUD/TTL).
  - `tests/mihomo/`, `tests/stash/`, `tests/sing-box/`: Kernel configuration validation tests (outbounds, groups, bare-kernel `check`, round-trip).
  - Fetch mocking standardized on `vi.stubGlobal('fetch', ...)` + `afterEach(vi.unstubAllGlobals)`; `unstubGlobals: true` in `vitest.config.ts`.
  - `vitest.config.ts`: environment `node`, v8 coverage, `unstubGlobals: true`.

- **Short-link API (`core/src/routes/shortlink.ts`)**:
  - 5 routes: `POST /api/shorten` (nanoid slug, custom slug requires `x-admin-key`, validated via `sValidator('json', ShortenRequestSchema)`), `GET /s/:slug` (302 redirect, access-key fail returns 404 to hide existence, query params merge into stored target), `GET /api/expand/:slug`, `PUT /api/shorten/:slug` (admin, `sValidator`), `DELETE /api/shorten/:slug` (admin).
  - KV key prefix `sl:`. Kernel-agnostic target storage — one short link serves all kernels via UA/query override at access time.

---

## 5. Key File Locations

- **Backend entry**: `core/[[path]].ts` (Hono app + Pages Function `onRequest`).
- **Worker entry**: `src/server.ts` (routes to Hono app or TanStack Start handler).
- **Types/Schemas**: `core/src/types.ts` (valibot schemas for 18 protocols + `RequestParamsSchema`), `core/src/env.ts` (`EdgeEnv` bindings).
- **Protocol support matrix**: `core/src/utils/protocol-registry.ts`.
- **Field rewrite rules**: `core/src/utils/kernel-field-tables.ts`.
- **Frontend protocol warnings**: `src/lib/protocol-support.ts`.
- **Config**: `vite.config.ts`, `wrangler.toml` (main=`src/server.ts`, `[assets]` directory=`.output/public` binding=`ASSETS`, KV `EDGE_KV`, `nodejs_compat`), `tsconfig.json`, `biome.json`.
