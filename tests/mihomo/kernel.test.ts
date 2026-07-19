import { describe, expect, test } from "vitest";
import { runBareKernelTest } from "../_helpers/bare-kernel";

/**
 * Mihomo Bare Kernel Test
 *
 * Generates a real configuration based on proxy.yaml and passes it to the
 * 'mihomo' binary with the '-t' flag to ensure validity.
 */

describe("Mihomo Bare Kernel Validation", () => {
	const options = {
		name: "Mihomo",
		fileExtension: "yaml",
		checkCommand: "mihomo -t -f",
		env: { SKIP_GEO_DOWNLOAD: "1" },
	};

	test("Mihomo Full Mode", async () => {
		expect(await runBareKernelTest(options, "mihomo")).toBe(true);
	}, 30000);

	test("Mihomo Dual Mode", async () => {
		expect(await runBareKernelTest(options, "mihomo-dual")).toBe(true);
	}, 30000);

	test("Mihomo White Mode", async () => {
		expect(await runBareKernelTest(options, "mihomo-white")).toBe(true);
	}, 30000);

	test("Mihomo Black Mode", async () => {
		expect(await runBareKernelTest(options, "mihomo-black")).toBe(true);
	}, 30000);
});
