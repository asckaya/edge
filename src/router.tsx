import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	return router;
}

export const router = createRouter({
	routeTree,
	scrollRestoration: true,
	defaultNotFoundComponent: () => (
		<div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-mono text-sm">
			Page Not Found
		</div>
	),
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
