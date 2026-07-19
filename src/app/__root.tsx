import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import "@fontsource-variable/inter";
import "@fontsource-variable/outfit";
import "./globals.css";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ title: "Edge Engine | Advanced Subscription Orchestrator" },
			{
				name: "description",
				content: "High-performance proxy subscription converter for Mihomo, Stash, and sing-box.",
			},
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	return (
		<html lang="en" className="font-inter font-outfit scroll-smooth">
			<head>
				<HeadContent />
			</head>
			<body className="antialiased selection:bg-blue-500/30">
				<Outlet />
				<Scripts />
			</body>
		</html>
	);
}
