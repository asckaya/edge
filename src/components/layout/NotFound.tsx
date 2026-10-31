import { ArrowLeft, ArrowUpRight, Layers } from "lucide-react";
import { usePreferences } from "@/components/home/usePreferences";
import SiteFooter from "@/components/layout/SiteFooter";

const LINKS = [
	{ href: "/#workspace", zh: "工作台", en: "Workspace" },
	{ href: "/links", zh: "短链接", en: "Links" },
	{ href: "/tools.html", zh: "工具箱", en: "Toolbox" },
	{ href: "/GUIDE.md", zh: "使用指南", en: "Guide" },
];

/**
 * 404 surface for unmatched routes. Lives at the router level so every miss —
 * SSR or client navigation — lands on the same designed page.
 */
export default function NotFound() {
	const { lang } = usePreferences();
	const zh = lang === "zh";

	return (
		<div className="min-h-screen bg-canvas text-body">
			<div className="relative isolate overflow-hidden">
				<div className="mesh" aria-hidden="true" />
				<div className="shell relative z-10 pt-6">
					<a href="/" className="group inline-flex items-center gap-2.5">
						<span className="flex size-7 items-center justify-center rounded-sm border border-hairline bg-elevated text-ink transition-colors group-hover:border-ink/30">
							<Layers className="size-3.5" strokeWidth={2.2} />
						</span>
						<span className="text-[13.5px] font-semibold tracking-tight text-ink">Edge Engine</span>
					</a>
				</div>

				<main className="shell relative z-10 flex min-h-[62vh] flex-col justify-center py-20">
					<span className="eyebrow text-[10px] text-mute">
						<span className="text-link">$</span> edge route --not-found
					</span>

					<h1 className="mt-4 text-[clamp(56px,8vw,88px)] font-semibold leading-none tracking-[-0.05em] text-ink">
						404
					</h1>

					<p className="mt-4 max-w-[46ch] text-[12.5px] leading-[1.9] text-mute">
						{zh
							? "这个路径没有对应的页面。可能是链接过期、拼写有误，或者页面已经迁移。"
							: "No page lives at this path. The link may have expired, been misspelled, or moved."}
					</p>

					<div className="mt-8 flex flex-wrap items-center gap-2">
						<a href="/" className="btn-pill h-9 text-[12.5px]">
							<ArrowLeft className="size-3.5" strokeWidth={2.4} />
							{zh ? "回到工作台" : "Back to workspace"}
						</a>
						{LINKS.map((link) => (
							<a key={link.href} href={link.href} className="btn-pill-ghost h-9 text-[12.5px]">
								{zh ? link.zh : link.en}
								<ArrowUpRight className="size-3" strokeWidth={2.4} />
							</a>
						))}
					</div>

					<div className="code-block mt-10 max-w-md px-3.5 py-3 font-mono text-[11px]">
						<span className="text-faint">$</span> edge route --resolve{" "}
						<span className="text-ink">{zh ? "<当前路径>" : "<current-path>"}</span>
						<span className="text-danger"> → 404</span>
					</div>
				</main>
			</div>

			<SiteFooter lang={lang} />
		</div>
	);
}
