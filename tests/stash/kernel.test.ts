import { describe, expect, test } from "vitest";
import { runBareKernelTest } from "../_helpers/bare-kernel";

/**
 * Stash Bare Kernel Test
 *
 * Generates a real configuration based on proxy.yaml and passes it to the
 * 'mihomo' binary with the '-t' flag. Stash configurations are fundamentally
 * compatible with Clash Meta (Mihomo) bare core for validation. Tailscale
 * nodes are filtered out (stash handles them, but mihomo's bare validator
 * does not).
 */

describe("Stash Bare Kernel Validation", () => {
	const options = {
		name: "Stash",
		fileExtension: "yaml",
		checkCommand: "mihomo -t -f",
		env: { SKIP_GEO_DOWNLOAD: "1" },
		filterTailscale: true,
	};

	test("Stash Full Mode", async () => {
		expect(await runBareKernelTest(options, "stash")).toBe(true);
	}, 30000);

	test("Stash Dual Mode", async () => {
		expect(await runBareKernelTest(options, "stash-dual")).toBe(true);
	}, 30000);

	test("Stash White Mode", async () => {
		expect(await runBareKernelTest(options, "stash-white")).toBe(true);
	}, 30000);

	test("Stash Black Mode", async () => {
		expect(await runBareKernelTest(options, "stash-black")).toBe(true);
	}, 30000);
});
