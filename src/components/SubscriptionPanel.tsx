import { AlertCircle, Globe, Link2, Plus, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import {
	isSafeSubscriptionName,
	isValidSubscriptionUrl,
	type Subscription,
} from "@/lib/subscriptions";

interface Props {
	subs: Subscription[];
	setSubs: Dispatch<SetStateAction<Subscription[]>>;
	lang?: "zh" | "en";
	/** Pre-computed duplicate subscription names (lifted to page level). */
	duplicateNames: Set<string>;
}

const TRANSLATIONS_PANEL = {
	zh: {
		namePlaceholder: "订阅名称 (如: Airport1)",
		urlPlaceholder: "订阅源完整链接 (HTTP / HTTPS)",
		invalidName: "无效名称格式（仅支持字母、数字、下划线及中文）",
		conflictName: "名称冲突：该订阅提供商名称已存在",
		invalidUrl: "无效的订阅链接（必须以 http:// 或 https:// 开头）",
		addProvider: "添加远程订阅提供商",
		removeTitle: "移除",
		nameRequired: "订阅名称不能为空",
		urlRequired: "订阅链接不能为空",
	},
	en: {
		namePlaceholder: "Provider Name (e.g. Airport1)",
		urlPlaceholder: "Subscription URL (HTTP / HTTPS)",
		invalidName: "Invalid Syntax (alphanumeric, underscore and Chinese chars only)",
		conflictName: "Conflict: Provider name already exists",
		invalidUrl: "Invalid subscription connection protocol (must start with http/https)",
		addProvider: "Add Subscription Provider",
		removeTitle: "Remove",
		nameRequired: "Subscription name cannot be empty",
		urlRequired: "Subscription URL cannot be empty",
	},
};

export default function SubscriptionPanel({ subs, setSubs, lang = "zh", duplicateNames }: Props) {
	const addSubRow = () => {
		setSubs((prev) => [...prev, { id: Date.now(), name: "", url: "" }]);
	};

	const removeSubRow = (id: number) => {
		setSubs((prev) => prev.filter((s) => s.id !== id));
	};

	const updateSub = (id: number, field: "name" | "url", value: string) => {
		setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
	};

	const t = TRANSLATIONS_PANEL[lang];

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3">
				{subs.map((sub) => {
					const nameTrimmed = sub.name.trim();
					const urlTrimmed = sub.url.trim();
					const isRowCompletelyEmpty = nameTrimmed === "" && urlTrimmed === "";

					let nameError = "";
					let urlError = "";

					if (!isRowCompletelyEmpty) {
						if (nameTrimmed === "") {
							nameError = t.nameRequired;
						} else if (!isSafeSubscriptionName(nameTrimmed)) {
							nameError = t.invalidName;
						} else if (duplicateNames.has(nameTrimmed)) {
							nameError = t.conflictName;
						}

						if (urlTrimmed === "") {
							urlError = t.urlRequired;
						} else if (!isValidSubscriptionUrl(urlTrimmed)) {
							urlError = t.invalidUrl;
						}
					}

					const hasError = Boolean(nameError || urlError);

					return (
						<div
							key={sub.id}
							className="group flex flex-col gap-1.5 transition-all duration-300 animate-reveal"
						>
							<div className="flex items-center gap-3 relative">
								<div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
									<div className="sm:col-span-4 relative flex items-center">
										<div className="absolute left-3.5 text-zinc-500 dark:text-zinc-500 pointer-events-none group-focus-within:text-zinc-700 dark:group-focus-within:text-zinc-300 transition-colors">
											<Globe className="h-4 w-4" />
										</div>
										{/* Fixed overlapping by using !pl-10 and adjusted placeholder text colors */}
										<input
											type="text"
											placeholder={t.namePlaceholder}
											value={sub.name}
											onChange={(e) => updateSub(sub.id, "name", e.target.value)}
											className={`w-full modern-input !pl-10 font-semibold placeholder:text-zinc-400 dark:placeholder:text-zinc-600 ${
												nameError
													? "border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-200 focus:border-red-500 dark:focus:border-red-800 focus:ring-red-100 dark:focus:ring-red-950/40"
													: ""
											}`}
										/>
									</div>
									<div className="sm:col-span-8 relative flex items-center">
										<div className="absolute left-3.5 text-zinc-500 dark:text-zinc-500 pointer-events-none group-focus-within:text-zinc-700 dark:group-focus-within:text-zinc-300 transition-colors">
											<Link2 className="h-4 w-4" />
										</div>
										{/* Fixed overlapping by using !pl-10 and adjusted placeholder text colors */}
										<input
											type="text"
											placeholder={t.urlPlaceholder}
											value={sub.url}
											onChange={(e) => updateSub(sub.id, "url", e.target.value)}
											className={`w-full modern-input !pl-10 font-mono text-[12px] placeholder:text-zinc-400 dark:placeholder:text-zinc-600 ${
												urlError
													? "border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-200 focus:border-red-500 dark:focus:border-red-800 focus:ring-red-100 dark:focus:ring-red-950/40"
													: ""
											}`}
										/>
									</div>
								</div>

								{subs.length > 1 && (
									<button
										type="button"
										onClick={() => removeSubRow(sub.id)}
										className="p-2.5 text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all border border-zinc-200 dark:border-zinc-800/40 hover:border-red-300 dark:hover:border-red-900/30 bg-white dark:bg-zinc-950/50 shrink-0 cursor-pointer"
										title={t.removeTitle}
									>
										<Trash2 className="h-4 w-4" />
									</button>
								)}
							</div>

							{hasError && (
								<div className="flex items-center gap-1.5 pl-3.5 text-red-600 dark:text-red-400">
									<AlertCircle className="h-3.5 w-3.5 shrink-0" />
									<span className="text-[11px] font-medium tracking-wide">
										{nameError || urlError}
									</span>
								</div>
							)}
						</div>
					);
				})}
			</div>

			<button
				type="button"
				onClick={addSubRow}
				className="group btn-outline !py-2.5 w-full justify-center text-[12px] uppercase tracking-wider font-semibold border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-500 dark:hover:border-zinc-600 cursor-pointer"
			>
				<Plus className="h-4 w-4 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors" />
				{t.addProvider}
			</button>
		</div>
	);
}
