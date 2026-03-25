// Stash iOS Mini proxy-groups
// Reduced from 24 → 13 groups to lower memory and simplify the UI.
// Removed: 测速专线, NTP服务, 苹果视频, 教育资源, 生产力工具, 金融服务, 新闻资讯, 成人内容

export const configStashMiniGroupsHeader = `proxy-groups:
  - name: 🚀 节点选择
    type: select
    proxies: [DIRECT, REJECT, {{AUTO_GROUPS_LIST}}, {{PROVIDERS_LIST}}, {{SELF_HOSTED_GROUP}}]
`;

export const configStashMiniGroupsMid = `  - name: 🛑 广告拦截
    type: select
    proxies: [REJECT, DIRECT, 🚀 节点选择]

  - name: 💬 AI 服务
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 📹 油管视频
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🎬 流媒体
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 📲 电报消息
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🌐 社交媒体
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🎮 游戏平台
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🔍 谷歌服务
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🍏 苹果服务
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: Ⓜ️ 微软服务
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🐱 开发工具
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: ☁️ 云服务
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🔒 国内服务
    type: select
    proxies: [DIRECT, REJECT, 🚀 节点选择, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🏠 私有网络
    type: select
    proxies: [DIRECT, REJECT, 🚀 节点选择]

  - name: 🌐 非中国
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🐟 漏网之鱼
    type: select
    proxies: [🚀 节点选择, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
`;
