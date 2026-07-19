import { createFileRoute } from "@tanstack/react-router";
import {
	Activity,
	AlertCircle,
	AlertTriangle,
	Cpu,
	Globe,
	HelpCircle,
	Layers,
	Moon,
	Network,
	Settings,
	Sun,
	Terminal,
} from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import ActionBox from "@/components/ActionBox";
import InteractiveCard from "@/components/home/InteractiveCard";
import { COMMON_GH_PROXIES, HOME_TRANSLATIONS } from "@/components/home/translations";
import { type KernelType, type RoutingMode, useConfigType } from "@/components/home/useConfigType";
import { usePreferences } from "@/components/home/usePreferences";
import RoutingFlow from "@/components/RoutingFlow";
import SubscriptionPanel from "@/components/SubscriptionPanel";
import { checkProtocolSupport } from "@/lib/protocol-support";
import {
	analyzeSubscriptions,
	countNonEmptyLines,
	type Subscription,
	validateProxiesText,
} from "@/lib/subscriptions";
import { version } from "../../package.json";

const NodeModal = lazy(() => import("@/components/NodeModal"));

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [proxiesText, setProxiesText] = useState("");

	// Hydration safety row key
	const [subs, setSubs] = useState<Subscription[]>(() => [{ id: 1, name: "", url: "" }]);

	const [secret, setSecret] = useState("edge-default");

	// UX Improvement: Default to empty string (direct connection) to not enable mirror by default
	const [ghProxy, setGhProxy] = useState("");

	// Help popover state
	const [showHelpPopover, setShowHelpPopover] = useState(false);
	const { theme, lang, mounted, toggleTheme, toggleLang } = usePreferences();
	const { configType, selectedKernel, selectedMode, changeKernel, changeMode } = useConfigType();
	const subscriptionAnalysis = useMemo(() => analyzeSubscriptions(subs), [subs]);
	const customNodeCount = useMemo(() => countNonEmptyLines(proxiesText), [proxiesText]);
	const proxiesValidation = useMemo(
		() => validateProxiesText(proxiesText, lang),
		[proxiesText, lang],
	);
	const protocolSupport = useMemo(
		() => checkProtocolSupport(proxiesText, selectedKernel, lang),
		[proxiesText, selectedKernel, lang],
	);

	const handleInjectNode = (uri: string) => {
		setProxiesText((prev) => (prev ? `${prev}\n${uri}` : uri));
	};

	const t = HOME_TRANSLATIONS[lang];

	return (
		<div className="relative min-h-screen py-6 px-4 md:px-8 flex items-center justify-center">
			{/* Ambient Radial Mesh Backgrounds */}
			<div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[140px] animate-pulse-slow pointer-events-none" />
			<div
				className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[140px] animate-pulse-slow pointer-events-none"
				style={{ animationDelay: "3.5s" }}
			/>

			{/* Main Workspace Frame */}
			<div className="w-full max-w-6xl z-10 flex flex-col gap-6 animate-reveal">
				{/* Premium Animated Header Bar */}
				<header className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-zinc-200 dark:border-zinc-900 gap-4">
					<div className="flex items-center gap-3">
						{/* Highly customized isometric logo design */}
						<div className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-lg group overflow-hidden shrink-0">
							<div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 opacity-15 dark:opacity-25 group-hover:opacity-40 transition-opacity duration-300" />
							<Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
						</div>
						<div className="flex flex-col">
							<div className="flex items-center gap-2">
								<h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-none">
									Edge Engine
								</h1>
								<span className="text-[9px] font-mono py-0.5 px-2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-extrabold leading-none">
									v{version}
								</span>
							</div>
							<span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-extrabold mt-1.5 leading-none">
								{lang === "zh" ? "边缘智能编排核心" : "Edge Orchestration Core"}
							</span>
						</div>
					</div>

					{/* Status Metrics and Theme Controls */}
					<div className="flex flex-wrap items-center gap-3 md:self-center">
						<div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shadow-sm">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
							{t.coreStatus}: {t.running}
						</div>

						<div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-indigo-500/5 dark:bg-indigo-500/5 border border-indigo-500/20 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shadow-sm">
							<Activity className="h-3 w-3 text-indigo-500" />
							{t.latency}: {t.latencyVal}
						</div>

						<div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={toggleLang}
								className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
								title={lang === "zh" ? "切换为英文" : "Switch to Chinese"}
							>
								<Globe className="h-3.5 w-3.5" />
								<span>{lang === "zh" ? "EN" : "中文"}</span>
							</button>

							<button
								type="button"
								onClick={toggleTheme}
								className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all flex items-center justify-center cursor-pointer"
								title={
									theme === "dark"
										? lang === "zh"
											? "切换为亮色模式"
											: "Switch to Light Mode"
										: lang === "zh"
											? "切换为暗色模式"
											: "Switch to Dark Mode"
								}
							>
								{theme === "dark" ? (
									<Sun className="h-3.5 w-3.5" />
								) : (
									<Moon className="h-3.5 w-3.5" />
								)}
							</button>
						</div>
					</div>
				</header>

				{/* Dashboard Realtime Stats Cards */}
				<section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-reveal">
					<div className="p-4 bg-white dark:bg-zinc-950/30 rounded-xl border border-zinc-200/80 dark:border-zinc-900/60 flex items-center justify-between shadow-sm hover:border-zinc-300 dark:hover:border-zinc-800 transition-all group">
						<div className="flex flex-col gap-1.5">
							<span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
								{t.activeSubs}
							</span>
							<span className="text-lg font-extrabold font-mono text-indigo-600 dark:text-indigo-400 leading-none">
								{subscriptionAnalysis.activeCount}{" "}
								<span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 uppercase">
									Src
								</span>
							</span>
						</div>
						<div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 group-hover:scale-110 transition-transform duration-300">
							<Globe className="h-4 w-4" />
						</div>
					</div>

					<div className="p-4 bg-white dark:bg-zinc-950/30 rounded-xl border border-zinc-200/80 dark:border-zinc-900/60 flex items-center justify-between shadow-sm hover:border-zinc-300 dark:hover:border-zinc-800 transition-all group">
						<div className="flex flex-col gap-1.5">
							<span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
								{t.customNodes}
							</span>
							<span className="text-lg font-extrabold font-mono text-purple-600 dark:text-purple-400 leading-none">
								{customNodeCount}{" "}
								<span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 uppercase">
									Nodes
								</span>
							</span>
						</div>
						<div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-500/10 group-hover:scale-110 transition-transform duration-300">
							<Cpu className="h-4 w-4" />
						</div>
					</div>

					<div className="p-4 bg-white dark:bg-zinc-950/30 rounded-xl border border-zinc-200/80 dark:border-zinc-900/60 flex items-center justify-between shadow-sm hover:border-zinc-300 dark:hover:border-zinc-800 transition-all group">
						<div className="flex flex-col gap-1.5 max-w-[70%]">
							<span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
								{t.activeKernel}
							</span>
							<span className="text-xs font-bold font-mono text-zinc-800 dark:text-zinc-200 truncate leading-none mt-0.5">
								{selectedKernel.toUpperCase()}{" "}
								<span className="text-[8px] py-0.5 px-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded uppercase font-bold">
									{selectedMode ? selectedMode.slice(1) : "Full"}
								</span>
							</span>
						</div>
						<div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-500/10 group-hover:scale-110 transition-transform duration-300">
							<Terminal className="h-4 w-4" />
						</div>
					</div>

					<div className="p-4 bg-white dark:bg-zinc-950/30 rounded-xl border border-zinc-200/80 dark:border-zinc-900/60 flex items-center justify-between shadow-sm hover:border-zinc-300 dark:hover:border-zinc-800 transition-all group">
						<div className="flex flex-col gap-1.5">
							<span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
								{t.runtimeEnv}
							</span>
							<span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400 leading-none mt-1 flex items-center gap-1">
								<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
								CLOUDFLARE EDGE
							</span>
						</div>
						<div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 group-hover:scale-110 transition-transform duration-300">
							<Activity className="h-4 w-4" />
						</div>
					</div>
				</section>

				{/* Two-Column Workspace Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
					{/* LEFT SIDE WORKSPACE (Column Span 7) - Inputs */}
					<div className="lg:col-span-7 flex h-full flex-col gap-6">
						{/* Raw Proxies Panel (Interactive Card) */}
						<InteractiveCard className="p-6 lg:flex-1">
							<div className="flex h-full flex-col gap-4">
								<div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-900/60">
									<span className="label-caps flex items-center gap-1.5 font-bold tracking-wider">
										<Cpu className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
										{t.rawProxies}
									</span>
									<button
										type="button"
										onClick={() => setIsModalOpen(true)}
										className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-all uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-indigo-500/5 dark:bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10 hover:border-indigo-500/25"
									>
										+ {t.injectNode}
									</button>
								</div>
								<textarea
									id="proxies-textarea"
									value={proxiesText}
									onChange={(e) => setProxiesText(e.target.value)}
									placeholder={
										mounted
											? "vless://...\nvmess://...\ntailscale://..."
											: "vless://... vmess://... tailscale://..."
									}
									spellCheck="false"
									className="w-full min-h-[140px] lg:flex-1 modern-input font-mono text-[12px] leading-relaxed resize-y focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
								/>
								{proxiesValidation.errors.map((error) => (
									<div
										key={error}
										className="flex items-start gap-1.5 pl-1.5 text-red-600 dark:text-red-500 text-[11px] leading-normal mt-1.5 animate-reveal"
									>
										<AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
										<span>{error}</span>
									</div>
								))}
								{protocolSupport.warnings.map((warning) => (
									<div
										key={warning}
										className="flex items-start gap-1.5 pl-1.5 text-amber-600 dark:text-amber-500 text-[11px] leading-normal mt-1.5 animate-reveal"
									>
										<AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
										<span>{warning}</span>
									</div>
								))}
							</div>
						</InteractiveCard>

						{/* Remote Providers Panel (Interactive Card) */}
						<InteractiveCard className="p-6 space-y-4">
							<div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-900/60 mb-2">
								<span className="label-caps flex items-center gap-1.5 font-bold tracking-wider">
									<Network className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
									{t.remoteProviders}
								</span>
							</div>
							<SubscriptionPanel
								subs={subs}
								setSubs={setSubs}
								lang={lang}
								duplicateNames={subscriptionAnalysis.duplicateNames}
							/>
						</InteractiveCard>
					</div>

					{/* RIGHT SIDE WORKSPACE (Column Span 5) - Orchestrator settings */}
					<div className="lg:col-span-5 h-full">
						{/* Orchestration Settings Panel (Interactive Card) */}
						{/* 3D tilt remains smooth and responsive since dropdown select is removed! */}
						<InteractiveCard className="h-full p-6 space-y-5">
							<span className="label-caps flex items-center gap-1.5 font-bold tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3">
								<Settings className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
								{t.settings}
							</span>

							<div className="space-y-4">
								{/* Kernel Target Step Selector (Modern Segmented controls) */}
								<div className="space-y-2">
									<span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
										{t.targetKernel}
									</span>
									<div className="grid grid-cols-3 gap-2">
										{[
											{ id: "mihomo", label: "Mihomo", desc: "Clash Meta" },
											{ id: "stash", label: "Stash iOS", desc: "Clash Meta" },
											{ id: "sing-box", label: "sing-box", desc: "Next-Gen" },
										].map((k) => {
											const isSelected = selectedKernel === k.id;
											return (
												<button
													key={k.id}
													type="button"
													onClick={() => changeKernel(k.id as KernelType)}
													className={`py-2.5 px-1 rounded-xl border text-center transition-all duration-300 flex flex-col justify-center items-center gap-0.5 cursor-pointer relative overflow-hidden group ${
														isSelected
															? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
															: "border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-800 hover:text-zinc-900 dark:hover:text-white"
													}`}
												>
													<span className="text-xs font-bold leading-none">{k.label}</span>
													<span className="text-[8px] font-medium opacity-60 leading-none">
														{k.desc}
													</span>
													{isSelected && (
														<span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500 dark:bg-indigo-400" />
													)}
												</button>
											);
										})}
									</div>
								</div>

								{/* Mode Selection Step Selector (Modern Segmented controls) */}
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
											{lang === "zh" ? "分流编排深度模式" : "Orchestration Mode"}
										</span>
										<button
											type="button"
											onClick={() => setShowHelpPopover(!showHelpPopover)}
											className={`text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
												showHelpPopover
													? "text-indigo-600 dark:text-indigo-400"
													: "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
											}`}
										>
											<HelpCircle className="h-3.5 w-3.5" />
											<span>{lang === "zh" ? "对比" : "Compare"}</span>
										</button>
									</div>

									<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
										{[
											{ id: "", label: lang === "zh" ? "全量分流" : "Full", sub: "Full" },
											{ id: "-dual", label: lang === "zh" ? "双模分流" : "Dual", sub: "Recommend" },
											{
												id: "-white",
												label: lang === "zh" ? "白名单" : "White",
												sub: "Direct First",
											},
											{
												id: "-black",
												label: lang === "zh" ? "黑名单" : "Black",
												sub: "Proxy First",
											},
										].map((m) => {
											const isSelected = selectedMode === m.id;
											return (
												<button
													key={m.id}
													type="button"
													onClick={() => changeMode(m.id as RoutingMode)}
													className={`py-2 px-0.5 rounded-xl border text-center transition-all duration-300 flex flex-col justify-center items-center gap-0.5 cursor-pointer relative ${
														isSelected
															? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
															: "border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-800 hover:text-zinc-900 dark:hover:text-white"
													}`}
												>
													<span className="text-[11px] font-bold leading-none">{m.label}</span>
													<span className="text-[7.5px] font-medium opacity-65 leading-none">
														{m.sub}
													</span>
													{isSelected && (
														<span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500 dark:bg-indigo-400" />
													)}
												</button>
											);
										})}
									</div>

									{/* Mode Differences Popover Card */}
									{showHelpPopover && (
										<div
											role="none"
											onMouseMove={(e) => e.stopPropagation()}
											onMouseLeave={(e) => e.stopPropagation()}
											className="mt-2 p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] space-y-3 animate-reveal z-40 text-zinc-700 dark:text-zinc-300 shadow-lg"
										>
											<div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2">
												<span className="font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
													<HelpCircle className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
													{lang === "zh" ? "分流编排模式区别说明" : "Mode Difference Explanation"}
												</span>
												<button
													type="button"
													onClick={() => setShowHelpPopover(false)}
													className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
												>
													[ {lang === "zh" ? "关闭" : "Close"} ]
												</button>
											</div>
											<div className="space-y-2.5 leading-relaxed max-h-52 overflow-y-auto">
												<div>
													<p className="font-bold text-indigo-600 dark:text-indigo-400">
														1. {lang === "zh" ? "全量分流 (Full)" : "Full Scenario Routing"}
													</p>
													<p className="text-zinc-500 dark:text-zinc-400 text-[10px] pl-3 mt-0.5">
														{lang === "zh"
															? "细化规则分流。将海外流量划分到 20+ 个场景特化分组（如 AI、GitHub、开发、视频、微软等），支持每个场景独立选择代理节点。"
															: "Granular scenario routing. Categorizes foreign traffic into 20+ scenario groups (e.g. AI, Dev, Media, Microsoft) with individual proxy selectors."}
													</p>
												</div>
												<div>
													<p className="font-bold text-indigo-600 dark:text-indigo-400">
														2.{" "}
														{lang === "zh" ? "双模分流 (Dual - 推荐)" : "Dual-Mode (Recommended)"}
													</p>
													<p className="text-zinc-500 dark:text-zinc-400 text-[10px] pl-3 mt-0.5">
														{lang === "zh"
															? "兼顾精简与功能。将所有海外场景的分组归拢合并为单个统一的「🚀 节点选择」分组，大大减小客户端界面和规则组体积。"
															: 'Combines simplicity with power. Merges all foreign scenario outbounds into a single "🚀 Proxy Select" group, reducing ruleset and UI bloat.'}
													</p>
												</div>
												<div>
													<p className="font-bold text-indigo-600 dark:text-indigo-400">
														3. {lang === "zh" ? "白名单模式 (White)" : "Whitelist (Domestic First)"}
													</p>
													<p className="text-zinc-500 dark:text-zinc-400 text-[10px] pl-3 mt-0.5">
														{lang === "zh"
															? "国内直连优先。仅对明确匹配到海外规则（如 Google、YouTube）的流量走代理，其余所有未匹配流量一律默认直连 (DIRECT)。"
															: "Domestic direct-connection first. Only traffic explicitly matched to foreign rules goes through proxies; everything else defaults to DIRECT."}
													</p>
												</div>
												<div>
													<p className="font-bold text-indigo-600 dark:text-indigo-400">
														4. {lang === "zh" ? "黑名单模式 (Black)" : "Blacklist (Proxy First)"}
													</p>
													<p className="text-zinc-500 dark:text-zinc-400 text-[10px] pl-3 mt-0.5">
														{lang === "zh"
															? "海外代理优先。仅对明确匹配到国内规则（如 哔哩哔哩、百度）的流量直连，其余所有未匹配的流量默认全部走代理。"
															: "Foreign proxy first. Only traffic explicitly matched to domestic rules goes DIRECT; all other unmatched traffic defaults to proxies."}
													</p>
												</div>
											</div>
										</div>
									)}
								</div>

								{/* Secret Key Input */}
								<div className="space-y-1.5">
									<span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
										{t.secret}
									</span>
									<input
										type="text"
										value={secret}
										onChange={(e) => setSecret(e.target.value)}
										placeholder={t.secretPlaceholder}
										className="w-full modern-input font-mono focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
									/>
								</div>

								{/* Mirror Path Input */}
								<div className="space-y-1.5">
									<span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
										{t.mirror}
									</span>
									<input
										list="gh-proxies-list"
										type="text"
										value={ghProxy}
										onChange={(e) => setGhProxy(e.target.value)}
										placeholder={t.mirrorPlaceholder}
										className="w-full modern-input font-mono focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
									/>
									<datalist id="gh-proxies-list">
										{COMMON_GH_PROXIES.map((proxy) => (
											<option key={proxy} value={proxy} />
										))}
									</datalist>
								</div>
							</div>
						</InteractiveCard>
					</div>
				</div>

				{/* Full-width generation dock keeps the two-column workspace visually balanced. */}
				<section className="relative">
					<ActionBox
						proxiesText={proxiesText}
						subs={subs}
						configType={configType}
						ghProxy={ghProxy}
						secret={secret}
						lang={lang}
						proxiesValidation={proxiesValidation}
						subscriptionAnalysis={subscriptionAnalysis}
						customNodesCount={customNodeCount}
					/>
				</section>

				{/* Dynamic Traffic Routing Flow Visualizer */}
				<RoutingFlow mode={selectedMode} lang={lang} />

				{/* Footer */}
				<footer className="mt-8 text-center border-t border-zinc-200 dark:border-zinc-900 pt-6">
					<div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
						<p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-[0.3em]">
							{lang === "zh"
								? "边缘网络分布式计算节点 • 强力驱动"
								: "Distributed Edge Compute Infrastructure"}
						</p>
						<a
							href="/GUIDE.md"
							target="_blank"
							rel="noreferrer"
							className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
						>
							{lang === "zh" ? "快速入门 / AI 文档 ↗" : "Quick Start / AI Guide ↗"}
						</a>
					</div>
				</footer>
			</div>

			{/* Inject Node Modal */}
			{isModalOpen && (
				<Suspense fallback={null}>
					<NodeModal
						isOpen={isModalOpen}
						onClose={() => setIsModalOpen(false)}
						onInject={handleInjectNode}
						lang={lang}
						kernel={selectedKernel}
					/>
				</Suspense>
			)}
		</div>
	);
}
