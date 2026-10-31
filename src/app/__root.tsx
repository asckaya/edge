import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import appCss from "./globals.css?url";

/**
 * Maple Mono CN is served from jsDelivr as unicode-range-split woff2 chunks, so a
 * page only downloads the slices it actually renders. Regular + SemiBold carry the
 * entire type ladder (400 body / 600 display). The URL is intentionally unpinned
 * so jsDelivr always resolves the current release.
 */
const FONT_CDN = "https://cdn.jsdelivr.net/npm/@chinese-fonts/maple-mono-cn/dist";

/**
 * Resolve the theme before first paint to avoid a flash: an explicit stored
 * preference wins, otherwise the OS `prefers-color-scheme` decides.
 */
const THEME_BOOTSTRAP = `try{var s=localStorage.getItem("theme");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}`;

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ title: "Edge Engine — 订阅编排控制台" },
			{
				name: "description",
				content: "High-performance proxy subscription converter for Mihomo, Stash, and sing-box.",
			},
			{ name: "theme-color", content: "#fafafa", media: "(prefers-color-scheme: light)" },
			{ name: "theme-color", content: "#0a0a0a", media: "(prefers-color-scheme: dark)" },
		],
		links: [
			{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
			{ rel: "preconnect", href: "https://cdn.jsdelivr.net", crossOrigin: "anonymous" },
			{ rel: "stylesheet", href: appCss },
			{ rel: "stylesheet", href: `${FONT_CDN}/MapleMono-CN-Regular/result.css` },
			{ rel: "stylesheet", href: `${FONT_CDN}/MapleMono-CN-SemiBold/result.css` },
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	return (
		<html lang="zh-CN" className="scroll-smooth">
			<head>
				<HeadContent />
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: static theme bootstrap */}
				<script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
			</head>
			<body>
				<Outlet />
				<Scripts />
			</body>
		</html>
	);
}
