/**
 * Short link contract shared by the link console and the home-page "shorten" action.
 *
 * Three independent secrets exist in this deployment:
 * 1. `secret`  — controller password baked into generated configs. Unrelated to links.
 * 2. `accessKey` — one shared key every short link uses (`?key=`), typed by users.
 * 3. admin key — `x-admin-key`, required only for custom slugs / update / delete.
 *
 * No key is ever hard-coded here: the shared access key is supplied by the user and
 * kept in localStorage; the admin key lives in sessionStorage only.
 */

const ACCESS_KEY_STORAGE = "edge-access-key";
const ADMIN_KEY_STORAGE = "edge-admin-key";

/** Stored shared access key, or an empty string when the user has not set one. */
export function readAccessKey(): string {
	if (typeof window === "undefined") return "";
	return localStorage.getItem(ACCESS_KEY_STORAGE) ?? "";
}

export function storeAccessKey(value: string): void {
	if (typeof window === "undefined") return;
	if (value) localStorage.setItem(ACCESS_KEY_STORAGE, value);
	else localStorage.removeItem(ACCESS_KEY_STORAGE);
}

export function readAdminKey(): string {
	if (typeof window === "undefined") return "";
	return sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
}

export function storeAdminKey(value: string): void {
	if (typeof window === "undefined") return;
	if (value) sessionStorage.setItem(ADMIN_KEY_STORAGE, value);
	else sessionStorage.removeItem(ADMIN_KEY_STORAGE);
}

/** Append the shared access key to a short URL so it can be opened directly. */
export function withAccessKey(shortUrl: string, accessKey: string): string {
	if (!accessKey) return shortUrl;
	const url = new URL(shortUrl);
	url.searchParams.set("key", accessKey);
	return url.toString();
}

export interface ApiOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: unknown;
	adminKey?: string;
}

/** Typed fetch wrapper that surfaces the worker's `{ error }` payload. */
export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
	const { method = "GET", body, adminKey } = options;
	const headers: Record<string, string> = {};
	if (body !== undefined) headers["Content-Type"] = "application/json";
	if (adminKey) headers["x-admin-key"] = adminKey;

	const response = await fetch(path, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
	if (!response.ok) {
		throw new Error(data?.error ? `${data.error} (${response.status})` : `HTTP ${response.status}`);
	}
	return data;
}
