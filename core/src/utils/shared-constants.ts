export const GROUP_TAGS = {
	PROXY: "🚀 节点选择",
	DIRECT: "DIRECT",
	REJECT: "REJECT",
	AD_BLOCK: "🛑 广告拦截",
	CN_SERVICES: "🔒 国内服务",
	PRIVATE_NET: "🏠 私有网络",
	NTP_SERVICES: "🕓 NTP 服务",
	BT_PT: "🧲 BT/PT",
	AI_SERVICES: "💬 AI 服务",
	YOUTUBE: "📹 油管视频",
	GOOGLE: "🔍 谷歌服务",
	TELEGRAM: "📲 电报消息",
	DEV_TOOLS: "🐱 开发工具",
	MICROSOFT: "Ⓜ️ 微软服务",
	APPLE: "🍏 苹果服务",
	APPLE_VIDEO: "🎬 苹果视频",
	SOCIAL_MEDIA: "🌐 社交媒体",
	STREAMING: "🎬 流媒体",
	EMBY: "🎥 EMBY 专线",
	GAMING: "🎮 游戏平台",
	GAME_DOWNLOAD: "🎮 游戏下载",
	EDUCATION: "📚 教育资源",
	PRODUCTIVITY: "🛠️ 生产力工具",
	FINANCE: "💰 金融服务",
	NEWS: "📰 新闻资讯",
	ADULT: "🔞 成人内容",
	CLOUD: "☁️ 云服务",
	NON_CN: "🌐 非中国",
	SHOPPING: "🛒 购物网站",
	SPEEDTEST: "🧪 测速专线",
	FINAL: "🐟 漏网之鱼",
};

// Backwards compatibility for PROXY_SELECTOR_TAG, DIRECT_TAG
export const PROXY_SELECTOR_TAG = GROUP_TAGS.PROXY;
export const DIRECT_TAG = GROUP_TAGS.DIRECT;

export const SCENARIO_GROUPS = [
	GROUP_TAGS.SHOPPING,
	GROUP_TAGS.FINAL,
	GROUP_TAGS.SPEEDTEST,
	GROUP_TAGS.AI_SERVICES,
	GROUP_TAGS.YOUTUBE,
	GROUP_TAGS.GOOGLE,
	GROUP_TAGS.TELEGRAM,
	GROUP_TAGS.DEV_TOOLS,
	GROUP_TAGS.MICROSOFT,
	GROUP_TAGS.APPLE,
	GROUP_TAGS.APPLE_VIDEO,
	GROUP_TAGS.SOCIAL_MEDIA,
	GROUP_TAGS.STREAMING,
	GROUP_TAGS.EMBY,
	GROUP_TAGS.GAMING,
	GROUP_TAGS.GAME_DOWNLOAD,
	GROUP_TAGS.EDUCATION,
	GROUP_TAGS.PRODUCTIVITY,
	GROUP_TAGS.FINANCE,
	GROUP_TAGS.NEWS,
	GROUP_TAGS.ADULT,
	GROUP_TAGS.CLOUD,
	GROUP_TAGS.NON_CN,
];

export const CORE_GROUPS = [
	GROUP_TAGS.CN_SERVICES,
	GROUP_TAGS.AD_BLOCK,
	GROUP_TAGS.DIRECT,
	GROUP_TAGS.REJECT,
	GROUP_TAGS.PROXY,
];

export const DIRECT_REDIRECT_GROUPS = [
	GROUP_TAGS.BT_PT,
	GROUP_TAGS.PRIVATE_NET,
	GROUP_TAGS.NTP_SERVICES,
];

export const FAKE_IP_RANGE = "198.18.0.1/16";
export const FAKE_IP_RANGE_SINGBOX = "198.18.0.0/15";
export const HEALTH_CHECK_URL = "https://cp.cloudflare.com/generate_204";

export const MIXED_PORT = 7897;
export const CLASH_API_PORT = 9090;
export const EXTERNAL_UI_URL =
	"https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip";
export const TUN_EXCLUDE_ADDRESSES = [
	"10.0.0.0/8",
	"100.64.0.0/10",
	"100.100.100.101/32",
	"172.16.0.0/12",
	"192.168.0.0/16",
];
export const DNS_LOCAL_SERVER = "223.5.5.5";
export const DNS_REMOTE_SERVER = "8.8.8.8";

// Region node groups. `filter` is the mihomo regex filter; sing-box uses
// extractCountryCodeFromName (in sing-box/tags.ts) and only needs code+tag.
export const REGION_GROUPS = [
	{
		code: "HK",
		tag: "🇭🇰 香港节点",
		filter:
			"^(?i)(?=.*(香港|港深|深港|沪港|广港|陆港|(?<![a-zA-Z])(hk|hkg)(?![a-zA-Z])|hongkong|hong kong|🇭🇰))(?!.*(排除)).*$",
	},
	{
		code: "JP",
		tag: "🇯🇵 日本节点",
		filter:
			"^(?i)(?=.*(日本|东京|大阪|京都|神奈川|琦玉|(?<![a-zA-Z])(jp|nrt|hnd|kix|cts|fuk)(?![a-zA-Z])|japan|tokyo|🇯🇵))(?!.*(排除)).*$",
	},
	{
		code: "US",
		tag: "🇺🇸 美国节点",
		filter:
			"^(?i)(?=.*(美国|美东|美西|美中|美南|美港|美日|中美|美专|(?<![a-zA-Z])(us|usa|lax|sfo|jfk|sjc)(?![a-zA-Z])|america|united states|🇺🇸))(?!.*(排除)).*$",
	},
	{
		code: "SG",
		tag: "🇸🇬 新加坡节点",
		filter:
			"^(?i)(?=.*(新加坡|坡县|坡|狮城|(?<![a-zA-Z])(sg|sin|xsp)(?![a-zA-Z])|singapore|🇸🇬))(?!.*(排除)).*$",
	},
	{
		code: "TW",
		tag: "🇹🇼 台湾节点",
		filter:
			"^(?i)(?=.*(台湾|台北|台中|台南|台东|湾湾|(?<![a-zA-Z])(tw|tpe|khh|tsa)(?![a-zA-Z])|taiwan|taipei|🇹🇼|🇼🇸))(?!.*(排除)).*$",
	},
] as const;
