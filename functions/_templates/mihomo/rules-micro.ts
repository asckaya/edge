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

  # 核心海外服务 (Proxy)
  - GEOSITE,google,🔍 谷歌服务
  - GEOSITE,youtube,📹 油管视频
  - GEOSITE,telegram,📲 电报消息
  - GEOSITE,netflix,🎬 流媒体
  - GEOSITE,twitter,🌐 社交媒体

  # 海外分流兜底 (Proxy)
  - GEOSITE,geolocation-!cn,🚀 节点选择

  # 漏网之鱼 (Black-list: REST DIRECT)
  - MATCH,DIRECT
`;
