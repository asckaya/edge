import { createFileRoute } from "@tanstack/react-router";
import {
	Activity,
	ArrowRight,
	ArrowUpRight,
	BookOpen,
	Check,
	ChevronRight,
	Circle,
	Cpu,
	Globe,
	HelpCircle,
	Network,
	Plus,
	Settings2,
	ShieldAlert,
	ShieldCheck,
	Sparkles,
	Terminal,
	Wrench,
} from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import ActionBox from "@/components/ActionBox";
import { COMMON_GH_PROXIES, HOME_TRANSLATIONS } from "@/components/home/translations";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteNav from "@/components/layout/SiteNav";
import SectionHead from "@/components/layout/SectionHead";
import { type KernelType, type RoutingMode, useConfigType } from "@/components/home/useConfigType";
import { usePreferences } from "@/components/home/usePreferences";
import RoutingFlow from "@/components/RoutingFlow";
import SubscriptionPanel from "@/components/SubscriptionPanel";
import { cn } from "@/lib/cn";
import { checkProtocolSupport } from "@/lib/protocol-support";
import {
	analyzeSubscriptions,
	countNonEmptyLines,
	type Subscription,
	validateProxiesText,
} from "@/lib/subscriptions";
import type { ConfigRules } from "../../core/src/types";

const NodeModal = lazy(() => import("@/components/NodeModal"));

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

/* -------------------------------------------------------------------------- */
/*                                   atoms                                    */
/* -------------------------------------------------------------------------- */

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
	return (
		<label htmlFor={htmlFor} className="eyebrow mb-1.5 block text-[10px] text-mute">
			{children}
		</label>
	);
}

/**
 * Card header shared by every panel in the workspace: icon, mono title, optional
 * count chip and an optional trailing control. Fixed minimum height keeps the
 * hairline divider on the same baseline whether or not the trailing slot holds
 * a 30px button.
 */
function CardHead({
	icon: Icon,
	title,
	count,
	aside,
}: {
	icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
	title: string;
	count?: number;
	aside?: React.ReactNode;
}) {
	return (
		<div className="border-b border-hairline pb-4">
			<div className="flex min-h-[30px] flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<Icon className="size-3.5 text-mute" strokeWidth={2} />
					<span className="eyebrow text-[10.5px] text-ink">{title}</span>
					{count !== undefined && <span className="chip ml-1">{count}</span>}
				</div>
				{aside}
			</div>
		</div>
	);
}

/**
 * Segmented choice tile shared by the kernel and orchestration-mode pickers.
 * Both rows use the same height, radius and internal rhythm so the two pickers
 * read as one stacked control instead of two competing shapes.
 */
function ChoiceTile({
	label,
	sub,
	active,
	onClick,
}: {
	label: string;
	sub: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={cn(
				"flex h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-sm border px-2 transition-colors",
				active
					? "border-ink bg-ink text-on-ink"
					: "border-hairline bg-elevated text-body hover:border-ink/25 hover:text-ink",
			)}
		>
			<span className="truncate text-[11.5px] font-semibold leading-none">{label}</span>
			<span
				className={cn("truncate text-[9px] leading-none", active ? "text-on-ink/70" : "text-faint")}
			>
				{sub}
			</span>
		</button>
	);
}

/* -------------------------------------------------------------------------- */
/*                                    page                                    */
/* -------------------------------------------------------------------------- */

function HomeComponent() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [proxiesText, setProxiesText] = useState("");

	// Hydration safety row key
	const [subs, setSubs] = useState<Subscription[]>(() => [{ id: 1, name: "", url: "" }]);

	const [secret, setSecret] = useState("edge-default");
	const [rulesMode, setRulesMode] = useState<ConfigRules>("category");

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
	const zh = lang === "zh";

	const kernels: { id: KernelType; label: string; sub: string }[] = [
		{ id: "mihomo", label: "Mihomo", sub: zh ? "Clash Meta" : "Clash Meta" },
		{ id: "stash", label: "Stash", sub: zh ? "iOS 客户端" : "iOS client" },
		{ id: "sing-box", label: "sing-box", sub: zh ? "新一代内核" : "next-gen" },
	];

	const modes: { id: RoutingMode; label: string; sub: string }[] = [
		{ id: "", label: zh ? "全量" : "Full", sub: zh ? "场景分流" : "20+ scenarios" },
		{ id: "-dual", label: zh ? "双模" : "Dual", sub: zh ? "推荐" : "recommended" },
		{ id: "-white", label: zh ? "白名单" : "White", sub: zh ? "国内直连" : "direct first" },
		{ id: "-black", label: zh ? "黑名单" : "Black", sub: zh ? "代理优先" : "proxy first" },
	];

	const tools = [
		{
			href: "/ip.html",
			icon: Globe,
			title: t.ipTool,
			desc: t.ipDesc,
			meta: "egress / geo",
		},
		{
			href: "/dns.html",
			icon: ShieldCheck,
			title: t.dnsTool,
			desc: t.dnsDesc,
			meta: "resolver / leak",
		},
		{
			href: "/webrtc.html",
			icon: ShieldAlert,
			title: t.webrtcTool,
			desc: t.webrtcDesc,
			meta: "browser / stun",
		},
		{
			href: "/claude.html",
			icon: Sparkles,
			title: t.claudeTool,
			desc: t.claudeDesc,
			meta: "ai / reachability",
		},
		{
			href: "/tools.html",
			icon: Wrench,
			title: t.toolsSuite,
			desc: t.toolsSuiteDesc,
			meta: "convert / codec",
		},
		{
			href: "/GUIDE.md",
			icon: BookOpen,
			title: t.docGuide,
			desc: t.docGuideDesc,
			meta: "reference / api",
		},
	];

	const stats = [
		{
			label: t.activeSubs,
			value: String(subscriptionAnalysis.activeCount).padStart(2, "0"),
			unit: "providers",
			icon: Globe,
		},
		{
			label: t.customNodes,
			value: String(customNodeCount).padStart(2, "0"),
			unit: "nodes",
			icon: Cpu,
		},
		{
			label: t.activeKernel,
			value: selectedKernel.toUpperCase(),
			unit: `mode=${selectedMode ? selectedMode.slice(1) : "full"}`,
			icon: Terminal,
		},
		{
			label: t.runtimeEnv,
			value: "CLOUDFLARE",
			unit: "edge · 300+ pop",
			icon: Activity,
			live: true,
		},
	];

	return (
		<div className="min-h-screen bg-canvas text-body">
			{/* ------------------------------------------------------------ nav */}
			<SiteNav
				lang={lang}
				theme={theme}
				onToggleLang={toggleLang}
				onToggleTheme={toggleTheme}
				active="workspace"
			/>

			{/* ----------------------------------------------------------- hero */}
			<section className="relative isolate overflow-hidden">
				<div className="mesh" aria-hidden="true" />
				<div className="pointer-events-none absolute inset-0 grid-texture" aria-hidden="true" />
				<div className="shell relative z-10 flex flex-col items-center pb-14 pt-20 text-center md:pb-16 md:pt-24">
					<span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-elevated/80 px-3 py-1 font-mono text-[11px] text-body backdrop-blur">
						<span className="text-link">$</span>
						<span className="text-ink">edge-engine</span>
						<span className="text-faint">--serve</span>
						<span className="text-mute">mihomo · stash · sing-box</span>
						<span className="caret text-ink" aria-hidden="true" />
					</span>

					<h1 className="display-xl mt-7 max-w-3xl text-balance">
						{zh ? "把订阅编排成" : "Orchestrate every"}
						<span className="relative mx-1.5 inline-block">
							<span className="relative z-10">{zh ? "一条链接" : "subscription"}</span>
							<span
								className="absolute inset-x-[-0.08em] bottom-[0.06em] z-0 h-[0.34em] rounded-[2px]"
								style={{
									background:
										"linear-gradient(90deg, var(--develop-a), var(--preview-a), var(--preview-b))",
									opacity: 0.1,
								}}
								aria-hidden="true"
							/>
						</span>
						{zh ? "" : " into one endpoint"}
					</h1>

					<p className="mt-5 max-w-[54ch] text-[12.5px] leading-[1.9] text-mute md:text-[13px]">
						{zh
							? "远程订阅、自建节点、分流模式与规则粒度全部汇入一次请求，实时生成可直接导入客户端的完整配置 —— 运行在 Cloudflare 边缘节点。"
							: "Remote providers, custom nodes, routing depth and rule granularity resolve in a single request — a complete client-ready config, rendered at the Cloudflare edge."}
					</p>

					<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
						<a href="#workspace" className="btn-pill h-10 w-full min-w-[150px] sm:w-auto">
							{zh ? "开始编排" : "Start orchestrating"}
							<ArrowRight className="size-3.5" strokeWidth={2.4} />
						</a>
						<a
							href="/GUIDE.md"
							target="_blank"
							rel="noreferrer"
							className="btn-pill-ghost h-10 w-full min-w-[150px] sm:w-auto"
						>
							{zh ? "阅读文档" : "Read the docs"}
							<ArrowUpRight className="size-3.5" strokeWidth={2.4} />
						</a>
					</div>

					<div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
						{[
							zh ? "云端生成" : "server-side render",
							zh ? "零运行时依赖" : "zero runtime deps",
							zh ? "20+ 场景分组" : "20+ scenario groups",
						].map((label) => (
							<span key={label} className="flex items-center gap-1.5">
								<Check className="size-3 text-ink" strokeWidth={3} />
								{label}
							</span>
						))}
					</div>
				</div>
			</section>

			{/* ---------------------------------------------------------- stats */}
			<section
				aria-label={zh ? "运行时指标" : "Runtime metrics"}
				className="border-y border-hairline"
			>
				<div className="shell grid grid-cols-2 gap-px bg-hairline md:grid-cols-4">
					{stats.map((s) => (
						<div key={s.label} className="group flex flex-col gap-2 bg-elevated px-5 py-5 md:px-6">
							<span className="flex items-center justify-between gap-2">
								<span className="eyebrow text-[10px] text-mute">{s.label}</span>
								<s.icon
									className="size-3.5 text-faint transition-colors group-hover:text-ink"
									strokeWidth={2}
								/>
							</span>
							<span className="flex items-baseline gap-2">
								<span className="font-mono text-[22px] font-semibold leading-none tracking-tight text-ink tabular-nums">
									{s.value}
								</span>
								{"live" in s && s.live ? (
									<span className="size-1.5 rounded-full bg-link" aria-hidden="true" />
								) : null}
							</span>
							<span className="truncate font-mono text-[10px] text-faint">{s.unit}</span>
						</div>
					))}
				</div>
			</section>

			{/* ------------------------------------------------------ workspace */}
			<main id="workspace" className="shell scroll-mt-16 py-16 md:py-20">
				<SectionHead
					index="01"
					title={zh ? "订阅来源" : "Sources"}
					desc={
						zh
							? "粘贴单节点 URI，或添加远程订阅提供商 —— 两者汇入同一个出口。"
							: "Paste node URIs and/or add remote providers — both feed the same endpoint."
					}
					aside={
						<div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
							<span className="chip">{selectedKernel}</span>
							<ChevronRight className="size-3" />
							<span className="chip">{`mode=${selectedMode ? selectedMode.slice(1) : "full"}`}</span>
							<ChevronRight className="size-3" />
							<span className="chip">{`rules=${rulesMode}`}</span>
						</div>
					}
				/>

				<div className="grid gap-4 lg:grid-cols-2">
					<div className="flex flex-col gap-4">
						{/* raw proxies */}
						<section className="card flex flex-1 flex-col p-5 md:p-6">
							<CardHead
								icon={Cpu}
								title={t.rawProxies}
								count={customNodeCount}
								aside={
									<button
										type="button"
										onClick={() => setIsModalOpen(true)}
										className="btn-square-ghost"
									>
										<Plus className="size-3" strokeWidth={2.6} />
										{t.injectNode}
									</button>
								}
							/>

							<textarea
								id="proxies-textarea"
								value={proxiesText}
								onChange={(e) => setProxiesText(e.target.value)}
								placeholder={
									mounted
										? "vless://…\nvmess://…\ntailscale://…"
										: "vless://… vmess://… tailscale://…"
								}
								spellCheck="false"
								className="textarea mt-4 min-h-[152px] flex-1 font-mono text-[12px] leading-[1.9]"
							/>

							<div className="mt-3 space-y-1.5 empty:hidden">
								{proxiesValidation.errors.map((error) => (
									<p key={error} className="flex items-start gap-1.5 text-[11px] text-danger">
										<Circle className="mt-1 size-1.5 shrink-0 fill-current" />
										<span>{error}</span>
									</p>
								))}
								{protocolSupport.warnings.map((warning) => (
									<p key={warning} className="flex items-start gap-1.5 text-[11px] text-warn-deep">
										<Circle className="mt-1 size-1.5 shrink-0 fill-current" />
										<span>{warning}</span>
									</p>
								))}
							</div>
						</section>

						{/* remote providers */}
						<section className="card p-5 md:p-6">
							<CardHead
								icon={Network}
								title={t.remoteProviders}
								count={subscriptionAnalysis.activeCount}
								aside={
									<span className="font-mono text-[10px] text-faint">
										{zh ? "同一名称会生成独立分组" : "one group per provider"}
									</span>
								}
							/>
							<div className="mt-4">
								<SubscriptionPanel
									subs={subs}
									setSubs={setSubs}
									lang={lang}
									duplicateNames={subscriptionAnalysis.duplicateNames}
								/>
							</div>
						</section>
					</div>

					{/* orchestration */}
					<section className="card p-5 md:p-6">
						<CardHead icon={Settings2} title={t.settings} />

						<div className="mt-5 space-y-6">
							<div>
								<FieldLabel>{t.targetKernel}</FieldLabel>
								<div className="grid grid-cols-3 gap-1.5">
									{kernels.map((k) => (
										<ChoiceTile
											key={k.id}
											label={k.label}
											sub={k.sub}
											active={selectedKernel === k.id}
											onClick={() => changeKernel(k.id)}
										/>
									))}
								</div>
							</div>

							<div>
								<div className="mb-1.5 flex items-center justify-between">
									<FieldLabel>
										<span className="block">{zh ? "分流编排模式" : "Orchestration mode"}</span>
									</FieldLabel>
									<button
										type="button"
										onClick={() => setShowHelpPopover((v) => !v)}
										className={cn(
											"-mt-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors",
											showHelpPopover ? "text-ink" : "text-faint hover:text-ink",
										)}
									>
										<HelpCircle className="size-3" strokeWidth={2.2} />
										{zh ? "对比" : "Compare"}
									</button>
								</div>

								<div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
									{modes.map((m) => (
										<ChoiceTile
											key={m.id || "full"}
											label={m.label}
											sub={m.sub}
											active={selectedMode === m.id}
											onClick={() => changeMode(m.id)}
										/>
									))}
								</div>

								{showHelpPopover && (
									<div
										role="dialog"
										aria-label={zh ? "模式说明" : "Mode comparison"}
										className="card-float mt-2 p-4 text-[11.5px]"
									>
										<div className="flex items-center justify-between border-b border-hairline pb-2">
											<span className="eyebrow text-[10px] text-ink">
												{zh ? "模式差异" : "Mode diff"}
											</span>
											<button
												type="button"
												onClick={() => setShowHelpPopover(false)}
												className="text-[10px] font-semibold uppercase tracking-[0.08em] text-faint transition-colors hover:text-ink"
											>
												{zh ? "关闭" : "close"}
											</button>
										</div>
										<dl className="mt-2.5 max-h-56 space-y-2.5 overflow-y-auto pr-1">
											{[
												{
													term: "full",
													d: zh
														? "20+ 场景分组（AI、开发、流媒体…），每个都能在客户端独立选择出向。"
														: "20+ scenario groups (AI, dev, media…) each individually selectable in your client.",
												},
												{
													term: "dual",
													d: zh
														? "所有海外场景合并进单一「🚀 节点选择」，规则体积与界面最精简。"
														: 'All foreign scenarios merged into one "🚀 Proxy Select" — smallest ruleset and UI.',
												},
												{
													term: "white",
													d: zh
														? "仅命中海外规则的流量走代理，其余默认 DIRECT。"
														: "Only traffic matching foreign rules is proxied; everything else defaults to DIRECT.",
												},
												{
													term: "black",
													d: zh
														? "仅命中国内规则的流量直连，其余默认走代理。"
														: "Only traffic matching domestic rules goes DIRECT; everything else defaults to proxies.",
												},
											].map((row) => (
												<div key={row.term} className="flex gap-2.5">
													<dt className="w-12 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wide text-ink">
														{row.term}
													</dt>
													<dd className="leading-relaxed text-mute">{row.d}</dd>
												</div>
											))}
										</dl>
									</div>
								)}
							</div>

							<div>
								<FieldLabel>{t.ruleGranularity}</FieldLabel>
								<div className="grid auto-rows-fr grid-cols-2 gap-1.5">
									{(
										[
											{ id: "category", name: t.rulesCategory, desc: t.rulesCategoryDesc },
											{ id: "granular", name: t.rulesGranular, desc: t.rulesGranularDesc },
										] as const
									).map((r) => {
										const active = rulesMode === r.id;
										return (
											<button
												key={r.id}
												type="button"
												onClick={() => setRulesMode(r.id)}
												className={cn(
													"flex h-full flex-col gap-1 rounded-sm border p-2.5 text-left transition-colors",
													active
														? "border-ink bg-elevated"
														: "border-hairline bg-canvas hover:border-ink/20",
												)}
											>
												<span className="flex items-center gap-1.5">
													<span
														className={cn(
															"flex size-3 items-center justify-center rounded-full border",
															active ? "border-ink bg-ink" : "border-hairline",
														)}
													>
														{active && (
															<span className="size-1 rounded-full bg-on-ink" aria-hidden="true" />
														)}
													</span>
													<span className="text-[11.5px] font-semibold text-ink">{r.name}</span>
												</span>
												<span className="text-[10px] leading-snug text-faint">{r.desc}</span>
											</button>
										);
									})}
								</div>
							</div>

							<div>
								<FieldLabel htmlFor="secret-input">{t.secret}</FieldLabel>
								<input
									id="secret-input"
									type="text"
									value={secret}
									onChange={(e) => setSecret(e.target.value)}
									placeholder={t.secretPlaceholder}
									className="input font-mono"
								/>
							</div>

							<div>
								<FieldLabel htmlFor="mirror-input">{t.mirror}</FieldLabel>
								<input
									id="mirror-input"
									list="gh-proxies-list"
									type="text"
									value={ghProxy}
									onChange={(e) => setGhProxy(e.target.value)}
									placeholder={t.mirrorPlaceholder}
									className="input font-mono"
								/>
								<datalist id="gh-proxies-list">
									{COMMON_GH_PROXIES.map((proxy) => (
										<option key={proxy} value={proxy} />
									))}
								</datalist>
							</div>
						</div>
					</section>
				</div>
			</main>

			{/* ------------------------------------------------------- endpoint */}
			<section className="border-t border-hairline bg-elevated/40">
				<div className="shell py-14 md:py-16">
					<SectionHead
						index="02"
						title={zh ? "生成订阅地址" : "Endpoint"}
						desc={
							zh
								? "生成可直接粘贴到客户端订阅栏的链接；可单独转为短链或在新窗口验证。"
								: "Generate an importable endpoint, shorten it, or verify it in a new tab."
						}
					/>
					<ActionBox
						proxiesText={proxiesText}
						subs={subs}
						configType={configType}
						rules={rulesMode}
						ghProxy={ghProxy}
						secret={secret}
						lang={lang}
						proxiesValidation={proxiesValidation}
						subscriptionAnalysis={subscriptionAnalysis}
						customNodesCount={customNodeCount}
					/>
				</div>
			</section>

			{/* -------------------------------------------------------- routing */}
			<section className="shell py-14 md:py-16">
				<SectionHead
					index="03"
					title={zh ? "分流路径" : "Routing path"}
					desc={
						zh
							? "当前模式下流量如何被判定、匹配与派发。"
							: "How traffic is judged, matched and dispatched in the active mode."
					}
					aside={
						<span className="chip chip-link">{`mode=${selectedMode ? selectedMode.slice(1) : "full"}`}</span>
					}
				/>
				<RoutingFlow mode={selectedMode} lang={lang} />
			</section>

			{/* ---------------------------------------------------------- tools */}
			<section id="tools" className="border-t border-hairline bg-elevated/40 scroll-mt-16">
				<div className="shell py-14 md:py-16">
					<SectionHead
						index="04"
						title={t.toolsTitle}
						desc={t.toolsDesc}
						aside={
							<a href="/tools.html" target="_blank" rel="noreferrer" className="btn-square-ghost">
								<Terminal className="size-3" strokeWidth={2.2} />
								{zh ? "打开工具箱" : "Open toolbox"}
							</a>
						}
					/>

					<div className="grid gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-3">
						{tools.map((tool) => (
							<a
								key={tool.href}
								href={tool.href}
								target="_blank"
								rel="noreferrer"
								className="group flex flex-col justify-between gap-6 bg-canvas p-5 transition-colors hover:bg-elevated md:p-6"
							>
								<div className="flex items-start justify-between">
									<span className="flex size-8 items-center justify-center rounded-sm border border-hairline bg-elevated text-ink transition-colors group-hover:border-ink/30">
										<tool.icon className="size-4" strokeWidth={1.9} />
									</span>
									<ArrowUpRight
										className="size-3.5 text-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
										strokeWidth={2}
									/>
								</div>
								<div>
									<h3 className="text-[13px] font-semibold tracking-tight text-ink">
										{tool.title}
									</h3>
									<p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-mute">
										{tool.desc}
									</p>
									<span className="mt-3 block font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
										{tool.meta}
									</span>
								</div>
							</a>
						))}
					</div>
				</div>
			</section>

			{/* --------------------------------------------------------- footer */}
			<SiteFooter lang={lang} />

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
