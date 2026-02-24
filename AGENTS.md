# AGENTS.md — AI 代码助手上下文文档

本文件为 AI 代码助手提供项目上下文，帮助快速理解代码库并生成正确的修改。

## 项目概述

**Edge** 是一个部署在 Cloudflare Workers 上的代理订阅转换器。用户通过 URL 参数传入机场订阅和自建节点，Worker 返回一份完整的 Clash YAML 配置。

支持两种客户端：
- **Mihomo / Clash Meta**（桌面端）
- **Stash**（iOS，有 Network Extension 内存限制）
- **Web UI**（基于 Next.js 的图形界面）

更多 Web UI 详情见：[web-ui/AGENTS.md](file:///Users/didi/test/web-ui/AGENTS.md)

---

## 核心入口

### `index.ts`

Worker 主文件，处理所有 HTTP 请求。

**关键参数：**
- `type`：`mihomo`（默认）/ `stash` / `stash-mini`
- `secret`：Mihomo external-controller 密码
- `[ProviderName]=URL`：机场订阅
- `proxies`：自建节点 URI 字符串

**模板选择逻辑：**
```typescript
const isStash     = configType === 'stash';
const isStashMini = configType === 'stash-mini';

const tplGroupsHeader   = isStashMini ? configStashMiniGroupsHeader   : isStash ? configStashGroupsHeader   : configMihomoGroupsHeader;
const tplGroupsMid      = isStashMini ? configStashMiniGroupsMid      : isStash ? configStashGroupsMid      : configMihomoGroupsMid;
const tplRuleProviders  = isStashMini ? configStashMiniRuleProviders  : configRuleProviders;
const tplRules          = isStashMini ? configStashMiniRules          : configRules;
```

**YAML 最终拼接顺序：**
```
tplHeader → proxy-providers → proxies → groupsHeader → Self-Hosted → 动态分组 → groupsMid → tplFooter → tplRuleProviders → tplRules
```

---

## 模板系统

### `templates/shared/`

Mihomo 和 Stash **完整版**共用的规则，不要在这里做 iOS 专属优化。

| 文件 | 说明 |
|---|---|
| `rule-providers.ts` | 57 个 rule-providers（domain 类 + GeoIP ipcidr 类，MRS 格式，MetaCubeX/meta-rules-dat） |
| `rules.ts` | 与 providers 对应的路由规则。**优先级：** 核心服务 (MS/Google/Apple) > 遥测拦截 > 开发工具 > AI > 其他 |

### `templates/mihomo/`

| 文件 | 说明 |
|---|---|
| `header.ts` | tun、external-controller、geodata-mode、find-process-mode 等 |
| `groups.ts` | 含 `🔗 节点链`（relay 类型）的完整分组 |
| `footer.ts` | DNS + sniffer（含 QUIC） + profile |

### `templates/stash/`

| 文件 | 说明 |
|---|---|
| `header.ts` | 沿用 mihomo header 的简化版（无 tun/external-controller） |
| `groups.ts` | 含 `🏮 入口节点` + `🛫 出口节点` 的链式分组（无 relay 类型） |
| `footer.ts` | Stash 专属 DNS（geosite: 语法），无 sniffer |

### `templates/stash/mini/`

**iOS 内存优化版，目标 <50 MB Network Extension。**

| 文件 | 内容 |
|---|---|
| `rule-providers-mini.ts` | **16 个** providers（完整版 48 个） |
| `rules-mini.ts` | 与 16 个 provider 对应的路由规则 |
| `groups-mini.ts` | **13 个**静态分组（完整版 24 个） |

**保留的 16 个 providers：**
`advertising`, `category-ai-chat-!cn`, `youtube`, `category-entertainment@!cn`,
`category-voip`, `category-social-media-!cn`, `apple`, `google`, `microsoft`,
`category-dev`, `category-games-!cn`, `cloudflare`, `private`,
`geolocation-cn`, `geolocation-!cn`, `cn-ip`

> ℹ️ `cn-ip`（`behavior: ipcidr`）是必要保留的 GeoIP 规则——腾讯会议等 CN App 媒体流量会直接走国内 IP，域名规则覆盖不到。

**精简原则：**
> 删除后流量走 `geolocation-!cn → 代理` 兜底，路由行为正确。
> 只删除在 iOS 上不常使用或已被 category 覆盖的 provider。

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
自建节点配置需符合 `src/types.ts` 中的 Zod 架构（使用 `type` 而非 `protocol`，`skip-cert-verify` 而非 `insecure`）。

### `local-test.ts`

本地验证 Worker 逻辑，输出 `output.yaml`。

```bash
bun local-test.ts
```

---

## Rule Provider 设计原则

1. **优先使用 `category-*` 聚合集**，而非单独品牌 provider
2. **单独 provider 只在以下情况保留：**
   - 需要 DNS `nameserver-policy` 精确匹配（仅 Mihomo）
   - 需要与同类别其他域名路由到不同策略组
3. **Mini 版额外原则：** 删除所有在 iOS 上不常用或已被 category 覆盖的 provider，宁可走底也不占内存
4. **GeoIP 规则优先级**：优先使用 domain 类规则。GeoIP 规则（`behavior: ipcidr`）作为补充，必须配合 `no-resolve` 以防 DNS 回退。
5. **单项还原原则**：尽可能使用 `category-*` 聚合集。如果某项服务（如 `telegram-ip`, `cn-ip`）没有对应的 category 版本，则保留其单项规则以确保覆盖完整性。

---

## 常见修改场景

### 添加新 rule-provider（完整版）

1. 在 `templates/shared/rule-providers.ts` 末尾添加 provider 定义
2. 在 `templates/shared/rules.ts` 添加对应 `RULE-SET` 规则
3. 如需新分组，在 `templates/stash/groups.ts` 和 `templates/mihomo/groups.ts` 添加

### 添加新 rule-provider（mini 版）

1. 在 `templates/stash/mini/rule-providers-mini.ts` 添加
2. 在 `templates/stash/mini/rules-mini.ts` 添加对应规则
3. 如需新分组，在 `templates/stash/mini/groups-mini.ts` 添加

### 修改 DNS 配置

- Mihomo：`templates/mihomo/footer.ts`
- Stash：`templates/stash/footer.ts`（使用 `geosite:` 语法，不支持 `rule-set:`）

### 添加新配置类型

1. 在 `templates/` 下创建新目录和文件
2. 在 `index.ts` 顶部添加 import
3. 在 `index.ts` 的 `configType` 判断逻辑中加入新类型
4. 在 `gen-url.ts` 的 `validTypes` 数组和 `modeLabels` 中注册
