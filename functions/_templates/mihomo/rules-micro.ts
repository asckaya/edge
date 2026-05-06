// Mihomo/Stash Micro (Black-list mode) routing rules.
// Black-list mode: Specified rules Proxy, Everything else Direct.

export const configMihomoMicroRules = `rules:
  # 广告拦截
  - GEOSITE,category-ads-all,🛑 广告拦截

  # SSH 直连
  - DST-PORT,22,DIRECT

  # P2P 直连
  - DST-PORT,11010,DIRECT

  # 局域网 & 私有网络
  - GEOIP,private,DIRECT,no-resolve
  - GEOSITE,private,DIRECT
  - DOMAIN-SUFFIX,et.net,DIRECT
  - DOMAIN-SUFFIX,ts.net,DIRECT

  # AI 服务 (Proxy)
  - GEOSITE,category-ai-chat-!cn,💬 AI 服务
  - GEOSITE,openai,💬 AI 服务
  - GEOSITE,anthropic,💬 AI 服务
  - GEOSITE,google-gemini,💬 AI 服务
  - GEOSITE,perplexity,💬 AI 服务
  - GEOSITE,deepseek,💬 AI 服务

  # 开发者工具 (Proxy)
  - GEOSITE,category-dev,🐱 开发工具
  - GEOSITE,github,🐱 开发工具
  - GEOSITE,docker,🐱 开发工具

  # 核心海外服务 (Proxy)
  - GEOSITE,google,🔍 谷歌服务
  - GEOSITE,youtube,📹 油管视频
  - GEOSITE,telegram,📲 电报消息
  - GEOIP,telegram,📲 电报消息,no-resolve
  - GEOSITE,twitter,🌐 社交媒体
  - GEOSITE,netflix,🎬 流媒体
  - GEOIP,netflix,🎬 流媒体,no-resolve
  - GEOSITE,disney,🎬 流媒体
  - GEOSITE,category-entertainment@!cn,🎬 流媒体

  # 游戏平台 (Proxy)
  - GEOSITE,category-games-!cn,🎮 游戏平台
  - GEOSITE,category-game-platforms-download,🎮 游戏平台

  # 海外分流兜底 (Proxy)
  - GEOSITE,geolocation-!cn,🚀 节点选择

  # 漏网之鱼 (Black-list: REST DIRECT)
  - MATCH,DIRECT
`;
