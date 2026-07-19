# Edge Engine — Advanced Proxy Subscription Orchestrator

> **中文文档** · [README.zh-CN.md](./README.zh-CN.md)

A worker-first proxy subscription orchestration engine running on Cloudflare Workers. Generates highly optimized routing configs for **Mihomo (Clash Meta)**, **Stash (iOS)**, and **sing-box**, with self-injected nodes and multi-airport merging.

## 🌟 Highlights

- **12 orchestration modes** — Mihomo / Stash / sing-box, each with **Full**, **Dual**, **White**, **Black** rule depths.
- **Single-subscription optimization** — auto-bypasses redundant airport groups, injecting nodes directly into the core selector for a minimal UI.
- **Native GeoX first** — uses native `GEOSITE` / `GEOIP` instead of external `rule-provider` YAML, cutting memory and speeding startup ~80%.
- **iOS memory tuning** — Stash Minimal variant fits the 50MB Network Extension cap.
- **Auto node renaming** — country flag emoji + airport name + index for a tidy UI.
- **Web UI + API in one worker** — TanStack Start SSR frontend + Hono API behind a single `src/server.ts` entrypoint.
- **120fps spotlight/3D effects** — native CSS variable–driven DOM updates, no React re-renders.
- **Short-link service** — Cloudflare KV-backed API with custom slugs (admin-auth), access keys, TTL, and kernel-agnostic targets (one slug serves all kernels via `type`/`mode` query overrides).
- **18 protocols** — vless, vmess, ss, trojan, wireguard, hysteria2, tuic, tailscale, anytls, socks, http, snell, juicity, naive, masque, mieru, trusttunnel, shadowtls.

## 🚀 Quick Start

### Deploy to Cloudflare Workers

1. Fork this repo.
2. Run `pnpm install`.
3. Set `EDGE_KV` (KV namespace) and `EDGE_ADMIN_KEY` (optional, for short-link admin) in `wrangler.toml`.
4. `pnpm deploy` (builds + `wrangler deploy`).
5. Open your `*.workers.dev` domain for the visual UI.

### Generate a subscription via API

| Param | Required | Description |
|---|---|---|
| `type` | no | Config format: `mihomo`, `stash`, `sing-box`. Inferred from `User-Agent` if omitted |
| `mode` | no | Routing mode: `full`, `dual`, `white`, `black` (default `full`) |
| `secret` | no | Dashboard/API password (default `edge-default`) |
| `proxies` | no | Self-hosted node URIs (one per line, any of the 18 protocols) |
| `gh_proxy` | no | GitHub rule-source mirror prefix (e.g. `https://mirror.ghproxy.com/`) |
| `[SubName]` | ≥1 | Airport subscriptions, e.g. `Airport1=https://sub.url` |

**Example:**
```text
https://your-edge.workers.dev/?type=mihomo&mode=dual&secret=xxx&MySub=https://airport.url
```

When `type` is omitted, the UA is matched case-insensitively:

- `clash` / `mihomo` → Mihomo
- `stash` → Stash
- `sing-box` / `singbox` → sing-box
- unknown → Mihomo (default)

Legacy combined values (e.g. `type=mihomo-dual`) still work.

## 📊 Routing modes

| Mode | Behavior | Best for |
|---|---|---|
| `full` | Granular routing | All 20+ rule groups (AI / media / dev / finance / …) |
| `dual` | Consolidated (recommended) | Full rules, foreign scenarios merged into one selector; BT/PT forced direct |
| `white` | Direct-first | Only defined foreign rules proxied; rest falls back to `DIRECT` |
| `black` | Proxy-first | Only defined domestic rules direct; rest falls back to proxies |

### Supported kernels
- `mihomo` · `stash` · `sing-box` (v1.14+)

## 🛠️ Project structure

```text
.
├── core/                         # Hono backend (runs on CF Workers)
│   ├── [[path]].ts               # Main Hono app: config rendering + request dispatch
│   ├── src/
│   │   ├── types.ts              # Valibot schemas (18 protocols) + request params
│   │   ├── env.ts                # Cloudflare bindings (ASSETS / EDGE_KV / EDGE_ADMIN_KEY)
│   │   ├── routes/
│   │   │   └── shortlink.ts      # Short-link API (KV-backed, sValidator)
│   │   └── utils/
│   │       ├── rules/            # Rule registry (categories, rule-sets, route rules, modes)
│   │       ├── mihomo/           # Mihomo/Stash config builders
│   │       ├── sing-box/         # sing-box config builders (v1.14+)
│   │       ├── proxy-protocol-parsers.ts   # 18 protocol URI parsers
│   │       ├── proxy-builder.ts            # 18 protocol URI builders (inverse)
│   │       ├── proxy-node.ts               # Node normalization (snake → kebab)
│   │       ├── protocol-registry.ts        # Protocol × kernel support matrix
│   │       ├── kernel-field-tables.ts      # Mihomo/Stash field-rewrite rules
│   │       ├── subscription-parser.ts      # Subscription parsing (base64/YAML/sing-box/cache)
│   │       ├── config-target.ts            # Request param normalization + UA inference
│   │       └── shared-constants.ts         # Group tags, network consts, region defs
│   └── templates/                # Config templates (TS template strings)
│       ├── mihomo/ · stash/ · shared/
├── src/                          # TanStack Start frontend (Vite + SSR on CF Workers)
│   ├── server.ts                 # Worker entrypoint: Hono app + fallback to TanStack handler
│   ├── router.tsx                # createRouter + getRouter (type registration)
│   ├── app/                      # Routes (__root.tsx, index.tsx)
│   ├── components/               # ActionBox, NodeModal, SubscriptionPanel, RoutingFlow, home/, node-modal/
│   └── lib/                      # build-url, node-uri, subscriptions, base64, protocol-support
├── scripts/
│   ├── gen-url.ts                # URL param preview (`pnpm gen`)
│   ├── yaml-to-config.ts         # Local config generator (`pnpm local`)
│   ├── gen-short.ts              # Short-link CRUD CLI (`pnpm short`)
│   └── lib/                      # Shared script utils (validate-target, build-target-url)
├── tests/                        # Vitest (25 files / 345 tests)
│   ├── _helpers/                 # callWorker, runBareKernelTest, mock-fetch, make-node
│   ├── common/ · mihomo/ · stash/ · sing-box/
├── vite.config.ts                # tailwindcss + cloudflare + tanstackStart + react (React Compiler)
├── wrangler.toml                 # CF Workers config (main=src/server.ts, KV, nodejs_compat)
├── biome.json                    # Linter/formatter (strict, noExplicitAny)
└── tsconfig.json                 # TS 6, strict + noUncheckedIndexedAccess + 7 more
```

## 💻 Local development

```bash
pnpm install
pnpm dev            # Vite dev server (SSR + HMR)
pnpm build          # Production build (prerenders / to .output/public)
pnpm preview        # Preview the production build
pnpm test           # Run all tests (25 files / 345 tests)
pnpm check          # TypeScript type check (tsc --noEmit)
pnpm lint           # Biome check
pnpm gen            # Generate URL param preview
pnpm local          # Generate a config locally (needs proxy.yaml)
pnpm short          # Short-link CRUD CLI
pnpm deploy         # Build + wrangler deploy to CF Workers
```

Pre-commit hook (husky + lint-staged) auto-runs `biome check --write` on staged files.

---

**Edge Engine** — *Refined, Efficient, and Deterministic.*
