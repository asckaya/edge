import { describe, expect, test } from "vitest";
import { canRunBareKernelTest, runBareKernelTest } from "../_helpers/bare-kernel";

/**
 * Sing-box Bare Kernel Test
 *
 * Generates a real configuration based on proxy.yaml and passes it to the
 * 'sing-box' binary with the 'check' command to ensure validity. Fetch is
 * stubbed for any provider URLs in proxy.yaml (and DNS/geo lookups).
 */

describe.skipIf(!canRunBareKernelTest("sing-box"))("Sing-box Bare Kernel Validation", () => {
	const options = {
		name: "Sing-box",
		fileExtension: "json",
		checkCommand: "sing-box check -c",
		stubFetch: true,
	};

	test("Sing-box Full Mode", async () => {
		expect(await runBareKernelTest(options, "sing-box")).toBe(true);
	}, 30000);

	test("Sing-box Dual Mode", async () => {
		expect(await runBareKernelTest(options, "sing-box-dual")).toBe(true);
	}, 30000);

	test("Sing-box White Mode", async () => {
		expect(await runBareKernelTest(options, "sing-box-white")).toBe(true);
	}, 30000);

	test("Sing-box Black Mode", async () => {
		expect(await runBareKernelTest(options, "sing-box-black")).toBe(true);
	}, 30000);
});
