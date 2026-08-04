import { describe, expect, test } from "vitest";
import { REGION_GROUPS } from "../../core/src/utils/shared-constants";

describe("REGION_GROUPS configuration & filters", () => {
	test("contains all expected 8 regions including Australia, UK, and Germany", () => {
		const codes = REGION_GROUPS.map((r) => r.code);
		expect(codes).toEqual(["HK", "JP", "US", "SG", "TW", "AU", "GB", "DE"]);
	});

	test.each([
		["AU", "🇦🇺 澳大利亚 01", true],
		["AU", "澳洲专线 02", true],
		["AU", "Sydney 03", true],
		["AU", "Melbourne-AU-04", true],
		["AU", "US-Node", false],

		["GB", "🇬🇧 英国 01", true],
		["GB", "London Premium 02", true],
		["GB", "UK-Server-03", true],
		["GB", "JP-Node", false],

		["DE", "🇩🇪 德国 01", true],
		["DE", "Frankfurt 02", true],
		["DE", "DE-Server-03", true],
		["DE", "HK-Node", false],
	])("region %s filter tests for node name '%s'", (code, nodeName, shouldMatch) => {
		const region = REGION_GROUPS.find((r) => r.code === code);
		expect(region).toBeDefined();
		if (!region) return;
		const filterPattern = region.filter.replace("(?i)", "");
		const regex = new RegExp(filterPattern, "i");
		expect(regex.test(nodeName)).toBe(shouldMatch);
	});
});
