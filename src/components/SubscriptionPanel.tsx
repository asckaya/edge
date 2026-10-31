import { Globe, Link2, Plus, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/cn";
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
		namePlaceholder: "订阅名称 (Airport1)",
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
		namePlaceholder: "Provider Name",
		urlPlaceholder: "Subscription URL (http/https)",
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
		<div className="space-y-2.5">
			{subs.map((sub, index) => {
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
					<div key={sub.id} className="group/row">
						<div className="flex items-center gap-1.5">
							<span className="w-6 shrink-0 select-none font-mono text-[10px] tabular-nums text-faint">
								{String(index + 1).padStart(2, "0")}
							</span>

							<div className="relative flex w-[40%] min-w-0 shrink-0 items-center">
								<Globe
									className="pointer-events-none absolute left-2.5 size-3.5 text-faint transition-colors group-focus-within/row:text-ink"
									strokeWidth={2}
								/>
								<input
									type="text"
									placeholder={t.namePlaceholder}
									value={sub.name}
									onChange={(e) => updateSub(sub.id, "name", e.target.value)}
									className="input w-full min-w-0 pl-8"
									data-invalid={nameError ? "true" : "false"}
								/>
							</div>

							<div className="relative flex min-w-0 flex-[2] items-center">
								<Link2
									className="pointer-events-none absolute left-2.5 size-3.5 text-faint transition-colors group-focus-within/row:text-ink"
									strokeWidth={2}
								/>
								<input
									type="text"
									placeholder={t.urlPlaceholder}
									value={sub.url}
									onChange={(e) => updateSub(sub.id, "url", e.target.value)}
									className="input w-full min-w-0 pl-8"
									data-invalid={urlError ? "true" : "false"}
								/>
							</div>

							{subs.length > 1 && (
								<button
									type="button"
									onClick={() => removeSubRow(sub.id)}
									title={t.removeTitle}
									aria-label={t.removeTitle}
									className={cn(
										"btn-square-ghost w-8 shrink-0 px-0 text-mute",
										"hover:border-danger/40 hover:bg-danger/5 hover:text-danger",
									)}
								>
									<Trash2 className="size-3.5" strokeWidth={2} />
								</button>
							)}
						</div>

						{hasError && (
							<p className="mt-1 pl-7.5 font-mono text-[10.5px] text-danger">
								{nameError || urlError}
							</p>
						)}
					</div>
				);
			})}

			<div className="pl-7.5">
				<button
					type="button"
					onClick={addSubRow}
					className="flex h-9 w-full items-center justify-center gap-1.5 rounded-sm border border-dashed border-hairline bg-canvas text-[11.5px] font-semibold text-mute transition-colors hover:border-ink/30 hover:text-ink"
				>
					<Plus className="size-3.5" strokeWidth={2.4} />
					{t.addProvider}
				</button>
			</div>
		</div>
	);
}
