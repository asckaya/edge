import type { Subscription } from "@/lib/subscriptions";
import { normalizeNonEmptyLines } from "@/lib/subscriptions";
import type { ConfigMode, ConfigType } from "../../core/src/types";

/**
 * Parse a frontend `configType` (e.g. `'sing-box-dual'`, `'mihomo'`) into the
 * canonical API `ConfigType`. Centralised here so the URI builder and the
 * `useConfigType` hook share a single source of truth.
 */
export function parseConfigType(configType: string): ConfigType {
	if (configType.startsWith("sing-box")) return "sing-box";
	if (configType.startsWith("stash")) return "stash";
	return "mihomo";
}

/**
 * Parse a frontend `configType` (e.g. `'mihomo-white'`) into the canonical API
 * `ConfigMode`. The legacy combined form (`type=mihomo-white`) is the only form
 * the frontend emits today; new URLs use `?type=mihomo&mode=white` instead.
 */
export function parseConfigMode(configType: string): ConfigMode {
	if (configType.endsWith("-dual")) return "dual";
	if (configType.endsWith("-white")) return "white";
	if (configType.endsWith("-black")) return "black";
	return "full";
}

export interface BuildConfigUrlOptions {
	/** Browser origin (typically `window.location.origin`). */
	origin: string;
	/** Frontend `configType` string, e.g. `'sing-box-dual'`. */
	configType: string;
	secret: string;
	subscriptions: Subscription[];
	proxiesText: string;
	ghProxy?: string;
}

/**
 * Build the canonical Edge Engine config endpoint URL from frontend state.
 *
 * Pure function (no DOM access) — pass `origin` explicitly so it is testable
 * outside the browser. The `type`/`mode` params are emitted as separate query
 * keys per the new URL convention (`AGENTS.md` §2).
 */
export function buildConfigUrl({
	origin,
	configType,
	secret,
	subscriptions,
	proxiesText,
	ghProxy,
}: BuildConfigUrlOptions): string {
	const url = new URL(origin);
	url.searchParams.set("type", parseConfigType(configType));
	url.searchParams.set("mode", parseConfigMode(configType));
	url.searchParams.set("secret", secret);

	for (const sub of subscriptions) {
		const name = sub.name.trim();
		const sUrl = sub.url.trim();
		if (name && sUrl) {
			url.searchParams.set(name, sUrl);
		}
	}

	const rawProxies = proxiesText.trim();
	if (rawProxies) {
		url.searchParams.set("proxies", normalizeNonEmptyLines(rawProxies));
	}

	if (ghProxy?.trim()) {
		url.searchParams.set("gh_proxy", ghProxy.trim());
	}

	return url.toString();
}
