import { createRouter } from "@tanstack/react-router";
import NotFound from "./components/layout/NotFound";
import { routeTree } from "./routeTree.gen";

/**
 * A router instance must never be shared between SSR requests: the router keeps
 * per-request state (matched routes, pending redirects). A module-level singleton
 * leaked that state across requests — a canonicalising redirect from one request
 * (`/links?admin=1` → `/links`) made the *next* request's not-found branch redirect
 * too, which is what drove the prerender redirect loop.
 */
function makeRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true,
		defaultNotFoundComponent: () => <NotFound />,
	});
}

export function getRouter() {
	return makeRouter();
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof makeRouter>;
	}
}
