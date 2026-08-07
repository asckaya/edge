import type { GeoXCategory } from "./types";

const geoipTags = (cat: GeoXCategory): string[] => (cat.geoip ?? []).map((t) => `${t}-ip`);

export const GEOX_CATEGORIES_CATEGORY = {
	ADVERTISING: {
		geosite: ["category-ads-all", "adblockfilters"],
	},
	PRIVATE: {
		geosite: ["private"],
		geoip: ["private"],
	},
	AI: {
		geosite: [
			"category-ai-chat-!cn",
			"category-ai-cn",
			"openai",
			"anthropic",
			"google-gemini",
			"perplexity",
			"xai",
			"cursor",
			"windsurf",
			"trae",
			"manus",
			"jetbrains-ai",
			"openrouter",
		],
	},
	MEDIA: {
		geosite: [
			"youtube",
			"netflix",
			"disney",
			"hbo",
			"hulu",
			"primevideo",
			"apple-tvplus",
			"category-entertainment@!cn",
			"category-media",
		],
		geoip: ["netflix", "google"],
	},
	EMBY: {
		geosite: ["emby"],
		geoip: ["emby"],
	},
	COMMUNICATION: {
		geosite: ["category-communication", "category-voip"],
		geoip: ["telegram"],
	},
	SOCIAL: {
		geosite: ["category-social-media-!cn", "category-forums", "pixiv", "threads"],
	},
	DEV: {
		geosite: [
			"category-dev",
			"category-container",
			"microsoft-dev",
			"jetbrains",
			"gitlab",
			"github",
			"docker",
			"gitee",
			"stackoverflow",
			"npm",
			"pypi",
			"huggingface",
			"v2ex",
		],
	},
	GAMES: {
		geosite: [
			"category-games-!cn",
			"category-game-platforms-download",
			"steam@cn",
			"category-games@cn",
		],
	},
	FINANCE: {
		geosite: [
			"category-cryptocurrency",
			"paypal",
			"bybit",
			"bitget",
			"binance",
			"okx",
			"coinbase",
			"category-finance",
			"category-bank-cn",
		],
	},
	PRODUCTIVITY: {
		geosite: [
			"category-remote-control",
			"category-password-management",
			"notion",
			"figma",
			"tutanota",
			"proton",
		],
	},
	SCHOLAR: {
		geosite: ["category-scholar-!cn", "category-scholar-cn"],
	},
	CN: {
		geosite: [
			"geolocation-cn",
			"cn",
			"apple-cn",
			"microsoft@cn",
			"category-netdisk-cn",
			"category-ecommerce@cn",
			"category-collaborate-cn",
			"category-cdn-cn",
			"category-ai-cn",
		],
		geoip: ["cn"],
	},
	NON_CN: {
		geosite: ["geolocation-!cn"],
	},
	NEWS: {
		geosite: ["category-tech-media", "category-news-ir"],
	},
	PORN: {
		geosite: ["category-porn"],
	},
	P2P: {
		geosite: ["category-public-tracker", "category-pt"],
	},
	INFRA: {
		geosite: [
			"cloudflare",
			"apple",
			"google",
			"microsoft",
			"onedrive",
			"win-update",
			"category-antivirus",
			"category-speedtest",
			"category-ntp",
			"category-ip-geo-detect",
			"category-android-app-download",
			"category-ecommerce",
			"amazon",
			"ebay",
		],
		geoip: ["cloudflare"],
	},
	CLOUD: {
		geosite: ["dropbox", "mega"],
	},
} satisfies Record<string, GeoXCategory>;

export const GEOX_CATEGORIES_GRANULAR = {
	ADVERTISING: {
		geosite: ["advertising", "adblockfilters"],
	},
	PRIVATE: {
		geosite: ["private"],
		geoip: ["private"],
	},
	AI: {
		geosite: [
			"openai",
			"anthropic",
			"google-gemini",
			"perplexity",
			"xai",
			"cursor",
			"windsurf",
			"trae",
			"manus",
			"jetbrains-ai",
			"poe",
			"midjourney",
			"claude",
			"coze",
			"meta-ai",
			"deepseek",
			"groq",
			"openrouter",
		],
	},
	MEDIA: {
		geosite: [
			"youtube",
			"netflix",
			"disney",
			"hbo",
			"hulu",
			"primevideo",
			"apple-tvplus",
			"spotify",
			"twitch",
			"tiktok",
			"paramountplus",
			"discoveryplus",
			"abema",
			"bahamut",
			"dmm",
			"niconico",
			"tvb",
			"bilibili@!cn",
			"iqiyi@!cn",
			"wetv",
		],
		geoip: ["netflix", "google"],
	},
	EMBY: {
		geosite: ["emby"],
		geoip: ["emby"],
	},
	COMMUNICATION: {
		geosite: ["telegram", "signal", "line", "whatsapp", "discord"],
		geoip: ["telegram"],
	},
	SOCIAL: {
		geosite: [
			"twitter",
			"facebook",
			"instagram",
			"reddit",
			"quora",
			"tumblr",
			"pinterest",
			"linkedin",
			"medium",
			"vk",
			"pixiv",
			"threads",
		],
	},
	DEV: {
		geosite: [
			"github",
			"gitlab",
			"gitee",
			"docker",
			"jetbrains",
			"microsoft-dev",
			"google-dev",
			"apple-dev",
			"android-dev",
			"stackoverflow",
			"npm",
			"pypi",
			"huggingface",
			"v2ex",
			"sourceforge",
			"maven",
			"go-dev",
			"rust-lang",
			"cargo",
			"deno",
			"bun",
			"rubygems",
			"packagist",
			"cocoapods",
			"hashicorp",
			"postman",
			"sentry",
			"datadog",
			"vercel",
			"netlify",
			"supabase",
			"firebase",
			"render",
			"railway",
			"replit",
		],
	},
	GAMES: {
		geosite: [
			"steam",
			"steam@cn",
			"epic",
			"nintendo",
			"playstation",
			"xbox",
			"ea",
			"ubisoft",
			"blizzard",
			"riot",
			"roblox",
		],
	},
	FINANCE: {
		geosite: [
			"bybit",
			"bitget",
			"binance",
			"okx",
			"coinbase",
			"kraken",
			"gate",
			"kucoin",
			"htx",
			"mexc",
			"crypto",
			"metamask",
			"uniswap",
			"opensea",
			"paypal",
			"stripe",
			"wise",
			"revolut",
		],
	},
	PRODUCTIVITY: {
		geosite: [
			"notion",
			"figma",
			"tutanota",
			"1password",
			"bitwarden",
			"lastpass",
			"teamviewer",
			"anydesk",
			"todesk",
			"slack",
			"trello",
			"zoom",
			"proton",
		],
	},
	SCHOLAR: {
		geosite: ["arxiv", "sciencedirect", "springer", "ieee", "researchgate"],
	},
	CN: {
		geosite: [
			"cn",
			"apple-cn",
			"microsoft@cn",
			"baidu",
			"alibaba",
			"tencent",
			"bytedance",
			"bilibili",
			"jd",
			"taobao",
			"weibo",
			"zhihu",
			"163",
		],
		geoip: ["cn"],
	},
	NON_CN: {
		geosite: ["geolocation-!cn"],
	},
	NEWS: {
		geosite: ["bloomberg", "reuters", "nytimes", "wsj", "bbc", "cnn"],
	},
	PORN: {
		geosite: ["pornhub", "xvideos", "xnxx", "onlyfans"],
	},
	P2P: {
		geosite: ["category-public-tracker", "category-pt"],
	},
	INFRA: {
		geosite: [
			"cloudflare",
			"apple",
			"google",
			"microsoft",
			"onedrive",
			"win-update",
			"amazon",
			"ebay",
		],
		geoip: ["cloudflare"],
	},
	CLOUD: {
		geosite: ["dropbox", "mega", "google-drive", "icloud"],
	},
} satisfies Record<string, GeoXCategory>;

export const GEOX_CATEGORIES = GEOX_CATEGORIES_CATEGORY;

/**
 * Deriving mode-specific allowed tag lists from categories.
 * This ensures consistency and makes it easy to add/remove entire service blocks.
 */

export const GEOX_ALLOWED_WHITE = [
	...GEOX_CATEGORIES.ADVERTISING.geosite.map((t) => (t === "category-ads-all" ? "advertising" : t)),
	...GEOX_CATEGORIES.PRIVATE.geosite,
	...geoipTags(GEOX_CATEGORIES.PRIVATE),
	...GEOX_CATEGORIES.CN.geosite,
	...geoipTags(GEOX_CATEGORIES.CN),
	"win-update",
	"category-antivirus",
	"category-netdisk-cn",
	"category-scholar-cn",
	"category-bank-cn",
];

export const GEOX_ALLOWED_WHITE_GRANULAR = [
	...GEOX_CATEGORIES_GRANULAR.ADVERTISING.geosite,
	...GEOX_CATEGORIES_GRANULAR.PRIVATE.geosite,
	...geoipTags(GEOX_CATEGORIES_GRANULAR.PRIVATE),
	...GEOX_CATEGORIES_GRANULAR.CN.geosite,
	...geoipTags(GEOX_CATEGORIES_GRANULAR.CN),
	"win-update",
];

export const GEOX_ALLOWED_BLACK = [
	...GEOX_CATEGORIES.ADVERTISING.geosite.map((t) => (t === "category-ads-all" ? "advertising" : t)),
	...GEOX_CATEGORIES.PRIVATE.geosite,
	...geoipTags(GEOX_CATEGORIES.PRIVATE),
	...GEOX_CATEGORIES.AI.geosite,
	...GEOX_CATEGORIES.MEDIA.geosite,
	...geoipTags(GEOX_CATEGORIES.MEDIA),
	...GEOX_CATEGORIES.EMBY.geosite,
	...geoipTags(GEOX_CATEGORIES.EMBY),
	...GEOX_CATEGORIES.COMMUNICATION.geosite,
	...geoipTags(GEOX_CATEGORIES.COMMUNICATION),
	...GEOX_CATEGORIES.SOCIAL.geosite,
	...GEOX_CATEGORIES.DEV.geosite,
	...GEOX_CATEGORIES.GAMES.geosite,
	...GEOX_CATEGORIES.SCHOLAR.geosite,
	...GEOX_CATEGORIES.PRODUCTIVITY.geosite,
	...GEOX_CATEGORIES.CLOUD.geosite,
	...GEOX_CATEGORIES.NON_CN.geosite,
];

export const GEOX_ALLOWED_BLACK_GRANULAR = [
	...GEOX_CATEGORIES_GRANULAR.ADVERTISING.geosite,
	...GEOX_CATEGORIES_GRANULAR.PRIVATE.geosite,
	...geoipTags(GEOX_CATEGORIES_GRANULAR.PRIVATE),
	...GEOX_CATEGORIES_GRANULAR.AI.geosite,
	...GEOX_CATEGORIES_GRANULAR.MEDIA.geosite,
	...geoipTags(GEOX_CATEGORIES_GRANULAR.MEDIA),
	...GEOX_CATEGORIES_GRANULAR.EMBY.geosite,
	...geoipTags(GEOX_CATEGORIES_GRANULAR.EMBY),
	...GEOX_CATEGORIES_GRANULAR.COMMUNICATION.geosite,
	...geoipTags(GEOX_CATEGORIES_GRANULAR.COMMUNICATION),
	...GEOX_CATEGORIES_GRANULAR.SOCIAL.geosite,
	...GEOX_CATEGORIES_GRANULAR.DEV.geosite,
	...GEOX_CATEGORIES_GRANULAR.GAMES.geosite,
	...GEOX_CATEGORIES_GRANULAR.SCHOLAR.geosite,
	...GEOX_CATEGORIES_GRANULAR.PRODUCTIVITY.geosite,
	...GEOX_CATEGORIES_GRANULAR.CLOUD.geosite,
	...GEOX_CATEGORIES_GRANULAR.NON_CN.geosite,
];

/**
 * Rule-sets that should bypass local DNS (routed to fakeip / remote DNS) due
 * to censorship or DNS pollution concerns. Derived from GEOX_CATEGORIES so
 * new entries automatically propagate to DNS rules.
 */
export const DNS_FAKEIP_RULE_SETS: string[] = [
	...GEOX_CATEGORIES.AI.geosite.filter((t) => t.endsWith("!cn")),
	...GEOX_CATEGORIES.NON_CN.geosite,
	...GEOX_CATEGORIES.DEV.geosite.filter((t) => t !== "github" && t !== "docker"),
];

export const DNS_FAKEIP_RULE_SETS_GRANULAR: string[] = [
	...GEOX_CATEGORIES_GRANULAR.AI.geosite,
	...GEOX_CATEGORIES_GRANULAR.NON_CN.geosite,
	...GEOX_CATEGORIES_GRANULAR.DEV.geosite,
];
