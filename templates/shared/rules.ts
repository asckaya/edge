// Shared routing rules (used by both Mihomo full and Stash full).
// Rule priority: reject/direct at top → specific services → category catch-alls → geolocation fallback.
// IP rules (no-resolve) are always separate from domain rules and cannot be replaced by category-* sets.

export const configRules = `rules:
  # SSH 直连
  - DST-PORT,22,DIRECT

  # P2P 直连
  - DST-PORT,11010,DIRECT

  # 局域网 & 私有网络
  - RULE-SET,private-ip,🏠 私有网络,no-resolve
  - RULE-SET,private,🏠 私有网络
  - DOMAIN-SUFFIX,et.net,DIRECT
  - DOMAIN-SUFFIX,ts.net,DIRECT

  # 广告拦截
  - RULE-SET,adblockfilters,🛑 广告拦截
  - RULE-SET,advertising,🛑 广告拦截

  # 国内直连
  - RULE-SET,geolocation-cn,🔒 国内服务
  - RULE-SET,cn,🔒 国内服务
  - RULE-SET,cn-ip,🔒 国内服务,no-resolve

  # 杀毒软件更新
  - RULE-SET,category-antivirus,🔒 国内服务

  # Windows Update 直连
  - RULE-SET,win-update,🔒 国内服务

  # 测速
  - RULE-SET,category-speedtest,🧪 测速专线

  # NTP 时间服务
  - RULE-SET,category-ntp,🕓 NTP 服务

  # 开发工具 (category-dev 涵盖 github/microsoft-dev/gitlab/jetbrains/docker/npm/pypi 等)
  - RULE-SET,category-dev,🐱 开发工具

  # 谷歌
  - RULE-SET,google,🔍 谷歌服务
  - RULE-SET,google-ip,🔍 谷歌服务,no-resolve

  # 苹果视频优先（在 apple 整体前）
  - RULE-SET,appletv,🎬 苹果视频
  - RULE-SET,apple,🍏 苹果服务

  # 微软服务（microsoft 已包含 OneDrive / Office / Azure 等）
  - RULE-SET,microsoft,Ⓜ️ 微软服务

  # AI 服务（category 覆盖主流服务；AI 编辑器单独列出确保不遗漏）
  - RULE-SET,category-ai-chat-!cn,💬 AI 服务
  - RULE-SET,xai,💬 AI 服务
  - RULE-SET,cursor,💬 AI 服务
  - RULE-SET,windsurf,💬 AI 服务
  - RULE-SET,trae,💬 AI 服务
  - RULE-SET,manus,💬 AI 服务
  - RULE-SET,jetbrains-ai,💬 AI 服务

  # 即时通讯（category-communication 涵盖 telegram/discord/slack/whatsapp 等；category-voip 涵盖 zoom/webex）
  # telegram-ip：Telegram DC 服务器 IP，域名规则覆盖不到
  - RULE-SET,category-communication,📲 电报消息
  - RULE-SET,category-voip,📲 电报消息
  - RULE-SET,telegram-ip,📲 电报消息,no-resolve

  # 油管
  - RULE-SET,youtube,📹 油管视频

  # 流媒体（无聚合 category，主流平台单独列出；category-entertainment@!cn 补充 TikTok/WebNovel）
  # netflix-ip：Netflix CDN IP，必须用 IP 规则才能捕获到
  - RULE-SET,netflix,🎬 流媒体
  - RULE-SET,netflix-ip,🎬 流媒体,no-resolve
  - RULE-SET,disney,🎬 流媒体
  - RULE-SET,hbo,🎬 流媒体
  - RULE-SET,hulu,🎬 流媒体
  - RULE-SET,primevideo,🎬 流媒体
  - RULE-SET,category-entertainment@!cn,🎬 流媒体

  # 社交媒体（category-social-media-!cn 覆盖 twitter/fb/ig/tiktok/discord 等）
  - RULE-SET,category-forums,🌐 社交媒体
  - RULE-SET,category-social-media-!cn,🌐 社交媒体
  - RULE-SET,twitter-ip,🌐 社交媒体,no-resolve

  # 游戏平台（category-games-!cn 仅境外，避免误伤国内；category-game-platforms-download 补充 EA/Riot/Steam 等 CDN）
  - RULE-SET,category-game-platforms-download,🎮 游戏下载
  - RULE-SET,category-games-!cn,🎮 游戏平台

  # 教育资源
  - RULE-SET,category-scholar-!cn,📚 教育资源

  # 生产力工具（remote-control: TeamViewer/AnyDesk；password-management: 1Password/Bitwarden 等）
  - RULE-SET,category-remote-control,🛠️ 生产力工具
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

  # BT / PT 追踪器（独立策略组，可按需切换 DIRECT/REJECT/代理）
  - RULE-SET,category-public-tracker,🧲 BT/PT
  - RULE-SET,category-pt,🧲 BT/PT

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
