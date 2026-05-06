# AGENTS.md — AI 代码助手上下文文档

本文件为 AI 代码助手提供项目上下文，帮助快速理解代码库并生成正确的修改。

## 项目概述

**Edge** 是一个部署在 Cloudflare Workers 上的代理订阅转换器。用户通过 URL 参数传入机场订阅 e.g. Airport=URL 和自建节点 e.g. proxies=URI，Worker 返回一份完整的 Mihomo / Stash YAML 或 sing-box JSON 配置。

支持多种配置输出类型：
- **Mihomo / Clash Meta**（桌面端，完整功能，原生 GeoX 极速版）
- **Stash**（iOS 完整版，外部 YAML Rule-Provider 兼容版）
- **Mini / Micro**（极致精简版，支持 Mihomo / Stash / sing-box）
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
- `type`：`mihomo` / `mihomo-mini` / `mihomo-micro` / `stash` / `stash-mini` / `stash-micro` / `sing-box` / `sing-box-mini` / `sing-box-micro`
- `secret`：Mihomo / sing-box 控制接口密码
- `[ProviderName]=URL`：机场订阅
- `proxies`：自建节点 URI 字符串
- `gh_proxy`：GitHub 规则源加速前缀

**模板选择逻辑：**
```typescript
const isStash   = configType === 'stash' || configType === 'stash-mini' || configType === 'stash-micro';
const isSingBox = configType === 'sing-box' || configType === 'sing-box-mini' || configType === 'sing-box-micro';
const isMini    = configType === 'stash-mini' || configType === 'mihomo-mini' || configType === 'sing-box-mini';
const isMicro   = configType === 'stash-micro' || configType === 'mihomo-micro' || configType === 'sing-box-micro';

const useMiniTemplates = isMini || isMicro;
const tplGroupsHeader  = useMiniTemplates ? configMihomoMiniGroupsHeader  : isStash ? configStashGroupsHeader  : configMihomoGroupsHeader;
const tplGroupsMid     = useMiniTemplates ? configMihomoMiniGroupsMid     : isStash ? configStashGroupsMid     : configMihomoGroupsMid;
const tplRuleProviders = useMiniTemplates ? configMihomoMiniRuleProviders : configMihomoRuleProviders;
const tplRules         = isMicro ? configMihomoMicroRules : isMini ? configMihomoMiniRules : configMihomoRules;
```

**YAML 最终拼接顺序：**
```
tplHeader → proxy-providers → proxies → groupsHeader → Self-Hosted → 动态分组 → groupsMid → tplFooter → tplRuleProviders → tplRules
```

---

## 模板系统架构演进 (GeoX 与 Rule-Providers 分离)

为了解决外部 `rule-providers` 带来的高内存占用和启动慢问题，我们对各平台的规则系统进行了深度特化：

### 1. `templates/mihomo/` (Mihomo & Stash 核心规则库)
Mihomo 和最新的 Stash 共用此处的模板系统。
- `rules.ts` / `rules-mini.ts` / `rules-micro.ts`：分流规则全集。完全使用 `GEOSITE,xxx` 语法，不再依赖外部的 `RULE-SET`。
- `groups.ts` / `groups-mini.ts`：策略组定义。含自动测速链式分组。
- `rule-providers.ts` / `rule-providers-mini.ts`：几乎被清空，仅保留 `adblockfilters` 等极个别外部规则。

### 2. `templates/stash/` (Stash 特化配置)
Stash 仅保留了自己特有的入口/出口节点链式分组策略，其余规则完全复用 `mihomo/` 目录。
- `groups.ts`：Stash 专属的 Full 版分组逻辑。

### 3. Mini/Micro 极致精简版 (全平台支持)
为了防止移动端设备（尤其是 iOS）的 Network Extension 因为内存超过 50MB 而崩溃，我们提供了两种极致轻量化的版本：

- **Mini 版 (白名单模式)**：`mihomo-mini` / `stash-mini` / `sing-box-mini`
    - **逻辑**：**全局代理，仅国内直连**。兜底规则为 `MATCH,Proxy`。
- **Micro 版 (黑名单模式)**：`mihomo-micro` / `stash-micro` / `sing-box-micro`
    - **逻辑**：**全局直连，仅规则代理**。兜底规则为 `MATCH,DIRECT`。

**共同配置：**
- **Groups**：精简到只剩 4 个基础策略组 + 7 个区域自动测速组。

---

## Rule Provider / GeoX 设计原则

为了极致的性能和稳定性，本项目采用 **Native GeoX 优先** 的原则，将规则维护成本降至最低。

### 1. `shared/geox.ts` (GeoX 注册中心)
所有项目中使用的 `GEOSITE` 和 `GEOIP` 标签都记录在此文件中，按类别进行归类：
- **AI**: 收录 OpenAI, Anthropic, Gemini, Perplexity, DeepSeek 以及国产大模型（Trae, Manus 等）。
- **Media**: 收录 Netflix, Youtube, Spotify, Disney+, Bahamut 等主流流媒体。
- **Dev**: 收录 GitHub, Docker, Stack Overflow, NPM, JetBrains 等开发者工具。
- **CN**: 收录 `geolocation-cn` 以及经过优化的 Apple-CN, Google-CN。

### 2. 行为分离原则（IP vs 域名）：
- **域名匹配**：优先使用 `GEOSITE`，只匹配 hostname，不会触发 DNS 解析。
- **IP 匹配**：使用 `GEOIP` 匹配目标 IP 地址。
- **防泄露**：像 `cn-ip` 和 `private-ip` 必须加上 `no-resolve`，防止在分流阶段提前触发 DNS 解析导致泄露。

### 3. 国内直连优化：
- 特别加入了 `google-cn` 和 `apple-cn` 规则，确保国内地图、推送等基础服务直连。
- `category-games@cn` 用于加速国内主流手游和端游的直连访问。

---

## sing-box 现状

### `functions/_src/utils/sing-box.ts`
sing-box 配置不使用 YAML 模板，而是通过 TypeScript 对象动态构建：
- **Outbounds**：支持 `isMini` / `isMicro` 模式。
    - Mini 模式：仅保留 4 个核心策略组 + 7 个区域测速组，其余组自动折叠。
- **Route**：根据注册中心的标签，从 `meta-rules-dat` 自动加载对应的 `.srs` 文件。
- **Node Renaming**：订阅节点自动按国家/地区图标 + 机场名 + 序号 + (原节点名) 进行重命名。

---

## 工具脚本

### `gen-url.ts`
从 `proxy.yaml` 读取配置，生成 Web UI 预览链接或 API 订阅 URL。

### Tests
验证 Worker 逻辑，对所有内核版本（Mihomo/Stash/sing-box）的全量、Mini、Micro 模式进行自动化测试：
```bash
# 运行本地测试
bun test
```
