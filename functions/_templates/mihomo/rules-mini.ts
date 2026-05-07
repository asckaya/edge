// Mihomo/Stash Mini routing rules.
// White-list mode: Domestic Direct, Everything else Proxy.

export const configMihomoMiniRules = `rules:
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

  # 国内直连 (White-list: CN services go DIRECT)
  - GEOSITE,google-cn,🔒 国内服务
  - GEOSITE,apple-cn,🔒 国内服务
  - GEOSITE,microsoft@cn,🔒 国内服务
  - GEOSITE,steam@cn,🔒 国内服务
  - GEOSITE,onedrive,🔒 国内服务
  - GEOSITE,category-ai-cn,🔒 国内服务
  - GEOSITE,category-games@cn,🔒 国内服务
  - GEOSITE,category-netdisk-cn,🔒 国内服务
  - GEOSITE,category-ecommerce@cn,🔒 国内服务
  - GEOSITE,category-collaborate-cn,🔒 国内服务
  - GEOSITE,category-scholar-cn,🔒 国内服务
  - GEOSITE,category-bank-cn,🔒 国内服务
  - GEOSITE,geolocation-cn,🔒 国内服务
  - GEOSITE,cn,🔒 国内服务
  - GEOIP,cn,🔒 国内服务,no-resolve

  # 非中国兜底（代理）
  - GEOSITE,geolocation-!cn,🐟 漏网之鱼

  # 漏网之鱼
  - MATCH,🐟 漏网之鱼
`;
