import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { app } from "../core/[[path]]";
import type { EdgeEnv } from "../core/src/env";

type WorkerEnv = Omit<EdgeEnv, "ASSETS"> & { ASSETS: { fetch: typeof fetch } };
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
		// Dynamic config rendering for query requests
		if (url.searchParams.toString() !== "") {
			return app.fetch(request, env, ctx);
		}
		// Serve static assets from Cloudflare Assets if available
		if (env.ASSETS) {
			const res = await env.ASSETS.fetch(request);
			if (res.status !== 404 || url.pathname.startsWith("/assets/")) {
				return withMarkdownCharset(url, res);
			}
		}
		// Fallback to TanStack Start handler (useful in local dev / dev server)
		const res = await tanstackFetch(request);
		return withMarkdownCharset(url, res);
	},
};

export default server;
