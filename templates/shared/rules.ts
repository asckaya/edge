// Shared routing rules (used by both Mihomo and Stash)
// Ordered from most-specific to least-specific.

export const configRules = `rules:
  # HttpDNS 拦截（CN App 绕过 + DoH 隧道）
  - RULE-SET,category-httpdns-cn,🛡️ 隐私防护
  - RULE-SET,category-doh,🛡️ 隐私防护

  # 广告拦截
  - RULE-SET,advertising,🛡️ 隐私防护

  # 开发工具 (category-dev 包含 github/microsoft-dev/gitlab/jetbrains/docker 等)
  - RULE-SET,category-dev,🐱 开发工具

  # 谷歌 / 苹果 / 微软
  - RULE-SET,google,🔍 谷歌服务
  - RULE-SET,google-ip,🔍 谷歌服务,no-resolve
  - RULE-SET,apple,🍏 苹果服务
  - RULE-SET,onedrive,Ⓜ️ 微软服务
  - RULE-SET,microsoft,Ⓜ️ 微软服务

  # Windows 遥测拦截 / Windows Update 直连
  - RULE-SET,win-spy,🛡️ 隐私防护
  - RULE-SET,win-extra,🛡️ 隐私防护
  - RULE-SET,win-update,🔒 国内服务

  # 测速
  - RULE-SET,category-speedtest,🧪 测速专线

  # NTP 时间服务（直连更准）
  - RULE-SET,category-ntp,🕓 NTP 服务

  # 安全拒绝（STUN/WebRTC 端口）
  - DST-PORT,3478,REJECT
  - DST-PORT,3479,REJECT
  - DST-PORT,5349,REJECT
  - DST-PORT,5350,REJECT
  - DST-PORT,19302,REJECT
  - DST-PORT,19303,REJECT
  - DST-PORT,19304,REJECT
  - DST-PORT,19305,REJECT
  - DST-PORT,19306,REJECT
  - DST-PORT,19307,REJECT
  - DST-PORT,19308,REJECT
  - DST-PORT,19309,REJECT

  # SSH 直连
  - DST-PORT,22,DIRECT

  # 局域网 & 私有网络
  - IP-CIDR,10.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,100.64.0.0/10,DIRECT,no-resolve
  - IP-CIDR,172.16.0.0/12,DIRECT,no-resolve
  - IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
  - RULE-SET,private,🏠 私有网络,no-resolve

  # 国内直连
  - RULE-SET,geolocation-cn,🔒 国内服务
  - RULE-SET,cn,🔒 国内服务,no-resolve
  # GeoIP 国内 IP 段兼底（解决腾讯会议等直连 IP 被漏网之鱼匹配的问题）
  - RULE-SET,cn-ip,🔒 国内服务,no-resolve

  # 苹果视频优先（在 apple 整体前）
  - RULE-SET,appletv,🎬 苹果视频

  # AI 服务（category 覆盖主流服务；AI 编辑器单独列出确保不遗漏）
  - RULE-SET,category-ai-chat-!cn,💬 AI 服务
  - RULE-SET,xai,💬 AI 服务
  - RULE-SET,cursor,💬 AI 服务
  - RULE-SET,windsurf,💬 AI 服务
  - RULE-SET,trae,💬 AI 服务
  - RULE-SET,manus,💬 AI 服务
  - RULE-SET,jetbrains-ai,💬 AI 服务

  # 即时通讯 & 社交 (category-communication 覆盖 telegram/discord/slack/protonmail/whatsapp 等)
  - RULE-SET,category-communication,📲 电报消息
  - RULE-SET,category-voip,📲 电报消息
  - RULE-SET,telegram-ip,📲 电报消息,no-resolve

  # 油管
  - RULE-SET,youtube,📹 油管视频

  # 流媒体（category-entertainment@!cn 覆盖 netflix/spotify/twitch/biliintl 等）
  - RULE-SET,category-entertainment@!cn,🎬 流媒体
  - RULE-SET,netflix-ip,🎬 流媒体,no-resolve

  # 社交媒体（category-social-media-!cn 覆盖 twitter/fb/ig/tiktok/discord 等）
  - RULE-SET,category-forums,🌐 社交媒体
  - RULE-SET,category-social-media-!cn,🌐 社交媒体
  - RULE-SET,twitter-ip,🌐 社交媒体,no-resolve

  # 游戏平台（category-games-!cn 仅境外，避免误伤国内游戏）
  - RULE-SET,category-games-!cn,🎮 游戏平台

  # 教育资源
  - RULE-SET,category-scholar-!cn,📚 教育资源

  # 生产力工具 (category-communication 已覆盖 slack/protonmail)
  - RULE-SET,category-password-management,🛠️ 生产力工具
  - RULE-SET,tutanota,🛠️ 生产力工具

  # 金融服务（含加密货币交易所）
  - RULE-SET,category-cryptocurrency,💰 金融服务
  - RULE-SET,paypal,💰 金融服务
  - RULE-SET,category-finance,💰 金融服务

  # 新闻资讯（科技媒体 + 境外新闻）
  - RULE-SET,category-tech-media,📰 新闻资讯
  - RULE-SET,category-news-ir,📰 新闻资讯

  # 成人内容
  - RULE-SET,category-porn,🔞 成人内容

  # BT / PT 追踪器 → 漏网之鱼
  - RULE-SET,category-public-tracker,🐟 漏网之鱼
  - RULE-SET,category-pt,🐟 漏网之鱼

  # 云服务 / Cloudflare
  - RULE-SET,cloudflare,☁️ 云服务
  - RULE-SET,cloudflare-ip,☁️ 云服务,no-resolve
  - RULE-SET,dropbox,☁️ 云服务
  - RULE-SET,mega,☁️ 云服务

  # 非中国兜底
  - RULE-SET,geolocation-!cn,🌐 非中国

  # 漏网之鱼
  - MATCH,🐟 漏网之鱼
`;
