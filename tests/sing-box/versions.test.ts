import { afterEach, describe, expect, test, vi } from "vitest";
import { createKernelMockFetch } from "../_helpers/mock-fetch";
import { callWorker } from "../_helpers/worker";

describe("Sing-box Kernel - Versions", () => {
	const mockFetch = createKernelMockFetch({ dnsIp: "93.184.215.14" });

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("Full Edition", async () => {
		vi.stubGlobal("fetch", mockFetch);
		const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
		const json = (await res.json()) as {
			outbounds: unknown[];
			route: {
				rule_set: unknown[];
				rules: Array<{ outbound: string; rule_set?: string[] }>;
				final: string;
			};
		};
		expect(json.outbounds).toBeDefined();
		expect(json.route.rule_set.length).toBeGreaterThan(20);
	});

	test("Dual Edition", async () => {
		vi.stubGlobal("fetch", mockFetch);
		const res = await callWorker("http://localhost/?type=sing-box-dual&Airport=http://sub.com");
		const json = (await res.json()) as {
			outbounds: unknown[];
			route: {
				rule_set: unknown[];
				rules: Array<{ outbound: string; rule_set?: string[] }>;
				final: string;
			};
		};
		// All scenario rules should point to 🚀 节点选择
		expect(
			json.route.rules.some((r) => r.outbound === "🚀 节点选择" && r.rule_set?.includes("google")),
		).toBe(true);
	});

	test("White Edition", async () => {
		vi.stubGlobal("fetch", mockFetch);
		const res = await callWorker("http://localhost/?type=sing-box-white&Sub=http://sub.com");
		const json = (await res.json()) as {
			outbounds: Array<{ tag: string }>;
			route: { final: string };
		};
		// White-list: final route to proxy
		expect(json.route.final).toBe("🚀 节点选择");
		expect(json.outbounds.some((item) => item.tag === "🔒 国内服务")).toBe(true);
	});

	test("Black Edition", async () => {
		vi.stubGlobal("fetch", mockFetch);
		const res = await callWorker("http://localhost/?type=sing-box-black&Sub=http://sub.com");
		const json = (await res.json()) as {
			outbounds: Array<{ tag: string }>;
			route: { final: string };
		};
		// Black-list: final route to direct
		expect(json.route.final).toBe("direct");
		expect(json.outbounds.some((item) => item.tag === "🔒 国内服务")).toBe(true);
	});
});
