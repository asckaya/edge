import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for the Edge Engine.
 *
 * - environment: 'node' — tests run in Node (the worker code uses Node globals
 *   like Buffer and child_process for bare-kernel validation).
 * - include: all test files under tests/.
 * - setupFiles: ensures global stubs (fetch, etc.) are cleaned up between tests
 *   even if a test forgets afterEach(vi.unstubAllGlobals).
 * - coverage: v8 provider; reports on the core source, excluding tests,
 *   generated configs, and type-only files.
 */
export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
		unstubGlobals: true,
		coverage: {
			provider: "v8",
			include: ["core/src/**/*.ts"],
			exclude: ["core/src/types.ts", "core/src/env.ts", "**/*.d.ts"],
			reporter: ["text", "html"],
			reportsDirectory: "coverage",
		},
	},
});
