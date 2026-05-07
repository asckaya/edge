/**
 * Central registry for all GeoX (GEOSITE / GEOIP) tags used in the project.
 * Categorized for easy reference and reuse across Mihomo, Stash, and Sing-box.
 */

export const GEODATA_URLS = {
  geoip: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/geoip@release/geoip.dat",
  geosite: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
  mmdb: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb",
  asn: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb",
};

export const GEODATA_URLS_LITE = {
  geoip: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip-lite.dat",
  geosite: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite-lite.dat",
  mmdb: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/Country-lite.mmdb",
  asn: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/GeoLite2-ASN.mmdb",
};

export const GEOX_REGISTRY = {
  ADVERTISING: {
    geosite: ['category-ads-all'],
  },
  PRIVATE: {
    geosite: ['private'],
    geoip: ['private'],
  },
  AI: {
    geosite: [
      'category-ai-chat-!cn',
      'category-ai-cn',
      'midjourney',
      'jetbrains-ai'
    ],
  },
  MEDIA: {
    geosite: [
      'category-entertainment',
      'category-media',
      'category-media-cn',
      'bilibili@intl'
    ],
    geoip: ['netflix', 'google'],
  },
  COMMUNICATION: {
    geosite: [
      'category-communication',
      'category-voip'
    ],
    geoip: ['telegram'],
  },
  SOCIAL: {
    geosite: [
      'category-social-media-!cn',
      'category-forums'
    ],
    geoip: ['twitter', 'facebook'],
  },
  DEV: {
    geosite: [
      'category-dev',
      'category-container'
    ],
  },
  GAMES: {
    geosite: [
      'category-games-!cn',
      'category-game-platforms-download'
    ],
  },
  FINANCE: {
    geosite: [
      'category-cryptocurrency',
      'category-finance'
    ],
  },
  PRODUCTIVITY: {
    geosite: [
      'category-remote-control',
      'category-password-management',
      'notion',
      'obsidian',
      'figma',
      'adobe',
      'autodesk',
      'tutanota'
    ],
  },
  SCHOLAR: {
    geosite: [
      'category-scholar-!cn'
    ],
  },
  CN: {
    geosite: [
      'geolocation-cn',
      'cn',
      'google-cn',
      'apple-cn',
      'microsoft@cn',
      'steam@cn',
      'onedrive',
      'category-games@cn',
      'category-logistics-cn',
      'category-ai-cn',
      'category-netdisk-cn',
      'category-ecommerce@cn',
      'category-cdn-cn',
      'category-collaborate-cn',
      'category-scholar-cn',
      'category-bank-cn'
    ],
    geoip: ['cn'],
  },
  NON_CN: {
    geosite: ['geolocation-!cn'],
  },
  INFRA: {
    geosite: [
      'cloudflare',
      'dropbox',
      'mega',
      'apple',
      'google',
      'microsoft',
      'win-update',
      'category-antivirus',
      'category-speedtest',
      'category-ntp',
      'category-doh',
      'category-httpdns-cn',
      'category-ip-geo-detect',
      'category-android-app-download',
      'category-netdisk-!cn',
      'category-ecommerce'
    ],
    geoip: ['cloudflare', 'google', 'fastly', 'cloudfront'],
  }
};
