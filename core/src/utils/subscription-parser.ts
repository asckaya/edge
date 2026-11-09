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
	"不支持",
	"换用",
	"官网",
	"维护",
	"通知",
	"耗尽",
	"续费",
	"warning",
	"alert",
	"expired",
	"invalid",
	"banned",
	"unsupported",
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
	if (!collapsed || collapsed.length < 4 || !BASE64_PATTERN.test(collapsed)) return null;
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

	// 1. Priority: structured configs (YAML/JSON with proxies or outbounds, or JSON array/object)
	const isLikelyStructured =
		raw.startsWith("{") || raw.startsWith("[") || /^\s*(proxies|outbounds):/m.test(raw);

	if (isLikelyStructured) {
		const structuredNodes = parseStructuredProxyList(raw);
		if (structuredNodes.length > 0) return structuredNodes;
	}

	// 2. Base64 decode attempt
	const collapsed = raw.replace(/\s+/g, "");
	if (collapsed.length >= 4 && BASE64_PATTERN.test(collapsed)) {
		const decoded = decodeBase64Text(collapsed);
		if (decoded) {
			const decodedRaw = stripBom(decoded);
			if (decodedRaw) {
				const isDecodedStructured =
					decodedRaw.startsWith("{") ||
					decodedRaw.startsWith("[") ||
					/^\s*(proxies|outbounds):/m.test(decodedRaw);
				if (isDecodedStructured) {
					const decodedStructured = parseStructuredProxyList(decodedRaw);
					if (decodedStructured.length > 0) return decodedStructured;
				}
				const decodedUriNodes = parseUriList(decodedRaw);
				if (decodedUriNodes.length > 0) return decodedUriNodes;
				const decodedStructuredFallback = parseStructuredProxyList(decodedRaw);
				if (decodedStructuredFallback.length > 0) return decodedStructuredFallback;
			}
		}
	}

	// 3. Fallback: plain URI list or structured parse
	const uriNodes = parseUriList(raw);
	if (uriNodes.length > 0) return uriNodes;

	return parseStructuredProxyList(raw);
}

function isLoopbackPlaceholderNode(node: LooseProxyNode): boolean {
	const server = String(node.server || "")
		.trim()
		.toLowerCase();
	return (
		server === "127.0.0.1" || server === "localhost" || server === "::1" || server === "0.0.0.0"
	);
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

async function fetchSingleSubscription(
	url: string,
	userAgent: string,
): Promise<LooseProxyNode[] | null> {
	let primaryNodes: LooseProxyNode[] | null = null;

	try {
		const body = await fetchWithCache(url, userAgent);
		const nodes = parseSubscriptionContent(body);
		if (nodes.length > 0 && !nodes.every(isAlertPlaceholderNode)) {
			return nodes;
		}
		if (nodes.length > 0) {
			primaryNodes = nodes;
		}
	} catch {
		// Primary fetch failed (network error or HTTP 4xx/5xx).
		// Fall through to attempt fallback when applicable.
	}

	// Fallback to "mihomo clash.meta" for sing-box if no valid non-alert nodes were retrieved
	if (userAgent === "sing-box") {
		try {
			const fallbackBody = await fetchWithCache(url, "mihomo clash.meta");
			const fallbackNodes = parseSubscriptionContent(fallbackBody);
			if (fallbackNodes.length > 0) {
				return fallbackNodes;
			}
		} catch (fallbackErr) {
			console.error(`Failed to fetch subscription fallback (${url}):`, fallbackErr);
		}
	}

	return primaryNodes;
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
				const nodes = await fetchSingleSubscription(url, userAgent);
				return [url, nodes] as const;
			}),
		),
	);

	return subscriptions.map((sub) => {
		const parsed = fetchedByUrl.get(sub.url) ?? null;
		if (parsed !== null && parsed.length > 0) {
			return { ...sub, nodes: collapseAlertSubscription(sub, parsed) };
		}
		return {
			...sub,
			nodes: [makeAlertNode(`⚠️ ${sub.name} 订阅加载失败`)],
		};
	});
}
