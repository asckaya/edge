import { DIRECT_TAG, GROUP_TAGS } from "../shared-constants";
import { GEOX_CATEGORIES_GRANULAR } from "./categories";
import type { RouteRuleDefinition } from "./types";

/**
 * ROUTE_RULES_CATEGORY: Aggregated category-based routing rules.
 */
export const ROUTE_RULES_CATEGORY: RouteRuleDefinition[] = [
	{ action: "sniff" },
	{
		type: "logical",
		mode: "or",
		rules: [{ protocol: "dns" }, { port: 53 }],
		action: "hijack-dns",
	},
	{
		type: "logical",
		mode: "and",
		rules: [{ protocol: "udp" }, { port: 443 }, { rule_set: "cn-ip", invert: true }],
		action: "reject",
	},
	{ domain_suffix: ["ts.net"], action: "route", outbound: DIRECT_TAG },
	{ rule_set: "private-ip", action: "route", outbound: GROUP_TAGS.PRIVATE_NET },
	{ rule_set: "private", action: "route", outbound: GROUP_TAGS.PRIVATE_NET },
	{ rule_set: "advertising", action: "route", outbound: GROUP_TAGS.AD_BLOCK },
	{ rule_set: "adblockfilters", action: "route", outbound: GROUP_TAGS.AD_BLOCK },
	{ rule_set: "category-speedtest", action: "route", outbound: GROUP_TAGS.SPEEDTEST },
	{ rule_set: "category-ntp", action: "route", outbound: GROUP_TAGS.NTP_SERVICES },
	{ rule_set: "category-ip-geo-detect", action: "route", outbound: GROUP_TAGS.PROXY },
	{ rule_set: "category-ai-chat-!cn", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
	{ rule_set: "openai", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
	{ rule_set: "anthropic", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
	{ rule_set: "google-gemini", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
	{ rule_set: "perplexity", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
	{ rule_set: "xai", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
	{ rule_set: "cursor", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
	{ rule_set: "windsurf", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
	{ rule_set: "trae", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
	{ rule_set: "manus", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
	{ rule_set: "jetbrains-ai", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
	{ rule_set: "openrouter", action: "route", outbound: GROUP_TAGS.AI_SERVICES },
	{ rule_set: "category-dev", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "category-container", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "microsoft-dev", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "jetbrains", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "gitlab", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "github", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "docker", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "gitee", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "stackoverflow", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "npm", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "pypi", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "huggingface", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "v2ex", action: "route", outbound: GROUP_TAGS.DEV_TOOLS },
	{ rule_set: "google", action: "route", outbound: GROUP_TAGS.GOOGLE },
	{ rule_set: "google-ip", action: "route", outbound: GROUP_TAGS.GOOGLE },
	{ rule_set: "apple-cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "apple-tvplus", action: "route", outbound: GROUP_TAGS.APPLE_VIDEO },
	{ rule_set: "apple", action: "route", outbound: GROUP_TAGS.APPLE },
	{ rule_set: "microsoft@cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "onedrive", action: "route", outbound: GROUP_TAGS.MICROSOFT },
	{ rule_set: "microsoft", action: "route", outbound: GROUP_TAGS.MICROSOFT },
	{ rule_set: "category-communication", action: "route", outbound: GROUP_TAGS.TELEGRAM },
	{ rule_set: "category-voip", action: "route", outbound: GROUP_TAGS.TELEGRAM },
	{ rule_set: "telegram-ip", action: "route", outbound: GROUP_TAGS.TELEGRAM },
	{ rule_set: "youtube", action: "route", outbound: GROUP_TAGS.YOUTUBE },
	{ rule_set: "emby", action: "route", outbound: GROUP_TAGS.EMBY },
	{ rule_set: "emby-ip", action: "route", outbound: GROUP_TAGS.EMBY },
	{ rule_set: "netflix", action: "route", outbound: GROUP_TAGS.STREAMING },
	{ rule_set: "netflix-ip", action: "route", outbound: GROUP_TAGS.STREAMING },
	{ rule_set: "disney", action: "route", outbound: GROUP_TAGS.STREAMING },
	{ rule_set: "hbo", action: "route", outbound: GROUP_TAGS.STREAMING },
	{ rule_set: "hulu", action: "route", outbound: GROUP_TAGS.STREAMING },
	{ rule_set: "primevideo", action: "route", outbound: GROUP_TAGS.STREAMING },
	{ rule_set: "category-entertainment@!cn", action: "route", outbound: GROUP_TAGS.STREAMING },
	{ rule_set: "category-media", action: "route", outbound: GROUP_TAGS.STREAMING },
	{ rule_set: "category-forums", action: "route", outbound: GROUP_TAGS.SOCIAL_MEDIA },
	{ rule_set: "category-social-media-!cn", action: "route", outbound: GROUP_TAGS.SOCIAL_MEDIA },
	{ rule_set: "pixiv", action: "route", outbound: GROUP_TAGS.SOCIAL_MEDIA },
	{ rule_set: "threads", action: "route", outbound: GROUP_TAGS.SOCIAL_MEDIA },
	{ rule_set: "steam@cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{
		rule_set: "category-game-platforms-download",
		action: "route",
		outbound: GROUP_TAGS.GAME_DOWNLOAD,
	},
	{ rule_set: "category-games-!cn", action: "route", outbound: GROUP_TAGS.GAMING },
	{ rule_set: "category-scholar-!cn", action: "route", outbound: GROUP_TAGS.EDUCATION },
	{ rule_set: "category-remote-control", action: "route", outbound: GROUP_TAGS.PRODUCTIVITY },
	{ rule_set: "category-password-management", action: "route", outbound: GROUP_TAGS.PRODUCTIVITY },
	{ rule_set: "notion", action: "route", outbound: GROUP_TAGS.PRODUCTIVITY },
	{ rule_set: "figma", action: "route", outbound: GROUP_TAGS.PRODUCTIVITY },
	{ rule_set: "tutanota", action: "route", outbound: GROUP_TAGS.PRODUCTIVITY },
	{ rule_set: "proton", action: "route", outbound: GROUP_TAGS.PRODUCTIVITY },
	{ rule_set: "category-cryptocurrency", action: "route", outbound: GROUP_TAGS.FINANCE },
	{ rule_set: "bybit", action: "route", outbound: GROUP_TAGS.FINANCE },
	{ rule_set: "bitget", action: "route", outbound: GROUP_TAGS.FINANCE },
	{ rule_set: "binance", action: "route", outbound: GROUP_TAGS.FINANCE },
	{ rule_set: "okx", action: "route", outbound: GROUP_TAGS.FINANCE },
	{ rule_set: "coinbase", action: "route", outbound: GROUP_TAGS.FINANCE },
	{ rule_set: "paypal", action: "route", outbound: GROUP_TAGS.FINANCE },
	{ rule_set: "category-bank-cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "category-finance", action: "route", outbound: GROUP_TAGS.FINANCE },
	{ rule_set: "category-tech-media", action: "route", outbound: GROUP_TAGS.NEWS },
	{ rule_set: "category-news-ir", action: "route", outbound: GROUP_TAGS.NEWS },
	{ rule_set: "category-porn", action: "route", outbound: GROUP_TAGS.ADULT },
	{ rule_set: "category-public-tracker", action: "route", outbound: GROUP_TAGS.BT_PT },
	{ rule_set: "category-pt", action: "route", outbound: GROUP_TAGS.BT_PT },
	{ rule_set: "cloudflare", action: "route", outbound: GROUP_TAGS.CLOUD },
	{ rule_set: "cloudflare-ip", action: "route", outbound: GROUP_TAGS.CLOUD },
	{ rule_set: "category-android-app-download", action: "route", outbound: GROUP_TAGS.CLOUD },
	{ rule_set: "dropbox", action: "route", outbound: GROUP_TAGS.CLOUD },
	{ rule_set: "mega", action: "route", outbound: GROUP_TAGS.CLOUD },
	{ rule_set: "geolocation-cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "cn-ip", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "category-antivirus", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "win-update", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "category-netdisk-cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "category-collaborate-cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "category-cdn-cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "category-scholar-cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "category-games@cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "category-ecommerce@cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "category-ecommerce", action: "route", outbound: GROUP_TAGS.SHOPPING },
	{ rule_set: "amazon", action: "route", outbound: GROUP_TAGS.SHOPPING },
	{ rule_set: "ebay", action: "route", outbound: GROUP_TAGS.SHOPPING },
	{ rule_set: "geolocation-!cn", action: "route", outbound: GROUP_TAGS.NON_CN },
];

/**
 * ROUTE_RULES_GRANULAR: Granular split routing rules.
 */
export const ROUTE_RULES_GRANULAR: RouteRuleDefinition[] = [
	{ action: "sniff" },
	{
		type: "logical",
		mode: "or",
		rules: [{ protocol: "dns" }, { port: 53 }],
		action: "hijack-dns",
	},
	{
		type: "logical",
		mode: "and",
		rules: [{ protocol: "udp" }, { port: 443 }, { rule_set: "cn-ip", invert: true }],
		action: "reject",
	},
	{ domain_suffix: ["ts.net"], action: "route", outbound: DIRECT_TAG },
	{ rule_set: "private-ip", action: "route", outbound: GROUP_TAGS.PRIVATE_NET },
	{ rule_set: "private", action: "route", outbound: GROUP_TAGS.PRIVATE_NET },
	{ rule_set: "advertising", action: "route", outbound: GROUP_TAGS.AD_BLOCK },
	{ rule_set: "adblockfilters", action: "route", outbound: GROUP_TAGS.AD_BLOCK },

	// AI Services
	...GEOX_CATEGORIES_GRANULAR.AI.geosite.map((tag) => ({
		rule_set: tag,
		action: "route" as const,
		outbound: GROUP_TAGS.AI_SERVICES,
	})),

	// Dev Tools
	...GEOX_CATEGORIES_GRANULAR.DEV.geosite.map((tag) => ({
		rule_set: tag,
		action: "route" as const,
		outbound: GROUP_TAGS.DEV_TOOLS,
	})),

	// Google / Apple / Microsoft
	{ rule_set: "google", action: "route", outbound: GROUP_TAGS.GOOGLE },
	{ rule_set: "google-ip", action: "route", outbound: GROUP_TAGS.GOOGLE },
	{ rule_set: "apple-cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "apple-tvplus", action: "route", outbound: GROUP_TAGS.APPLE_VIDEO },
	{ rule_set: "apple", action: "route", outbound: GROUP_TAGS.APPLE },
	{ rule_set: "microsoft@cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "onedrive", action: "route", outbound: GROUP_TAGS.MICROSOFT },
	{ rule_set: "microsoft", action: "route", outbound: GROUP_TAGS.MICROSOFT },

	// Communication & Social
	...GEOX_CATEGORIES_GRANULAR.COMMUNICATION.geosite.map((tag) => ({
		rule_set: tag,
		action: "route" as const,
		outbound: GROUP_TAGS.TELEGRAM,
	})),
	{ rule_set: "telegram-ip", action: "route", outbound: GROUP_TAGS.TELEGRAM },

	{ rule_set: "youtube", action: "route", outbound: GROUP_TAGS.YOUTUBE },
	{ rule_set: "emby", action: "route", outbound: GROUP_TAGS.EMBY },
	{ rule_set: "emby-ip", action: "route", outbound: GROUP_TAGS.EMBY },

	// Media / Streaming
	...GEOX_CATEGORIES_GRANULAR.MEDIA.geosite
		.filter((tag) => tag !== "youtube" && tag !== "apple-tvplus")
		.map((tag) => ({
			rule_set: tag,
			action: "route" as const,
			outbound: GROUP_TAGS.STREAMING,
		})),
	{ rule_set: "netflix-ip", action: "route", outbound: GROUP_TAGS.STREAMING },

	// Social Media
	...GEOX_CATEGORIES_GRANULAR.SOCIAL.geosite.map((tag) => ({
		rule_set: tag,
		action: "route" as const,
		outbound: GROUP_TAGS.SOCIAL_MEDIA,
	})),

	// Games
	{ rule_set: "steam@cn", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	...GEOX_CATEGORIES_GRANULAR.GAMES.geosite
		.filter((tag) => tag !== "steam@cn")
		.map((tag) => ({
			rule_set: tag,
			action: "route" as const,
			outbound: GROUP_TAGS.GAMING,
		})),

	// Scholar
	...GEOX_CATEGORIES_GRANULAR.SCHOLAR.geosite.map((tag) => ({
		rule_set: tag,
		action: "route" as const,
		outbound: GROUP_TAGS.EDUCATION,
	})),

	// Productivity
	...GEOX_CATEGORIES_GRANULAR.PRODUCTIVITY.geosite.map((tag) => ({
		rule_set: tag,
		action: "route" as const,
		outbound: GROUP_TAGS.PRODUCTIVITY,
	})),

	// Finance
	...GEOX_CATEGORIES_GRANULAR.FINANCE.geosite.map((tag) => ({
		rule_set: tag,
		action: "route" as const,
		outbound: GROUP_TAGS.FINANCE,
	})),

	// News
	...GEOX_CATEGORIES_GRANULAR.NEWS.geosite.map((tag) => ({
		rule_set: tag,
		action: "route" as const,
		outbound: GROUP_TAGS.NEWS,
	})),

	// Porn
	...GEOX_CATEGORIES_GRANULAR.PORN.geosite.map((tag) => ({
		rule_set: tag,
		action: "route" as const,
		outbound: GROUP_TAGS.ADULT,
	})),

	// P2P
	{ rule_set: "category-public-tracker", action: "route", outbound: GROUP_TAGS.BT_PT },
	{ rule_set: "category-pt", action: "route", outbound: GROUP_TAGS.BT_PT },

	// Cloud
	...GEOX_CATEGORIES_GRANULAR.CLOUD.geosite.map((tag) => ({
		rule_set: tag,
		action: "route" as const,
		outbound: GROUP_TAGS.CLOUD,
	})),
	{ rule_set: "cloudflare-ip", action: "route", outbound: GROUP_TAGS.CLOUD },

	// CN
	...GEOX_CATEGORIES_GRANULAR.CN.geosite.map((tag) => ({
		rule_set: tag,
		action: "route" as const,
		outbound: GROUP_TAGS.CN_SERVICES,
	})),
	{ rule_set: "cn-ip", action: "route", outbound: GROUP_TAGS.CN_SERVICES },
	{ rule_set: "win-update", action: "route", outbound: GROUP_TAGS.CN_SERVICES },

	// Fallback
	{ rule_set: "geolocation-!cn", action: "route", outbound: GROUP_TAGS.NON_CN },
];

export const ROUTE_RULES = ROUTE_RULES_CATEGORY;
