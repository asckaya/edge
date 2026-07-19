import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import YAML from "yaml";
import { createKernelMockFetch } from "../_helpers/mock-fetch";
import { callWorker } from "../_helpers/worker";

const mockFetch = createKernelMockFetch();

describe("Stash Kernel", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", mockFetch);
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("Full Edition", async () => {
		const res = await callWorker("http://localhost/?type=stash&Airport=http://sub.com");
		const yaml = YAML.parse(await res.text());
		expect(yaml["external-controller"]).toBeUndefined(); // Stash doesn't use this field
		expect(yaml["proxy-providers"]?.Airport).toBeDefined();
		expect(yaml.dns).toBeDefined();
	});

	test("Dual Edition", async () => {
		const res = await callWorker("http://localhost/?type=stash-dual&Airport=http://sub.com");
		const yaml = YAML.parse(await res.text());
		expect(yaml.rules.some((r: string) => r.includes("🚀 节点选择") && r.includes("youtube"))).toBe(
			true,
		);
	});

	test("White Edition", async () => {
		const res = await callWorker("http://localhost/?type=stash-white&Airport=http://sub.com");
		const yaml = YAML.parse(await res.text());
		expect(yaml.rules.some((r: string) => r.includes("MATCH,🚀 节点选择"))).toBe(true);
		expect(yaml["proxy-groups"].some((g: { name: string }) => g.name === "🔒 国内服务")).toBe(true);
	});

	test("Black Edition", async () => {
		const res = await callWorker("http://localhost/?type=stash-black&Airport=http://sub.com");
		const yaml = YAML.parse(await res.text());
		expect(yaml.rules.some((r: string) => r.includes("MATCH,DIRECT"))).toBe(true);
		expect(yaml["proxy-groups"].some((g: { name: string }) => g.name === "🔒 国内服务")).toBe(true);
	});

	test("supports Tailscale nodes in Stash output", async () => {
		const params = new URLSearchParams({
			type: "stash-dual",
			proxies: [
				`ss://${Buffer.from("aes-256-gcm:password").toString("base64")}@127.0.0.1:8388#Local-SS`,
				"tailscale://tskey-auth-test@controlplane.tailscale.com#Tailscale-Node",
			].join("\n"),
		});
		const res = await callWorker(`http://localhost/?${params}`);
		const yaml = YAML.parse(await res.text());

		expect(yaml.proxies.some((proxy: { type: string }) => proxy.type === "tailscale")).toBe(true);
		expect(yaml["proxy-groups"].some((group: { name: string }) => group.name === "Tailscale")).toBe(
			true,
		);
	});
});
