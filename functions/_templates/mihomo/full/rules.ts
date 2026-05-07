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

  # 国内直连 (关键特定服务优先，其余由 geolocation-cn 覆盖)
  - GEOSITE,google-cn,🔒 国内服务
  - GEOSITE,apple-cn,🔒 国内服务
  - GEOSITE,microsoft@cn,🔒 国内服务
  - GEOSITE,steam@cn,🔒 国内服务
  - GEOSITE,onedrive,🔒 国内服务
  - GEOSITE,category-ai-cn,🔒 国内服务
  - GEOSITE,category-games@cn,🔒 国内服务
  - GEOSITE,category-netdisk-cn,🔒 国内服务
  - GEOSITE,geolocation-cn,🔒 国内服务
  - GEOSITE,cn,🔒 国内服务
  - GEOIP,cn,🔒 国内服务,no-resolve

  # 杀毒软件更新 & 系统更新
  - GEOSITE,category-antivirus,🔒 国内服务
  - GEOSITE,win-update,🔒 国内服务

  # 测速 & NTP
  - GEOSITE,category-speedtest,🧪 测速专线
  - GEOSITE,category-ntp,🕓 NTP 服务

  # 开发工具
  - GEOSITE,category-dev,🐱 开发工具

  # 谷歌 & 苹果 & 微软 (全量服务)
  - GEOSITE,google,🔍 谷歌服务
  - GEOIP,google,🔍 谷歌服务,no-resolve
  - GEOSITE,apple-tvplus,🎬 苹果视频
  - GEOSITE,apple,🍏 苹果服务
  - GEOSITE,microsoft,Ⓜ️ 微软服务

  # AI 服务
  - GEOSITE,category-ai-chat-!cn,💬 AI 服务
  - GEOSITE,midjourney,💬 AI 服务
  - GEOSITE,jetbrains-ai,💬 AI 服务

  # 即时通讯 & 油管 & 流媒体
  - GEOSITE,category-communication,📲 电报消息
  - GEOSITE,category-voip,📲 电报消息
  - GEOIP,telegram,📲 电报消息,no-resolve
  - GEOSITE,youtube,📹 油管视频
  - GEOSITE,category-entertainment,🎬 流媒体
  - GEOSITE,category-media,🎬 流媒体
  - GEOIP,netflix,🎬 流媒体,no-resolve

  # 社交媒体 & 游戏
  - GEOSITE,category-forums,🌐 社交媒体
  - GEOSITE,category-social-media-!cn,🌐 社交媒体
  - GEOIP,twitter,🌐 社交媒体,no-resolve
  - GEOSITE,category-game-platforms-download,🎮 游戏下载
  - GEOSITE,category-games-!cn,🎮 游戏平台

  # 教育 & 生产力 & 金融
  - GEOSITE,category-scholar-!cn,📚 教育资源
  - GEOSITE,category-remote-control,🛠️ 生产力工具
  - GEOSITE,category-password-management,🛠️ 生产力工具
  - GEOSITE,notion,🛠️ 生产力工具
  - GEOSITE,obsidian,🛠️ 生产力工具
  - GEOSITE,figma,🛠️ 生产力工具
  - GEOSITE,category-cryptocurrency,💰 金融服务
  - GEOSITE,category-finance,💰 金融服务

  # 新闻 & 成人 & P2P
  - GEOSITE,category-tech-media,📰 新闻资讯
  - GEOSITE,category-news-ir,📰 新闻资讯
  - GEOSITE,category-porn,🔞 成人内容
  - GEOSITE,category-public-tracker,🧲 BT/PT
  - GEOSITE,category-pt,🧲 BT/PT

  # 云服务 & 购物 (归类优化)
  - GEOSITE,cloudflare,☁️ 云服务
  - GEOIP,cloudflare,☁️ 云服务,no-resolve
  - GEOSITE,category-netdisk-!cn,☁️ 云服务
  - GEOSITE,category-android-app-download,☁️ 云服务
  - GEOSITE,dropbox,☁️ 云服务
  - GEOSITE,mega,☁️ 云服务
  - GEOSITE,category-ecommerce,🚀 节点选择
  - GEOSITE,category-ip-geo-detect,🧪 测速专线

  # 非中国兜底
  - GEOSITE,geolocation-!cn,🌐 非中国

  # 漏网之鱼
  - MATCH,🐟 漏网之鱼
`;
