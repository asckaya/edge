import { describe, expect, test } from "vitest";
import {
	analyzeSubscriptions,
	countNonEmptyLines,
	normalizeNonEmptyLines,
	validateProxiesText,
} from "../../src/lib/subscriptions";

describe("subscription form utilities", () => {
	test("finds duplicate trimmed names in linear analysis", () => {
		const result = analyzeSubscriptions([
			{ id: 1, name: "Airport", url: "https://one.example/sub" },
			{ id: 2, name: " Airport ", url: "https://two.example/sub" },
		]);

		expect(result.activeCount).toBe(2);
		expect(result.duplicateNames).toEqual(new Set(["Airport"]));
		expect(result.allNamesSafe).toBe(true);
		expect(result.allUrlsValid).toBe(true);
	});

	test("normalizes and counts non-empty proxy lines consistently", () => {
		const input = "  vless://one  \n\nss://two\n   ";
		expect(countNonEmptyLines(input)).toBe(2);
		expect(normalizeNonEmptyLines(input)).toBe("vless://one\nss://two");
	});

	test("validateProxiesText identifies http and https URLs as invalid/errors", () => {
		const zhRes = validateProxiesText(
			"ss://foo\nhttps://kaze1.aisaka-taiga.com/oosaka/123\nvmess://bar",
			"zh",
		);
		expect(zhRes.isValid).toBe(false);
		expect(zhRes.errors.length).toBe(1);
		expect(zhRes.errors[0]).toContain("第 2 行包含 http:// 或 https:// 协议链接");

		const enRes = validateProxiesText("http://some-sub.com/link", "en");
		expect(enRes.isValid).toBe(false);
		expect(enRes.errors.length).toBe(1);
		expect(enRes.errors[0]).toContain("Line 1 contains http:// or https:// protocols");

		const validRes = validateProxiesText("ss://foo\nvmess://bar", "zh");
		expect(validRes.isValid).toBe(true);
		expect(validRes.errors).toEqual([]);
	});

	test("analyzeSubscriptions fails if subscription name is missing but url is present", () => {
		const result = analyzeSubscriptions([{ id: 1, name: "", url: "https://one.example/sub" }]);
		expect(result.allNamesSafe).toBe(false);
		expect(result.activeCount).toBe(0);
	});

	test("analyzeSubscriptions fails if subscription url is missing but name is present", () => {
		const result = analyzeSubscriptions([{ id: 1, name: "Airport", url: "" }]);
		expect(result.allUrlsValid).toBe(false);
		expect(result.activeCount).toBe(0);
	});

	test("analyzeSubscriptions ignores completely empty rows", () => {
		const result = analyzeSubscriptions([
			{ id: 1, name: "", url: "" },
			{ id: 2, name: "Airport", url: "https://one.example/sub" },
		]);
		expect(result.allNamesSafe).toBe(true);
		expect(result.allUrlsValid).toBe(true);
		expect(result.activeCount).toBe(1);
	});
});
