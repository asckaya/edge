// Primary: theSVG official brand SVGs
// https://testingcf.jsdelivr.net/gh/glincker/thesvg@main/public/icons/{slug}/{variant}.svg
// Variants: default (brand color) | light (dark fill for light bg) | dark (light fill for dark bg)
const THESVG = "https://testingcf.jsdelivr.net/gh/glincker/thesvg@main/public/icons/";
// Fallback: Simple Icons via jsDelivr npm CDN (Cloudflare edge)
// https://testingcf.jsdelivr.net/npm/simple-icons@latest/icons/{slug}.svg
const SI = "https://testingcf.jsdelivr.net/npm/simple-icons@latest/icons/";
// Country flags: lipis/flag-icons 4:3 rectangular SVG
const FLAG = "https://testingcf.jsdelivr.net/gh/lipis/flag-icons@main/flags/4x3/";

export interface ServiceMeta {
	label: string;
	emoji: string;
	icon: string;
}

export const SERVICE_METADATA: Record<string, ServiceMeta> = {
	// AI Services
	openai: { label: "OpenAI", emoji: "🤖", icon: `${THESVG}openai/light.svg` },
	anthropic: { label: "Anthropic", emoji: "🧠", icon: `${THESVG}anthropic/light.svg` },
	claude: { label: "Claude", emoji: "🧠", icon: `${THESVG}claude/default.svg` },
	"google-gemini": { label: "Gemini", emoji: "♊", icon: `${THESVG}google-gemini/default.svg` },
	perplexity: { label: "Perplexity", emoji: "🔍", icon: `${THESVG}perplexity/default.svg` },
	xai: { label: "xAI (Grok)", emoji: "⚡", icon: `${THESVG}x-ai/default.svg` },
	cursor: { label: "Cursor", emoji: "💻", icon: `${THESVG}cursor/light.svg` },
	windsurf: { label: "Windsurf", emoji: "🏄", icon: `${THESVG}windsurf/default.svg` },
	trae: { label: "Trae", emoji: "⚡", icon: `${THESVG}trae/default.svg` },
	manus: { label: "Manus", emoji: "📜", icon: `${THESVG}manus/default.svg` },
	"jetbrains-ai": { label: "JetBrains AI", emoji: "🧠", icon: `${THESVG}jetbrains/default.svg` },
	openrouter: { label: "OpenRouter", emoji: "🌐", icon: `${THESVG}openrouter/light.svg` },
	poe: { label: "Poe", emoji: "💬", icon: `${THESVG}poe/default.svg` },
	midjourney: { label: "Midjourney", emoji: "🎨", icon: `${THESVG}midjourney/light.svg` },
	coze: { label: "Coze", emoji: "🤖", icon: `${THESVG}coze/default.svg` },
	"meta-ai": { label: "Meta AI", emoji: "🌐", icon: `${THESVG}meta/default.svg` },
	deepseek: { label: "DeepSeek", emoji: "🐳", icon: `${THESVG}deepseek/default.svg` },
	groq: { label: "Groq", emoji: "⚡", icon: `${THESVG}groq/default.svg` },

	// Web3 & Finance
	bybit: { label: "Bybit", emoji: "📈", icon: `${THESVG}bybit/default.svg` },
	bitget: { label: "Bitget", emoji: "📈", icon: `${SI}bitget.svg` },
	binance: { label: "Binance", emoji: "📈", icon: `${THESVG}binance/default.svg` },
	okx: { label: "OKX", emoji: "📈", icon: `${THESVG}okx/default.svg` },
	coinbase: { label: "Coinbase", emoji: "📈", icon: `${THESVG}coinbase/default.svg` },
	kraken: { label: "Kraken", emoji: "🐙", icon: `${THESVG}kraken/default.svg` },
	gate: { label: "Gate.io", emoji: "📈", icon: `${SI}gate.svg` },
	kucoin: { label: "KuCoin", emoji: "📈", icon: `${THESVG}kucoin/default.svg` },
	htx: { label: "HTX (Huobi)", emoji: "📈", icon: `${SI}huobi.svg` },
	mexc: { label: "MEXC", emoji: "📈", icon: `${SI}mexc.svg` },
	crypto: { label: "Crypto.com", emoji: "💳", icon: `${SI}cryptocom.svg` },
	metamask: { label: "MetaMask", emoji: "🦊", icon: `${THESVG}metamask/default.svg` },
	uniswap: { label: "Uniswap", emoji: "🦄", icon: `${SI}uniswap.svg` },
	opensea: { label: "OpenSea", emoji: "⛵", icon: `${THESVG}opensea/default.svg` },
	paypal: { label: "PayPal", emoji: "💳", icon: `${THESVG}paypal/default.svg` },
	stripe: { label: "Stripe", emoji: "💳", icon: `${THESVG}stripe/default.svg` },
	wise: { label: "Wise", emoji: "🚀", icon: `${THESVG}wise/default.svg` },
	revolut: { label: "Revolut", emoji: "💳", icon: `${THESVG}revolut/default.svg` },

	// Dev Tools
	github: { label: "GitHub", emoji: "🐙", icon: `${THESVG}github/light.svg` },
	gitlab: { label: "GitLab", emoji: "🦊", icon: `${THESVG}gitlab/default.svg` },
	gitee: { label: "Gitee", emoji: "🔴", icon: `${THESVG}gitee/default.svg` },
	docker: { label: "Docker", emoji: "🐳", icon: `${THESVG}docker/default.svg` },
	jetbrains: { label: "JetBrains", emoji: "🧠", icon: `${THESVG}jetbrains/default.svg` },
	"microsoft-dev": { label: "Microsoft Dev", emoji: "Ⓜ️", icon: `${THESVG}microsoft/default.svg` },
	"google-dev": { label: "Google Dev", emoji: "🔍", icon: `${THESVG}google/default.svg` },
	"apple-dev": { label: "Apple Dev", emoji: "🍏", icon: `${THESVG}apple/light.svg` },
	"android-dev": { label: "Android Dev", emoji: "🤖", icon: `${THESVG}android/default.svg` },
	stackoverflow: {
		label: "StackOverflow",
		emoji: "📚",
		icon: `${THESVG}stack-overflow/default.svg`,
	},
	npm: { label: "NPM", emoji: "📦", icon: `${THESVG}npm/default.svg` },
	pypi: { label: "PyPI", emoji: "🐍", icon: `${THESVG}python/default.svg` },
	huggingface: { label: "HuggingFace", emoji: "🤗", icon: `${THESVG}huggingface/default.svg` },
	v2ex: { label: "V2EX", emoji: "💬", icon: `${THESVG}v2ex/default.svg` },
	vercel: { label: "Vercel", emoji: "▲", icon: `${THESVG}vercel/light.svg` },
	netlify: { label: "Netlify", emoji: "🌐", icon: `${THESVG}netlify/default.svg` },
	supabase: { label: "Supabase", emoji: "⚡", icon: `${THESVG}supabase/default.svg` },
	firebase: { label: "Firebase", emoji: "🔥", icon: `${THESVG}firebase/default.svg` },
	sourceforge: { label: "SourceForge", emoji: "📦", icon: `${THESVG}sourceforge/default.svg` },
	maven: { label: "Maven", emoji: "📦", icon: `${THESVG}apache/default.svg` },
	"go-dev": { label: "Go Dev", emoji: "🐹", icon: `${THESVG}go/default.svg` },
	"rust-lang": { label: "Rust Lang", emoji: "🦀", icon: `${THESVG}rust/default.svg` },
	cargo: { label: "Cargo", emoji: "📦", icon: `${THESVG}rust/default.svg` },
	deno: { label: "Deno", emoji: "🦕", icon: `${THESVG}deno/light.svg` },
	bun: { label: "Bun", emoji: "🥟", icon: `${THESVG}bun/default.svg` },
	rubygems: { label: "RubyGems", emoji: "💎", icon: `${THESVG}ruby/default.svg` },
	packagist: { label: "Packagist", emoji: "📦", icon: `${THESVG}php/default.svg` },
	cocoapods: { label: "CocoaPods", emoji: "📦", icon: `${THESVG}cocoapods/default.svg` },
	hashicorp: { label: "HashiCorp", emoji: "🏗️", icon: `${THESVG}hashicorp/default.svg` },
	postman: { label: "Postman", emoji: "🚀", icon: `${THESVG}postman/default.svg` },
	sentry: { label: "Sentry", emoji: "🛡️", icon: `${THESVG}sentry/default.svg` },
	datadog: { label: "Datadog", emoji: "🐶", icon: `${THESVG}datadog/default.svg` },
	render: { label: "Render", emoji: "🚀", icon: `${THESVG}render/default.svg` },
	railway: { label: "Railway", emoji: "🚂", icon: `${THESVG}railway/light.svg` },
	replit: { label: "Replit", emoji: "⚡", icon: `${THESVG}replit/default.svg` },

	// Media & Streaming
	youtube: { label: "YouTube", emoji: "📹", icon: `${THESVG}youtube/default.svg` },
	netflix: { label: "Netflix", emoji: "🎬", icon: `${THESVG}netflix/default.svg` },
	disney: { label: "Disney+", emoji: "🏰", icon: `${THESVG}disneyplus/default.svg` },
	hbo: { label: "HBO", emoji: "🎬", icon: `${THESVG}hbo/default.svg` },
	hulu: { label: "Hulu", emoji: "🎬", icon: `${THESVG}hulu/default.svg` },
	peacock: { label: "Peacock", emoji: "🦚", icon: `${SI}peacock.svg` },
	primevideo: { label: "Prime Video", emoji: "🎬", icon: `${THESVG}amazon/default.svg` },
	"apple-tvplus": { label: "Apple TV+", emoji: "🎬", icon: `${THESVG}apple/light.svg` },
	spotify: { label: "Spotify", emoji: "🎵", icon: `${THESVG}spotify/default.svg` },
	twitch: { label: "Twitch", emoji: "💜", icon: `${THESVG}twitch/default.svg` },
	tiktok: { label: "TikTok", emoji: "🎵", icon: `${THESVG}tiktok/default.svg` },
	abema: { label: "AbemaTV", emoji: "📺", icon: `${SI}abema.svg` },
	bahamut: { label: "巴哈姆特", emoji: "🎮", icon: `${SI}bahamutanime.svg` },
	niconico: { label: "Niconico", emoji: "📺", icon: `${THESVG}niconico/default.svg` },
	dmm: { label: "DMM", emoji: "🔞", icon: `${SI}dmm.svg` },
	tver: { label: "TVer", emoji: "📺", icon: `${SI}tver.svg` },
	radiko: { label: "Radiko", emoji: "📻", icon: `${SI}radiko.svg` },
	"u-next": { label: "U-NEXT", emoji: "🎬", icon: `${SI}unext.svg` },
	unext: { label: "U-NEXT", emoji: "🎬", icon: `${SI}unext.svg` },
	"d-anime-store": { label: "d动漫商城", emoji: "📺", icon: `${SI}crunchyroll.svg` },
	kktv: { label: "KKTV", emoji: "📺", icon: `${SI}kktv.svg` },
	"line-tv": { label: "LINE TV", emoji: "📺", icon: `${SI}line.svg` },
	catchplay: { label: "CatchPlay", emoji: "🎬", icon: `${SI}vudu.svg` },
	tvb: { label: "TVB", emoji: "📺", icon: `${SI}tvb.svg` },
	mytvsuper: { label: "myTV SUPER", emoji: "📺", icon: `${SI}tvb.svg` },
	viutv: { label: "ViuTV", emoji: "📺", icon: `${SI}viu.svg` },
	viu: { label: "ViuTV", emoji: "📺", icon: `${SI}viu.svg` },
	bbc: { label: "BBC iPlayer", emoji: "🇬🇧", icon: `${THESVG}bbc/default.svg` },
	itv: { label: "ITVX", emoji: "🇬🇧", icon: `${SI}itv.svg` },
	channel4: { label: "Channel 4", emoji: "🇬🇧", icon: `${SI}channel4.svg` },

	// Games & Regional Services
	cygames: { label: "Cygames", emoji: "🐎", icon: `${SI}cygames.svg` },
	eplus: { label: "eplus", emoji: "🎫", icon: `${SI}ticketmaster.svg` },
	melonbooks: { label: "Melonbooks", emoji: "🍈", icon: `${SI}gumroad.svg` },
	toranoana: { label: "虎之穴", emoji: "🐯", icon: `${SI}gumroad.svg` },
	mercari: { label: "Mercari", emoji: "🛍️", icon: `${SI}mercari.svg` },

	// Social & Communication
	twitter: { label: "Twitter (X)", emoji: "🐦", icon: `${THESVG}twitter/default.svg` },
	facebook: { label: "Facebook", emoji: "📘", icon: `${THESVG}facebook/default.svg` },
	instagram: { label: "Instagram", emoji: "📷", icon: `${THESVG}instagram/default.svg` },
	reddit: { label: "Reddit", emoji: "🤖", icon: `${THESVG}reddit/default.svg` },
	linkedin: { label: "LinkedIn", emoji: "💼", icon: `${THESVG}linkedin/default.svg` },
	pixiv: { label: "Pixiv", emoji: "🎨", icon: `${THESVG}pixiv/default.svg` },
	threads: { label: "Threads", emoji: "🌀", icon: `${THESVG}threads/light.svg` },
	telegram: { label: "Telegram", emoji: "📲", icon: `${THESVG}telegram/default.svg` },
	signal: { label: "Signal", emoji: "🔒", icon: `${THESVG}signal/default.svg` },
	line: { label: "Line", emoji: "💬", icon: `${THESVG}line/default.svg` },
	whatsapp: { label: "WhatsApp", emoji: "💬", icon: `${THESVG}whatsapp/default.svg` },
	discord: { label: "Discord", emoji: "💬", icon: `${THESVG}discord/default.svg` },

	// Games
	steam: { label: "Steam", emoji: "🎮", icon: `${THESVG}steam/default.svg` },
	epic: { label: "Epic Games", emoji: "🎮", icon: `${THESVG}epic-games/default.svg` },
	nintendo: { label: "Nintendo", emoji: "🎮", icon: `${THESVG}nintendo/default.svg` },
	playstation: { label: "PlayStation", emoji: "🎮", icon: `${THESVG}playstation/default.svg` },
	xbox: { label: "Xbox", emoji: "🎮", icon: `${THESVG}xbox/default.svg` },

	// Productivity & Infrastructure
	notion: { label: "Notion", emoji: "📝", icon: `${THESVG}notion/default.svg` },
	figma: { label: "Figma", emoji: "🎨", icon: `${THESVG}figma/default.svg` },
	"1password": { label: "1Password", emoji: "🔒", icon: `${THESVG}1password/default.svg` },
	bitwarden: { label: "Bitwarden", emoji: "🔒", icon: `${THESVG}bitwarden/default.svg` },
	proton: { label: "Proton", emoji: "✉️", icon: `${THESVG}proton/default.svg` },
	slack: { label: "Slack", emoji: "💬", icon: `${THESVG}slack/default.svg` },
	zoom: { label: "Zoom", emoji: "📹", icon: `${THESVG}zoom/default.svg` },
	google: { label: "Google", emoji: "🔍", icon: `${THESVG}google/default.svg` },
	apple: { label: "Apple", emoji: "🍏", icon: `${THESVG}apple/light.svg` },
	microsoft: { label: "Microsoft", emoji: "Ⓜ️", icon: `${THESVG}microsoft/default.svg` },
	onedrive: { label: "OneDrive", emoji: "☁️", icon: `${THESVG}microsoft/default.svg` },
	amazon: { label: "Amazon", emoji: "🛒", icon: `${THESVG}amazon/default.svg` },
	ebay: { label: "eBay", emoji: "🛒", icon: `${THESVG}ebay/default.svg` },
	emby: { label: "EMBY 专线", emoji: "🎥", icon: `${THESVG}emby/default.svg` },
};

export function getGranularOutboundTag(tag: string, fallbackGroupTag?: string): string {
	const meta = SERVICE_METADATA[tag];
	if (meta) {
		return meta.label;
	}
	if (fallbackGroupTag) {
		return fallbackGroupTag;
	}
	return tag.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export const GROUP_ICONS: Record<string, string> = {
	// Top & Core Groups
	"🚀 节点选择": `${THESVG}rocket/default.svg`,
	"⚡ 自动选择": `${THESVG}lightning/default.svg`,
	"♻️ 自动选择": `${THESVG}lightning/default.svg`,
	"🔒 国内服务": `${FLAG}cn.svg`,
	"🛑 广告拦截": `${THESVG}adblock/default.svg`,
	DIRECT: `${SI}v2ray.svg`,
	REJECT: `${SI}adblock.svg`,
	"🏠 私有网络": `${THESVG}home-assistant/default.svg`,
	"🕓 NTP 服务": `${SI}clockify.svg`,
	"🧲 BT/PT": `${THESVG}bittorrent/default.svg`,
	"🐟 漏网之鱼": `${SI}fish.svg`,
	"Self-Hosted": `${THESVG}proxmox/default.svg`,
	Tailscale: `${THESVG}tailscale/default.svg`,

	// Region Groups (Standard 4:3 Rectangular SVG Flags from lipis/flag-icons)
	"🇭🇰 香港节点": `${FLAG}hk.svg`,
	"🇯🇵 日本节点": `${FLAG}jp.svg`,
	"🇺🇸 美国节点": `${FLAG}us.svg`,
	"🇸🇬 新加坡节点": `${FLAG}sg.svg`,
	"🇹🇼 台湾节点": `${FLAG}tw.svg`,
	"🇦🇺 澳大利亚节点": `${FLAG}au.svg`,
	"🇬🇧 英国节点": `${FLAG}gb.svg`,
	"🇩🇪 德国节点": `${FLAG}de.svg`,

	// Category Groups
	"🇯🇵 日本服务": `${FLAG}jp.svg`,
	"🇹🇼 台湾服务": `${FLAG}tw.svg`,
	"🇭🇰 香港服务": `${FLAG}hk.svg`,
	"🇬🇧 英国服务": `${FLAG}gb.svg`,
	"💬 AI 服务": `${THESVG}openai/light.svg`,
	"📹 油管视频": `${THESVG}youtube/default.svg`,
	"🔍 谷歌服务": `${THESVG}google/default.svg`,
	"📲 电报消息": `${THESVG}telegram/default.svg`,
	"🐱 开发工具": `${THESVG}github/light.svg`,
	"Ⓜ️ 微软服务": `${THESVG}microsoft/default.svg`,
	"🍏 苹果服务": `${THESVG}apple/light.svg`,
	"🌐 社交媒体": `${THESVG}twitter/default.svg`,
	"🎬 流媒体": `${THESVG}netflix/default.svg`,
	"🎮 游戏平台": `${THESVG}steam/default.svg`,
	"🛠️ 生产力工具": `${THESVG}notion/default.svg`,
};

// Build complete icon map dynamically from SERVICE_METADATA
for (const [, meta] of Object.entries(SERVICE_METADATA)) {
	GROUP_ICONS[meta.label] = meta.icon;
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
