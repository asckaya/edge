# Edge — Web UI (Next.js)

这是 **Edge** 订阅转换器的图形化界面。

## 核心功能

- **多订阅管理**：支持添加多个外部订阅源，支持 URL 格式自动校验。
- **智能校验**：
    - **名称安全**：自动拦截非法字符，确保 Provider 名称符合规范。
    - **重复检查**：实时高亮重复的 Provider 名称。
- **自建节点**：支持粘贴多个节点 URI，并自动识别不支持的协议格式（Warning 提示）。
- **GitHub Proxy 组合框**：支持从常见镜像地址中快速选择，或自定义输入加速地址。
- **一键构建**：自动拼接所有参数及节点，一键生成适用于 Mihomo/Stash 的 Final URL。

## 快速开始

首先安装依赖并启动开发服务器：

```bash
bun install
bun run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 即可看到结果。

## 技术栈

- **框架**: Next.js (App Router)
- **样式**: Tailwind CSS
- **验证**: 实时前端校验逻辑
- **构建**: 兼容 Cloudflare Assets 部署

## 部署说明

项目构建后会将静态资源输出至 `out/ui` 目录，部署流水线会自动处理该目录下的资产。
