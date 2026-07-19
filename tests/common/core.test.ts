import { describe, expect, test } from "vitest";
import { callWorker } from "../_helpers/worker";

describe("Core Routing & Security", () => {
	const customProxy = encodeURIComponent("trojan://secret@example.com:443#Test-Node");

	test("Root Fallback to UI", async () => {
		const res = await callWorker("http://localhost/");
		const content = await res.text();
		expect(content).toBe("Static Asset Content");
	});

	test("Missing Parameters", async () => {
		const res = await callWorker("http://localhost/?foo=bar");
		const content = await res.text();
		expect(content).toContain("Missing parameters");
	});

	test("Custom Secret", async () => {
		const res = await callWorker("http://localhost/?secret=my-secret&Airport=http://sub.com");
		const text = await res.text();
		expect(text).toContain('secret: "my-secret"');
	});

	test("Detects sing-box and mode from User-Agent and query parameters", async () => {
		const res = await callWorker(
			`http://localhost/?mode=black&proxies=${customProxy}`,
			"SINGBOX/1.13",
		);
		expect(res.headers.get("content-type")).toContain("application/json");
		const json = (await res.json()) as { route: { final: string } };
		expect(json.route.final).toBe("direct");
	});

	test("Detects Stash from User-Agent", async () => {
		const res = await callWorker(`http://localhost/?proxies=${customProxy}`, "StAsH/3.2.0");
		const text = await res.text();
		expect(text).toContain("mixed-port: 7897");
		expect(text).not.toContain("external-controller: 0.0.0.0:9090");
	});

	test("Detects Clash as Mihomo from User-Agent", async () => {
		const res = await callWorker(`http://localhost/?proxies=${customProxy}`, "ClAsH-Verge/2.0");
		const text = await res.text();
		expect(text).toContain("external-controller: 0.0.0.0:9090");
	});

	test("Explicit type takes precedence over User-Agent", async () => {
		const res = await callWorker(
			`http://localhost/?type=sing-box&mode=full&proxies=${customProxy}`,
			"Mihomo/1.19",
		);
		expect(res.headers.get("content-type")).toContain("application/json");
	});
});
