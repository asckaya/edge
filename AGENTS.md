# AGENTS.md — AI 代码助手上下文文档

本文件为 AI 代码助手提供项目上下文，帮助快速理解代码库并生成正确的修改。

## 项目概述

**Edge** 是一个部署在 Cloudflare Workers 上的代理订阅转换器。用户通过 URL 参数传入机场订阅和自建节点，Worker 返回一份完整的 Clash YAML 配置。

支持三种输出类型：
- **Mihomo / Clash Meta**（桌面端，完整功能）
- **Stash**（iOS 完整版）
- **Stash Mini**（iOS 内存优化版，目标 <50 MB Network Extension）
- **Web UI**（基于 Next.js 的图形界面，部署在根路径）

---

## 核心入口

### `functions/[[path]].ts`

Cloudflare Pages Function 主文件，处理所有 HTTP 请求。
- **根路径 (`/`)**：
    - 如果带有参数：Subscription API，通过 URL 参数生成配置。
    - 如果无参数：通过 `context.next()` 回退到 Web UI 静态资源。
- **注意**：不再使用独立的 Worker，静态资源由 Cloudflare Pages 自动服务。

**关键参数：**
- `type`：`mihomo`（默认）/ `stash` / `stash-mini`
- `secret`：Mihomo external-controller 密码
- `[ProviderName]=URL`：机场订阅
- `proxies`：自建节点 URI 字符串

**模板选择逻辑：**
```typescript
const isStash     = configType === 'stash';
const isStashMini = configType === 'stash-mini';

const tplGroupsHeader  = isStashMini ? configStashMiniGroupsHeader  : isStash ? configStashGroupsHeader  : configMihomoGroupsHeader;
const tplGroupsMid     = isStashMini ? configStashMiniGroupsMid     : isStash ? configStashGroupsMid     : configMihomoGroupsMid;
const tplRuleProviders = isStashMini ? configStashMiniRuleProviders : configRuleProviders;
const tplRules         = isStashMini ? configStashMiniRules         : configRules;
```

**YAML 最终拼接顺序：**
```
tplHeader → proxy-providers → proxies → groupsHeader → Self-Hosted → 动态分组 → groupsMid → tplFooter → tplRuleProviders → tplRules
```

---

## 模板系统

### `templates/shared/`

Mihomo 和 Stash **完整版**共用的规则集，不要在这里做 iOS 专属优化。

| 文件 | 说明 |
|---|---|
| `rule-providers.ts` | **67 个** rule-providers（含 `private-ip` 聚合 IP 库） |
| `rules.ts` | 与 providers 对应的路由规则，**优先级**：端口拒绝/直连 > 局域网 > 国内直连 > 核心服务 > AI > 流媒体 > 社交 > 游戏 > 云/其他 > 兜底 |

**规则排列原则：** REJECT/DIRECT（DST-PORT、IP-CIDR）在最顶部；`geolocation-cn` 在所有代理规则之前；`geolocation-!cn` 作为非中文流量兜底；`MATCH` 最后。

### `templates/mihomo/`

| 文件 | 说明 |
|---|---|
| `header.ts` | tun、external-controller、geodata-mode、find-process-mode 等 |
| `groups.ts` | 含 `🔗 节点链`（dialer-proxy 链式）的完整分组，共 **26 个**策略组 |
| `footer.ts` | DNS + sniffer（含 QUIC） + profile |

### `templates/stash/`

| 文件 | 说明 |
|---|---|
| `header.ts` | 简化版 header（无 tun/external-controller） |
| `groups.ts` | 含 `🏮 入口节点` + `🛫 出口节点` 链式分组，共 **26 个**策略组 |
| `footer.ts` | Stash 专属 DNS（`geosite:` 语法），无 sniffer |

### `templates/stash/mini/`

**iOS 内存优化版，目标 <50 MB Network Extension。**

| 文件 | 内容 |
|---|---|
| `rule-providers-mini.ts` | **17 个** providers（完整版 66 个） |
| `rules-mini.ts` | 与 17 个 provider 对应的路由规则 |
| `groups-mini.ts` | **17 个**策略组（完整版 26 个） |

**Mini 保留的 17 个 providers：**
`advertising`, `category-ai-chat-!cn`, `youtube`, `category-entertainment@!cn`,
`category-voip`, `category-social-media-!cn`, `apple`, `google`, `microsoft`,
`category-dev`, `category-games-!cn`, `cloudflare`, `private`,
`geolocation-cn`, `geolocation-!cn`, `cn`, `cn-ip`

> ℹ️ `cn-ip`（`behavior: ipcidr`）是必要保留的 GeoIP 规则——腾讯会议等 CN App 媒体流量会直接走国内 IP，域名规则覆盖不到。

---

## 模板占位符

| 占位符 | 替换内容 |
|---|---|
| `{{PROVIDERS_LIST}}` | 所有 proxy-provider 名称，逗号分隔 |
| `{{AUTO_GROUPS_LIST}}` | 所有 `⚡ xxx 自动选择` 组名，逗号分隔 |
| `{{SELF_HOSTED_GROUP}}` | `Self-Hosted`（无自建节点时为空） |
| `{{SECRET}}` | Mihomo external-controller 密码 |

`fillPlaceholders()` 方法会同时清理空占位符产生的多余逗号 `", ]"` → `"]"`。

---

## 工具脚本

### `gen-url.ts`

从 `proxy.yaml` 读取配置，生成 Worker 订阅 URL。

```bash
bun gen-url.ts                    # 默认 mihomo
bun gen-url.ts --type stash       # Stash 完整版
bun gen-url.ts --type stash-mini  # Stash Mini
```

支持的协议：`hysteria2`（含端口跳跃）、`vless`、`trojan`、`ss`、`vmess`。
自建节点配置需符合 `functions/_src/types.ts` 中的 Zod 架构（使用 `type` 而非 `protocol`，`skip-cert-verify` 而非 `insecure`）。

### Tests

本地验证 Worker 逻辑，对 `mihomo`、`stash`、`stash-mini` 三种类型进行自动化测试，确保无引用错误，并输出 `output-{type}.yaml`。

```bash
bun test
```

---

## Rule Provider 设计原则

1. **优先使用 `category-*` 聚合集**，而非单独品牌 provider。
2. **单独 provider 只在以下情况保留：**
   - 需要 DNS `nameserver-policy` 精确匹配（仅 Mihomo，如 `openai`、`anthropic` 等 AI 提供商）
   - 所属 category 不存在（如流媒体：`netflix`、`disney`、`hbo`、`hulu`、`primevideo` 无聚合 category）
   - 需要独立路由到不同策略组（如 `appletv` 独立于 `apple`）
3. **IP 规则（`behavior: ipcidr`）不可被域名规则替代**：
   - 域名规则只匹配 hostname，IP 规则匹配目标 IP 地址，两者完全不同维度
   - `telegram-ip`、`google-ip`、`netflix-ip`、`twitter-ip`、`cloudflare-ip`、`cn-ip` 都必须保留
  - **私有网络优化**：硬编码的 `10.x/100.x` IP 段已合并入 `private-ip` rule-provider，统一维护
4. **Mini 版额外原则**：删除所有在 iOS 上不常用或已被 category 兜底的 provider，宁可走 `geolocation-!cn` 兜底也不占内存。
5. **STUN 策略**：为保证 EasyTier/Tailscale 等 VPN 的 P2P 打洞质量，默认**不拦截** 3478/3479 等 STUN 端口。

---

## 策略组说明（完整版）

| 组名 | 默认动作 | 说明 |
|---|---|---|
| 🚀 节点选择 | 代理 | 主选择组 |
| 🔗 节点链 / 🏮 入口 / 🛫 出口 | — | 多跳链路（Mihomo: dialer-proxy；Stash: 手动链） |
| 🛑 广告拦截 | REJECT | 广告域名 |
| 💬 AI 服务 | 代理 | OpenAI/Claude/Gemini 等 |
| 📹 油管视频 | 代理 | YouTube |
| 🎬 流媒体 | 代理 | Netflix/Disney+/HBO/Hulu/Prime/TikTok 等 |
| 📲 电报消息 | 代理 | Telegram/Discord/WhatsApp/Zoom 等 |
| 🌐 社交媒体 | 代理 | Twitter/Facebook/Instagram/Reddit 等 |
| 🐱 开发工具 | 代理 | GitHub/npm/PyPI/GitLab/Docker 等 |
| Ⓜ️ 微软服务 | 代理 | 含 OneDrive/Office/Azure/Teams |
| 🍏 苹果服务 | 代理 | App Store/iCloud 等 |
| 🎬 苹果视频 | 代理 | Apple TV+ |
| 🔍 谷歌服务 | 代理 | Google 全服务 |
| 🎮 游戏平台 | 代理 | Steam/EA/Riot/Blizzard 等境外游戏 |
| 📚 教育资源 | 代理 | arXiv/Coursera/学术搜索等 |
| 🛠️ 生产力工具 | 代理 | TeamViewer/AnyDesk/1Password/Bitwarden 等 |
| 💰 金融服务 | 代理 | PayPal/Coinbase/Binance 等 |
| 📰 新闻资讯 | 代理 | TechCrunch/The Verge/境外新闻 |
| 🔞 成人内容 | 代理 | — |
| 🧲 BT/PT | 漏网之鱼 | 可切换为 DIRECT（国内 PT）或 REJECT |
| ☁️ 云服务 | 代理 | Cloudflare/Dropbox/Mega |
| 🔒 国内服务 | DIRECT | CN 域名 + 杀毒更新 + Windows Update |
| 🏠 私有网络 | DIRECT | 由 `private-ip` (IP) + `private` (Domain) 共同接管 |
| 🌐 非中国 | 代理 | geolocation-!cn 兜底 |
| 🐟 漏网之鱼 | 代理 | MATCH 最终兜底 |

---

## 常见修改场景

### 添加新 rule-provider（完整版）

1. 在 `templates/shared/rule-providers.ts` 的对应分类下添加 provider 定义
2. 在 `templates/shared/rules.ts` 添加对应 `RULE-SET` 规则（注意放在合适的优先级位置）
3. 如需新分组，在 `templates/stash/groups.ts` 和 `templates/mihomo/groups.ts` 同步添加

### 添加新 rule-provider（mini 版）

1. 在 `templates/stash/mini/rule-providers-mini.ts` 添加
2. 在 `templates/stash/mini/rules-mini.ts` 添加对应规则
3. 如需新分组，在 `templates/stash/mini/groups-mini.ts` 添加

### 修改 DNS 配置

- Mihomo：`functions/_templates/mihomo/footer.ts`（支持 `rule-set:` 语法）
- Stash：`functions/_templates/stash/footer.ts`（使用 `geosite:` 语法，不支持 `rule-set:`）

### 添加新配置类型

1. 在 `functions/_templates/` 下创建新目录和文件
2. 在 `functions/[[path]].ts` 顶部添加 import
3. 在 `functions/[[path]].ts` 的逻辑中加入新类型
4. 在 `gen-url.ts` 的 `validTypes` 数组和 `modeLabels` 中注册
