# Edge Engine 快速入手指南

> 给用户与 AI Agent 使用的订阅转换说明。Web 控制台位于 `/`，本文档固定位于 `/GUIDE.md`。

Edge Engine 将一个或多个机场订阅、自建节点转换为 **Mihomo（Clash Meta）**、**Stash** 或 **sing-box** 配置，并自动加入分流规则与策略组。

---

## 一分钟上手

### 方法一：使用网页（推荐新用户）

1. 打开部署域名的根路径，例如 `https://edge.example.com/`。
2. 填写一个或多个订阅名称和订阅链接。
3. 选择目标内核：Mihomo、Stash 或 sing-box。
4. 选择分流模式。日常使用推荐 `dual`。
5. 点击生成，复制结果 URL。
6. 将结果 URL 作为远程配置或订阅地址添加到对应客户端。

### 方法二：直接拼接 API URL

最小示例：

```text
https://edge.example.com/?type=mihomo&mode=dual&Airport=https%3A%2F%2Fsub.example.com%2Fyour-token
```

把以下内容替换为自己的信息：

- `https://edge.example.com`：你的 Edge Engine 部署地址。
- `Airport`：订阅名称。
- `https://sub.example.com/your-token`：机场订阅链接，作为查询参数时应进行 URL 编码。

访问生成后的 URL，响应内容就是目标客户端配置。

---

## URL 格式

```text
{BASE_URL}/?type={TYPE}&mode={MODE}&secret={SECRET}&{SUB_NAME}={ENCODED_SUB_URL}
```

至少需要提供以下来源之一：

- 一个订阅参数：`订阅名称=订阅链接`
- 自建节点参数：`proxies=节点URI`

### 标准参数

| 参数 | 是否必填 | 默认值 | 说明 |
|---|---:|---|---|
| `type` | 否 | 自动识别，识别失败时为 `mihomo` | `mihomo`、`stash`、`sing-box` |
| `mode` | 否 | `full` | `full`、`dual`、`white`、`black` |
| `secret` | 否 | `edge-default` | 写入生成配置的外部控制密钥，不是转换接口的访问密码 |
| `proxies` | 否 | 空 | 自建节点 URI；多个节点使用换行分隔并进行 URL 编码 |
| `gh_proxy` | 否 | 空 | GitHub 规则资源的镜像前缀，值必须是完整 HTTP/HTTPS URL |

除上述保留参数外，其他合法的 HTTP/HTTPS 查询参数都会被视为订阅：

```text
订阅名称=订阅链接
```

订阅名称建议只使用：

```text
A-Z  a-z  0-9  _  中文
```

不要把以下保留名称用作订阅名称：

```text
type  mode  secret  proxies  gh_proxy
```

多个订阅名称不能重复。

---

## 目标内核

| `type` | 输出 | 常见客户端 |
|---|---|---|
| `mihomo` | YAML | Mihomo、Clash Meta 兼容客户端 |
| `stash` | YAML | Stash（iOS） |
| `sing-box` | JSON | sing-box 兼容客户端 |

如果省略 `type`，服务会根据请求的 `User-Agent` 判断：

- 包含 `clash` 或 `mihomo` → `mihomo`
- 包含 `stash` → `stash`
- 包含 `sing-box` 或 `singbox` → `sing-box`
- 无法识别 → `mihomo`

显式传入 `type` 的优先级最高。

---

## 分流模式

| `mode` | 行为 | 适用场景 |
|---|---|---|
| `dual` | 国外场景统一进入 `🚀 节点选择`，国内流量直连 | 推荐日常使用，策略组简洁 |
| `full` | AI、媒体、开发等场景分别使用独立策略组 | 需要精细控制每类流量 |
| `white` | 只代理已定义的国外规则，其余流量直连 | 国内优先、省代理流量 |
| `black` | 只直连已定义的国内规则，其余流量代理 | 代理优先、覆盖范围更大 |

内核和模式是两个独立参数：

```text
?type=mihomo&mode=dual
```

旧格式 `type=mihomo-dual` 仍兼容，但新链接应使用独立参数。

---

## 常用示例

### 单订阅 + Mihomo + 推荐模式

```text
https://edge.example.com/?type=mihomo&mode=dual&MyAirport=https%3A%2F%2Fsub.example.com%2Ftoken
```

单订阅时，Edge Engine 会省略冗余的机场选择组，节点会直接进入核心选择器和自动选择组。

### 多订阅合并

```text
https://edge.example.com/?type=mihomo&mode=dual&AirportA=https%3A%2F%2Fa.example.com%2Fsub&AirportB=https%3A%2F%2Fb.example.com%2Fsub
```

多订阅时，每个订阅会拥有独立的机场选择组和自动选择组。

### Stash 白名单模式

```text
https://edge.example.com/?type=stash&mode=white&iPhone=https%3A%2F%2Fsub.example.com%2Ftoken
```

### sing-box 黑名单模式

```text
https://edge.example.com/?type=sing-box&mode=black&Main=https%3A%2F%2Fsub.example.com%2Ftoken
```

### 注入自建节点

```text
https://edge.example.com/?type=mihomo&mode=dual&proxies=vless%3A%2F%2FUUID%40node.example.com%3A443%3Fsecurity%3Dtls%23MyNode
```

支持的节点协议包括：

```text
vless  vmess  ss  trojan  hysteria2  tuic  anytls
wireguard  tailscale  socks  http  snell
juicity  naive  masque  mieru  trusttunnel  shadowtls
```

不同内核支持的协议范围不同，未支持的协议节点会被自动过滤：

| 协议 | Mihomo | Stash | sing-box |
|---|:---:|:---:|:---:|
| vmess / vless / ss / trojan / hysteria2 / tuic / anytls / socks / http / snell | ✓ | ✓ | ✓ (outbound) |
| wireguard / tailscale | ✓ | ✓ | ✓ (endpoint) |
| trusttunnel | ✓ | ✓ | ✗ |
| masque / mieru | ✓ | ✗ | ✗ |
| juicity | ✗ | ✓ | ✗ |
| naive / shadowtls | ✗ | ✗ | ✓ |

机场订阅和 `proxies` 可以同时使用。

### 多个自建节点

原始内容：

```text
vless://...
hysteria2://...
```

将完整内容作为 `proxies` 的值进行 URL 编码。换行通常会编码为 `%0A`。

---

## URL 编码

订阅链接和节点 URI 经常包含 `?`、`&`、`#`、`=` 等字符，必须作为一个完整参数值进行 URL 编码，否则会被错误拆成多个查询参数。

JavaScript：

```js
const baseUrl = 'https://edge.example.com/';
const url = new URL(baseUrl);

url.searchParams.set('type', 'mihomo');
url.searchParams.set('mode', 'dual');
url.searchParams.set('Airport', 'https://sub.example.com/path?token=abc&flag=1');

console.log(url.toString());
```

Python：

```python
from urllib.parse import urlencode

base_url = "https://edge.example.com/"
params = {
    "type": "mihomo",
    "mode": "dual",
    "Airport": "https://sub.example.com/path?token=abc&flag=1",
}

print(base_url + "?" + urlencode(params))
```

不要对整个最终 URL 重复编码，只编码各参数值；使用 `URLSearchParams` 或 `urlencode` 最稳妥。

---

## 给 AI / Agent 的调用契约

当用户要求生成 Edge Engine 订阅转换地址时，按以下规则执行：

1. 必须获得部署根地址 `base_url`。
2. 至少获得一个订阅 URL 或一个自建节点 URI。
3. 未指定内核时使用 `mihomo`。
4. 未指定模式时优先推荐 `dual`；只有用户明确需要精细策略组时才使用 `full`。
5. 使用独立的 `type` 和 `mode` 参数，不生成旧式组合参数。
6. 使用 `URLSearchParams` 等标准工具编码参数，不手工拼接未编码的订阅 URL。
7. 不修改订阅 URL、Token、UUID、密码或节点 URI。
8. 不把保留参数名用作订阅名称。
9. 输出前检查最终 URL 中至少存在一个订阅参数或 `proxies`。
10. 订阅 URL 与节点凭据属于敏感信息；除非用户明确要求，不要在公开消息、日志或代码仓库中展示完整值。

机器可读摘要：

```yaml
service: Edge Engine
guide_path: /GUIDE.md
ui_path: /
conversion_endpoint: /
method: GET
required_source:
  any_of:
    - named_subscription_query_parameter
    - proxies
types: [mihomo, stash, sing-box]
modes: [full, dual, white, black]
recommended_mode: dual
defaults:
  type: mihomo
  mode: full
  secret: edge-default
reserved_query_keys: [type, mode, secret, proxies, gh_proxy]
subscription_value_protocols: [http, https]
outputs:
  mihomo: yaml
  stash: yaml
  sing-box: json
```

推荐的 AI 输入模板：

```text
部署地址：<BASE_URL>
目标内核：mihomo | stash | sing-box
分流模式：dual | full | white | black
订阅：<NAME>=<URL>
自建节点：<可选，多行 URI>
GitHub 镜像：<可选>
```

---

## 常见问题

### 打开根路径为什么是网页？

不带查询参数访问 `/` 时显示 Web 控制台。带转换参数访问根路径时返回生成后的客户端配置。

### 为什么提示 Missing parameters？

请求中没有有效订阅，也没有 `proxies`。至少添加一个以 HTTP/HTTPS 开头的订阅 URL，或提供自建节点。

### 为什么订阅链接被截断？

通常是订阅 URL 没有正确编码，其中的 `&` 被当成了下一个查询参数。使用网页生成器、`URLSearchParams` 或 `urlencode`。

### 为什么客户端收到错误格式？

显式指定正确的 `type`，不要完全依赖客户端的 `User-Agent` 自动识别。

### `secret` 能保护转换链接吗？

不能。`secret` 会写入生成配置，用于 Mihomo / sing-box 等外部控制接口。它不是 Edge Engine API 的访问鉴权。

### 可以只使用自建节点吗？

可以。只传 `proxies` 即可，也可以和机场订阅一起合并。

---

## 安全提醒

- 生成 URL 中可能包含订阅 Token、节点 UUID 或密码。
- URL 可能出现在浏览器历史、代理日志、服务器日志和客户端同步记录中。
- 推荐自行部署 Edge Engine，并始终使用 HTTPS。
- 不要公开分享完整生成 URL；排查问题时先隐藏敏感参数。
- 公共设备使用后应清理浏览记录和剪贴板。

---

## 快速检查清单

- [ ] 部署地址正确并使用 HTTPS
- [ ] 至少有一个订阅或自建节点
- [ ] `type` 与客户端匹配
- [ ] `mode` 符合预期，日常优先 `dual`
- [ ] 订阅名称不重复且未使用保留名称
- [ ] 所有参数值均已正确 URL 编码
- [ ] 没有把包含敏感信息的完整 URL 公开分享

