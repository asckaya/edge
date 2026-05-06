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
      'openai',
      'anthropic',
      'google-gemini',
      'perplexity',
      'deepseek',
      'poe',
      'midjourney',
      'xai',
      'cursor',
      'windsurf',
      'trae',
      'manus',
      'jetbrains-ai'
    ],
  },
  MEDIA: {
    geosite: [
      'youtube',
      'netflix',
      'disney',
      'hbo',
      'hulu',
      'primevideo',
      'apple-tvplus',
      'spotify',
      'tidal',
      'twitch',
      'abematv',
      'bahamut',
      'bilibili@intl',
      'category-entertainment@!cn'
    ],
    geoip: ['netflix', 'google'],
  },
  COMMUNICATION: {
    geosite: ['category-communication', 'category-voip', 'telegram', 'discord', 'slack'],
    geoip: ['telegram'],
  },
  SOCIAL: {
    geosite: [
      'category-social-media-!cn',
      'twitter',
      'facebook',
      'instagram',
      'pinterest',
      'reddit',
      'category-forums'
    ],
    geoip: ['twitter', 'facebook', 'instagram'],
  },
  DEV: {
    geosite: [
      'category-dev',
      'category-container',
      'github',
      'gitlab',
      'stackoverflow',
      'docker',
      'npm',
      'pypi',
      'microsoft-dev',
      'jetbrains'
    ],
  },
  GAMES: {
    geosite: ['category-games-!cn', 'category-game-platforms-download', 'steam', 'epicgames', 'ea', 'nintendo', 'playstation', 'xbox'],
  },
  FINANCE: {
    geosite: ['category-cryptocurrency', 'paypal', 'binance', 'coinbase', 'category-finance'],
  },
  PRODUCTIVITY: {
    geosite: ['category-remote-control', 'category-password-management', 'notion', 'obsidian', 'figma', 'adobe', 'autodesk', 'tutanota'],
  },
  CN: {
    geosite: ['geolocation-cn', 'cn', 'google-cn', 'apple-cn', 'category-games@cn'],
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
      'category-ntp'
    ],
    geoip: ['cloudflare', 'google', 'apple', 'microsoft'],
  }
};
