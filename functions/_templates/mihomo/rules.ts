// Shared routing rules (used by both Mihomo full and Stash full).
// Rule priority: reject/direct at top → specific services → category catch-alls → geolocation fallback.
// IP rules (no-resolve) are always separate from domain rules and cannot be replaced by category-* sets.

export const configMihomoRules = `rules:
  # SSH 直连
  - DST-PORT,22,DIRECT

  # P2P 直连
  - DST-PORT,11010,DIRECT

  # 局域网 & 私有网络
  - GEOIP,private,🏠 私有网络,no-resolve
  - GEOSITE,private,🏠 私有网络
  - DOMAIN-SUFFIX,et.net,DIRECT
  - DOMAIN-SUFFIX,ts.net,DIRECT

  # 广告拦截
  - RULE-SET,adblockfilters,🛑 广告拦截
  - GEOSITE,category-ads-all,🛑 广告拦截

  # 国内直连
  - GEOSITE,google-cn,🔒 国内服务
  - GEOSITE,category-games@cn,🔒 国内服务
  - GEOSITE,geolocation-cn,🔒 国内服务
  - GEOSITE,cn,🔒 国内服务
  - GEOIP,cn,🔒 国内服务,no-resolve

  # 杀毒软件更新
  - GEOSITE,category-antivirus,🔒 国内服务

  # Windows Update 直连
  - GEOSITE,win-update,🔒 国内服务

  # 测速
  - GEOSITE,category-speedtest,🧪 测速专线

  # NTP 时间服务
  - GEOSITE,category-ntp,🕓 NTP 服务

  # 开发工具 (category-dev 涵盖 github/microsoft-dev/gitlab/jetbrains/docker/npm/pypi 等)
  - GEOSITE,category-dev,🐱 开发工具

  # 谷歌
  - GEOSITE,google,🔍 谷歌服务
  - GEOIP,google,🔍 谷歌服务,no-resolve

  # 苹果视频优先（在 apple 整体前）
  - GEOSITE,apple-tvplus,🎬 苹果视频
  - GEOSITE,apple,🍏 苹果服务

  # 微软服务（microsoft 已包含 OneDrive / Office / Azure 等）
  - GEOSITE,microsoft,Ⓜ️ 微软服务

  # AI 服务（category 覆盖主流服务；AI 编辑器单独列出确保不遗漏）
  - GEOSITE,category-ai-chat-!cn,💬 AI 服务
  - GEOSITE,xai,💬 AI 服务
  - GEOSITE,cursor,💬 AI 服务
  - GEOSITE,windsurf,💬 AI 服务
  - GEOSITE,trae,💬 AI 服务
  - GEOSITE,manus,💬 AI 服务
  - GEOSITE,jetbrains-ai,💬 AI 服务

  # 即时通讯（category-communication 涵盖 telegram/discord/slack/whatsapp 等；category-voip 涵盖 zoom/webex）
  # telegram-ip：Telegram DC 服务器 IP，域名规则覆盖不到
  - GEOSITE,category-communication,📲 电报消息
  - GEOSITE,category-voip,📲 电报消息
  - GEOIP,telegram,📲 电报消息,no-resolve

  # 油管
  - GEOSITE,youtube,📹 油管视频

  # 流媒体（无聚合 category，主流平台单独列出；category-entertainment@!cn 补充 TikTok/WebNovel）
  # netflix-ip：Netflix CDN IP，必须用 IP 规则才能捕获到
  - GEOSITE,netflix,🎬 流媒体
  - GEOIP,netflix,🎬 流媒体,no-resolve
  - GEOSITE,disney,🎬 流媒体
  - GEOSITE,hbo,🎬 流媒体
  - GEOSITE,hulu,🎬 流媒体
  - GEOSITE,primevideo,🎬 流媒体
  - GEOSITE,category-entertainment@!cn,🎬 流媒体

  # 社交媒体（category-social-media-!cn 覆盖 twitter/fb/ig/tiktok/discord 等）
  - GEOSITE,category-forums,🌐 社交媒体
  - GEOSITE,category-social-media-!cn,🌐 社交媒体
  - GEOIP,twitter,🌐 社交媒体,no-resolve

  # 游戏平台（category-games-!cn 仅境外，避免误伤国内；category-game-platforms-download 补充 EA/Riot/Steam 等 CDN）
  - GEOSITE,category-game-platforms-download,🎮 游戏下载
  - GEOSITE,category-games-!cn,🎮 游戏平台

  # 教育资源
  - GEOSITE,category-scholar-!cn,📚 教育资源

  # 生产力工具（remote-control: TeamViewer/AnyDesk；password-management: 1Password/Bitwarden 等）
  - GEOSITE,category-remote-control,🛠️ 生产力工具
  - GEOSITE,category-password-management,🛠️ 生产力工具
  - GEOSITE,tutanota,🛠️ 生产力工具

  # 金融服务（含加密货币交易所）
  - GEOSITE,category-cryptocurrency,💰 金融服务
  - GEOSITE,paypal,💰 金融服务
  - GEOSITE,category-finance,💰 金融服务

  # 新闻资讯（科技媒体 + 境外新闻）
  - GEOSITE,category-tech-media,📰 新闻资讯
  - GEOSITE,category-news-ir,📰 新闻资讯

  # 成人内容
  - GEOSITE,category-porn,🔞 成人内容

  # BT / PT 追踪器（独立策略组，可按需切换 DIRECT/REJECT/代理）
  - GEOSITE,category-public-tracker,🧲 BT/PT
  - GEOSITE,category-pt,🧲 BT/PT

  # 云服务 / Cloudflare
  - GEOSITE,cloudflare,☁️ 云服务
  - GEOIP,cloudflare,☁️ 云服务,no-resolve
  - GEOSITE,dropbox,☁️ 云服务
  - GEOSITE,mega,☁️ 云服务

  # 非中国兜底
  - GEOSITE,geolocation-!cn,🌐 非中国

  # 漏网之鱼
  - MATCH,🐟 漏网之鱼
`;
