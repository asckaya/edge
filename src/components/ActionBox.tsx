import { Check, Copy, ExternalLink, Link2, Loader2, Scissors, Terminal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ConfigRules } from "../../core/src/types";
import { buildConfigUrl } from "@/lib/build-url";
import { readAccessKey, withAccessKey } from "@/lib/links";
import type {
	ProxiesValidationResult,
	Subscription,
	SubscriptionAnalysis,
} from "@/lib/subscriptions";

interface ActionBoxProps {
	proxiesText: string;
	subs: Subscription[];
	configType: string;
	rules?: ConfigRules;
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
		generateSuccess: "生成订阅地址",
		fillParams: "参数不完整",
		kernel: "目标内核",
		depth: "分流模式",
		activeSubs: "活跃订阅源",
		customNodes: "自建单节点",
		prompt: "粘贴到客户端订阅栏即可",
		copyTitle: "复制订阅链接",
		copiedTitle: "已复制",
		openTitle: "在新窗口打开",
		shorten: "转短链接",
		shortening: "生成中",
		shortenFailed: "短链接失败",
		shortened: "短链接",
		restore: "还原链接",
		ready: "ready",
		needsInput: "至少一个订阅源或单节点",
	},
	en: {
		generateSuccess: "Generate endpoint",
		fillParams: "Incomplete params",
		kernel: "Kernel",
		depth: "Mode",
		activeSubs: "Providers",
		customNodes: "Custom nodes",
		prompt: "paste into your client",
		copyTitle: "Copy endpoint URL",
		copiedTitle: "Copied",
		openTitle: "Open in new tab",
		shorten: "Shorten",
		shortening: "Generating",
		shortenFailed: "Shorten failed",
		shortened: "short link",
		restore: "Restore",
		ready: "ready",
		needsInput: "need a provider or a node",
	},
};

export default function ActionBox({
	proxiesText,
	subs,
	configType,
	rules,
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
			rules,
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
			// Strip type from the stored target so the short link is kernel-agnostic (resolved via UA).
			// Preserve mode so user's routing depth selection (dual/white/black) is retained.
			const strippedUrl = new URL(resultUrl);
			strippedUrl.searchParams.delete("type");

			// Reuse the shared access key the user set in the link console (if any) so
			// links created from the workspace stay protected by the same `?key=`.
			const accessKey = readAccessKey();
			const resp = await fetch("/api/shorten", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					target: strippedUrl.toString(),
					...(accessKey ? { accessKey } : {}),
				}),
			});
			if (!resp.ok) {
				const data = (await resp.json().catch(() => ({}))) as { error?: string };
				throw new Error(data?.error || `HTTP ${resp.status}`);
			}
			const data = (await resp.json()) as { shortUrl: string };
			setDisplayUrl(withAccessKey(data.shortUrl, accessKey));
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

	const getKernelBadge = (type: string) => {
		if (type.startsWith("sing-box")) return "sing-box · json";
		if (type.startsWith("stash")) return "stash · yaml";
		return "mihomo · yaml";
	};

	const getModeBadge = (type: string) => {
		if (type.endsWith("-dual")) return "dual";
		if (type.endsWith("-white")) return "white";
		if (type.endsWith("-black")) return "black";
		return "full";
	};

	const t = TRANSLATIONS_ACTION[lang];

	const spec = [
		{ label: t.kernel, value: getKernelBadge(configType) },
		{ label: t.depth, value: getModeBadge(configType) },
		{ label: t.activeSubs, value: String(subscriptionAnalysis.activeCount).padStart(2, "0") },
		{ label: t.customNodes, value: String(customNodesCount).padStart(2, "0") },
	];

	return (
		<div className="card overflow-hidden">
			{/* spec table + action */}
			<div className="grid grid-cols-2 gap-px bg-hairline lg:grid-cols-6">
				{spec.map((row) => (
					<div key={row.label} className="bg-elevated px-4 py-4 md:px-5">
						<div className="eyebrow text-[9px] text-faint">{row.label}</div>
						<div className="mt-1.5 truncate font-mono text-[12px] font-semibold text-ink">
							{row.value}
						</div>
					</div>
				))}

				<div className="col-span-2 flex flex-col items-stretch justify-center gap-1.5 bg-elevated px-4 py-4 md:px-5 lg:col-span-2">
					<button
						type="button"
						onClick={generateUrl}
						disabled={!isValid}
						className="btn-pill h-9 w-full px-4 text-[12.5px]"
					>
						<Terminal className="size-3.5" strokeWidth={2.4} />
						{isValid ? t.generateSuccess : t.fillParams}
					</button>
					<p className="text-center font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint">
						{isValid ? t.prompt : t.needsInput}
					</p>
				</div>
			</div>

			{resultUrl && (
				<>
					<div className="flex items-center justify-between gap-3 border-t border-hairline px-4 py-2.5 md:px-5">
						<div className="flex min-w-0 items-center gap-2">
							<Link2 className="size-3.5 shrink-0 text-mute" strokeWidth={2.2} />
							<span className="eyebrow text-[9.5px] text-ink">endpoint</span>
							<span
								className={cn(
									"chip ml-1 h-[18px] text-[9px]",
									isShortened && "chip-link",
									copied && "chip-link",
								)}
							>
								{copied ? "copied" : isShortened ? t.shortened : t.ready}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={copyUrl}
								title={t.copyTitle}
								aria-label={t.copyTitle}
								className="btn-square-ghost h-7 w-7 px-0"
							>
								{copied ? (
									<Check className="size-3" strokeWidth={2.8} />
								) : (
									<Copy className="size-3" strokeWidth={2} />
								)}
							</button>
							<a
								href={displayUrl}
								target="_blank"
								rel="noreferrer"
								title={t.openTitle}
								aria-label={t.openTitle}
								className="btn-square-ghost h-7 w-7 px-0"
							>
								<ExternalLink className="size-3" strokeWidth={2} />
							</a>
						</div>
					</div>

					<div className="border-t border-hairline px-4 py-4 md:px-5">
						<div className="code-block flex items-start gap-3 px-3.5 py-3">
							<span className="mt-px shrink-0 select-none font-mono text-[10px] text-faint">$</span>
							<code
								className="min-w-0 flex-1 select-text break-all whitespace-pre-wrap text-ink"
								title={displayUrl}
							>
								{displayUrl}
							</code>
						</div>

						<div className="mt-3 flex flex-wrap items-center gap-2">
							{isShortened ? (
								<button type="button" onClick={restoreUrl} className="btn-square-ghost">
									<Link2 className="size-3" strokeWidth={2.2} />
									{t.restore}
								</button>
							) : (
								<button
									type="button"
									onClick={shortenUrl}
									disabled={shortening}
									className="btn-square-ghost"
								>
									{shortening ? (
										<Loader2 className="size-3 animate-spin" strokeWidth={2.4} />
									) : (
										<Scissors className="size-3" strokeWidth={2.2} />
									)}
									{shortening ? t.shortening : t.shorten}
								</button>
							)}
							{shortenError && (
								<span className="font-mono text-[10px] text-danger">
									{t.shortenFailed}: {shortenError}
								</span>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
}
