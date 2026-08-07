const ICON_BASE = "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/";

export interface ServiceMeta {
	label: string;
	emoji: string;
	icon: string;
}

export const SERVICE_METADATA: Record<string, ServiceMeta> = {
	// AI Services
	openai: { label: "OpenAI", emoji: "🤖", icon: "ChatGPT.png" },
	anthropic: { label: "Anthropic", emoji: "🧠", icon: "Anthropic.png" },
	claude: { label: "Claude", emoji: "🧠", icon: "Claude.png" },
	"google-gemini": { label: "Gemini", emoji: "♊", icon: "Gemini.png" },
	perplexity: { label: "Perplexity", emoji: "🔍", icon: "Perplexity.png" },
	xai: { label: "xAI (Grok)", emoji: "⚡", icon: "X.png" },
	cursor: { label: "Cursor", emoji: "💻", icon: "Cursor.png" },
	windsurf: { label: "Windsurf", emoji: "🏄", icon: "Windsurf.png" },
	trae: { label: "Trae", emoji: "⚡", icon: "Trae.png" },
	manus: { label: "Manus", emoji: "📜", icon: "Manus.png" },
	"jetbrains-ai": { label: "JetBrains AI", emoji: "🧠", icon: "JetBrains.png" },
	openrouter: { label: "OpenRouter", emoji: "🌐", icon: "OpenRouter.png" },
	poe: { label: "Poe", emoji: "💬", icon: "Poe.png" },
	midjourney: { label: "Midjourney", emoji: "🎨", icon: "Midjourney.png" },
	coze: { label: "Coze", emoji: "🤖", icon: "Coze.png" },
	"meta-ai": { label: "Meta AI", emoji: "🌐", icon: "Meta.png" },
	deepseek: { label: "DeepSeek", emoji: "🐳", icon: "DeepSeek.png" },
	groq: { label: "Groq", emoji: "⚡", icon: "Groq.png" },

	// Web3 & Finance
	bybit: { label: "Bybit", emoji: "📈", icon: "Bybit.png" },
	bitget: { label: "Bitget", emoji: "📈", icon: "Bitget.png" },
	binance: { label: "Binance", emoji: "📈", icon: "Binance.png" },
	okx: { label: "OKX", emoji: "📈", icon: "OKX.png" },
	coinbase: { label: "Coinbase", emoji: "📈", icon: "Coinbase.png" },
	kraken: { label: "Kraken", emoji: "🐙", icon: "Kraken.png" },
	gate: { label: "Gate.io", emoji: "📈", icon: "Gate.png" },
	kucoin: { label: "KuCoin", emoji: "📈", icon: "KuCoin.png" },
	htx: { label: "HTX (Huobi)", emoji: "📈", icon: "HTX.png" },
	mexc: { label: "MEXC", emoji: "📈", icon: "MEXC.png" },
	crypto: { label: "Crypto.com", emoji: "💳", icon: "Crypto.png" },
	metamask: { label: "MetaMask", emoji: "🦊", icon: "MetaMask.png" },
	uniswap: { label: "Uniswap", emoji: "🦄", icon: "Uniswap.png" },
	opensea: { label: "OpenSea", emoji: "⛵", icon: "OpenSea.png" },
	paypal: { label: "PayPal", emoji: "💳", icon: "PayPal.png" },
	stripe: { label: "Stripe", emoji: "💳", icon: "Stripe.png" },
	wise: { label: "Wise", emoji: "🚀", icon: "Wise.png" },
	revolut: { label: "Revolut", emoji: "💳", icon: "Revolut.png" },

	// Dev Tools
	github: { label: "GitHub", emoji: "🐙", icon: "GitHub.png" },
	gitlab: { label: "GitLab", emoji: "🦊", icon: "GitLab.png" },
	gitee: { label: "Gitee", emoji: "🔴", icon: "Gitee.png" },
	docker: { label: "Docker", emoji: "🐳", icon: "Docker.png" },
	jetbrains: { label: "JetBrains", emoji: "🧠", icon: "JetBrains.png" },
	"microsoft-dev": { label: "Microsoft Dev", emoji: "Ⓜ️", icon: "Microsoft.png" },
	"google-dev": { label: "Google Dev", emoji: "🔍", icon: "Google_Search.png" },
	"apple-dev": { label: "Apple Dev", emoji: "🍏", icon: "Apple.png" },
	"android-dev": { label: "Android Dev", emoji: "🤖", icon: "Android.png" },
	stackoverflow: { label: "StackOverflow", emoji: "📚", icon: "StackOverflow.png" },
	npm: { label: "NPM", emoji: "📦", icon: "NPM.png" },
	pypi: { label: "PyPI", emoji: "🐍", icon: "Python.png" },
	huggingface: { label: "HuggingFace", emoji: "🤗", icon: "HuggingFace.png" },
	v2ex: { label: "V2EX", emoji: "💬", icon: "V2EX.png" },
	vercel: { label: "Vercel", emoji: "▲", icon: "Vercel.png" },
	netlify: { label: "Netlify", emoji: "🌐", icon: "Netlify.png" },
	supabase: { label: "Supabase", emoji: "⚡", icon: "Supabase.png" },
	firebase: { label: "Firebase", emoji: "🔥", icon: "Firebase.png" },

	// Media & Streaming
	youtube: { label: "YouTube", emoji: "📹", icon: "YouTube.png" },
	netflix: { label: "Netflix", emoji: "🎬", icon: "Netflix.png" },
	disney: { label: "Disney+", emoji: "🏰", icon: "Disney+.png" },
	hbo: { label: "HBO", emoji: "🎬", icon: "HBO.png" },
	hulu: { label: "Hulu", emoji: "🎬", icon: "Hulu.png" },
	primevideo: { label: "Prime Video", emoji: "🎬", icon: "Prime_Video.png" },
	"apple-tvplus": { label: "Apple TV+", emoji: "🎬", icon: "Apple_TV.png" },
	spotify: { label: "Spotify", emoji: "🎵", icon: "Spotify.png" },
	twitch: { label: "Twitch", emoji: "💜", icon: "Twitch.png" },
	tiktok: { label: "TikTok", emoji: "🎵", icon: "TikTok.png" },
	abema: { label: "AbemaTV", emoji: "📺", icon: "AbemaTV.png" },
	bahamut: { label: "巴哈姆特", emoji: "🎮", icon: "Bahamut.png" },
	niconico: { label: "Niconico", emoji: "📺", icon: "Niconico.png" },

	// Social & Communication
	twitter: { label: "Twitter (X)", emoji: "🐦", icon: "Twitter.png" },
	facebook: { label: "Facebook", emoji: "📘", icon: "Facebook.png" },
	instagram: { label: "Instagram", emoji: "📷", icon: "Instagram.png" },
	reddit: { label: "Reddit", emoji: "🤖", icon: "Reddit.png" },
	linkedin: { label: "LinkedIn", emoji: "💼", icon: "LinkedIn.png" },
	pixiv: { label: "Pixiv", emoji: "🎨", icon: "Pixiv.png" },
	threads: { label: "Threads", emoji: "🌀", icon: "Threads.png" },
	telegram: { label: "Telegram", emoji: "📲", icon: "Telegram.png" },
	signal: { label: "Signal", emoji: "🔒", icon: "Signal.png" },
	line: { label: "Line", emoji: "💬", icon: "Line.png" },
	whatsapp: { label: "WhatsApp", emoji: "💬", icon: "WhatsApp.png" },
	discord: { label: "Discord", emoji: "💬", icon: "Discord.png" },

	// Games
	steam: { label: "Steam", emoji: "🎮", icon: "Steam.png" },
	epic: { label: "Epic Games", emoji: "🎮", icon: "Epic.png" },
	nintendo: { label: "Nintendo", emoji: "🎮", icon: "Nintendo.png" },
	playstation: { label: "PlayStation", emoji: "🎮", icon: "PlayStation.png" },
	xbox: { label: "Xbox", emoji: "🎮", icon: "Xbox.png" },

	// Productivity & Infrastructure
	notion: { label: "Notion", emoji: "📝", icon: "Notion.png" },
	figma: { label: "Figma", emoji: "🎨", icon: "Figma.png" },
	"1password": { label: "1Password", emoji: "🔒", icon: "1Password.png" },
	bitwarden: { label: "Bitwarden", emoji: "🔒", icon: "Bitwarden.png" },
	proton: { label: "Proton", emoji: "✉️", icon: "ProtonMail.png" },
	slack: { label: "Slack", emoji: "💬", icon: "Slack.png" },
	zoom: { label: "Zoom", emoji: "📹", icon: "Zoom.png" },
	google: { label: "Google", emoji: "🔍", icon: "Google_Search.png" },
	apple: { label: "Apple", emoji: "🍏", icon: "Apple.png" },
	microsoft: { label: "Microsoft", emoji: "Ⓜ️", icon: "Microsoft.png" },
	onedrive: { label: "OneDrive", emoji: "☁️", icon: "OneDrive.png" },
	amazon: { label: "Amazon", emoji: "🛒", icon: "Amazon.png" },
	ebay: { label: "eBay", emoji: "🛒", icon: "eBay.png" },
	emby: { label: "EMBY 专线", emoji: "🎥", icon: "Emby.png" },
};

export function getGranularOutboundTag(tag: string, fallbackGroupTag?: string): string {
	const meta = SERVICE_METADATA[tag];
	if (meta) {
		return meta.label;
	}
	if (fallbackGroupTag) {
		return fallbackGroupTag;
	}
	// Fallback auto-format for unregistered service tags
	return tag.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export const GROUP_ICONS: Record<string, string> = {
	// Top & Core Groups
	"🚀 节点选择": `${ICON_BASE}Proxy.png`,
	"⚡ 自动选择": `${ICON_BASE}Auto.png`,
	"♻️ 自动选择": `${ICON_BASE}Auto.png`,
	"🔒 国内服务": `${ICON_BASE}China.png`,
	"🛑 广告拦截": `${ICON_BASE}Ady.png`,
	DIRECT: `${ICON_BASE}Direct.png`,
	REJECT: `${ICON_BASE}Reject.png`,
	"🏠 私有网络": `${ICON_BASE}Lan.png`,
	"🕓 NTP 服务": `${ICON_BASE}Clock.png`,
	"🧲 BT/PT": `${ICON_BASE}Download.png`,
	"🐟 漏网之鱼": `${ICON_BASE}Final.png`,
	"Self-Hosted": `${ICON_BASE}Server.png`,
	Tailscale: `${ICON_BASE}Tailscale.png`,

	// Region Groups
	"🇭🇰 香港节点": `${ICON_BASE}HK.png`,
	"🇯🇵 日本节点": `${ICON_BASE}JP.png`,
	"🇺🇸 美国节点": `${ICON_BASE}US.png`,
	"🇸🇬 新加坡节点": `${ICON_BASE}SG.png`,
	"🇹🇼 台湾节点": `${ICON_BASE}TW.png`,
	"🇦🇺 澳大利亚节点": `${ICON_BASE}AU.png`,
	"🇬🇧 英国节点": `${ICON_BASE}UK.png`,
	"🇩🇪 德国节点": `${ICON_BASE}DE.png`,

	// Category Groups (Emoji & Plain)
	"💬 AI 服务": `${ICON_BASE}ChatGPT.png`,
	"AI 服务": `${ICON_BASE}ChatGPT.png`,
	"📹 油管视频": `${ICON_BASE}YouTube.png`,
	油管视频: `${ICON_BASE}YouTube.png`,
	"🔍 谷歌服务": `${ICON_BASE}Google_Search.png`,
	谷歌服务: `${ICON_BASE}Google_Search.png`,
	"📲 电报消息": `${ICON_BASE}Telegram.png`,
	电报消息: `${ICON_BASE}Telegram.png`,
	"🐱 开发工具": `${ICON_BASE}GitHub.png`,
	开发工具: `${ICON_BASE}GitHub.png`,
	"Ⓜ️ 微软服务": `${ICON_BASE}Microsoft.png`,
	微软服务: `${ICON_BASE}Microsoft.png`,
	"🍏 苹果服务": `${ICON_BASE}Apple.png`,
	苹果服务: `${ICON_BASE}Apple.png`,
	"🎬 苹果视频": `${ICON_BASE}Apple_TV.png`,
	苹果视频: `${ICON_BASE}Apple_TV.png`,
	"🌐 社交媒体": `${ICON_BASE}Twitter.png`,
	社交媒体: `${ICON_BASE}Twitter.png`,
	"🎬 流媒体": `${ICON_BASE}Netflix.png`,
	流媒体: `${ICON_BASE}Netflix.png`,
	"🎥 EMBY 专线": `${ICON_BASE}Emby.png`,
	"EMBY 专线": `${ICON_BASE}Emby.png`,
	"🎮 游戏平台": `${ICON_BASE}Steam.png`,
	游戏平台: `${ICON_BASE}Steam.png`,
	"🎮 游戏下载": `${ICON_BASE}Game.png`,
	游戏下载: `${ICON_BASE}Game.png`,
	"📚 教育资源": `${ICON_BASE}Scholar.png`,
	教育资源: `${ICON_BASE}Scholar.png`,
	"🛠️ 生产力工具": `${ICON_BASE}Work.png`,
	生产力工具: `${ICON_BASE}Work.png`,
	"💰 金融服务": `${ICON_BASE}Card.png`,
	金融服务: `${ICON_BASE}Card.png`,
	"📰 新闻资讯": `${ICON_BASE}News.png`,
	新闻资讯: `${ICON_BASE}News.png`,
	"🔞 成人内容": `${ICON_BASE}Pornhub.png`,
	成人内容: `${ICON_BASE}Pornhub.png`,
	"☁️ 云服务": `${ICON_BASE}Cloud.png`,
	云服务: `${ICON_BASE}Cloud.png`,
	"🌐 非中国": `${ICON_BASE}Global.png`,
	非中国: `${ICON_BASE}Global.png`,
	"🛒 购物网站": `${ICON_BASE}Shopping.png`,
	购物网站: `${ICON_BASE}Shopping.png`,
	"🧪 测速专线": `${ICON_BASE}Speedtest.png`,
	测速专线: `${ICON_BASE}Speedtest.png`,
};

// Build complete icon map dynamically from SERVICE_METADATA
for (const [, meta] of Object.entries(SERVICE_METADATA)) {
	GROUP_ICONS[meta.label] = `${ICON_BASE}${meta.icon}`;
}

export function getGroupIcon(groupName: string): string | undefined {
	if (GROUP_ICONS[groupName]) {
		return GROUP_ICONS[groupName];
	}
	const cleanName = groupName
		.replace(/^[\p{Extended_Pictographic}\p{Regional_Indicator}\s]+/u, "")
		.trim();
	return GROUP_ICONS[cleanName];
}
