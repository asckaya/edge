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
- `type`：`*-full` / `*-dual` / `*-mini` / `*-micro` (其中 `*` 为 `mihomo` / `stash` / `sing-box`)
- `secret`：Mihomo / sing-box 控制接口密码
- `[ProviderName]=URL`：机场订阅
- `proxies`：自建节点 URI 字符串
- `gh_proxy`：GitHub 规则源加速前缀

**模板选择逻辑：**
```typescript
const isStash   = configType.includes('stash');
const isSingBox = configType.includes('sing-box');
const isMini    = configType.endsWith('-mini');
const isMicro   = configType.endsWith('-micro');
const isDual    = configType.endsWith('-dual');

const useMiniTemplates = isMini || isMicro || isDual;
const tplGroupsHeader  = useMiniTemplates ? configMihomoMiniGroupsHeader  : isStash ? configStashGroupsHeader  : configMihomoGroupsHeader;
const tplGroupsMid     = useMiniTemplates ? configMihomoMiniGroupsMid     : isStash ? configStashGroupsMid     : configMihomoGroupsMid;
const tplRuleProviders = useMiniTemplates ? configMihomoMiniRuleProviders : configMihomoRuleProviders;
let tplRules           = isMicro ? configMihomoMicroRules : isMini ? configMihomoMiniRules : configMihomoRules;

// Dual 模式重定向逻辑
if (isDual) {
  tplRules = transformToDual(tplRules); // 将场景分组替换为“🚀 节点选择”
}
```

**YAML 最终拼接顺序：**
```
tplHeader → proxy-providers → proxies → groupsHeader → Self-Hosted → 动态分组 → groupsMid → tplFooter → tplRuleProviders → tplRules
```

---

## 模板系统架构演进 (模块化与多版本)

为了提高可维护性，模板系统按 **内核 > 版本** 的结构进行了重新组织：

### 1. `_templates/mihomo/` (核心模板库)
Mihomo 和 Stash 共用此处的底层规则。
- **根目录**：`header.ts`, `footer.ts`, `rule-providers.ts` (跨版本共用)。
- **`full/`**：标准全量版。包含 `groups.ts` 和 `rules.ts` (60+ 场景分组)。
- **`mini/`**：精简版与双模版共用。包含 `groups.ts` (4 个基础策略组 + 7 个区域组) 和 `rules.ts` (白名单规则)。
- **`micro/`**：极简黑名单版。仅包含 `rules.ts`。

### 2. `_templates/stash/` (Stash 特化)
- **`full/`**：Stash 专属的入口/出口链式分组策略。

### 3. 配置模式详解

- **Full 版**：全量规则 + 全量场景分组。
- **Dual 版 (推荐)**：全量规则 + 精简分组。将所有国外场景重定向到 `🚀 节点选择`，适合追求简洁的用户。
- **Mini 版**：白名单模式。全局代理，仅国内直连。
- **Micro 版**：黑名单模式。全局直连，仅规则匹配代理。

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
验证 Worker 逻辑，按 **内核 > 版本** 组织集成测试，并包含通用逻辑验证：
```bash
# 目录结构
tests/
  ├── mihomo/    # full, dual, mini, micro
  ├── stash/     # full, dual, mini, micro
  ├── sing-box/  # full, dual, mini, micro
  └── common/    # core, parser, builder, uri

# 运行本地测试
bun test
```
