import { ArrowRight, HelpCircle } from "lucide-react";
import type { FlowData, FlowStep, Lang, Mode } from "./RoutingFlow.data";
import { FLOW_DATA } from "./RoutingFlow.data";

interface RoutingFlowProps {
	mode: string; // '', '-dual', '-white', '-black'
	lang: Lang;
}

function FlowColumn({ step }: { step: FlowStep }) {
	return (
		<div className="space-y-3">
			<span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-600 dark:text-zinc-300 block mb-1">
				{step.title}
			</span>
			<div className="space-y-2">
				{step.items.map((item) => (
					<div
						key={item.name}
						className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-sm hover:scale-[1.01] transition-all"
					>
						<div className={`p-1.5 rounded-lg ${item.color}`}>
							<item.icon className="h-4 w-4" />
						</div>
						<span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{item.name}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function RuleColumn({ step }: { step: FlowStep }) {
	return (
		<div className="space-y-3">
			<span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-600 dark:text-zinc-300 block mb-1">
				{step.title}
			</span>
			<div className="space-y-2">
				{step.items.map((item) => (
					<div
						key={item.name}
						className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-sm hover:scale-[1.01] transition-all"
					>
						<div className="flex items-center gap-2.5">
							<div className={`p-1.5 rounded-lg ${item.color}`}>
								<item.icon className="h-4 w-4" />
							</div>
							<span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
								{item.name}
							</span>
						</div>
						{item.tag && (
							<span
								className={`text-[8px] font-mono font-extrabold py-0.5 px-1.5 rounded uppercase ${
									item.tag === "DIRECT"
										? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20"
										: item.tag === "REJECT"
											? "bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20"
											: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20"
								}`}
							>
								{item.tag}
							</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

function OutboundColumn({ step }: { step: FlowStep }) {
	return (
		<div className="space-y-3">
			<span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-600 dark:text-zinc-300 block mb-1">
				{step.title}
			</span>
			<div className="space-y-2">
				{step.items.map((item) => (
					<div
						key={item.name}
						className={`flex items-center gap-2.5 p-2.5 rounded-xl border shadow-sm hover:scale-[1.01] transition-all ${item.color}`}
					>
						<item.icon className="h-4 w-4 shrink-0" />
						<span className="text-xs font-extrabold truncate">{item.name}</span>
					</div>
				))}
			</div>
		</div>
	);
}

export default function RoutingFlow({ mode, lang }: RoutingFlowProps) {
	const isChinese = lang === "zh";
	const flow: FlowData = FLOW_DATA[mode as Mode][lang];
	const [step1, step2, step3] = flow.steps;
	if (!(step1 && step2 && step3)) return null;

	return (
		<div className="p-6 bg-white dark:bg-zinc-950/30 rounded-xl border border-zinc-200/80 dark:border-zinc-900/60 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-800 transition-all space-y-5 animate-reveal">
			<div className="border-b border-zinc-100 dark:border-zinc-900/60 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
				<div className="flex flex-col gap-1">
					<span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
						{isChinese ? "📐 当前模式架构分流路径可视化" : "📐 Path Routing Visualization"}
					</span>
					<h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">{flow.title}</h3>
				</div>
				<p className="text-[11px] text-zinc-500 dark:text-zinc-300 max-w-md md:text-right font-medium">
					{flow.desc}
				</p>
			</div>

			{/* Visual Flow Grid */}
			<div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
				{/* Step 1: Input */}
				<div className="md:col-span-3">
					<FlowColumn step={step1} />
				</div>

				{/* Arrow 1 */}
				<div className="hidden md:flex md:col-span-1 justify-center">
					<ArrowRight className="h-5 w-5 text-indigo-500 animate-pulse-slow" />
				</div>

				{/* Step 2: Rules */}
				<div className="md:col-span-3">
					<RuleColumn step={step2} />
				</div>

				{/* Arrow 2 */}
				<div className="hidden md:flex md:col-span-1 justify-center">
					<ArrowRight className="h-5 w-5 text-indigo-500 animate-pulse-slow" />
				</div>

				{/* Step 3: Outbounds */}
				<div className="md:col-span-3">
					<OutboundColumn step={step3} />
				</div>
			</div>

			{/* Configuration Hint Box */}
			<div className="mt-4 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-2.5">
				<HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
				<div className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
					<strong>
						{isChinese ? "💡 配置与交互提示：" : "💡 Configuration & Interactive Tip:"}
					</strong>
					{isChinese
						? "所有特化场景策略组（如 AI 服务、油管视频等）的默认出向均设为「🚀 节点选择」。用户可以在客户端软件的界面中，为各个场景独立选择不同的出向（例如：手动将 AI 服务切到「美国节点」，将油管视频切到「香港自动」），从而轻松实现上述定制化分流方案。"
						: 'All scenario groups default to "🚀 Proxy Select". You can freely override this in your client UI by selecting a specific region or auto-test group for each scenario individually (e.g. directing AI to US nodes and YouTube to HK auto-test).'}
				</div>
			</div>
		</div>
	);
}
