import { describe, expect, test } from "vitest";
import { parseProxyLine } from "../../core/src/utils/proxy-parser";
import { encodeUtf8Base64 } from "../../src/lib/base64";
import { buildNodeUri, buildVmessUri, type NodeFormValues } from "../../src/lib/node-uri";

const BASE_FORM: NodeFormValues = {
	protocol: "vless",
	host: "node.example.com",
	port: "443",
	name: "Test Node",
	uuid: "",
	password: "",
	sni: "",
	network: "tcp",
	encryption: "none",
	security: "tls",
	cipher: "aes-256-gcm",
	alpn: "h3",
	congestion: "bbr",
	obfs: "none",
	obfsPassword: "",
	privateKey: "",
	publicKey: "",
	localIp: "10.0.0.1/24",
	mtu: "1420",
	fingerprint: "chrome",
	idleTimeout: "",
	controlUrl: "https://controlplane.tailscale.com",
	hostname: "",
	tailscaleUdp: true,
	acceptRoutes: false,
	exitNode: "",
	ephemeral: false,
};

describe("encodeUtf8Base64", () => {
	test("encodes Unicode credentials without browser btoa limitations", () => {
		const value = "aes-256-gcm:密码-🔐";
		const encoded = encodeUtf8Base64(value);
		expect(Buffer.from(encoded, "base64").toString("utf8")).toBe(value);
	});

	test("builds a standard VMess JSON URI with Unicode names", () => {
		const uri = buildVmessUri({
			name: "🇯🇵 东京节点",
			host: "tokyo.example.com",
			port: "443",
			uuid: "uuid-1234",
			network: "ws",
			security: "tls",
			sni: "cdn.example.com",
		});
		const payload = JSON.parse(
			Buffer.from(uri.slice("vmess://".length), "base64").toString("utf8"),
		);

		expect(payload).toMatchObject({
			ps: "🇯🇵 东京节点",
			add: "tokyo.example.com",
			port: 443,
			id: "uuid-1234",
			net: "ws",
			tls: "tls",
			sni: "cdn.example.com",
		});
	});

	test("builds parseable Shadowsocks URIs from form state", () => {
		const uri = buildNodeUri({ ...BASE_FORM, protocol: "ss", password: "密码-🔐" });
		expect(uri).not.toBeNull();
		if (uri === null) throw new Error("test setup failed: uri is null");
		expect(parseProxyLine(uri).node).toMatchObject({
			type: "ss",
			cipher: "aes-256-gcm",
			password: "密码-🔐",
			name: "Test Node",
		});
	});

	test("rejects incomplete form state before injection", () => {
		expect(buildNodeUri({ ...BASE_FORM, host: "" })).toBeNull();
		expect(buildNodeUri({ ...BASE_FORM, protocol: "tailscale", password: "" })).toBeNull();
	});
});
