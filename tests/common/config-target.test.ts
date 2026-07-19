import { describe, expect, test } from "vitest";
import {
	inferConfigTypeFromUserAgent,
	normalizeConfigTarget,
} from "../../core/src/utils/config-target";

describe("config target resolution", () => {
	test.each([
		["ClAsH-Verge/2.0", "mihomo"],
		["MIHOMO/1.19", "mihomo"],
		["sing-box/1.13", "sing-box"],
		["SingBox Android", "sing-box"],
		["StAsH/3.2.0", "stash"],
		["Unknown Client", "mihomo"],
	] as const)("infers %s as %s", (userAgent, expected) => {
		expect(inferConfigTypeFromUserAgent(userAgent)).toBe(expected);
	});

	test("splits legacy combined type into type and mode", () => {
		expect(normalizeConfigTarget("sing-box-dual", undefined, "")).toEqual({
			type: "sing-box",
			mode: "dual",
		});
	});

	test("uses explicit mode over a legacy type suffix", () => {
		expect(normalizeConfigTarget("mihomo-dual", "white", "")).toEqual({
			type: "mihomo",
			mode: "white",
		});
	});

	test("uses explicit type over User-Agent detection", () => {
		expect(normalizeConfigTarget("stash", "black", "sing-box/1.13")).toEqual({
			type: "stash",
			mode: "black",
		});
	});
});
