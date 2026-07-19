import { ofetch } from "ofetch";
import type { LooseProxyNode } from "../proxy-node";
import { extractCountryCodeFromName, toFlagEmoji } from "./tags";

const RESERVED_HOST_SUFFIXES = [".localhost", ".local", ".lan", ".example", ".invalid", ".test"];
const GEO_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const GEO_FAILURE_TTL_MS = 5 * 60 * 1000;
const GEO_CACHE_MAX_ENTRIES = 512;

interface GeoCacheEntry {
	value: string | null;
	expiresAt: number;
}

interface DnsJsonResponse {
	Answer?: Array<{ data?: unknown }>;
}

interface CountryResponse {
	country?: unknown;
}

const ipCache = new Map<string, GeoCacheEntry>();
const countryCache = new Map<string, GeoCacheEntry>();
const ipInflight = new Map<string, Promise<string | null>>();
const countryInflight = new Map<string, Promise<string | null>>();

function readGeoCache(cache: Map<string, GeoCacheEntry>, key: string): GeoCacheEntry | undefined {
	const entry = cache.get(key);
	if (!entry) return undefined;
	if (entry.expiresAt <= Date.now()) {
		cache.delete(key);
		return undefined;
	}
	cache.delete(key);
	cache.set(key, entry);
	return entry;
}

function writeGeoCache(cache: Map<string, GeoCacheEntry>, key: string, value: string | null): void {
	cache.delete(key);
	cache.set(key, {
		value,
		expiresAt: Date.now() + (value ? GEO_CACHE_TTL_MS : GEO_FAILURE_TTL_MS),
	});
	if (cache.size > GEO_CACHE_MAX_ENTRIES) {
		const oldestKey = cache.keys().next().value;
		if (oldestKey) cache.delete(oldestKey);
	}
}

function cachedLookup(
	cache: Map<string, GeoCacheEntry>,
	inflight: Map<string, Promise<string | null>>,
	key: string,
	load: () => Promise<string | null>,
): Promise<string | null> {
	const cached = readGeoCache(cache, key);
	if (cached) return Promise.resolve(cached.value);

	const pending = inflight.get(key);
	if (pending) return pending;

	const request = load()
		.then((value) => {
			writeGeoCache(cache, key, value);
			return value;
		})
		.finally(() => inflight.delete(key));
	inflight.set(key, request);
	return request;
}

function isIpAddress(host: string): boolean {
	return (
		/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || (/^[0-9a-f:]+$/i.test(host) && host.includes(":"))
	);
}

function isReservedHostname(hostname: string): boolean {
	const value = hostname.toLowerCase();
	return value === "localhost" || RESERVED_HOST_SUFFIXES.some((suffix) => value.endsWith(suffix));
}

function isReservedIpAddress(ip: string): boolean {
	const value = ip.trim().toLowerCase();
	if (
		value === "::1" ||
		value.startsWith("fe80:") ||
		value.startsWith("fc") ||
		value.startsWith("fd")
	)
		return true;
	const match = value.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
	if (!match) return false;
	const [a, b] = [Number(match[1]), Number(match[2])];
	return (
		a === 0 ||
		a === 10 ||
		a === 127 ||
		(a === 169 && b === 254) ||
		(a === 192 && b === 168) ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 100 && b >= 64 && b <= 127)
	);
}

function fetchJson<T>(url: string, headers?: Record<string, string>): Promise<T | null> {
	return ofetch<T>(url, { headers, timeout: 800 }).catch(() => null);
}

function getServerIp(server: string): Promise<string | null> {
	const hostname = server.trim();
	if (!hostname || isReservedHostname(hostname)) return Promise.resolve(null);
	if (isIpAddress(hostname)) return Promise.resolve(hostname);

	const key = hostname.toLowerCase();
	return cachedLookup(ipCache, ipInflight, key, async () => {
		for (const type of ["A", "AAAA"]) {
			const query = new URL("https://cloudflare-dns.com/dns-query");
			query.searchParams.set("name", hostname);
			query.searchParams.set("type", type);
			const payload = await fetchJson<DnsJsonResponse>(query.toString(), {
				Accept: "application/dns-json",
			});
			const ip = payload?.Answer?.map((answer) => String(answer.data || "").trim()).find(
				(value: string) => isIpAddress(value),
			);
			if (ip) return ip;
		}
		return null;
	});
}

function getCountryCode(ip: string): Promise<string | null> {
	return cachedLookup(countryCache, countryInflight, ip, async () => {
		const payload = await fetchJson<CountryResponse>(
			`https://api.country.is/${encodeURIComponent(ip)}`,
		);
		const code = String(payload?.country || "")
			.trim()
			.toUpperCase();
		return /^[A-Z]{2}$/.test(code) ? code : null;
	});
}

function extractHostCandidates(node: LooseProxyNode): string[] {
	const httpOptions = node["http-opts"] as { host?: unknown } | undefined;
	const wsOptions = node["ws-opts"] as { headers?: { Host?: unknown } } | undefined;
	const pluginOptions = node["plugin-opts"] as { host?: unknown } | undefined;
	const legacyPluginOptions = node.plugin_opts as { host?: unknown } | undefined;
	const httpHosts = Array.isArray(httpOptions?.host) ? httpOptions.host : [];
	const candidates = [
		node.server,
		node.sni,
		node.servername,
		wsOptions?.headers?.Host,
		...httpHosts,
		pluginOptions?.host,
		legacyPluginOptions?.host,
	];
	return Array.from(new Set(candidates.map((value) => String(value || "").trim()).filter(Boolean)));
}

export async function buildGeoNodeLabel(
	providerName: string,
	sequence: number,
	node: LooseProxyNode,
): Promise<string> {
	const originalName = String(node.name || "").trim();
	let countryCode = extractCountryCodeFromName(originalName);
	if (!countryCode) {
		for (const host of extractHostCandidates(node)) {
			const ip = await getServerIp(host);
			if (!ip || isReservedIpAddress(ip)) continue;
			countryCode = await getCountryCode(ip);
			if (countryCode) break;
		}
	}
	const flag = toFlagEmoji(countryCode);
	return `${flag} ${providerName} ${String(sequence).padStart(2, "0")} (${originalName})`;
}
