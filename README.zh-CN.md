# Edge Engine — 高级代理订阅编排引擎

> **English** · [README.md](./README.md)

基于 Cloudflare Workers 的 Worker-first 订阅转换引擎，为 **Mihomo (Clash Meta)**、**Stash (iOS)**、**sing-box** 生成极致优化的分流配置，支持自建节点注入与多机场合并。

## 🌟 核心特性

- **十二种编排模式** — Mihomo / Stash / sing-box，每种内核均支持 **Full (完整)**、**Dual (双模)**、**White (白名单)**、**Black (黑名单)** 四种规则深度。
- **单订阅分组优化** — 检测到单订阅时自动隐藏冗余分组，将节点直接注入核心选择器，提供极简 UI 体验。
- **Native GeoX 优先** — 弃用外部 `rule-provider` YAML，完全基于 `GEOSITE` / `GEOIP` 匹配，内存占用大幅降低，启动速度提升约 80%。
- **iOS 内存优化** — 针对 Stash 的 50MB Network Extension 限制提供 Minimal 版本，防止崩溃。
- **节点自动重命名** — 订阅节点按国家/地区旗帜 emoji + 机场名 + 序号自动重命名，UI 整洁。
- **Web UI & API 一体化** — TanStack Start SSR 前端 + Hono API，统一由 `src/server.ts` 入口分发。
- **120FPS 视觉特效** — 3D 卡片悬浮与聚光灯特效通过原生 CSS 变量直控 DOM，摆脱 React 重绘开销。
- **短链服务** — 基于 Cloudflare KV 的短链 API，支持自定义固定短链（管理员鉴权）、访问密钥、TTL 过期；短链目标内核无关——访问时可通过 `type` / `mode` 查询参数覆盖，一个短链服务所有内核客户端。
- **18 种协议** — vless、vmess、ss、trojan、wireguard、hysteria2、tuic、tailscale、anytls、socks、http、snell、juicity、naive、masque、mieru、trusttunnel、shadowtls。

## 🚀 快速开始

### 部署到 Cloudflare Workers

1. Fork 本仓库。
2. 执行 `pnpm install`。
3. 在 `wrangler.toml` 中配置 `EDGE_KV`（KV 命名空间）和 `EDGE_ADMIN_KEY`（可选，短链管理员鉴权）。
4. 执行 `pnpm deploy`（构建 + `wrangler deploy`）。
5. 访问你的 `*.workers.dev` 域名打开可视化 UI。

### 通过 API 生成订阅

| 参数 | 必填 | 说明 |
|---|---|---|
| `type` | 否 | 配置格式：`mihomo`、`stash`、`sing-box`。未传时根据客户端 UA 自动判断 |
| `mode` | 否 | 分流模式：`full`、`dual`、`white`、`black`（默认 `full`） |
| `secret` | 否 | 控制面板/API 访问密码（默认 `edge-default`） |
| `proxies` | 否 | 自建节点 URI（每行一个，支持 18 种协议） |
| `gh_proxy` | 否 | GitHub 规则源加速前缀（例如 `https://mirror.ghproxy.com/`） |
| `[SubName]` | 至少一个 | 机场订阅，例如 `Airport1=https://sub.url` |

**示例：**
```text
https://your-edge.workers.dev/?type=mihomo&mode=dual&secret=xxx&MySub=https://机场链接
```

省略 `type` 时会根据 `User-Agent` 忽略大小写自动识别：

- 包含 `clash` 或 `mihomo` → Mihomo
- 包含 `stash` → Stash
- 包含 `sing-box` 或 `singbox` → sing-box
- 无法识别 → 默认 Mihomo

旧格式（例如 `type=mihomo-dual`）仍然兼容。

## 📊 配置模式对比

| 模式 | 路由逻辑 | 适用场景 |
|---|---|---|
| `full` | 精细化分流 | 全量 20+ 规则组，覆盖 AI / 媒体 / 开发 / 金融等细分领域 |
| `dual` | 双模分流（推荐） | 全量规则，国外场景合并为统一"节点选择"，BT/PT 强制直连防封号 |
| `white` | 白名单（直连优先） | 仅代理明确定义的国外规则，其余兜底 `DIRECT`，适合省流 |
| `black` | 黑名单（代理优先） | 仅直连明确定义的国内规则，其余兜底代理，追求极致代理覆盖 |

### 支持内核
- `mihomo` · `stash` · `sing-box`（v1.14+）

## 🛠️ 项目结构

```text
.
├── core/                         # Hono 后端（运行在 CF Workers）
│   ├── [[path]].ts               # 主 Hono 应用：配置渲染 + 请求分发
│   ├── src/
│   │   ├── types.ts              # Valibot 协议 Schema（18 种）+ 请求参数
│   │   ├── env.ts                # Cloudflare 环境绑定（ASSETS / EDGE_KV / EDGE_ADMIN_KEY）
│   │   ├── routes/
│   │   │   └── shortlink.ts      # 短链 API（KV 后端，sValidator）
│   │   └── utils/
│   │       ├── rules/            # 规则注册中心（分类、规则集、路由规则、模式操作）
│   │       ├── mihomo/           # Mihomo/Stash 配置构建器
│   │       ├── sing-box/         # sing-box 配置构建器（v1.14+）
│   │       ├── proxy-protocol-parsers.ts   # 18 种协议 URI 解析器
│   │       ├── proxy-builder.ts            # 18 种协议 URI 构建器（反向）
│   │       ├── proxy-node.ts               # 节点规范化（snake_case → kebab-case）
│   │       ├── protocol-registry.ts        # 协议 × 内核支持矩阵
│   │       ├── kernel-field-tables.ts      # Mihomo/Stash 字段重写规则
│   │       ├── subscription-parser.ts      # 订阅解析（base64/YAML/sing-box/缓存）
│   │       ├── config-target.ts            # 请求参数规范化 + UA 推断
│   │       └── shared-constants.ts         # 组标签、网络常量、地区定义
│   └── templates/                # 配置模板（TS 模板字符串）
│       ├── mihomo/ · stash/ · shared/
├── src/                          # TanStack Start 前端（Vite + SSR on CF Workers）
│   ├── server.ts                 # Worker 入口：Hono app + fallback 到 TanStack handler
│   ├── router.tsx                # createRouter + getRouter（类型注册）
│   ├── app/                      # 路由（__root.tsx, index.tsx）
│   ├── components/               # ActionBox, NodeModal, SubscriptionPanel, RoutingFlow, home/, node-modal/
│   └── lib/                      # build-url, node-uri, subscriptions, base64, protocol-support
├── scripts/
│   ├── gen-url.ts                # URL 参数预览（`pnpm gen`）
│   ├── yaml-to-config.ts         # 本地配置生成器（`pnpm local`）
│   ├── gen-short.ts              # 短链 CRUD CLI（`pnpm short`）
│   └── lib/                      # 共享脚本工具（validate-target, build-target-url）
├── tests/                        # Vitest（25 文件 / 345 测试）
│   ├── _helpers/                 # callWorker, runBareKernelTest, mock-fetch, make-node
│   ├── common/ · mihomo/ · stash/ · sing-box/
├── vite.config.ts                # tailwindcss + cloudflare + tanstackStart + react（React Compiler）
├── wrangler.toml                 # CF Workers 配置（main=src/server.ts, KV, nodejs_compat）
├── biome.json                    # Linter/formatter（严格，noExplicitAny）
└── tsconfig.json                 # TS 6，strict + noUncheckedIndexedAccess 等 9 项
```

## 💻 本地开发

```bash
pnpm install
pnpm dev            # Vite dev server（SSR + HMR）
pnpm build          # 生产构建（prerender / 到 .output/public）
pnpm preview        # 预览生产构建
pnpm test           # 运行全量测试（25 文件 / 345 测试）
pnpm check          # TypeScript 类型检查（tsc --noEmit）
pnpm lint           # Biome 检查
pnpm gen            # 生成 URL 参数预览
pnpm local          # 本地生成配置文件（需要 proxy.yaml）
pnpm short          # 短链管理 CLI
pnpm deploy         # 构建 + wrangler deploy 到 CF Workers
```

Pre-commit hook（husky + lint-staged）会对暂存文件自动执行 `biome check --write`。

---

**Edge Engine** — *Refined, Efficient, and Deterministic.*
