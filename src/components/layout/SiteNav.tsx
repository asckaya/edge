import { Languages, Layers, Moon, Sun } from "lucide-react";
import type { Language } from "@/components/home/translations";
import { cn } from "@/lib/cn";
import { version } from "../../../package.json";

export interface SiteNavProps {
	lang: Language;
	theme: "light" | "dark";
	onToggleLang: () => void;
	onToggleTheme: (event: React.MouseEvent<HTMLButtonElement>) => void;
	/** Active route key, used to highlight the matching link. */
	active?: "workspace" | "links" | "tools";
}

const NAV_LINKS: {
	key: NonNullable<SiteNavProps["active"]>;
	href: string;
	zh: string;
	en: string;
}[] = [
	{ key: "workspace", href: "/", zh: "工作台", en: "Workspace" },
	{ key: "links", href: "/links", zh: "短链接", en: "Links" },
	{ key: "tools", href: "#tools", zh: "工具箱", en: "Tools" },
];

export default function SiteNav({
	lang,
	theme,
	onToggleLang,
	onToggleTheme,
	active,
}: SiteNavProps) {
	const zh = lang === "zh";

	return (
		<header className="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur-xl">
			<div className="shell flex h-14 items-center justify-between gap-4">
				<a href="/" className="group flex min-w-0 items-center gap-2.5">
					<span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-hairline bg-elevated text-ink transition-colors group-hover:border-ink/30">
						<Layers className="size-3.5" strokeWidth={2.2} />
					</span>
					<span className="flex min-w-0 items-baseline gap-2">
						<span className="truncate text-[13.5px] font-semibold tracking-tight text-ink">
							Edge Engine
						</span>
						<span className="hidden text-[10px] font-semibold tabular-nums text-faint sm:inline">
							{version}
						</span>
					</span>
				</a>

				<nav className="hidden items-center gap-1 md:flex">
					{NAV_LINKS.map((link) => (
						<a
							key={link.key}
							href={link.href}
							className={cn(
								"rounded-full px-3 py-1.5 text-[12.5px] transition-colors",
								active === link.key
									? "bg-soft font-semibold text-ink"
									: "text-body hover:bg-soft hover:text-ink",
							)}
						>
							{zh ? link.zh : link.en}
						</a>
					))}
					<a
						href="/GUIDE.md"
						target="_blank"
						rel="noreferrer"
						className="rounded-full px-3 py-1.5 text-[12.5px] text-body transition-colors hover:bg-soft hover:text-ink"
					>
						{zh ? "文档" : "Docs"}
					</a>
				</nav>

				<div className="flex items-center gap-1.5">
					<span className="mr-1 hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-mute sm:flex">
						<span className="relative flex size-1.5">
							<span className="absolute inset-0 rounded-full bg-link opacity-40 motion-safe:animate-ping" />
							<span className="relative size-1.5 rounded-full bg-link" />
						</span>
						{zh ? "运行中" : "operational"}
					</span>
					<button
						type="button"
						onClick={onToggleLang}
						className="btn-square-ghost px-2"
						title={zh ? "Switch to English" : "切换为中文"}
						aria-label={zh ? "Switch to English" : "切换为中文"}
					>
						<Languages className="size-3.5" strokeWidth={2} />
						<span className="text-[10px] font-semibold tracking-wide">{zh ? "ZH" : "EN"}</span>
					</button>
					<button
						type="button"
						onClick={onToggleTheme}
						className="btn-square-ghost w-[30px] px-0"
						title={
							theme === "dark" ? (zh ? "亮色模式" : "Light mode") : zh ? "深色模式" : "Dark mode"
						}
						aria-label={zh ? "切换主题" : "Toggle theme"}
					>
						{theme === "dark" ? (
							<Sun className="size-3.5" strokeWidth={2} />
						) : (
							<Moon className="size-3.5" strokeWidth={2} />
						)}
					</button>
				</div>
			</div>
		</header>
	);
}
