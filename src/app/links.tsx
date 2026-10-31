import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowUpRight,
	Check,
	Copy,
	Database,
	ExternalLink,
	KeyRound,
	Link2,
	Loader2,
	RefreshCw,
	Scissors,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePreferences } from "@/components/home/usePreferences";
import SectionHead from "@/components/layout/SectionHead";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteNav from "@/components/layout/SiteNav";
import { cn } from "@/lib/cn";
import {
	apiRequest,
	readAccessKey,
	readAdminKey,
	storeAccessKey,
	storeAdminKey,
	withAccessKey,
} from "@/lib/links";

export const Route = createFileRoute("/links")({
	component: LinksComponent,
});

const SLUG_PATTERN = /^[A-Za-z0-9_-]{3,64}$/;

const TTL_OPTIONS = [
	{ value: "", zh: "永久", en: "never" },
	{ value: "86400", zh: "1 天", en: "1 day" },
	{ value: "604800", zh: "7 天", en: "7 days" },
	{ value: "2592000", zh: "30 天", en: "30 days" },
	{ value: "31536000", zh: "1 年", en: "1 year" },
];

type LogTone = "ok" | "err" | "info";
interface LogEntry {
	id: number;
	time: string;
	tag: string;
	tone: LogTone;
	message: string;
}

interface ShortLinkResult {
	slug: string;
	shortUrl: string;
	target: string;
}

const COPY = {
	zh: {
		eyebrow: "edge link --console",
		title: "短链接控制台",
		lead: "把任意订阅或节点地址压缩成短链，之后随时替换目标而不用改动客户端里的订阅地址。任何人都可以创建。",
		accessKey: "访问密钥",
		accessHint: "本组共用同一把访问密钥，打开短链时需要带上 ?key=",
		accessMissing: "填写访问密钥后短链才会受保护，否则任何人拿到链接都能打开。",
		create: "创建短链接",
		createDesc: "填写目标地址即可生成，访问时自动续期，长期不用会被自动清理。",
		target: "目标地址",
		slug: "自定义 slug",
		ttl: "有效期",
		submit: "生成短链接",
		submitting: "生成中",
		lookupTitle: "查询短链",
		lookupDesc: "输入 slug 查看它当前指向的目标地址。",
		lookup: "查询",
		expand: "解析结果",
		admin: "管理员面板",
		adminDesc: "仅自定义 slug、替换目标与删除需要管理员密钥。",
		adminKey: "管理员密钥",
		adminHint: "只保存在当前标签页",
		update: "更新目标",
		delete: "删除",
		console: "操作日志",
		emptyConsole: "尚无操作记录",
		copy: "复制短链",
		copied: "已复制",
		open: "打开",
		notFound: "短链不存在",
		lookupDenied: "未找到，或访问密钥不匹配",
		confirmDelete: "确认删除该短链？删除后不可恢复。",
		slugNote: "仅允许字母、数字、- 和 _，长度 3–64",
		urlNote: "请输入完整的 http(s) 地址",
		keyNote: "访问密钥至少 4 位",
		lifecycle: "普通短链 3 个月无人访问会被自动清理，每次访问自动续期。",
		rateLimited: "创建过于频繁，请稍后再试。",
	},
	en: {
		eyebrow: "edge link --console",
		title: "Short link console",
		lead: "Compress any subscription or node URL into a short link you can repoint later without touching your client. Anyone can create one.",
		accessKey: "Access key",
		accessHint: "The group shares one access key — append ?key= when opening.",
		accessMissing:
			"Set the access key to protect the link; otherwise anyone with the URL can open it.",
		create: "Create short link",
		createDesc:
			"A target URL is all you need — the link renews on use and is cleaned up when idle.",
		target: "Target URL",
		slug: "Custom slug",
		ttl: "Expires",
		submit: "Create short link",
		submitting: "Creating",
		lookupTitle: "Look up a link",
		lookupDesc: "Enter a slug to see where it currently points.",
		expand: "Resolved target",
		admin: "Admin panel",
		adminDesc: "Custom slugs, repointing and deletion require the admin key.",
		adminKey: "Admin key",
		adminHint: "Kept in this tab only",
		update: "Update target",
		delete: "Delete",
		console: "Activity log",
		emptyConsole: "no activity yet",
		copy: "Copy",
		copied: "Copied",
		open: "Open",
		notFound: "Short link not found",
		lookupDenied: "Not found, or the access key does not match",
		confirmDelete: "Delete this short link? This cannot be undone.",
		slugNote: "letters, digits, - and _ only, length 3–64",
		urlNote: "enter a full http(s) URL",
		keyNote: "access key needs at least 4 characters",
		lifecycle: "Ordinary links are cleaned up after 3 months without a visit and renew on use.",
		rateLimited: "Too many creations — try again later.",
	},
} as const;

function timestamp(): string {
	return new Date().toTimeString().slice(0, 8);
}

function isValidTarget(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function LinksComponent() {
	const { theme, lang, toggleTheme, toggleLang } = usePreferences();
	const t = COPY[lang];

	const [accessKey, setAccessKey] = useState("");
	const [adminKey, setAdminKey] = useState("");
	const [ready, setReady] = useState(false);
	// `/links?admin=1` unlocks the maintenance panel. Read straight from the URL so
	// the public view never depends on router search validation.
	const [admin, setAdmin] = useState(false);

	useEffect(() => {
		setAccessKey(readAccessKey());
		setAdminKey(readAdminKey());
		setAdmin(new URLSearchParams(window.location.search).get("admin") === "1");
		setReady(true);
	}, []);

	// create form
	const [target, setTarget] = useState("");
	const [slug, setSlug] = useState("");
	const [ttl, setTtl] = useState("");
	const [creating, setCreating] = useState(false);
	const [created, setCreated] = useState<ShortLinkResult | null>(null);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	// lookup / admin ops
	const [lookupSlug, setLookupSlug] = useState("");
	const [resolved, setResolved] = useState<{ slug: string; target: string | null } | null>(null);
	const [updateTarget, setUpdateTarget] = useState("");
	const [busy, setBusy] = useState<"lookup" | "update" | "delete" | null>(null);

	const [log, setLog] = useState<LogEntry[]>([]);

	const pushLog = useCallback((tag: string, tone: LogTone, message: string) => {
		setLog((prev) =>
			[{ id: Date.now() + Math.random(), time: timestamp(), tag, tone, message }, ...prev].slice(
				0,
				12,
			),
		);
	}, []);

	const updateAccessKey = (value: string) => {
		setAccessKey(value);
		storeAccessKey(value);
	};

	const updateAdminKey = (value: string) => {
		setAdminKey(value);
		storeAdminKey(value);
	};

	const keyTooShort = accessKey.trim() !== "" && accessKey.trim().length < 4;
	const targetError = useMemo(() => {
		if (!target.trim()) return null;
		return isValidTarget(target.trim()) ? null : t.urlNote;
	}, [target, t.urlNote]);
	const slugError = useMemo(() => {
		const value = slug.trim();
		if (!value) return null;
		return SLUG_PATTERN.test(value) ? null : t.slugNote;
	}, [slug, t.slugNote]);

	const canCreate =
		ready &&
		target.trim() !== "" &&
		!targetError &&
		!slugError &&
		!keyTooShort &&
		accessKey.trim() !== "" &&
		!creating;

	const handleCreate = async () => {
		setCreating(true);
		try {
			const body: Record<string, unknown> = {
				target: target.trim(),
				accessKey: accessKey.trim(),
			};
			if (admin && slug.trim()) body.slug = slug.trim();
			if (ttl) body.ttlSeconds = Number(ttl);

			const result = await apiRequest<ShortLinkResult>("/api/shorten", {
				method: "POST",
				body,
				adminKey: admin ? adminKey : undefined,
			});
			setCreated(result);
			setLookupSlug(result.slug);
			pushLog("CREATE", "ok", `/${result.slug} → ${result.target}`);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			pushLog("CREATE", "err", message.includes("429") ? t.rateLimited : message);
		} finally {
			setCreating(false);
		}
	};

	const handleLookup = async () => {
		const value = lookupSlug.trim();
		if (!value) return;
		setBusy("lookup");
		try {
			// The target of a key-protected link is only readable with the same key the
			// redirect requires; admins may read any link with their admin key.
			const query = accessKey ? `?key=${encodeURIComponent(accessKey)}` : "";
			const result = await apiRequest<{ slug: string; target: string | null }>(
				`/api/expand/${encodeURIComponent(value)}${query}`,
				{ adminKey: admin ? adminKey : undefined },
			);
			setResolved(result);
			setUpdateTarget(result.target ?? "");
			pushLog("EXPAND", "info", `${result.slug} → ${result.target ?? "—"}`);
		} catch (err) {
			setResolved(null);
			const message = err instanceof Error ? err.message : String(err);
			pushLog("EXPAND", "err", message.includes("404") ? t.lookupDenied : message);
		} finally {
			setBusy(null);
		}
	};

	const handleUpdate = async () => {
		const value = lookupSlug.trim();
		if (!value) return;
		setBusy("update");
		try {
			const body: Record<string, unknown> = {};
			if (updateTarget.trim()) body.target = updateTarget.trim();
			if (accessKey.trim()) body.accessKey = accessKey.trim();
			if (ttl) body.ttlSeconds = Number(ttl);

			await apiRequest(`/api/shorten/${encodeURIComponent(value)}`, {
				method: "PUT",
				body,
				adminKey,
			});
			pushLog("UPDATE", "ok", `/${value} → ${updateTarget.trim() || "(unchanged)"}`);
			setResolved({ slug: value, target: updateTarget.trim() || resolved?.target || null });
		} catch (err) {
			pushLog("UPDATE", "err", err instanceof Error ? err.message : String(err));
		} finally {
			setBusy(null);
		}
	};

	const handleDelete = async () => {
		const value = lookupSlug.trim();
		if (!value) return;
		if (!window.confirm(t.confirmDelete)) return;
		setBusy("delete");
		try {
			await apiRequest(`/api/shorten/${encodeURIComponent(value)}`, {
				method: "DELETE",
				adminKey,
			});
			pushLog("DELETE", "ok", `/${value}`);
			setResolved(null);
			setUpdateTarget("");
			if (created?.slug === value) setCreated(null);
		} catch (err) {
			pushLog("DELETE", "err", err instanceof Error ? err.message : String(err));
		} finally {
			setBusy(null);
		}
	};

	const copy = async (value: string, id: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 1800);
		} catch (err) {
			pushLog("COPY", "err", err instanceof Error ? err.message : String(err));
		}
	};

	const createdUrl = created ? withAccessKey(created.shortUrl, accessKey.trim()) : "";

	return (
		<div className="min-h-screen bg-canvas text-body">
			<SiteNav
				lang={lang}
				theme={theme}
				onToggleLang={toggleLang}
				onToggleTheme={toggleTheme}
				active="links"
			/>

			<main className="shell py-12 md:py-16">
				{/* hero */}
				<div className="relative isolate">
					<div className="mesh" aria-hidden="true" />
					<div className="relative">
						<span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-elevated/80 px-3 py-1 font-mono text-[11px] text-body backdrop-blur">
							<span className="text-link">$</span>
							<span className="text-faint">{t.eyebrow}</span>
							<span className="caret text-ink" aria-hidden="true" />
						</span>
						<h1 className="heading-lg mt-5 max-w-2xl text-balance">{t.title}</h1>
						<p className="mt-3 max-w-[58ch] text-[12.5px] leading-[1.9] text-mute">{t.lead}</p>
					</div>
				</div>

				{/* shared access key */}
				<div className="card mt-10 grid gap-4 p-4 md:grid-cols-12 md:items-end md:p-5">
					<div className="md:col-span-6">
						<label htmlFor="access-key" className="eyebrow mb-1.5 block text-[10px] text-mute">
							<span className="inline-flex items-center gap-1.5">
								<KeyRound className="size-3" strokeWidth={2.2} />
								{t.accessKey}
							</span>
						</label>
						<input
							id="access-key"
							type="text"
							spellCheck="false"
							autoComplete="off"
							value={accessKey}
							onChange={(e) => updateAccessKey(e.target.value)}
							placeholder="shared-access-key"
							className="input font-mono"
							data-invalid={keyTooShort ? "true" : "false"}
						/>
						{keyTooShort && <p className="mt-1 font-mono text-[10.5px] text-danger">{t.keyNote}</p>}
					</div>
					<p className="flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-faint md:col-span-6">
						<ShieldCheck className="mt-px size-3 shrink-0" strokeWidth={2.2} />
						{accessKey.trim() ? t.accessHint : t.accessMissing}
					</p>
				</div>

				{/* 01 create */}
				<section className="mt-14">
					<SectionHead index="01" title={t.create} desc={t.createDesc} />
					<div className="card overflow-hidden">
						<div className="grid gap-4 p-4 md:grid-cols-12 md:p-5">
							<div className={admin ? "md:col-span-8" : "md:col-span-12"}>
								<label htmlFor="target" className="eyebrow mb-1.5 block text-[10px] text-mute">
									{t.target}
								</label>
								<input
									id="target"
									type="url"
									spellCheck="false"
									value={target}
									onChange={(e) => setTarget(e.target.value)}
									placeholder="https://example.com/api/sub?token=…"
									className="input font-mono"
									data-invalid={targetError ? "true" : "false"}
								/>
								{targetError && (
									<p className="mt-1 font-mono text-[10.5px] text-danger">{targetError}</p>
								)}
							</div>

							{admin && (
								<div className="md:col-span-4">
									<label htmlFor="slug" className="eyebrow mb-1.5 block text-[10px] text-mute">
										{t.slug}
									</label>
									<input
										id="slug"
										type="text"
										spellCheck="false"
										value={slug}
										onChange={(e) => setSlug(e.target.value)}
										placeholder="airport-hkg"
										className="input font-mono"
										data-invalid={slugError ? "true" : "false"}
									/>
									{slugError && (
										<p className="mt-1 font-mono text-[10.5px] text-danger">{slugError}</p>
									)}
								</div>
							)}

							{admin ? (
								<div className="md:col-span-12">
									<span className="eyebrow mb-1.5 block text-[10px] text-mute">{t.ttl}</span>
									<div className="flex flex-wrap gap-1.5">
										{TTL_OPTIONS.map((option) => (
											<button
												key={option.value || "never"}
												type="button"
												onClick={() => setTtl(option.value)}
												data-active={ttl === option.value}
												className="tab-pill h-8 text-[11.5px]"
											>
												{lang === "zh" ? option.zh : option.en}
											</button>
										))}
									</div>
								</div>
							) : (
								<p className="flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-faint md:col-span-12">
									<ShieldCheck className="mt-px size-3 shrink-0" strokeWidth={2.2} />
									{t.lifecycle}
								</p>
							)}
						</div>

						<div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-canvas px-4 py-3 md:px-5">
							<p className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
								POST /api/shorten
							</p>
							<button
								type="button"
								onClick={handleCreate}
								disabled={!canCreate}
								className="btn-pill h-9 px-4 text-[12.5px]"
							>
								{creating ? (
									<Loader2 className="size-3.5 animate-spin" strokeWidth={2.4} />
								) : (
									<Scissors className="size-3.5" strokeWidth={2.4} />
								)}
								{creating ? t.submitting : t.submit}
							</button>
						</div>
					</div>

					{created && (
						<div className="card animate-reveal mt-3 overflow-hidden">
							<div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5 md:px-5">
								<div className="flex min-w-0 items-center gap-2">
									<Link2 className="size-3.5 shrink-0 text-mute" strokeWidth={2.2} />
									<span className="eyebrow text-[9.5px] text-ink">/{created.slug}</span>
								</div>
								<div className="flex items-center gap-1.5">
									<button
										type="button"
										onClick={() => copy(createdUrl, created.slug)}
										className="btn-square-ghost h-7"
									>
										{copiedId === created.slug ? (
											<Check className="size-3" strokeWidth={2.8} />
										) : (
											<Copy className="size-3" strokeWidth={2} />
										)}
										{copiedId === created.slug ? t.copied : t.copy}
									</button>
									<a
										href={createdUrl}
										target="_blank"
										rel="noreferrer"
										className="btn-square-ghost h-7 w-7 px-0"
										aria-label={t.open}
									>
										<ExternalLink className="size-3" strokeWidth={2} />
									</a>
								</div>
							</div>
							<div className="px-4 py-4 md:px-5">
								<div className="code-block flex items-start gap-3 px-3.5 py-3">
									<span className="mt-px shrink-0 select-none font-mono text-[10px] text-faint">
										$
									</span>
									<code className="min-w-0 flex-1 select-text break-all whitespace-pre-wrap text-ink">
										{createdUrl}
									</code>
								</div>
							</div>
						</div>
					)}
				</section>

				{/* 02 lookup + admin */}
				<section className="mt-14">
					<SectionHead
						index="02"
						title={admin ? t.admin : t.lookupTitle}
						desc={admin ? t.adminDesc : t.lookupDesc}
						aside={
							admin ? (
								<span className="chip chip-warn">{lang === "zh" ? "管理员" : "admin"}</span>
							) : undefined
						}
					/>

					<div className="grid gap-4 lg:grid-cols-12">
						<div className="card p-4 md:p-5 lg:col-span-7">
							{admin && (
								<div className="mb-4 border-b border-hairline pb-4">
									<label htmlFor="admin-key" className="eyebrow mb-1.5 block text-[10px] text-mute">
										<span className="inline-flex items-center gap-1.5">
											<KeyRound className="size-3" strokeWidth={2.2} />
											{t.adminKey}
										</span>
									</label>
									<input
										id="admin-key"
										type="password"
										autoComplete="off"
										value={adminKey}
										onChange={(e) => updateAdminKey(e.target.value)}
										placeholder="x-admin-key"
										className="input font-mono"
									/>
									<p className="mt-1.5 font-mono text-[10px] text-faint">{t.adminHint}</p>
								</div>
							)}

							<label htmlFor="lookup-slug" className="eyebrow mb-1.5 block text-[10px] text-mute">
								slug
							</label>
							<div className="flex flex-wrap gap-1.5">
								<input
									id="lookup-slug"
									type="text"
									spellCheck="false"
									value={lookupSlug}
									onChange={(e) => setLookupSlug(e.target.value)}
									placeholder="airport-hkg"
									className="input min-w-[160px] flex-1 font-mono"
								/>
								<button
									type="button"
									onClick={handleLookup}
									disabled={!lookupSlug.trim() || busy !== null}
									className="btn-square-ghost"
								>
									{busy === "lookup" ? (
										<Loader2 className="size-3 animate-spin" strokeWidth={2.4} />
									) : (
										<RefreshCw className="size-3" strokeWidth={2.2} />
									)}
									{lang === "zh" ? "查询" : "Look up"}
								</button>
								{admin && (
									<button
										type="button"
										onClick={handleDelete}
										disabled={!lookupSlug.trim() || busy !== null}
										className="btn-square-ghost hover:border-danger/40 hover:bg-danger/5 hover:text-danger"
									>
										{busy === "delete" ? (
											<Loader2 className="size-3 animate-spin" strokeWidth={2.4} />
										) : (
											<Trash2 className="size-3" strokeWidth={2.2} />
										)}
										{t.delete}
									</button>
								)}
							</div>

							{resolved && (
								<div className="animate-reveal mt-4 rounded-sm border border-hairline bg-canvas p-3">
									<div className="eyebrow flex items-center gap-1.5 text-[9.5px] text-mute">
										<Database className="size-3" strokeWidth={2.2} />
										{t.expand}
									</div>
									<p className="mt-1.5 break-all font-mono text-[11.5px] text-ink">
										{resolved.target ?? t.notFound}
									</p>
								</div>
							)}

							{admin && (
								<>
									<div className="mt-4">
										<label
											htmlFor="update-target"
											className="eyebrow mb-1.5 block text-[10px] text-mute"
										>
											{t.target}
										</label>
										<input
											id="update-target"
											type="url"
											spellCheck="false"
											value={updateTarget}
											onChange={(e) => setUpdateTarget(e.target.value)}
											placeholder="https://example.com/api/sub?token=…"
											className="input font-mono"
										/>
									</div>

									<div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
										<p className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
											PUT · DELETE /api/shorten/:slug
										</p>
										<button
											type="button"
											onClick={handleUpdate}
											disabled={!lookupSlug.trim() || !updateTarget.trim() || busy !== null}
											className="btn-pill h-9 px-4 text-[12.5px]"
										>
											{busy === "update" ? (
												<Loader2 className="size-3.5 animate-spin" strokeWidth={2.4} />
											) : (
												<ArrowUpRight className="size-3.5" strokeWidth={2.4} />
											)}
											{t.update}
										</button>
									</div>
								</>
							)}
						</div>

						{/* activity log */}
						<div className="card overflow-hidden lg:col-span-5">
							<div className="flex items-center justify-between border-b border-hairline px-4 py-2.5 md:px-5">
								<span className="eyebrow text-[9.5px] text-ink">{t.console}</span>
								{log.length > 0 && <span className="chip h-[18px] text-[9px]">{log.length}</span>}
							</div>
							<div className="code-block max-h-[360px] overflow-y-auto rounded-none border-0 bg-transparent p-3.5">
								{log.length === 0 ? (
									<p className="font-mono text-[11px] text-faint">{t.emptyConsole}</p>
								) : (
									<ul className="space-y-1">
										{log.map((entry) => (
											<li
												key={entry.id}
												className="flex gap-2 font-mono text-[10.5px] leading-relaxed"
											>
												<span className="shrink-0 text-faint">[{entry.time}]</span>
												<span
													className={cn(
														"shrink-0 font-semibold",
														entry.tone === "ok" && "text-link",
														entry.tone === "err" && "text-danger",
														entry.tone === "info" && "text-mute",
													)}
												>
													[{entry.tag}]
												</span>
												<span className="min-w-0 break-all text-body">{entry.message}</span>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
					</div>
				</section>
			</main>

			<SiteFooter lang={lang} />
		</div>
	);
}
