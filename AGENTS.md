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

- **Frontend**: TanStack Start (Vite + Nitro + TanStack Router) on CF Workers. `src/app/__root.tsx` (root route), `src/app/index.tsx` (`/` route), `src/app/links.tsx` (`/links` short-link console), `src/router.tsx` (createRouter + `getRouter` export for type registration), `src/server.ts` (custom Worker entrypoint). React Compiler enabled via Vite babel plugin. `@/` alias resolves to `src/` (configured in both `tsconfig.json` paths and `vite.config.ts` resolve.alias — Vite does not read tsconfig paths).
- **Design system**: single source of truth is `src/app/globals.css` — Vercel/Geist tokens (canvas `#fafafa`, ink `#171717`, hairline `#ebebeb`, link `#0070f3`, 6/12/16/64/100px radius scale), light-first with an equivalent `.dark` set, primitives `.eyebrow` / `.card` / `.btn-pill` / `.btn-square(-ghost)` / `.tab-pill` / `.input` / `.code-block` / `.chip` / `.mesh`. Type is **Maple Mono CN for every role** (latin + CJK + code), loaded from jsDelivr (`@chinese-fonts/maple-mono-cn`, unicode-range split, no self-hosting) with Regular + SemiBold only. Theme resolves from `localStorage.theme` else `prefers-color-scheme`, applied pre-paint by the inline bootstrap script in `__root.tsx`. Standalone tool pages share `public/tools.css` (same tokens/classes, `html.dark` variant).
- **Backend**: Hono Worker. `core/[[path]].ts` (main app, ~150 lines), `core/src/routes/shortlink.ts` (5 routes, `@hono/standard-validator` + valibot), `core/src/utils/` (14 files).
- **Stash / Mihomo**: Templates reside in `core/templates/` (YAML based).
- **sing-box**: Configurations are generated programmatically (TS object) in `core/src/utils/sing-box/`. Targets **sing-box v1.14+** (enables `snell`/`naive`/`shadowtls` outbounds; `juicity` is NOT supported by sing-box — stash-only). `wireguard` is NOT emitted as a sing-box outbound — sing-box 1.11+ deprecated the WireGuard outbound (removed in 1.13+), migrating it to the Endpoint system; use `toSingBoxEndpoint` for wireguard instead. Supports `isMinimal` (removes extra group tabs to fit 50MB extension limits) and automatic `.srs` rule-set mapping. gRPC transport no longer emits `multi_mode` (dropped in sing-box v1.14+, auto-detected). h2 network folds to `{type:"http"}` transport (one-way forward, no strict round-trip). Decoder is strict, so field names/values must be exact: ws uses `early_data_header_name`; hy2 `server_ports` entries use `start:end`; tuic emits either `udp_relay_mode` or `udp_over_stream` (never both); the socks outbound has no `tls`; snell accepts only `version` 4 or 6; naive accepts only `server_name`/`certificate`/`ech` inside `tls`.
- **GeoX Rules**: Native `GEOSITE` / `GEOIP` preferred. Explicitly keep `cn-ip` and `private-ip` with `no-resolve` on to prevent DNS leaks.
- **Supported Proxy Protocols** (kernel matrix, 18 total):
  - mihomo+stash+sing-box (outbound): `vmess`/`vless`/`ss`/`trojan`/`hysteria2`/`tuic`/`socks`/`http`/`anytls`/`snell`.
  - mihomo+stash only (not sing-box outbound): `wireguard` (sing-box v1.14+ migrated to Endpoint), `tailscale`, `trusttunnel`, `masque`, `mieru`.
  - sing-box-only: `naive`, `shadowtls`.
  - stash-only: `juicity`.
  - URI schemes invented for protocols lacking official specs: `snell://`, `masque://`, `mieru://`, `trusttunnel://`, `shadowtls://`, `juicity://`, `naive+https://`/`naive+quic://`.
- **REALITY** is not uniform across kernels: `vless`/`vmess`/`trojan` accept `reality-opts` everywhere; **`anytls` + REALITY is sing-box-only** (mihomo states it will never support the combination and silently ignores the field; Stash does not document it). `KERNEL_PROTOCOL_RULES.anytls.strip` therefore drops `reality-opts` for both `mihomo` and `stash`.
- **Kernel field rules are per-kernel data, not guesses**: `KERNEL_PROTOCOL_RULES[kernel]` carries `typeRename`/`fieldRenames`/`nestedRenames`/`defaults`/`strip`/`normalize`. `normalize` exists for strict scalar decoders — mihomo hard-errors on an array `ip` (wireguard/tuic) and on `mieru` setting both `port` and `port-range` or a lowercase `transport`.
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
  - 5 routes: `POST /api/shorten` (nanoid slug, custom slug requires `x-admin-key`, validated via `sValidator('json', ShortenRequestSchema)`), `GET /s/:slug` (302 redirect, access-key fail returns 404 to hide existence, query params merge into stored target), `GET /api/expand/:slug` (returns `{slug, target}`; a key-protected link requires the same `?key=` as the redirect, `x-admin-key` bypasses — knowing the slug alone must never reveal a target), `PUT /api/shorten/:slug` (admin, `sValidator`), `DELETE /api/shorten/:slug` (admin).
  - Read paths share one rule: **the access key gates the target, not the slug**. `/s/:slug` and `/api/expand/:slug` both 404 on a missing/wrong key so existence is never confirmed.
  - KV key prefix `sl:`. Kernel-agnostic target storage — one short link serves all kernels via UA/query override at access time.
  - Lifecycle: ordinary (random-slug) links default to a **90-day sliding TTL** (`ORDINARY_TTL_SECONDS`), renewed at most once per day on access (`RENEW_INTERVAL_MS`) so unused links are GC'd by KV itself. Admin custom slugs stay permanent unless an explicit `ttlSeconds` is passed.
  - Abuse control: `POST /api/shorten` is throttled per client IP (`createWindows`, 20/hour fixed window, `429` + `Retry-After`), per isolate. `resetCreateQuota()` is the test hook.
  - Three independent secrets — never conflate them: **`secret`** (controller password baked into generated configs, visible to every subscriber), **`accessKey`** (`?key=` gate on a short link, shared by the group), **admin key** (`x-admin-key`, custom slug / update / delete only). No key is hard-coded in the frontend; `src/lib/links.ts` keeps the access key in `localStorage` and the admin key in `sessionStorage`.
  - Frontend: `/links` is public (create + lookup); `/links?admin=1` reveals the admin panel (custom slug, update, delete).

---

## 5. Key File Locations

- **Backend entry**: `core/[[path]].ts` (Hono app + Pages Function `onRequest`).
- **Request routing** (`src/server.ts`): `/api/*` and `/s/*` → Hono; `/` **with** query params → Hono (config renderer); **file-like paths** (has an extension, or `/assets/*`) → Cloudflare Assets; everything else → TanStack SSR. Assets must never be consulted for route paths: `[assets].html_handling = "none"` in `wrangler.toml` keeps `/ip.html` canonical, and the worker 308-redirects legacy `/ip` → `/ip.html` (`TOOL_PAGES`). Forwarding Assets' trailing-slash 3xx for routes used to ping-pong with the router and hang prerendering.
- **Router** (`src/router.tsx`): `getRouter()` **creates a new router per request** — a module-level singleton leaked match/redirect state across SSR requests (one canonicalising redirect made later not-found requests redirect instead of 404). `defaultNotFoundComponent` renders `src/components/layout/NotFound.tsx`.
- **Worker entry**: `src/server.ts` (routes to Hono app or TanStack Start handler).
- **Types/Schemas**: `core/src/types.ts` (valibot schemas for 18 protocols + `RequestParamsSchema`), `core/src/env.ts` (`EdgeEnv` bindings).
- **Protocol support matrix**: `core/src/utils/protocol-registry.ts`.
- **Field rewrite rules**: `core/src/utils/kernel-field-tables.ts`.
- **Frontend protocol warnings**: `src/lib/protocol-support.ts`.
- **Short-link console**: `src/app/links.tsx` (page) + `src/lib/links.ts` (storage/API contract).
- **Shared layout**: `src/components/layout/SiteNav.tsx`, `SiteFooter.tsx`, `SectionHead.tsx`.
- **Standalone tool pages**: `public/{ip,dns,webrtc,claude,tools}.html` + `public/tools.css`.
- **Design tokens**: `src/app/globals.css`.
- **Config**: `vite.config.ts`, `wrangler.toml` (main=`src/server.ts`, `[assets]` directory=`.output/public` binding=`ASSETS`, KV `EDGE_KV`, `nodejs_compat`), `tsconfig.json`, `biome.json`.
