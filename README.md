# Edge Engine — Advanced Proxy Subscription Orchestrator

基于 Cloudflare Pages 的分布式订阅转换引擎，支持 Mihomo (Clash Meta)、Stash iOS 与 sing-box。通过自建节点注入与多机场合并，生成极致优化的分流配置。

## 🌟 核心特性

- **九种编排模式**：Mihomo / Stash / sing-box，每种内核均支持 **Full (完整)**、**Mini (白名单)**、**Micro (黑名单)** 三种规则深度。
- **Native GeoX 优先**：弃用传统的外部 `rule-provider` YAML，完全基于 `GEOSITE` 和 `GEOIP` 匹配，大幅降低内存占用，启动速度提升 80%。
- **极致内存优化**：针对 iOS Stash 的 50MB 内存限制，提供 Mini/Micro 版本，防止 Network Extension 崩溃。
- **节点自动重命名**：订阅节点自动按国家/地区图标 + 机场名 + 序号进行重命名，确保 UI 整洁。
- **Web UI & API 一体化**：部署在根路径的 Next.js 图形界面，支持可视化节点构建与订阅生成。

## 🚀 快速开始

### 1. 部署到 Cloudflare Pages

1. Fork 本仓库。
2. 在 Cloudflare Dashboard 中创建 Pages 项目。
3. 选择关联 GitHub 仓库，构建设置：
   - **Framework preset**: `Next.js`
   - **Build command**: `pnpm build`
   - **Output directory**: `out`
4. 部署完成后，直接访问你的域名即可打开可视化 UI。

### 2. 使用 API 生成订阅

直接通过 URL 参数调用：

| 参数 | 必填 | 说明 |
|---|---|---|
| `type` | 否 | 见下表 [配置模式对比](#-配置模式对比) (默认 `mihomo`) |
| `secret` | 否 | 控制面板/API 访问密码 (默认 `edge-default`) |
| `proxies` | 否 | 自建节点 URI (支持 vless/vmess/ss/trojan/wireguard/hysteria2/tuic) |
| `gh_proxy` | 否 | GitHub 规则源加速前缀 (例如 `https://mirror.ghproxy.com/`) |
| `[SubName]` | 至少一个 | 机场订阅，例如 `Airport1=https://sub.url` |

**示例 API：**
```text
https://your-edge.pages.dev/?type=mihomo-mini&secret=xxx&MySub=https://机场链接
```

## 📊 配置模式对比

| 模式 | 路由逻辑 | 适用场景 |
|---|---|---|
| `*-full` | **精细化分流** | 全量 60+ 规则组，覆盖 AI/媒体/开发/金融等细分领域。 |
| `*-dual` | **双模分流 (推荐)** | 全量规则，但合并所有国外场景为统一的“节点选择”，简单直接。 |
| `*-mini` | **白名单 (代理优先)** | 全局代理，仅 CN 内容直连。iOS 内存受限设备首选。 |
| `*-micro` | **黑名单 (直连优先)** | 全局直连，仅规则匹配内容代理。极致省流/低功耗。 |

### 支持内核：
- `mihomo`, `mihomo-dual`, `mihomo-mini`, `mihomo-micro`
- `stash`, `stash-dual`, `stash-mini`, `stash-micro`
- `sing-box`, `sing-box-dual`, `sing-box-mini`, `sing-box-micro`

## 🛠️ 项目结构

```text
.
├── functions/
│   ├── [[path]].ts          # Cloudflare Pages API 主路由
│   ├── _src/                # 核心逻辑 (解析器、构建器)
│   └── _templates/          # 配置模板
│       ├── mihomo/          # Mihomo/Stash 核心模板
│       │   ├── full/        # 完整版/双模版规则与分组
│       │   ├── mini/        # 精简版规则与分组
│       │   └── micro/       # 极简版规则
│       ├── stash/           # Stash 特化模板
│       └── shared/          # 跨内核共用资源 (GeoX 注册中心)
├── src/
│   ├── app/                 # Next.js Web UI 页面
│   └── components/          # UI 组件 (NodeBuilder, SubscriptionPanel)
├── tests/
│   └── local.test.ts        # 自动化测试 (Vitest)
└── gen-url.ts               # 本地调试工具
```

## 💻 本地开发

```bash
pnpm install
pnpm dev:local      # 启动本地 Next.js 开发服务器
pnpm dev            # 使用 Wrangler 模拟 Cloudflare Pages 环境
pnpm test           # 运行全量集成测试
```

---

**Edge Engine** — *Refined, Efficient, and Deterministic.*
