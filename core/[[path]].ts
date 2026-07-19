import { Hono } from "hono";
import { type EventContext, handle } from "hono/cloudflare-pages";
import { cors } from "hono/cors";
import * as v from "valibot";
import type { EdgeEnv } from "./src/env";
import { shortlinkApp } from "./src/routes/shortlink";
import { RequestParamsSchema } from "./src/types";
import { normalizeConfigTarget } from "./src/utils/config-target";
import { buildMihomoConfig } from "./src/utils/mihomo";
import { parseProxyTextToNodes, renderProxyYaml } from "./src/utils/proxy-parser";
import { buildSingBoxConfig } from "./src/utils/sing-box/index";
import { fetchSubscriptionNodes, parseSubscriptionContent } from "./src/utils/subscription-parser";

export const app = new Hono<{ Bindings: EdgeEnv }>();

const RESERVED_QUERY_KEYS = new Set(["secret", "proxies", "type", "mode", "gh_proxy"]);

function buildRequestParams(searchParams: URLSearchParams, userAgent: string) {
	const subscriptions = [];
	for (const [name, subscriptionUrl] of searchParams) {
		if (
			name &&
			subscriptionUrl &&
			!RESERVED_QUERY_KEYS.has(name) &&
			(subscriptionUrl.startsWith("http://") || subscriptionUrl.startsWith("https://"))
		) {
			subscriptions.push({ name, url: subscriptionUrl });
		}
	}

	return {
		...normalizeConfigTarget(searchParams.get("type"), searchParams.get("mode"), userAgent),
		secret: searchParams.get("secret") ?? undefined,
		proxies: searchParams.get("proxies") ?? undefined,
		gh_proxy: searchParams.get("gh_proxy") ?? undefined,
		subscriptions,
	};
}

// Extracts proxy names for the "Self-Hosted" selector group.
// `nodes` covers URI-parsed proxies (ss://, vmess://, ...). `rawLines` covers
// YAML-formatted proxy definitions (e.g. "- name: foo\n  type: ss\n  ...") that
// parseProxyTextToNodes couldn't parse as URIs — these are passed verbatim into
// mihomo's `proxies:` block by renderProxyYaml, so we regex their names here.
// Without this, YAML-pasted proxies would be unreachable from the Self-Hosted group.
const CUSTOM_PROXY_NAME_RE = /- name:\s*['"]?([^'"]+)['"]?/;

function extractCustomProxyNames(nodes: Array<{ name: string }>, rawLines: string[]): string[] {
	const names = nodes.map((node) => node.name);
	for (const line of rawLines) {
		const nameMatch = line.match(CUSTOM_PROXY_NAME_RE);
		if (nameMatch?.[1]) names.push(nameMatch[1]);
	}
	return names;
}

app.use("*", cors());

// ---------- Short link API ----------
app.route("/", shortlinkApp);

// ---------- Config rendering ----------

app.get("*", async (c) => {
	const url = new URL(c.req.url);
	const searchParams = url.searchParams;

	const paramsObj = buildRequestParams(searchParams, c.req.header("user-agent") || "");

	const parseResult = v.safeParse(RequestParamsSchema, paramsObj);
	if (!parseResult.success) {
		const errorMsg = parseResult.issues
			.map((issue) => `${issue.path?.[0]?.key || ""}: ${issue.message}`)
			.join(", ");
		return c.text(`Invalid parameters: ${errorMsg}`, 400);
	}

	const {
		type: configType,
		mode,
		secret: providedSecret,
		proxies: customProxiesRaw,
		gh_proxy: ghProxy,
		subscriptions,
	} = parseResult.output;

	const isStash = configType === "stash";
	const isSingBox = configType === "sing-box";

	if (subscriptions.length === 0 && !customProxiesRaw) {
		return c.text(
			"Edge Subscription API - Missing parameters. Visit / for the interface. Add ?proxies=... or ?SubName=SubUrl",
			200,
			{
				"Content-Type": "text/plain; charset=utf-8",
			},
		);
	}

	if (isSingBox) {
		const [resolvedSubscriptions, customNodes] = await Promise.all([
			subscriptions.length > 0
				? fetchSubscriptionNodes(subscriptions, "sing-box")
				: Promise.resolve([]),
			customProxiesRaw ? parseSubscriptionContent(customProxiesRaw) : Promise.resolve([]),
		]);

		const finalConfig = await buildSingBoxConfig({
			secret: providedSecret,
			subscriptions: resolvedSubscriptions,
			customNodes,
			ghProxy,
			mode,
		});

		return c.json(finalConfig, 200, { "Cache-Control": "no-cache" });
	}

	// Mihomo/Stash Logic
	const parsedCustomProxies = parseProxyTextToNodes(customProxiesRaw);
	const customProxiesYaml = renderProxyYaml(parsedCustomProxies);
	const finalYaml = buildMihomoConfig({
		secret: providedSecret,
		subscriptions,
		customProxies: customProxiesYaml,
		customProxyNodes: parsedCustomProxies.nodes,
		customProxyNames: extractCustomProxyNames(
			parsedCustomProxies.nodes,
			parsedCustomProxies.rawLines,
		),
		ghProxy,
		isStash,
		mode,
	});

	return c.text(finalYaml, 200, {
		"content-type": "text/yaml; charset=utf-8",
		"Cache-Control": "no-cache",
	});
});

export const onRequest = (
	context: Pick<EventContext, "request" | "next" | "waitUntil" | "passThroughOnException">,
) => {
	const url = new URL(context.request.url);
	if (url.searchParams.toString() === "") {
		return context.next();
	}
	return handle(app)(context as unknown as EventContext);
};
