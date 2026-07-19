import { AlertTriangle, KeyRound, Network, Settings2, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
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

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop with Blur */}
			<div
				role="none"
				className="absolute inset-0 bg-[#000]/70 backdrop-blur-md transition-opacity duration-300"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === "Escape") onClose();
				}}
			/>

			{/* Shadcn Dialog Panel */}
			<div className="glass-panel w-full max-w-lg relative flex flex-col max-h-[85vh] animate-reveal duration-300">
				{/* Modal Header */}
				<div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
					<div className="flex items-center gap-2">
						<ShieldCheck className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
						<h3 className="text-md font-bold tracking-tight text-zinc-900 dark:text-white uppercase">
							{t.title}
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/85 transition-all border border-zinc-200 dark:border-zinc-800/40 cursor-pointer"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Tabbed Navigation */}
				<div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 shrink-0 px-4 pt-1">
					<button
						type="button"
						onClick={() => setActiveTab("basic")}
						className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
							activeTab === "basic"
								? "border-indigo-500 text-zinc-900 dark:text-white"
								: "border-transparent text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
						}`}
					>
						<Network className="h-3.5 w-3.5" />
						{t.topology}
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("auth")}
						className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
							activeTab === "auth"
								? "border-indigo-500 text-zinc-900 dark:text-white"
								: "border-transparent text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
						}`}
					>
						<KeyRound className="h-3.5 w-3.5" />
						{t.credentials}
					</button>
					{!isTailscaleOrWG && (
						<button
							type="button"
							onClick={() => setActiveTab("advanced")}
							className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
								activeTab === "advanced"
									? "border-indigo-500 text-zinc-900 dark:text-white"
									: "border-transparent text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
							}`}
						>
							<Settings2 className="h-3.5 w-3.5" />
							{t.advanced}
						</button>
					)}
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
					<div className="px-6 py-2.5 border-t border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 flex items-start gap-2">
						<AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
						<span className="text-[11px] leading-normal text-amber-700 dark:text-amber-400">
							{protocolWarning}
						</span>
					</div>
				)}

				{/* Modal Footer */}
				<div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 flex justify-end gap-3 shrink-0">
					<button
						type="button"
						onClick={onClose}
						className="btn-outline !py-2 !px-4 text-xs font-semibold uppercase tracking-wider"
					>
						{t.cancel}
					</button>
					<button
						type="button"
						onClick={handleInject}
						disabled={!canInject}
						className="btn-glow !py-2 !px-5 text-xs font-semibold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{t.inject}
					</button>
				</div>
			</div>
		</div>
	);
}
