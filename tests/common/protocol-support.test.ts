import { describe, expect, test } from "vitest";
import {
	checkProtocolSupport,
	extractProtocol,
	isProtocolSupportedByKernel,
} from "../../src/lib/protocol-support";

describe("extractProtocol", () => {
	test("extracts standard schemes", () => {
		expect(extractProtocol("vless://uuid@example.com:443")).toBe("vless");
		expect(extractProtocol("vmess://base64payload")).toBe("vmess");
		expect(extractProtocol("trojan://pw@host:443")).toBe("trojan");
		expect(extractProtocol("ss://method:pw@host:443")).toBe("ss");
	});

	test("maps shadowsocks and wg aliases to canonical keys", () => {
		expect(extractProtocol("shadowsocks://method:pw@host:443")).toBe("ss");
		expect(extractProtocol("wg://host:443")).toBe("wireguard");
	});

	test("accepts project custom schemes", () => {
		expect(extractProtocol("snell://psk@host:443")).toBe("snell");
		expect(extractProtocol("masque://host:443")).toBe("masque");
		expect(extractProtocol("mieru://user:pw@host:443")).toBe("mieru");
		expect(extractProtocol("trusttunnel://user:pw@host:443")).toBe("trusttunnel");
		expect(extractProtocol("shadowtls://host:443")).toBe("shadowtls");
		expect(extractProtocol("juicity://uuid:pw@host:443")).toBe("juicity");
		expect(extractProtocol("naive+https://user:pw@host:443")).toBe("naive");
		expect(extractProtocol("naive+quic://user:pw@host:443")).toBe("naive");
	});

	test("returns null for blank or comment lines", () => {
		expect(extractProtocol("")).toBeNull();
		expect(extractProtocol("   ")).toBeNull();
		expect(extractProtocol("# a comment")).toBeNull();
		expect(extractProtocol("  # indented comment")).toBeNull();
	});

	test("returns null for lines without a scheme", () => {
		expect(extractProtocol("just text")).toBeNull();
		expect(extractProtocol("example.com:443")).toBeNull();
	});

	test("trims leading whitespace before matching", () => {
		expect(extractProtocol("  vless://uuid@host:443")).toBe("vless");
	});

	test("is case-insensitive on scheme", () => {
		expect(extractProtocol("VLESS://uuid@host:443")).toBe("vless");
		expect(extractProtocol("SS://method:pw@host:443")).toBe("ss");
	});
});

describe("isProtocolSupportedByKernel", () => {
	test("mihomo supports its full protocol set", () => {
		expect(isProtocolSupportedByKernel("vless", "mihomo")).toBe(true);
		expect(isProtocolSupportedByKernel("masque", "mihomo")).toBe(true);
		expect(isProtocolSupportedByKernel("mieru", "mihomo")).toBe(true);
	});

	test("mihomo does not support sing-box-only or stash-only protocols", () => {
		expect(isProtocolSupportedByKernel("naive", "mihomo")).toBe(false);
		expect(isProtocolSupportedByKernel("shadowtls", "mihomo")).toBe(false);
		expect(isProtocolSupportedByKernel("juicity", "mihomo")).toBe(false);
	});

	test("stash excludes mihomo-only and sing-box-only protocols", () => {
		expect(isProtocolSupportedByKernel("masque", "stash")).toBe(false);
		expect(isProtocolSupportedByKernel("mieru", "stash")).toBe(false);
		expect(isProtocolSupportedByKernel("naive", "stash")).toBe(false);
		expect(isProtocolSupportedByKernel("juicity", "stash")).toBe(true);
	});

	test("sing-box supports wireguard and tailscale as endpoints", () => {
		expect(isProtocolSupportedByKernel("wireguard", "sing-box")).toBe(true);
		expect(isProtocolSupportedByKernel("tailscale", "sing-box")).toBe(true);
	});

	test("sing-box does not support mihomo/stash-only protocols", () => {
		expect(isProtocolSupportedByKernel("masque", "sing-box")).toBe(false);
		expect(isProtocolSupportedByKernel("mieru", "sing-box")).toBe(false);
		expect(isProtocolSupportedByKernel("juicity", "sing-box")).toBe(false);
		expect(isProtocolSupportedByKernel("trusttunnel", "sing-box")).toBe(false);
	});

	test("unknown protocols report as unsupported", () => {
		expect(isProtocolSupportedByKernel("unknownproto", "mihomo")).toBe(false);
	});
});

describe("checkProtocolSupport", () => {
	test("returns no warnings when all protocols are supported by the kernel", () => {
		const text = "vless://uuid@host:443\nvmess://payload\ntrojan://pw@host:443";
		const result = checkProtocolSupport(text, "mihomo", "en");
		expect(result.unsupportedProtocols).toEqual([]);
		expect(result.warnings).toEqual([]);
	});

	test("returns no warnings for empty input", () => {
		expect(checkProtocolSupport("", "sing-box", "zh")).toEqual({
			unsupportedProtocols: [],
			warnings: [],
		});
		expect(checkProtocolSupport("   \n  ", "stash", "zh")).toEqual({
			unsupportedProtocols: [],
			warnings: [],
		});
	});

	test("flags masque/mieru when sing-box is selected", () => {
		const text = "vless://uuid@host:443\nmasque://host:443\nmieru://user:pw@host:443";
		const result = checkProtocolSupport(text, "sing-box", "en");
		expect(result.unsupportedProtocols.sort()).toEqual(["masque", "mieru"]);
		expect(result.warnings).toHaveLength(2);
		expect(result.warnings[0]).toContain("sing-box");
		expect(result.warnings[0]).toContain("masque");
	});

	test("flags naive/shadowtls when mihomo is selected", () => {
		const text = "naive+https://user:pw@host:443\nshadowtls://host:443";
		const result = checkProtocolSupport(text, "mihomo", "zh");
		expect(result.unsupportedProtocols.sort()).toEqual(["naive", "shadowtls"]);
		expect(result.warnings[0]).toContain("Mihomo");
	});

	test("flags juicity when mihomo is selected (stash-only)", () => {
		const text = "juicity://uuid:pw@host:443";
		const result = checkProtocolSupport(text, "mihomo", "en");
		expect(result.unsupportedProtocols).toEqual(["juicity"]);
		expect(result.warnings[0]).toContain("juicity");
	});

	test("deduplicates repeated unsupported protocols", () => {
		const text = "masque://a:443\nmasque://b:443\nmasque://c:443";
		const result = checkProtocolSupport(text, "stash", "en");
		expect(result.unsupportedProtocols).toEqual(["masque"]);
		expect(result.warnings).toHaveLength(1);
	});

	test("ignores comment and blank lines", () => {
		const text = "# vless://comment\n\n  # another comment\nvless://real@host:443";
		const result = checkProtocolSupport(text, "mihomo", "en");
		expect(result.unsupportedProtocols).toEqual([]);
	});

	test("localized warnings differ by lang", () => {
		const text = "masque://host:443";
		const zh = checkProtocolSupport(text, "stash", "zh");
		const en = checkProtocolSupport(text, "stash", "en");
		expect(zh.warnings[0]).toContain("Stash");
		expect(zh.warnings[0]).toContain("过滤掉");
		expect(en.warnings[0]).toContain("filtered out");
	});
});
