import type { GeoXCategory } from "./types";

const geoipTags = (cat: GeoXCategory): string[] => (cat.geoip ?? []).map((t) => `${t}-ip`);

export const GEOX_CATEGORIES = {
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
			"deepseek",
			"xai",
			"cursor",
			"windsurf",
			"trae",
			"manus",
			"jetbrains-ai",
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
		geosite: ["category-social-media-!cn", "category-forums"],
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
		geosite: ["category-cryptocurrency", "paypal", "category-finance", "category-bank-cn"],
	},
	PRODUCTIVITY: {
		geosite: [
			"category-remote-control",
			"category-password-management",
			"notion",
			"figma",
			"tutanota",
		],
	},
	SCHOLAR: {
		geosite: ["category-scholar-!cn", "category-scholar-cn"],
	},
	CN: {
		geosite: [
			"geolocation-cn",
			"cn",
			"google-cn",
			"apple-cn",
			"microsoft@cn",
			"onedrive",
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
			"win-update",
			"category-antivirus",
			"category-speedtest",
			"category-ntp",
			"category-ip-geo-detect",
			"category-android-app-download",
			"category-ecommerce",
		],
		geoip: ["cloudflare"],
	},
	CLOUD: {
		geosite: ["dropbox", "mega"],
	},
} satisfies Record<string, GeoXCategory>;

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
	"onedrive",
	"category-netdisk-cn",
	"category-scholar-cn",
	"category-bank-cn",
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

/**
 * Rule-sets that should bypass local DNS (routed to fakeip / remote DNS) due
 * to censorship or DNS pollution concerns. Derived from GEOX_CATEGORIES so
 * new entries automatically propagate to DNS rules.
 *
 * - AI: only `!cn` aggregators (CN AI sites resolve locally)
 * - NON_CN: all entries
 * - DEV: all entries except `github`/`docker` (already covered by the
 *   `category-dev` aggregator)
 */
export const DNS_FAKEIP_RULE_SETS: string[] = [
	...GEOX_CATEGORIES.AI.geosite.filter((t) => t.endsWith("!cn")),
	...GEOX_CATEGORIES.NON_CN.geosite,
	...GEOX_CATEGORIES.DEV.geosite.filter((t) => t !== "github" && t !== "docker"),
];
