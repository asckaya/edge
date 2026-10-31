import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { app } from "../core/[[path]]";
import type { EdgeEnv } from "../core/src/env";

type WorkerEnv = Omit<EdgeEnv, "ASSETS"> & { ASSETS: { fetch: typeof fetch } };

/** Paths that look like a static file (has an extension) or a bundled asset. */
const ASSET_PATH = /\.[a-zA-Z0-9]+$/;

/**
 * Static tool pages are real `.html` files (see `public/`). Their extensionless
 * form is kept alive as a permanent redirect so old bookmarks keep working.
 */
const TOOL_PAGES = new Set(["ip", "dns", "webrtc", "claude", "tools"]);
type WorkerExecutionContext = ExecutionContext;

const tanstackFetch = createStartHandler(defaultStreamHandler);

/**
 * Ensure `.md` responses carry `charset=utf-8`. Without this, browsers decode
 * the UTF-8 bytes as latin-1 and non-ASCII text garbles. CF's asset handler
 * returns `text/markdown` with no charset for markdown files.
 */
function withMarkdownCharset(url: URL, response: Response): Response {
	if (!url.pathname.endsWith(".md")) return response;
	const ct = response.headers.get("Content-Type") ?? "text/markdown";
	if (ct.includes("charset")) return response;
	const corrected = new Response(response.body, response);
	corrected.headers.set("Content-Type", `${ct}; charset=utf-8`);
	return corrected;
}

const server = {
	async fetch(request: Request, env: WorkerEnv, ctx: WorkerExecutionContext) {
		const url = new URL(request.url);
		// API and short-link routes always go through Hono (they may have no query string)
		if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/s/")) {
			return app.fetch(request, env, ctx);
		}
		// Dynamic config rendering for root requests with query parameters
		if (url.pathname === "/" && url.searchParams.toString() !== "") {
			return app.fetch(request, env, ctx);
		}
		// Legacy extensionless tool URLs (`/ip` → `/ip.html`).
		const toolSlug = url.pathname.slice(1);
		if (TOOL_PAGES.has(toolSlug)) {
			const target = new URL(url);
			target.pathname = `/${toolSlug}.html`;
			return Response.redirect(target.toString(), 308);
		}

		// Files come from Cloudflare Assets; every other path is an app route and is
		// rendered by TanStack. Asking Assets about route paths made Assets and the
		// router canonicalise trailing slashes in opposite directions — an endless
		// 307 loop that broke prerendering — so only file-like paths are forwarded.
		const isAssetPath = ASSET_PATH.test(url.pathname) || url.pathname.startsWith("/assets/");
		if (env.ASSETS && isAssetPath) {
			const res = await env.ASSETS.fetch(request);
			return withMarkdownCharset(url, res);
		}
		// Fallback to TanStack Start handler (useful in local dev / dev server)
		const res = await tanstackFetch(request);
		return withMarkdownCharset(url, res);
	},
};

export default server;
