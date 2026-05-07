// Mihomo/Stash Minimal (Black-list mode) routing rules.
// Black-list mode: Specified rules Proxy, Everything else Direct.

export const configMihomoMinimalRules = `rules:
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
  - GEOSITE,category-ai-chat-!cn,🚀 节点选择

  # 开发者工具 (Proxy)
  - GEOSITE,category-dev,🚀 节点选择
  - GEOSITE,category-container,🚀 节点选择

  # 核心海外服务 (Proxy)
  - GEOSITE,google,🚀 节点选择
  - GEOSITE,youtube,🚀 节点选择
  - GEOSITE,category-communication,🚀 节点选择
  - GEOIP,telegram,🚀 节点选择,no-resolve
  - GEOSITE,category-social-media-!cn,🚀 节点选择
  - GEOSITE,category-entertainment,🚀 节点选择
  - GEOIP,netflix,🚀 节点选择,no-resolve

  # 游戏平台 (Proxy)
  - GEOSITE,category-games-!cn,🚀 节点选择
  - GEOSITE,category-game-platforms-download,🚀 节点选择

  # 教育 & 生产力 (Proxy)
  - GEOSITE,category-scholar-!cn,🚀 节点选择
  - GEOSITE,category-remote-control,🚀 节点选择
  - GEOSITE,category-password-management,🚀 节点选择

  # 海外分流兜底 (Proxy)
  - GEOSITE,geolocation-!cn,🚀 节点选择

  # 漏网之鱼 (Black-list: REST DIRECT)
  - MATCH,DIRECT
`;
