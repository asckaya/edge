import { afterEach, describe, expect, test, vi } from "vitest";
import { callWorker } from "../_helpers/worker";

describe("Sing-box Kernel - Utils", () => {
	let currentSubResponse: () => Response;

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	const stubFetch = () => {
		const mockFetch = vi.fn((input: RequestInfo | URL) => {
			const url =
				typeof input === "string"
					? input
					: input instanceof URL
						? input.toString()
						: (input as Request).url;
			const parsedUrl = new URL(url);
			if (url === "http://sub.com") {
				return currentSubResponse();
			}
			if (parsedUrl.hostname === "cloudflare-dns.com") {
				return new Response(JSON.stringify({ Answer: [{ data: "1.1.1.1" }] }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}
			if (parsedUrl.hostname === "api.country.is") {
				return new Response(JSON.stringify({ country: "JP" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}
			return new Response("", { status: 404 });
		}) as unknown as typeof fetch;
		vi.stubGlobal("fetch", mockFetch);
	};

	test("Node Renaming", async () => {
		currentSubResponse = () =>
			new Response(
				JSON.stringify({
					outbounds: [
						{
							type: "trojan",
							tag: "node-1",
							server: "jp.real.site",
							server_port: 443,
							password: "pw1",
							tls: { enabled: true, server_name: "jp.real.site" },
						},
					],
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		stubFetch();

		const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
		const json = (await res.json()) as { outbounds: Array<{ tag: string }> };
		expect(json.outbounds.some((item) => item.tag === "🇯🇵 Airport 01 (node-1)")).toBe(true);
	});

	test("Renaming Prefers Hints", async () => {
		currentSubResponse = () =>
			new Response(
				JSON.stringify({
					outbounds: [
						{
							type: "trojan",
							tag: "TW-X1-1",
							server: "unknown.net",
							server_port: 443,
							password: "pw2",
						},
					],
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		stubFetch();

		const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
		const json = (await res.json()) as { outbounds: Array<{ tag: string }> };
		expect(json.outbounds.some((item) => item.tag === "🇹🇼 Airport 01 (TW-X1-1)")).toBe(true);
	});

	test("Informational Node Filtering", async () => {
		currentSubResponse = () =>
			new Response(
				JSON.stringify({
					outbounds: [
						{
							type: "vless",
							tag: "剩余流量：463.56 GB",
							server: "i.net",
							server_port: 443,
							uuid: "u1",
						},
						{ type: "vless", tag: "🇯🇵Japan 01", server: "j.net", server_port: 443, uuid: "u2" },
					],
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		stubFetch();

		const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
		const json = (await res.json()) as {
			outbounds: Array<{ type: string; tag: string }>;
		};
		const tags = json.outbounds.filter((item) => item.type === "vless").map((item) => item.tag);
		expect(tags).toEqual(["🇯🇵 Airport 01 (🇯🇵Japan 01)"]);
	});

	test("Tailscale Endpoint Integration", async () => {
		stubFetch();
		const res = await callWorker(
			"http://localhost/?type=sing-box&proxies=tailscale://tskey-auth-xxxx@controlplane.tailscale.com?hostname=mihomo%26state-dir=.%2Fstate%26accept-routes=true%26exit-node=100.88.0.1%26ephemeral=true%26udp=true%23Tailscale-Node",
		);
		const json = (await res.json()) as {
			endpoints: Record<string, unknown>[];
			route: { rules: Array<{ outbound: string; ip_cidr?: string[] }> };
		};

		expect(json.endpoints).toHaveLength(1);
		expect(json.endpoints[0]).toMatchObject({
			type: "tailscale",
			tag: "Tailscale-Node",
			auth_key: "tskey-auth-xxxx",
			hostname: "mihomo",
			control_url: "https://controlplane.tailscale.com",
			state_directory: "./state",
			accept_routes: true,
			exit_node: "100.88.0.1",
			ephemeral: true,
		});

		const routeRule = json.route.rules.find((r) => r.outbound === "Tailscale-Node");
		expect(routeRule).toBeDefined();
		expect(routeRule?.ip_cidr).toContain("100.64.0.0/10");
		expect(routeRule?.ip_cidr).toContain("fd7a:115c:a1e0::/48");
	});
});
