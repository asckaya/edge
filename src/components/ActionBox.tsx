import {
	Check,
	Copy,
	Cpu,
	ExternalLink,
	Layers,
	Link2,
	Loader2,
	Scissors,
	Terminal,
} from "lucide-react";
import { useState } from "react";
import InteractiveCard from "@/components/home/InteractiveCard";
import { buildConfigUrl } from "@/lib/build-url";
import type {
	ProxiesValidationResult,
	Subscription,
	SubscriptionAnalysis,
} from "@/lib/subscriptions";

interface ActionBoxProps {
	proxiesText: string;
	subs: Subscription[];
	configType: string;
	ghProxy?: string;
	secret: string;
	lang?: "zh" | "en";
	proxiesValidation?: ProxiesValidationResult;
	/** Pre-computed subscription analysis (lifted to page level). */
	subscriptionAnalysis: SubscriptionAnalysis;
	/** Pre-computed count of non-empty proxy lines (lifted to page level). */
	customNodesCount: number;
}

const TRANSLATIONS_ACTION = {
	zh: {
		generateSuccess: "生成配置订阅链接",
		fillParams: "请先填写上方必要参数",
		console: "部署控制台 (Deployment Console)",
		copyTitle: "复制订阅链接",
		openTitle: "在新窗口中打开测试",
		kernel: "目标客户端内核",
		depth: "分流编排模式",
		activeSubs: "活跃远程订阅源",
		customNodes: "自建单节点数",
		channels: "个订阅渠道",
		nodes: "个导入节点",
		prompt: "直接复制此链接并粘贴到您的 Clash / Stash / sing-box 客户端订阅中即可。",
		shorten: "转短链接",
		shortening: "生成中…",
		shortenFailed: "短链接生成失败",
		shortened: "已转为短链接",
		restore: "还原原链接",
	},
	en: {
		generateSuccess: "Generate Config Endpoint",
		fillParams: "Fill Required Parameters",
		console: "Deployment Console",
		copyTitle: "Copy Endpoint URL",
		openTitle: "Open Endpoint in New Tab",
		kernel: "Target Kernel",
		depth: "Orchestration Depth",
		activeSubs: "Active Subscriptions",
		customNodes: "Custom Endpoints",
		channels: "remote provider(s)",
		nodes: "custom node(s)",
		prompt: "Import this endpoint URL directly into your Mihomo, Stash, or sing-box client.",
		shorten: "Shorten",
		shortening: "Generating…",
		shortenFailed: "Shorten failed",
		shortened: "Shortened",
		restore: "Restore original",
	},
};

export default function ActionBox({
	proxiesText,
	subs,
	configType,
	ghProxy,
	secret,
	lang = "zh",
	proxiesValidation,
	subscriptionAnalysis,
	customNodesCount,
}: ActionBoxProps) {
	const [resultUrl, setResultUrl] = useState("");
	const [displayUrl, setDisplayUrl] = useState("");
	const [originalUrl, setOriginalUrl] = useState("");
	const [copied, setCopied] = useState(false);
	const [shortening, setShortening] = useState(false);
	const [shortenError, setShortenError] = useState<string | null>(null);
	const [isShortened, setIsShortened] = useState(false);

	const isAtLeastOneProvided = proxiesText.trim() !== "" || subscriptionAnalysis.activeCount > 0;
	const isProxiesValid = proxiesValidation ? proxiesValidation.isValid : true;
	const isValid =
		isAtLeastOneProvided &&
		subscriptionAnalysis.allNamesSafe &&
		subscriptionAnalysis.allUrlsValid &&
		subscriptionAnalysis.duplicateNames.size === 0 &&
		isProxiesValid;

	const generateUrl = () => {
		const url = buildConfigUrl({
			origin: window.location.origin,
			configType,
			secret,
			subscriptions: subs,
			proxiesText,
			ghProxy,
		});
		setResultUrl(url);
		setDisplayUrl(url);
		setOriginalUrl(url);
		setCopied(false);
		setIsShortened(false);
		setShortenError(null);
	};

	const shortenUrl = async () => {
		if (!resultUrl) return;
		setShortening(true);
		setShortenError(null);
		try {
			// Strip type/mode from the stored target so the short link is kernel-agnostic.
			// type/mode are resolved at access time via UA detection or explicit ?type= override.
			const strippedUrl = new URL(resultUrl);
			strippedUrl.searchParams.delete("type");
			strippedUrl.searchParams.delete("mode");

			const resp = await fetch("/api/shorten", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ target: strippedUrl.toString() }),
			});
			if (!resp.ok) {
				const data = (await resp.json().catch(() => ({}))) as { error?: string };
				throw new Error(data?.error || `HTTP ${resp.status}`);
			}
			const data = (await resp.json()) as { shortUrl: string };
			setDisplayUrl(data.shortUrl);
			setCopied(false);
			setIsShortened(true);
		} catch (err) {
			setShortenError(err instanceof Error ? err.message : String(err));
		} finally {
			setShortening(false);
		}
	};

	const restoreUrl = () => {
		setDisplayUrl(originalUrl);
		setCopied(false);
		setIsShortened(false);
		setShortenError(null);
	};

	const copyUrl = async () => {
		try {
			await navigator.clipboard.writeText(displayUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy: ", err);
		}
	};

	const activeSubsCount = subscriptionAnalysis.activeCount;

	const getKernelBadge = (type: string) => {
		if (type.startsWith("sing-box"))
			return lang === "zh" ? "sing-box (JSON 格式)" : "sing-box (JSON)";
		if (type.startsWith("stash")) return lang === "zh" ? "Stash (YAML 格式)" : "Stash (YAML)";
		return lang === "zh" ? "Mihomo / Clash Meta (YAML)" : "Mihomo / Clash (YAML)";
	};

	const getOrchestrationModeBadge = (type: string) => {
		if (type.endsWith("-dual"))
			return lang === "zh" ? "双模分流 (推荐模式)" : "Dual-Mode (Consolidated)";
		if (type.endsWith("-white"))
			return lang === "zh" ? "白名单模式 (国内直连)" : "Whitelist (Domestic First)";
		if (type.endsWith("-black"))
			return lang === "zh" ? "黑名单模式 (国外直连)" : "Blacklist (Proxy First)";
		return lang === "zh" ? "全量精细化分流模式" : "Full scenario routing";
	};

	const t = TRANSLATIONS_ACTION[lang];

	return (
		<div className="space-y-6">
			<button
				type="button"
				onClick={generateUrl}
				disabled={!isValid}
				className={`w-full py-4 text-[13px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
					isValid
						? "btn-glow"
						: "bg-zinc-100/60 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-900/40 cursor-not-allowed rounded-xl"
				}`}
			>
				{isValid ? (
					<div className="flex items-center justify-center gap-2">
						<Cpu className="h-4 w-4 animate-pulse" />
						{t.generateSuccess}
					</div>
				) : (
					<div className="flex items-center justify-center gap-2">
						<Layers className="h-4 w-4" />
						{t.fillParams}
					</div>
				)}
			</button>

			{resultUrl && (
				<InteractiveCard variant="console" className="p-5 md:p-6 flex flex-col gap-5">
					{/* Manifest header */}
					<div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
						<div className="flex items-center gap-2">
							<Terminal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
							<span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
								{t.console}
							</span>
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={copyUrl}
								className={`p-1.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
									copied
										? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-900/50 text-green-700 dark:text-green-400"
										: "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
								}`}
								title={t.copyTitle}
							>
								{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
							</button>
							<a
								href={displayUrl}
								target="_blank"
								rel="noreferrer"
								className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer"
								title={t.openTitle}
							>
								<ExternalLink className="h-3.5 w-3.5" />
							</a>
						</div>
					</div>

					{/* Manifest Stats Details */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-xs border-b border-zinc-200 dark:border-zinc-800 pb-5">
						<div className="space-y-1">
							<span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">
								{t.kernel}
							</span>
							<p className="text-zinc-700 dark:text-zinc-300 font-bold">
								{getKernelBadge(configType)}
							</p>
						</div>
						<div className="space-y-1">
							<span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">
								{t.depth}
							</span>
							<p className="text-zinc-700 dark:text-zinc-300 font-bold">
								{getOrchestrationModeBadge(configType)}
							</p>
						</div>
						<div className="space-y-1">
							<span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">
								{t.activeSubs}
							</span>
							<p className="text-zinc-700 dark:text-zinc-300 font-bold">
								{activeSubsCount} {t.channels}
							</p>
						</div>
						<div className="space-y-1">
							<span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">
								{t.customNodes}
							</span>
							<p className="text-zinc-700 dark:text-zinc-300 font-bold">
								{customNodesCount} {t.nodes}
							</p>
						</div>
					</div>

					{/* URI manifest block */}
					<div className="relative group/url space-y-2">
						<div className="flex items-start gap-3 min-w-0 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl group-hover/url:border-zinc-300 dark:group-hover/url:border-zinc-800 transition-colors">
							<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0 mt-0.5">
								<Link2 className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
							</span>
							<span
								className="flex-1 min-w-0 break-all whitespace-pre-wrap select-text"
								title={displayUrl}
							>
								{displayUrl}
							</span>
							{isShortened ? (
								<span className="inline-flex shrink-0 rounded-md border border-indigo-500/20 bg-indigo-500/5 px-2 py-1 font-sans text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
									{t.shortened}
								</span>
							) : (
								<span className="hidden sm:inline-flex shrink-0 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 font-sans text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
									{lang === "zh" ? "已就绪" : "Ready"}
								</span>
							)}
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							{isShortened ? (
								<button
									type="button"
									onClick={restoreUrl}
									className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer"
								>
									<Link2 className="h-3 w-3" />
									{t.restore}
								</button>
							) : (
								<button
									type="button"
									onClick={shortenUrl}
									disabled={shortening}
									className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
								>
									{shortening ? (
										<Loader2 className="h-3 w-3 animate-spin" />
									) : (
										<Scissors className="h-3 w-3" />
									)}
									{shortening ? t.shortening : t.shorten}
								</button>
							)}
							{shortenError && (
								<span className="text-[10px] text-red-500 dark:text-red-400 font-semibold">
									{t.shortenFailed}: {shortenError}
								</span>
							)}
						</div>
					</div>

					{/* Copy prompt */}
					<p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-semibold uppercase tracking-wider text-center">
						{t.prompt}
					</p>
				</InteractiveCard>
			)}
		</div>
	);
}
