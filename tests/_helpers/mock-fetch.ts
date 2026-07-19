import { vi } from "vitest";

/**
 * Shared fetch mock factory for kernel tests.
 * Returns a minimal base64-encoded trojan subscription for http://sub.com
 * so kernel tests no longer hit the real network. DNS / geo lookups are
 * also stubbed to keep tests deterministic and offline.
 */
export function createKernelMockFetch(options?: { dnsIp?: string }): typeof fetch {
	const dnsIp = options?.dnsIp ?? "1.1.1.1";
	return vi.fn((input: RequestInfo | URL) => {
		const url =
			typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
		const parsed = new URL(url);
		if (url === "http://sub.com") {
			const encoded = btoa("trojan://pw@example.com:443?sni=example.com#SubNode");
			return new Response(encoded, { status: 200 });
		}
		if (parsed.hostname === "cloudflare-dns.com") {
			return new Response(JSON.stringify({ Answer: [{ data: dnsIp }] }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}
		if (
			parsed.hostname === "api.country.is" ||
			url.includes("ipwho.is") ||
			url.includes("country.is")
		) {
			return new Response(JSON.stringify({ success: true, country_code: "US", country: "US" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}
		return new Response("", { status: 404 });
	}) as unknown as typeof fetch;
}
