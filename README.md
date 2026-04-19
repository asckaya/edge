# Edge — Clash 订阅转换器

基于 Cloudflare Workers 的代理订阅转换器，支持 Mihomo（Clash Meta）、Stash iOS 与 sing-box。

## 功能

- **多订阅合并**：将多个机场订阅合并为一份配置，每个订阅独立 `proxy-provider`
- **自建节点**：支持在 `proxy.yaml` 中直接写 URI，自动解析为 Clash 格式
- **四种配置模式**：Mihomo / Stash iOS / Stash iOS Mini（<50 MB）/ sing-box JSON
- **节点链（Relay）**：通过 `🏮 入口节点 → 🛫 出口节点` 实现多跳中转
- **精细分流**：67 条 rule-set，按 AI / 流媒体 / 社交 / 开发工具 / 游戏 / 金融等分组路由
- **VPN 友好**：针对 EasyTier / Tailscale 优化，支持 P2P 打洞、Magic DNS 及私网地址自动排除

## 快速开始

### 1. 配置

```bash
cp example.yaml proxy.yaml
# 编辑 proxy.yaml，填写 worker 地址、订阅 URL 和自建节点
```

### 2. 生成订阅 URL

```bash
bun gen-url.ts                    # Mihomo / Clash Meta（默认）
bun gen-url.ts --type stash       # Stash iOS 完整版
bun gen-url.ts --type stash-mini  # Stash iOS 内存优化版（<50 MB）
bun gen-url.ts --type sing-box    # sing-box 1.13+ JSON 配置
```

### 3. 部署 Worker

```bash
npx wrangler deploy
```

## Worker URL 参数

| 参数 | 必填 | 说明 |
|---|---|---|
| `type` | 否 | `mihomo`（默认）/ `stash` / `stash-mini` / `sing-box` |
| `secret` | 否 | Mihomo external-controller 密码 |
| `[ProviderName]` | 至少一个 | 订阅 URL，例如 `Airport1=https://...` |
| `proxies` | 否 | 自建节点 URI (yaml 格式或 URI)，更多详情请查看 `example.yaml` |
| `skip-cert-verify` | 否 | 跳过证书验证（`true` / `false`，默认 `false`） |

**原生 API 调用示例：**
```
https://your-worker.workers.dev/?type=stash-mini&secret=xxx&Airport1=https://sub.example.com/token
```

### 🌍 可视化 Web UI (Next.js)
直接在浏览器中访问部署好的 Worker 下的 `/ui` 目录（如 `https://your-worker.workers.dev/ui`），即可打开 **Edge Subscription Generator** 图形界面。您可以直接在页面中：
1. 添减订阅源 URL。
2. 使用智能表单（React Node Builder）通过协议模板动态拼接 `VLESS, VMess, TUIC, Hysteria2, Trojan, Shadowsocks, Wireguard` 等格式节点并防止语法错误。
3. 一键生成支持各类客户端配置模板拼接的 Final URL，并自动复制入剪贴板。

## 配置模式对比

| 模式 | Rule Providers | Proxy Groups | 适用场景 |
|---|---|---|---|
| `mihomo` | 67 | 26 | 桌面端 Mihomo / Clash Meta |
| `stash` | 67 | 26 | iOS Stash（内存充足） |
| `stash-mini` | **17** | **17** | iOS Stash（Network Extension <50 MB） |
| `sing-box` | Remote rule-set | Selector / URLTest | sing-box 1.13+ 图形客户端 |

`sing-box` 模式使用 `MetaCubeX/meta-rules-dat@sing` 的 remote `geosite/geoip` `.srs` 规则集，而不是 Mihomo 的 `rule-provider` YAML。

### stash-mini 精简内容

相比完整版，mini 版删除了以下 rule-provider（流量均由 `geolocation-!cn` 兜底代理）：

- Windows 遥测 / 更新（iOS 无关）
- AI 子品牌（openai/anthropic/gemini 等，由 `category-ai-chat-!cn` 覆盖）
- AI 编辑器（cursor/windsurf/trae/manus 等）
- 开发细分（container/jetbrains/gitlab，由 `category-dev` 覆盖）
- 流媒体细分（netflix/disney/hbo/hulu/primevideo，由 `geolocation-!cn` 兜底）
- 生产力工具（tutanota/密码管理器/远程控制）
- 金融 / 加密货币 / 新闻 / 成人 / BT-PT / 测速 / NTP

## 项目结构

```
.
├── index.ts                          # Worker 入口（路由 & 模板组装）
├── gen-url.ts                        # 本地 URL 生成工具
├── tests/
│   └── local.test.ts                 # 本地测试脚本
├── example.yaml                      # 配置文件模板
├── proxy.yaml                        # 你的本地配置（gitignored）
├── templates/
│   ├── shared/
│   │   ├── rule-providers.ts         # 66 个 rule-providers（Mihomo & Stash 共用）
│   │   └── rules.ts                  # 路由规则
│   ├── mihomo/
│   │   ├── header.ts                 # Mihomo 专属头部配置
│   │   ├── groups.ts                 # Mihomo proxy-groups（26 个）
│   │   └── footer.ts                 # Mihomo DNS & sniffer
│   └── stash/
│       ├── header.ts                 # Stash 专属头部配置
│       ├── groups.ts                 # Stash proxy-groups（26 个）
│       ├── footer.ts                 # Stash DNS 配置
│       └── mini/
│           ├── rule-providers-mini.ts # 17 个 rule-providers
│           ├── rules-mini.ts          # 精简路由规则
│           └── groups-mini.ts         # 17 个 proxy-groups
└── wrangler.toml                     # Cloudflare Workers 配置
```

## 本地开发

```bash
bun install
bun test tests/local.test.ts        # 生成各平台 output-{type}.yaml 并验证一致性
npx wrangler dev         # 本地启动 Worker（监听 localhost:8787）
```
