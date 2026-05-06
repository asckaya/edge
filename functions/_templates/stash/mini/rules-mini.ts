// Stash iOS Mini routing rules.
// White-list mode: Domestic Direct, Everything else Proxy.

export const configStashMiniRules = `rules:
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

  # 国内直连 (White-list)
  - GEOSITE,geolocation-cn,🔒 国内服务
  - GEOSITE,cn,🔒 国内服务
  - GEOIP,cn,🔒 国内服务,no-resolve

  # 非中国兜底（代理）
  - GEOSITE,geolocation-!cn,🐟 漏网之鱼

  # 漏网之鱼
  - MATCH,🐟 漏网之鱼
`;
