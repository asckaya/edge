# AGENTS.md — AI 代码助手上下文文档

本文件为 AI 代码助手提供项目上下文，帮助快速理解代码库并生成正确的修改。

## 项目概述

**Edge** 是一个部署在 Cloudflare Pages 上的代理订阅转换引擎。它采用 **数据驱动 (Data-Driven)** 的架构，取代了传统的硬编码模板。用户通过 URL 参数传入机场订阅和自建节点，系统动态生成优化的配置。

支持内核：
- **Mihomo / Clash Meta** (桌面/安卓首选)
- **Stash** (iOS 首选，原生 GeoX 优化)
- **sing-box** (1.13+ JSON 配置，服务端展开订阅)

---

## 核心架构：注册中心驱动 (Registry-Driven)

项目已完成架构合并，所有规则和分组逻辑由统一的注册中心管理：

### 1. 规则注册中心 (`rules-registry.ts`)
- **GEOX_CATEGORIES**: 唯一的规则定义源。每个类别包含 `tag` (GeoX 标签)、`rule_set` (外部资源) 以及匹配逻辑。
- **ROUTE_RULES**: 路由逻辑定义。规定了不同流量对应的 Outbound 分组。

### 2. 分组构建器 (`group-builder.ts` / `shared-constants.ts`)
- **SCENARIO_GROUPS**: 场景化分组（AI、Media、Dev 等）在这里定义，并由构建器自动渲染为各内核对应的语法。
- **CORE_GROUPS**: 核心控制分组（Proxy, Direct, Reject）。

---

## 编排模式 (Orchestration Modes)

系统支持 4 种核心分流深度，在 3 种内核上共计 12 种模式：

- **Full (完整)**: 精细化分流，全量 20+ 场景分组。
- **Dual (双模 - 推荐)**: 全量规则。合并所有国外场景到 `🚀 节点选择`，仅保留核心分流组。
- **White (白名单 - 直连优先)**: 仅代理明确定义的国外规则，其余兜底 `DIRECT`。
- **Black (黑名单 - 代理优先)**: 仅直连国内规则，其余兜底代理。

---

## 单订阅优化 (Single Subscription Optimization)

系统会自动检测订阅数量：
- **多订阅**: 为每个机场生成独立的 `[Airport]` 节点组和 `⚡ [Airport] 自动选择` 组。
- **单订阅**: **自动简化逻辑**。不再生成机场名命名的冗余分组，直接将该机场 Provider 注入核心 `🚀 节点选择` 和 `⚡ 自动选择` 中，提供更清爽的 UI。

---

## Rule Provider / GeoX 设计原则

- **Native GeoX 优先**: 优先使用 `GEOSITE` 和 `GEOIP`，只在必要时使用外部 `.mrs` (Mihomo) 或 `.srs` (Sing-box) 文件。
- **防泄露**: `cn-ip` 和 `private-ip` 必须开启 `no-resolve`，防止提前触发 DNS 解析。
- **国内直连优化**: 特别加入了 `google-cn` 和 `apple-cn` 规则，确保国内基础服务（地图、推送等）直连。

---

## 工具与脚本

- **`gen-url.ts`**: 根据 `proxy.yaml` 生成带参数的 Worker URL。
- **`yaml-to-config.ts`**: 本地调试工具。直接读取 YAML 并生成最终配置，用于预览修改。
- **`pnpm test`**: 运行全量集成测试。
- **`kernel.test.ts`**: 核心校验脚本。验证生成的 YAML 是否能被 Mihomo 裸核成功加载（验证语法合法性）。

---

## 修改指南

1. **新增服务**: 在 `rules-registry.ts` 的 `GEOX_CATEGORIES` 中添加新标签。
2. **调整分组**: 修改 `shared-constants.ts` 中的分组常量。
3. **内核逻辑**:
   - Mihomo/Stash 修改 `mihomo/group-builder.ts`。
   - Sing-box 修改 `sing-box/groups.ts` 和 `outbounds.ts`。
4. **验证**: 修改后务必运行 `pnpm test` 确保 12 种模式均未损坏。


---

## sing-box 现状

### `functions/_src/utils/sing-box.ts`
sing-box 配置不使用 YAML 模板，而是通过 TypeScript 对象动态构建：
- **Outbounds**：支持 `isMinimal` / `isDual` 模式。
    - Minimal 模式：仅保留广告拦截组 + 7 个区域测速组，其余组自动折叠。
- **Route**：根据注册中心的标签，从 `meta-rules-dat` 自动加载对应的 `.srs` 文件。
- **Node Renaming**：订阅节点自动按国家/地区图标 + 机场名 + 序号 + (原节点名) 进行重命名。

---

## 工具脚本

### `gen-url.ts`
从 `proxy.yaml` 读取配置，生成 Web UI 预览链接或 API 订阅 URL。

### Tests
验证 Worker 逻辑，按 **内核 > 版本** 组织集成测试，并包含通用逻辑验证：
```bash
### 目录结构
tests/
  ├── mihomo/    # full, dual, white, black
  ├── stash/     # full, dual, white, black
  ├── sing-box/  # full, dual, white, black
  └── common/    # core, parser, builder, uri

# 运行本地测试
pnpm test

# 运行内核验证测试 (验证生成的 YAML 是否可被 mihomo 加载)
pnpm vitest tests/mihomo/kernel.test.ts
```

---

## 注意事项

- **GeoX 标签**: 仅使用 upstream (MetaCubeX/meta-rules-dat) 确认为存在的标签。已移除 `midjourney`, `obsidian` 等失效标签。
- **配置校验**: 所有的修改应通过 `kernel.test.ts` 验证，确保生成的配置在裸核下依然合法。
