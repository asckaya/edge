// Stash iOS Mini routing rules.
// Ordered from most-specific to least-specific.
// Matches the 17 providers in rule-providers-mini.ts.

export const configStashMiniRules = `rules:
  # 广告拦截
  - RULE-SET,advertising,🛑 广告拦截

  # SSH 直连
  - DST-PORT,22,DIRECT

  # P2P 直连
  - DST-PORT,11010,DIRECT

  # 局域网 & 私有网络
  - RULE-SET,private-ip,🏠 私有网络,no-resolve
  - RULE-SET,private,🏠 私有网络
  - DOMAIN-SUFFIX,et.net,DIRECT
  - DOMAIN-SUFFIX,ts.net,DIRECT

  # 国内直连
  - RULE-SET,geolocation-cn,🔒 国内服务
  - RULE-SET,cn,🔒 国内服务
  - RULE-SET,cn-ip,🔒 国内服务,no-resolve

  # AI 服务
  - RULE-SET,category-ai-chat-!cn,💬 AI 服务

  # 油管
  - RULE-SET,youtube,📹 油管视频

  # 流媒体（category-entertainment@!cn 主要覆盖 TikTok；netflix/spotify/twitch/biliintl 等）
  - RULE-SET,category-entertainment@!cn,🎬 流媒体

  # 即时通讯（telegram/signal/whatsapp 等）
  - RULE-SET,category-voip,📲 电报消息

  # 社交媒体（twitter/fb/ig/tiktok/discord/reddit 等）
  - RULE-SET,category-social-media-!cn,🌐 社交媒体

  # 游戏平台（仅境外）
  - RULE-SET,category-games-!cn,🎮 游戏平台

  # 开发工具（github/npm/pypi 等）
  - RULE-SET,category-dev,🐱 开发工具

  # 谷歌 / 苹果 / 微软
  - RULE-SET,google,🔍 谷歌服务
  - RULE-SET,apple,🍏 苹果服务
  - RULE-SET,microsoft,Ⓜ️ 微软服务

  # 云服务 / Cloudflare
  - RULE-SET,cloudflare,☁️ 云服务

  # 非中国兜底（代理）
  - RULE-SET,geolocation-!cn,🌐 非中国

  # 漏网之鱼
  - MATCH,🐟 漏网之鱼
`;
