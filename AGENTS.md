# AGENTS.md — AI 代码助手上下文文档

本文件为 AI 代码助手提供项目上下文，帮助快速理解代码库并生成正确的修改。

## 项目概述

**Edge** 是一个部署在 Cloudflare Workers 上的代理订阅转换器。用户通过 URL 参数传入机场订阅和自建节点，Worker 返回一份完整的 Mihomo / Stash YAML 或 sing-box JSON 配置。

支持四种配置输出类型：
- **Mihomo / Clash Meta**（桌面端，完整功能，原生 GeoX 极速版）
- **Stash**（iOS 完整版，外部 YAML Rule-Provider 兼容版）
- **Stash Mini**（iOS 内存优化版，目标 <50 MB Network Extension，全 GeoX 无外部依赖）
- **sing-box**（1.13+ JSON 配置，服务端展开订阅）
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
- `type`：`mihomo`（默认）/ `stash` / `stash-mini` / `sing-box`
- `secret`：Mihomo / sing-box 控制接口密码
- `[ProviderName]=URL`：机场订阅
- `proxies`：自建节点 URI 字符串
- `gh_proxy`：GitHub 规则源加速前缀

**模板选择逻辑：**
```typescript
const isStash     = configType === 'stash';
const isStashMini = configType === 'stash-mini';
const isSingBox   = configType === 'sing-box';

const tplGroupsHeader  = isStashMini ? configStashMiniGroupsHeader  : isStash ? configStashGroupsHeader  : configMihomoGroupsHeader;
const tplGroupsMid     = isStashMini ? configStashMiniGroupsMid     : isStash ? configStashGroupsMid     : configMihomoGroupsMid;
const tplRuleProviders = isStashMini ? configStashMiniRuleProviders : isStash ? configRuleProviders : configMihomoRuleProviders;
const tplRules         = isStashMini ? configStashMiniRules         : isStash ? configRules : configMihomoRules;
```

**YAML 最终拼接顺序：**
```
tplHeader → proxy-providers → proxies → groupsHeader → Self-Hosted → 动态分组 → groupsMid → tplFooter → tplRuleProviders → tplRules
```

---

## 模板系统架构演进 (GeoX 与 Rule-Providers 分离)

为了解决外部 `rule-providers` 带来的高内存占用和启动慢问题，我们对各平台的规则系统进行了深度特化：

### 1. `templates/mihomo/` (Mihomo & Stash 共同使用的极速规则)
Mihomo 和最新的 Stash 都已全面拥抱内置的二进制 `GEOSITE`/`GEOIP` 数据库。
- `rules.ts`：完全使用 `GEOSITE,xxx` 语法，不再依赖外部的 `RULE-SET`（大幅降低内存，将 50MB+ 的内存消耗压缩到 15MB 左右）。
- `rule-providers.ts`：几乎被清空，仅保留极个别无法用 Geo 数据替代的第三方规则库（如 `adblockfilters`）。
- 对于 Mihomo，`groups.ts`：含自动测速链式分组，并自带垃圾节点清洗正则匹配（剔除过期、流量提示等无用节点）。

### 2. `templates/stash/` (Stash 专属分组)
由于最新版 Stash 同样完全支持 GeoX，因此它不再维护自己庞大且吃内存的 `RULE-SET`，而是**完全复用**了 `mihomo/rules.ts` 和 `mihomo/rule-providers.ts` 的规则定义。
- `groups.ts`：Stash 仅保留了自己特有的入口/出口节点链式分组策略。

### 3. `templates/stash/mini/` (Stash 极致内存版)
为了防止 iOS 设备的 Network Extension 因为内存超过 50MB 而崩溃，Mini 版追求极致的轻量化。
- `rule-providers-mini.ts`：**完全置空（0 外部规则依赖）**。
- `rules-mini.ts`：强制全盘改写为原生 `GEOSITE`/`GEOIP`。即便内置字典无法识别个别细分类，也会回退到 `geolocation-!cn` 兜底。
- `groups-mini.ts`：保留 17 个轻量级策略组。

---

## Rule Provider / GeoX 设计原则

1. **新增分类规则：**
   - 不管是为 Mihomo 加规则还是为 Stash 加规则，由于它们已经共用规则引擎，请直接在 `mihomo/rules.ts` 中添加 `GEOSITE,xxx` 即可。不再需要增加冗余的外部 provider。
   - 如果是为 Stash (Mini版) 加规则：直接在 `stash/mini/rules-mini.ts` 中加 `GEOSITE,xxx`。

2. **行为分离原则（IP vs 域名）：**
   - 域名规则只匹配 hostname，IP 规则匹配目标 IP 地址。
   - 像 `geolocation-cn` 必须在所有代理规则之前；而 `cn-ip` 和 `private-ip` 需要加上 `no-resolve` 防止提前触发 DNS 泄露。

3. **国内直连兜底：**
   - `GEOSITE,google-cn` 和 `GEOSITE,category-games@cn` 是为了优化特定大陆服务的直连，避免游戏和国内版谷歌服务绕远路。

---

## sing-box 现状

### `functions/_src/utils/sing-box.ts`
sing-box 配置不使用上述 YAML 模板，而是纯 TypeScript 对象生成：
- `outbounds`：`selector` / `urltest` / `direct` / `block` / 各协议节点
- `route.rule_set`：使用 `MetaCubeX/meta-rules-dat@sing` 的 remote `geosite/geoip` `.srs`
- 订阅节点会优先按服务器 IP 做 GeoIP，并重命名为 `国家 icon + 机场名 + 数字 + (原节点名)`
- 若整份订阅只返回占位告警节点，会自动收敛成单个 `⚠️ 机场名 订阅失效`

---

## 工具脚本

### `gen-url.ts`
从 `proxy.yaml` 读取配置，生成 Worker 订阅 URL。
```bash
bun gen-url.ts                    # 默认 mihomo
bun gen-url.ts --type stash       # Stash 完整版
bun gen-url.ts --type stash-mini  # Stash Mini
bun gen-url.ts --type sing-box    # sing-box 1.13+ JSON
```

### Tests
验证 Worker 逻辑，对四种类型进行自动化测试：
```bash
bun test
```
