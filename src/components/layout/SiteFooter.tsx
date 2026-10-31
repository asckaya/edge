import { Layers } from "lucide-react";
import type { Language } from "@/components/home/translations";
import { version } from "../../../package.json";

function GitHubMark({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
			<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-2.91-.88-2.91-2.79 0-.55.2-1.01.52-1.36-.05-.13-.23-.64.05-1.34 0 0 .42-.13 1.37.52.4-.11.82-.16 1.24-.16.42 0 .84.05 1.24.16.95-.65 1.37-.52 1.37-.52.28.7.1 1.21.05 1.34.32.35.52.81.52 1.36 0 1.92-1.14 2.59-2.92 2.79.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A7.99 7.99 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
		</svg>
	);
}

export default function SiteFooter({ lang }: { lang: Language }) {
	const zh = lang === "zh";

	return (
		<footer className="border-t border-hairline">
			<div className="shell py-12 md:py-16">
				<div className="grid gap-10 md:grid-cols-12">
					<div className="md:col-span-5">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-sm border border-hairline bg-elevated text-ink">
								<Layers className="size-3.5" strokeWidth={2.2} />
							</span>
							<span className="text-[13.5px] font-semibold tracking-tight text-ink">
								Edge Engine
							</span>
						</div>
						<p className="mt-3 max-w-xs text-[11.5px] leading-relaxed text-mute">
							{zh
								? "为 Mihomo、Stash 与 sing-box 提供的边缘订阅编排服务。"
								: "Edge subscription orchestration for Mihomo, Stash and sing-box."}
						</p>
						<div className="mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
							<span className="flex size-1.5 rounded-full bg-link" aria-hidden="true" />
							{zh ? "全部系统运行正常" : "all systems operational"}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-8 md:col-span-7 md:grid-cols-3">
						<div>
							<div className="eyebrow mb-3 text-[10px] text-ink">{zh ? "产品" : "Product"}</div>
							<ul className="space-y-2 text-[12px] text-body">
								<li>
									<a href="/#workspace" className="transition-colors hover:text-ink">
										{zh ? "工作台" : "Workspace"}
									</a>
								</li>
								<li>
									<a href="/links" className="transition-colors hover:text-ink">
										{zh ? "短链接控制台" : "Link console"}
									</a>
								</li>
								<li>
									<a
										href="/GUIDE.md"
										target="_blank"
										rel="noreferrer"
										className="transition-colors hover:text-ink"
									>
										{zh ? "使用指南" : "Guide"}
									</a>
								</li>
							</ul>
						</div>
						<div>
							<div className="eyebrow mb-3 text-[10px] text-ink">{zh ? "诊断" : "Diagnostics"}</div>
							<ul className="space-y-2 text-[12px] text-body">
								{[
									{ href: "/ip.html", zh: "IP 位置检测", en: "IP & geo" },
									{ href: "/dns.html", zh: "DNS 泄漏测试", en: "DNS leak" },
									{ href: "/webrtc.html", zh: "WebRTC 检测", en: "WebRTC" },
									{ href: "/claude.html", zh: "Claude / AI 测试", en: "AI check" },
								].map((link) => (
									<li key={link.href}>
										<a
											href={link.href}
											target="_blank"
											rel="noreferrer"
											className="transition-colors hover:text-ink"
										>
											{zh ? link.zh : link.en}
										</a>
									</li>
								))}
							</ul>
						</div>
						<div>
							<div className="eyebrow mb-3 text-[10px] text-ink">{zh ? "内核" : "Kernels"}</div>
							<ul className="space-y-2 font-mono text-[12px] text-mute">
								<li>mihomo</li>
								<li>stash</li>
								<li>sing-box</li>
							</ul>
						</div>
					</div>
				</div>

				<div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-5 text-[10px] uppercase tracking-[0.1em] text-faint sm:flex-row sm:items-center">
					<span className="flex flex-wrap items-center gap-x-3 gap-y-1">
						<span>© {new Date().getFullYear()} edge engine</span>
						<span className="hidden sm:inline">·</span>
						<span>{zh ? "边缘分布式计算节点" : "distributed edge compute"}</span>
						<span className="hidden sm:inline">·</span>
						<span className="font-mono">build {version}</span>
					</span>
					<a
						href="https://github.com/asckaya/edge"
						target="_blank"
						rel="noreferrer"
						aria-label="GitHub"
						className="flex items-center gap-1.5 transition-colors hover:text-ink"
					>
						<GitHubMark className="size-3.5" />
						<span className="font-mono">asckaya/edge</span>
					</a>
				</div>
			</div>
		</footer>
	);
}
