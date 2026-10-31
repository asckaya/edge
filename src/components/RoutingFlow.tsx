import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { FlowData, FlowItem, FlowStep, Lang, Mode } from "./RoutingFlow.data";
import { FLOW_DATA } from "./RoutingFlow.data";

interface RoutingFlowProps {
	mode: string; // '', '-dual', '-white', '-black'
	lang: Lang;
}

function ColumnHead({ step }: { step: FlowStep }) {
	return (
		<div className="flex items-baseline justify-between gap-2 pb-3">
			<span className="eyebrow text-[9.5px] text-ink">{step.title}</span>
			<span className="font-mono text-[9.5px] text-faint">{step.items.length}</span>
		</div>
	);
}

function FlowItemRow({ item, tag }: { item: FlowItem; tag?: string }) {
	return (
		<div className="flex items-center justify-between gap-2 rounded-sm border border-hairline bg-canvas px-2.5 py-2 transition-colors hover:border-ink/15">
			<div className="flex min-w-0 items-center gap-2">
				<span
					className={cn(
						"flex size-6 shrink-0 items-center justify-center rounded-sm border border-hairline",
						item.color,
					)}
				>
					<item.icon className="size-3.5" />
				</span>
				<span className="truncate text-[11.5px] font-medium text-ink">{item.name}</span>
			</div>
			{tag && (
				<span
					className={cn(
						"chip shrink-0 border-transparent bg-transparent px-0 font-mono text-[9px]",
						tag === "DIRECT" && "text-ink",
						tag === "REJECT" && "text-danger",
						tag !== "DIRECT" && tag !== "REJECT" && "text-link",
					)}
				>
					{tag}
				</span>
			)}
		</div>
	);
}

function FlowColumn({ step }: { step: FlowStep }) {
	return (
		<div>
			<ColumnHead step={step} />
			<div className="space-y-1.5">
				{step.items.map((item) => (
					<FlowItemRow key={item.name} item={item} tag={item.tag} />
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
		<div className="card overflow-hidden">
			<div className="flex flex-col gap-1 border-b border-hairline px-5 py-4 md:flex-row md:items-center md:justify-between">
				<div className="flex items-center gap-2">
					<span className="eyebrow text-[10.5px] text-ink">{flow.title}</span>
				</div>
				<p className="max-w-md text-[11.5px] leading-relaxed text-mute md:text-right">
					{flow.desc}
				</p>
			</div>

			<div className="grid grid-cols-1 items-start gap-6 p-5 md:grid-cols-11 md:gap-3 md:p-6">
				<div className="md:col-span-3">
					<FlowColumn step={step1} />
				</div>

				<div className="hidden justify-center pt-10 md:col-span-1 md:flex">
					<ArrowRight className="size-3.5 text-faint" strokeWidth={2} />
				</div>

				<div className="md:col-span-3">
					<FlowColumn step={step2} />
				</div>

				<div className="hidden justify-center pt-10 md:col-span-1 md:flex">
					<ArrowRight className="size-3.5 text-faint" strokeWidth={2} />
				</div>

				<div className="md:col-span-3">
					<FlowColumn step={step3} />
				</div>
			</div>

			<div className="border-t border-hairline bg-canvas px-5 py-3.5 md:px-6">
				<p className="text-[11px] leading-relaxed text-mute">
					<span className="mr-1.5 font-semibold text-ink">{isChinese ? "note //" : "note //"}</span>
					{isChinese
						? "所有场景分组默认出向均为「🚀 节点选择」，可在客户端为单个场景覆盖为具体地区或自动测速组。"
						: 'Every scenario group defaults to "🚀 Proxy Select"; override each one in your client with a region or auto-test group.'}
				</p>
			</div>
		</div>
	);
}
