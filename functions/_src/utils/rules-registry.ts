import { RouteRuleDefinition, RuleSetDefinition } from './sing-box/types';
import { GROUP_TAGS, DIRECT_TAG } from './shared-constants';

/**
 * GeoX Category Registry
 * Used to organize tags and derive mode-specific allowed lists.
 */
export const GEOX_CATEGORIES = {
  ADVERTISING: {
    geosite: ['category-ads-all', 'adblockfilters'],
  },
  PRIVATE: {
    geosite: ['private'],
    geoip: ['private'],
  },
  AI: {
    geosite: [
      'category-ai-chat-!cn',
      'category-ai-cn',
      'openai',
      'anthropic',
      'google-gemini',
      'perplexity',
      'deepseek',
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
      'category-entertainment@!cn',
      'category-media'
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
    geoip: ['twitter'],
  },
  DEV: {
    geosite: [
      'category-dev',
      'category-container',
      'microsoft-dev',
      'jetbrains',
      'gitlab',
      'github',
      'docker'
    ],
  },
  GAMES: {
    geosite: [
      'category-games-!cn',
      'category-game-platforms-download',
      'steam@cn',
      'category-games@cn'
    ],
  },
  FINANCE: {
    geosite: [
      'category-cryptocurrency',
      'paypal',
      'category-finance',
      'category-bank-cn'
    ],
  },
  PRODUCTIVITY: {
    geosite: [
      'category-remote-control',
      'category-password-management',
      'notion',
      'figma',
      'tutanota'
    ],
  },
  SCHOLAR: {
    geosite: [
      'category-scholar-!cn',
      'category-scholar-cn'
    ],
  },
  CN: {
    geosite: [
      'geolocation-cn',
      'cn',
      'google-cn',
      'apple-cn',
      'microsoft@cn',
      'onedrive',
      'category-netdisk-cn',
      'category-ecommerce@cn',
      'category-collaborate-cn',
      'category-cdn-cn',
      'category-ai-cn'
    ],
    geoip: ['cn'],
  },
  NON_CN: {
    geosite: ['geolocation-!cn'],
  },
  NEWS: {
    geosite: [
      'category-tech-media',
      'category-news-ir'
    ],
  },
  PORN: {
    geosite: ['category-porn'],
  },
  P2P: {
    geosite: [
      'category-public-tracker',
      'category-pt'
    ],
  },
  INFRA: {
    geosite: [
      'cloudflare',
      'apple',
      'google',
      'microsoft',
      'win-update',
      'category-antivirus',
      'category-speedtest',
      'category-ntp',
      'category-ip-geo-detect',
      'category-android-app-download',
      'category-ecommerce'
    ],
    geoip: ['cloudflare'],
  }
};

/**
 * Deriving mode-specific allowed tag lists from categories.
 * This ensures consistency and makes it easy to add/remove entire service blocks.
 */

export const GEOX_ALLOWED_WHITE = [
  ...GEOX_CATEGORIES.ADVERTISING.geosite.map(t => t === 'category-ads-all' ? 'advertising' : t),
  ...GEOX_CATEGORIES.PRIVATE.geosite,
  ...GEOX_CATEGORIES.PRIVATE.geoip.map(t => `${t}-ip`),
  ...GEOX_CATEGORIES.CN.geosite,
  ...GEOX_CATEGORIES.CN.geoip.map(t => `${t}-ip`),
  'win-update', 'category-antivirus', 'onedrive', 'category-netdisk-cn', 'category-scholar-cn', 'category-bank-cn'
];

export const GEOX_ALLOWED_BLACK = [
  ...GEOX_CATEGORIES.ADVERTISING.geosite.map(t => t === 'category-ads-all' ? 'advertising' : t),
  ...GEOX_CATEGORIES.PRIVATE.geosite,
  ...GEOX_CATEGORIES.PRIVATE.geoip.map(t => `${t}-ip`),
  ...GEOX_CATEGORIES.AI.geosite,
  ...GEOX_CATEGORIES.MEDIA.geosite,
  ...GEOX_CATEGORIES.MEDIA.geoip.map(t => `${t}-ip`),
  ...GEOX_CATEGORIES.COMMUNICATION.geosite,
  ...GEOX_CATEGORIES.COMMUNICATION.geoip.map(t => `${t}-ip`),
  ...GEOX_CATEGORIES.SOCIAL.geosite,
  ...GEOX_CATEGORIES.SOCIAL.geoip.map(t => `${t}-ip`),
  ...GEOX_CATEGORIES.DEV.geosite,
  ...GEOX_CATEGORIES.GAMES.geosite,
  ...GEOX_CATEGORIES.SCHOLAR.geosite,
  ...GEOX_CATEGORIES.PRODUCTIVITY.geosite,
  ...GEOX_CATEGORIES.NON_CN.geosite
];

export const GEOX_ALLOWED_DUAL = [
  ...GEOX_CATEGORIES.ADVERTISING.geosite.map(t => t === 'category-ads-all' ? 'advertising' : t),
  ...GEOX_CATEGORIES.PRIVATE.geosite,
  ...GEOX_CATEGORIES.PRIVATE.geoip.map(t => `${t}-ip`),
  'google', 'youtube', 'telegram', 'category-ai-chat-!cn',
  'geolocation-cn', 'cn', 'cn-ip', 'geolocation-!cn',
  'category-ecommerce', 'category-social-media-!cn', 'category-entertainment@!cn', 'category-games-!cn'
];

/**
 * RULE_SET_DEFINITIONS: Source of truth for sing-box and mihomo rule sets.
 * Derived automatically from GEOX_CATEGORIES.
 */
const CUSTOM_RULE_SETS: RuleSetDefinition[] = [
  { kind: 'geosite', tag: 'advertising', remoteName: 'category-ads-all', mihomoType: 'GEOSITE' },
  {
    kind: 'geosite',
    tag: 'adblockfilters',
    url: 'https://raw.githubusercontent.com/217heidai/adblockfilters/main/rules/adblocksingbox.srs',
    mihomoType: 'RULE-SET',
  },
];

const DERIVED_RULE_SETS: RuleSetDefinition[] = [];
const processedTags = new Set(CUSTOM_RULE_SETS.map(s => s.tag));

Object.values(GEOX_CATEGORIES).forEach(cat => {
  (cat.geosite || []).forEach(t => {
    if (!processedTags.has(t)) {
      DERIVED_RULE_SETS.push({ kind: 'geosite', tag: t, mihomoType: 'GEOSITE' });
      processedTags.add(t);
    }
  });
  (cat.geoip || []).forEach(t => {
    const tag = `${t}-ip`;
    if (!processedTags.has(tag)) {
      DERIVED_RULE_SETS.push({ kind: 'geoip', tag, remoteName: t, mihomoType: 'GEOIP' });
      processedTags.add(tag);
    }
  });
});

export const RULE_SET_DEFINITIONS: RuleSetDefinition[] = [
  ...CUSTOM_RULE_SETS,
  ...DERIVED_RULE_SETS
];


/**
 * ROUTE_RULES: Main routing rules used across all kernels.
 */
export const ROUTE_RULES: RouteRuleDefinition[] = [
  { action: 'sniff' },
  {
    type: 'logical',
    mode: 'or',
    rules: [{ protocol: 'dns' }, { port: 53 }],
    action: 'hijack-dns',
  },
  { port: 22, action: 'route', outbound: DIRECT_TAG },
  { port: 11010, action: 'route', outbound: DIRECT_TAG },
  { rule_set: 'private-ip', action: 'route', outbound: GROUP_TAGS.PRIVATE_NET },
  { rule_set: 'private', action: 'route', outbound: GROUP_TAGS.PRIVATE_NET },
  { domain_suffix: ['et.net', 'ts.net'], action: 'route', outbound: DIRECT_TAG },
  { rule_set: 'advertising', action: 'route', outbound: GROUP_TAGS.AD_BLOCK },
  { rule_set: 'adblockfilters', action: 'route', outbound: GROUP_TAGS.AD_BLOCK },
  { rule_set: 'geolocation-cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'cn-ip', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'category-antivirus', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'win-update', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'apple-cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'google-cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'microsoft@cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'steam@cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'onedrive', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'category-netdisk-cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'category-ecommerce@cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'category-collaborate-cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'category-cdn-cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'category-scholar-cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'category-bank-cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'category-games@cn', action: 'route', outbound: GROUP_TAGS.CN_SERVICES },
  { rule_set: 'category-speedtest', action: 'route', outbound: GROUP_TAGS.SPEEDTEST },
  { rule_set: 'category-ntp', action: 'route', outbound: GROUP_TAGS.NTP_SERVICES },
  { rule_set: 'category-dev', action: 'route', outbound: GROUP_TAGS.DEV_TOOLS },
  { rule_set: 'category-container', action: 'route', outbound: GROUP_TAGS.DEV_TOOLS },
  { rule_set: 'microsoft-dev', action: 'route', outbound: GROUP_TAGS.DEV_TOOLS },
  { rule_set: 'jetbrains', action: 'route', outbound: GROUP_TAGS.DEV_TOOLS },
  { rule_set: 'gitlab', action: 'route', outbound: GROUP_TAGS.DEV_TOOLS },
  { rule_set: 'github', action: 'route', outbound: GROUP_TAGS.DEV_TOOLS },
  { rule_set: 'docker', action: 'route', outbound: GROUP_TAGS.DEV_TOOLS },
  { rule_set: 'google', action: 'route', outbound: GROUP_TAGS.GOOGLE },
  { rule_set: 'google-ip', action: 'route', outbound: GROUP_TAGS.GOOGLE },
  { rule_set: 'apple-tvplus', action: 'route', outbound: GROUP_TAGS.APPLE_VIDEO },
  { rule_set: 'apple', action: 'route', outbound: GROUP_TAGS.APPLE },
  { rule_set: 'microsoft', action: 'route', outbound: GROUP_TAGS.MICROSOFT },
  { rule_set: 'category-ai-chat-!cn', action: 'route', outbound: GROUP_TAGS.AI_SERVICES },
  { rule_set: 'openai', action: 'route', outbound: GROUP_TAGS.AI_SERVICES },
  { rule_set: 'anthropic', action: 'route', outbound: GROUP_TAGS.AI_SERVICES },
  { rule_set: 'google-gemini', action: 'route', outbound: GROUP_TAGS.AI_SERVICES },
  { rule_set: 'perplexity', action: 'route', outbound: GROUP_TAGS.AI_SERVICES },
  { rule_set: 'deepseek', action: 'route', outbound: GROUP_TAGS.AI_SERVICES },
  { rule_set: 'xai', action: 'route', outbound: GROUP_TAGS.AI_SERVICES },
  { rule_set: 'cursor', action: 'route', outbound: GROUP_TAGS.AI_SERVICES },
  { rule_set: 'windsurf', action: 'route', outbound: GROUP_TAGS.AI_SERVICES },
  { rule_set: 'trae', action: 'route', outbound: GROUP_TAGS.AI_SERVICES },
  { rule_set: 'manus', action: 'route', outbound: GROUP_TAGS.AI_SERVICES },
  { rule_set: 'jetbrains-ai', action: 'route', outbound: GROUP_TAGS.AI_SERVICES },
  { rule_set: 'category-communication', action: 'route', outbound: GROUP_TAGS.TELEGRAM },
  { rule_set: 'category-voip', action: 'route', outbound: GROUP_TAGS.TELEGRAM },
  { rule_set: 'telegram-ip', action: 'route', outbound: GROUP_TAGS.TELEGRAM },
  { rule_set: 'youtube', action: 'route', outbound: GROUP_TAGS.YOUTUBE },
  { rule_set: 'netflix', action: 'route', outbound: GROUP_TAGS.STREAMING },
  { rule_set: 'netflix-ip', action: 'route', outbound: GROUP_TAGS.STREAMING },
  { rule_set: 'disney', action: 'route', outbound: GROUP_TAGS.STREAMING },
  { rule_set: 'hbo', action: 'route', outbound: GROUP_TAGS.STREAMING },
  { rule_set: 'hulu', action: 'route', outbound: GROUP_TAGS.STREAMING },
  { rule_set: 'primevideo', action: 'route', outbound: GROUP_TAGS.STREAMING },
  { rule_set: 'category-entertainment@!cn', action: 'route', outbound: GROUP_TAGS.STREAMING },
  { rule_set: 'category-media', action: 'route', outbound: GROUP_TAGS.STREAMING },
  { rule_set: 'category-forums', action: 'route', outbound: GROUP_TAGS.SOCIAL_MEDIA },
  { rule_set: 'category-social-media-!cn', action: 'route', outbound: GROUP_TAGS.SOCIAL_MEDIA },
  { rule_set: 'twitter-ip', action: 'route', outbound: GROUP_TAGS.SOCIAL_MEDIA },
  { rule_set: 'category-game-platforms-download', action: 'route', outbound: GROUP_TAGS.GAME_DOWNLOAD },
  { rule_set: 'category-games-!cn', action: 'route', outbound: GROUP_TAGS.GAMING },
  { rule_set: 'category-scholar-!cn', action: 'route', outbound: GROUP_TAGS.EDUCATION },
  { rule_set: 'category-remote-control', action: 'route', outbound: GROUP_TAGS.PRODUCTIVITY },
  { rule_set: 'category-password-management', action: 'route', outbound: GROUP_TAGS.PRODUCTIVITY },
  { rule_set: 'notion', action: 'route', outbound: GROUP_TAGS.PRODUCTIVITY },
  { rule_set: 'figma', action: 'route', outbound: GROUP_TAGS.PRODUCTIVITY },
  { rule_set: 'tutanota', action: 'route', outbound: GROUP_TAGS.PRODUCTIVITY },
  { rule_set: 'category-cryptocurrency', action: 'route', outbound: GROUP_TAGS.FINANCE },
  { rule_set: 'paypal', action: 'route', outbound: GROUP_TAGS.FINANCE },
  { rule_set: 'category-finance', action: 'route', outbound: GROUP_TAGS.FINANCE },
  { rule_set: 'category-tech-media', action: 'route', outbound: GROUP_TAGS.NEWS },
  { rule_set: 'category-news-ir', action: 'route', outbound: GROUP_TAGS.NEWS },
  { rule_set: 'category-porn', action: 'route', outbound: GROUP_TAGS.ADULT },
  { rule_set: 'category-public-tracker', action: 'route', outbound: GROUP_TAGS.BT_PT },
  { rule_set: 'category-pt', action: 'route', outbound: GROUP_TAGS.BT_PT },
  { rule_set: 'cloudflare', action: 'route', outbound: GROUP_TAGS.CLOUD },
  { rule_set: 'cloudflare-ip', action: 'route', outbound: GROUP_TAGS.CLOUD },
  { rule_set: 'category-android-app-download', action: 'route', outbound: GROUP_TAGS.CLOUD },
  { rule_set: 'dropbox', action: 'route', outbound: GROUP_TAGS.CLOUD },
  { rule_set: 'mega', action: 'route', outbound: GROUP_TAGS.CLOUD },
  { rule_set: 'category-ecommerce', action: 'route', outbound: GROUP_TAGS.SHOPPING },
  { rule_set: 'category-ip-geo-detect', action: 'route', outbound: GROUP_TAGS.SPEEDTEST },
  { rule_set: 'geolocation-!cn', action: 'route', outbound: GROUP_TAGS.NON_CN },
];
