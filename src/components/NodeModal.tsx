import { AlertTriangle, KeyRound, Network, Settings2, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { buildNodeUri } from "@/lib/node-uri";
import { isProtocolSupportedByKernel, type KernelId } from "@/lib/protocol-support";
import NodeModalTabContent from "./node-modal/NodeModalTabContent";
import { NODE_MODAL_TRANSLATIONS } from "./node-modal/translations";
import { useNodeForm } from "./node-modal/useNodeForm";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onInject: (nodeStr: string) => void;
	lang?: "zh" | "en";
	kernel?: KernelId;
}

const KERNEL_LABELS: Record<KernelId, { zh: string; en: string }> = {
	mihomo: { zh: "Mihomo", en: "Mihomo" },
	stash: { zh: "Stash", en: "Stash" },
	"sing-box": { zh: "sing-box", en: "sing-box" },
};

export default function NodeModal({ isOpen, onClose, onInject, lang = "zh", kernel }: Props) {
	const [activeTab, setActiveTab] = useState<"basic" | "auth" | "advanced">("basic");
	const { form, updateField, changeProtocol } = useNodeForm();
	const { protocol } = form;
	const canInject =
		protocol === "tailscale" ? Boolean(form.password) : Boolean(form.host && form.port);

	if (!isOpen) return null;

	const handleInject = () => {
		const uri = buildNodeUri(form);
		if (!uri) return;
		onInject(uri);
		onClose();
	};

	const isTailscaleOrWG = protocol === "tailscale" || protocol === "wireguard";

	const t = NODE_MODAL_TRANSLATIONS[lang];

	const protocolUnsupported = kernel != null && !isProtocolSupportedByKernel(protocol, kernel);
	const protocolWarning = protocolUnsupported
		? t.unsupportedProtocol(protocol, KERNEL_LABELS[kernel][lang])
		: null;

	const tabs: { id: "basic" | "auth" | "advanced"; label: string; icon: typeof Network }[] = [
		{ id: "basic", label: t.topology, icon: Network },
		{ id: "auth", label: t.credentials, icon: KeyRound },
		...(isTailscaleOrWG ? [] : [{ id: "advanced" as const, label: t.advanced, icon: Settings2 }]),
	];

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
			{/* Scrim */}
			<button
				type="button"
				aria-label={lang === "zh" ? "关闭" : "Close"}
				onClick={onClose}
				className="absolute inset-0 cursor-default bg-black/35 backdrop-blur-[3px] dark:bg-black/65"
			/>

			{/* Dialog */}
			<div
				role="dialog"
				aria-modal="true"
				aria-label={t.title}
				className="card-float animate-reveal relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden sm:rounded-lg"
			>
				{/* Header */}
				<div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
					<div className="flex min-w-0 items-center gap-2">
						<span className="flex size-6 items-center justify-center rounded-sm border border-hairline bg-canvas text-ink">
							<Network className="size-3.5" strokeWidth={2.2} />
						</span>
						<h2 className="eyebrow truncate text-[10.5px] text-ink">{t.title}</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label={lang === "zh" ? "关闭" : "Close"}
						className="btn-square-ghost w-8 shrink-0 px-0"
					>
						<X className="size-3.5" strokeWidth={2.2} />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-hairline px-5 py-3 no-scrollbar">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							data-active={activeTab === tab.id}
							className="tab-pill"
						>
							<tab.icon className="size-3" strokeWidth={2.2} />
							{tab.label}
						</button>
					))}
				</div>

				<NodeModalTabContent
					activeTab={activeTab}
					form={form}
					updateField={updateField}
					changeProtocol={changeProtocol}
					lang={lang}
					t={t}
				/>

				{protocolWarning && (
					<div className="flex shrink-0 items-start gap-2 border-t border-warn/25 bg-warn/5 px-5 py-2.5">
						<AlertTriangle className="mt-px size-3.5 shrink-0 text-warn" strokeWidth={2.2} />
						<span className="text-[11px] leading-relaxed text-warn-deep">{protocolWarning}</span>
					</div>
				)}

				{/* Footer */}
				<div className="flex shrink-0 items-center justify-end gap-2 border-t border-hairline bg-canvas px-5 py-3.5">
					<button type="button" onClick={onClose} className="btn-square-ghost">
						{t.cancel}
					</button>
					<button
						type="button"
						onClick={handleInject}
						disabled={!canInject}
						className={cn("btn-square", !canInject && "cursor-not-allowed")}
					>
						{t.inject}
					</button>
				</div>
			</div>
		</div>
	);
}
