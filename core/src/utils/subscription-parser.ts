import { ofetch } from "ofetch";
import YAML from "yaml";
import type { Subscription } from "../types";
import { coerceProxyNodes, type LooseProxyNode } from "./proxy-node";
import { parseProxyTextToNodes } from "./proxy-parser";
import { parseSingBoxOutbounds } from "./sing-box/subscription-outbound";

export interface ResolvedSubscription extends Subscription {
	nodes: LooseProxyNode[];
}

const ALERT_KEYWORDS = [
	"订阅",
	"泄露",
	"账号安全",
	"重新",
	"导入",
	"失效",
	"过期",
	"warning",
	"alert",
	"expired",
	"invalid",
	"banned",
];

const BASE64_PATTERN = /^[A-Za-z0-9+/=_-\s]+$/;
let subscriptionCachePromise: Promise<Cache | null> | null = null;

function getSubscriptionCache(): Promise<Cache | null> {
	if (typeof caches === "undefined") return Promise.resolve(null);
	if (!subscriptionCachePromise) {
		subscriptionCachePromise = caches.open("subscription-cache");
	}
	return subscriptionCachePromise;
}

function stripBom(input: string): string {
	return input.replace(/^\uFEFF/, "").trim();
}

function decodeBase64Text(collapsed: string): string | null {
	if (!collapsed || collapsed.length < 16 || !BASE64_PATTERN.test(collapsed)) return null;
	return Buffer.from(collapsed, "base64").toString("utf-8");
}

function extractStructuredProxyNodes(parsed: unknown): LooseProxyNode[] {
	if (Array.isArray(parsed)) return coerceProxyNodes(parsed);
	if (!parsed || typeof parsed !== "object") return [];

	const record = parsed as Record<string, unknown>;
	if (Array.isArray(record.proxies)) return coerceProxyNodes(record.proxies);
	return parseSingBoxOutbounds(record);
}

function parseStructuredProxyList(input: string): LooseProxyNode[] {
	try {
		const parsed = YAML.parse(input);
		return extractStructuredProxyNodes(parsed);
	} catch {
		return [];
	}
}

function parseUriList(input: string): LooseProxyNode[] {
	if (!input.includes("://")) return [];
	return parseProxyTextToNodes(input).nodes;
}

export function parseSubscriptionContent(input: string): LooseProxyNode[] {
	const raw = stripBom(input);
	if (!raw) return [];

	// Fast path: plain URI list (contains "://"). Skips base64 decode + YAML parse.
	if (raw.includes("://")) {
		const uriNodes = parseUriList(raw);
		if (uriNodes.length > 0) return uriNodes;
	}

	const decoded = decodeBase64Text(raw.replace(/\s+/g, ""));
	if (!decoded) return parseStructuredProxyList(raw);

	const decodedRaw = stripBom(decoded);
	if (!decodedRaw) return [];

	if (decodedRaw.includes("://")) {
		const decodedUriNodes = parseUriList(decodedRaw);
		if (decodedUriNodes.length > 0) return decodedUriNodes;
	}
	return parseStructuredProxyList(decodedRaw);
}

function isLoopbackPlaceholderNode(node: LooseProxyNode): boolean {
	const server = String(node.server || "")
		.trim()
		.toLowerCase();
	const port = Number(node.port);
	return (server === "127.0.0.1" || server === "localhost" || server === "::1") && port === 1;
}

function isAlertPlaceholderNode(node: LooseProxyNode): boolean {
	if (!isLoopbackPlaceholderNode(node)) return false;
	const name = String(node.name || "")
		.trim()
		.toLowerCase();
	return ALERT_KEYWORDS.some((keyword) => name.includes(keyword));
}

function collapseAlertSubscription(sub: Subscription, nodes: LooseProxyNode[]): LooseProxyNode[] {
	if (nodes.length === 0) return nodes;
	if (!nodes.every((node) => isAlertPlaceholderNode(node))) return nodes;

	return [makeAlertNode(`⚠️ ${sub.name} 订阅失效`)];
}

function makeAlertNode(name: string): LooseProxyNode {
	return {
		name,
		type: "ss",
		server: "127.0.0.1",
		port: 1,
		cipher: "aes-128-gcm",
		password: "00000000-0000-0000-0000-000000000000",
		udp: false,
		__subscriptionAlert: true,
	} as LooseProxyNode;
}

async function fetchWithCache(url: string, userAgent: string): Promise<string> {
	const cache = await getSubscriptionCache();
	const cacheKey = cache ? new Request(url, { headers: { "User-Agent": userAgent } }) : null;

	if (cache && cacheKey) {
		const cachedResponse = await cache.match(cacheKey);
		if (cachedResponse) return cachedResponse.text();
	}

	const body = await ofetch<string>(url, {
		headers: {
			"User-Agent": userAgent,
			Accept: "*/*",
		},
		timeout: 8000,
		parseResponse: (txt) => txt,
	});

	if (cache && cacheKey) {
		await cache.put(
			cacheKey,
			new Response(body, {
				headers: {
					"Cache-Control": "public, max-age=300",
					"Content-Type": "text/plain; charset=utf-8",
				},
			}),
		);
	}

	return body;
}

export async function fetchSubscriptionNodes(
	subscriptions: Subscription[],
	userAgent: string,
): Promise<ResolvedSubscription[]> {
	// Dedup by URL: fetch+parse once per unique URL, then map back to all
	// subscriptions sharing that URL. collapseAlertSubscription runs per-sub
	// (uses sub.name) so it stays on the mapped result.
	const uniqueUrls = Array.from(new Set(subscriptions.map((s) => s.url)));
	const fetchedByUrl = new Map<string, LooseProxyNode[] | null>(
		await Promise.all(
			uniqueUrls.map(async (url) => {
				try {
					const body = await fetchWithCache(url, userAgent);
					return [url, await parseSubscriptionContent(body)] as const;
				} catch (err) {
					console.error(`Failed to fetch subscription (${url}):`, err);
					return [url, null] as const;
				}
			}),
		),
	);

	return subscriptions.map((sub) => {
		const parsed = fetchedByUrl.get(sub.url) ?? null;
		if (parsed !== null) {
			return { ...sub, nodes: collapseAlertSubscription(sub, parsed) };
		}
		return {
			...sub,
			nodes: [makeAlertNode(`⚠️ ${sub.name} 订阅加载失败`)],
		};
	});
}
