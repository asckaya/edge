import { onRequest } from "../../core/[[path]]";
import type { EdgeEnv } from "../../core/src/env";

/**
 * Invoke the Pages Function worker with a synthetic request + execution context.
 *
 * This is the shared helper that was previously duplicated (with minor env
 * shape variations) across ~9 test files. All call sites pass an empty env,
 * so the default is `{}`; tests that need an EDGE_KV / EDGE_ADMIN_KEY binding
 * can pass it explicitly.
 */
export function callWorker(url: string, userAgent?: string, env: EdgeEnv = {}): Promise<Response> {
	const req = new Request(url, userAgent ? { headers: { "User-Agent": userAgent } } : undefined);
	return onRequest({
		request: req,
		next: () => new Response("Static Asset Content"),
		env,
		params: {},
		waitUntil: () => {},
		data: {},
		functionPath: "/",
	} as unknown as Parameters<typeof onRequest>[0]);
}
