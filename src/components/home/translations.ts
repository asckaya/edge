export type Language = "zh" | "en";

export const HOME_TRANSLATIONS = {
	zh: {
		rawProxies: "自建单节点 (Raw Proxies)",
		injectNode: "导入单节点",
		remoteProviders: "远程订阅提供商 (Remote Providers)",
		settings: "编排配置选项 (Orchestration Settings)",
		targetKernel: "目标运行内核",
		secret: "控制密钥 (Secret)",
		secretPlaceholder: "Mihomo / sing-box 外部控制密钥",
		mirror: "规则镜像源 (Mirror)",
		mirrorPlaceholder: "直连下载 (默认)",
		activeSubs: "活跃订阅源",
		customNodes: "自建节点数",
		activeKernel: "当前内核",
		runtimeEnv: "运行环境",
		latency: "处理延迟",
		coreStatus: "引擎状态",
		running: "运行中",
		latencyVal: "< 0.1ms",
	},
	en: {
		rawProxies: "Custom Proxies (Raw Proxies)",
		injectNode: "Inject Node",
		remoteProviders: "Remote Providers",
		settings: "Orchestration Settings",
		targetKernel: "Kernel Target",
		secret: "Controller Secret",
		secretPlaceholder: "Mihomo / sing-box password",
		mirror: "Mirror Path",
		mirrorPlaceholder: "Direct Connection (Default)",
		activeSubs: "Active Providers",
		customNodes: "Custom Nodes",
		activeKernel: "Active Kernel",
		runtimeEnv: "Environment",
		latency: "Latency",
		coreStatus: "Core Status",
		running: "OPERATIONAL",
		latencyVal: "< 0.1ms",
	},
} as const;

export const COMMON_GH_PROXIES = [
	"https://gh-proxy.com/",
	"https://ghfast.top/",
	"https://ghproxy.net/",
	"https://mirror.ghproxy.com/",
];
