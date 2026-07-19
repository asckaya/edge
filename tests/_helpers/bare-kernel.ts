import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { vi } from "vitest";
import YAML from "yaml";
import { buildProxyUri } from "../../core/src/utils/proxy-builder";
import { coerceProxyNode, type LooseProxyNode } from "../../core/src/utils/proxy-node";
import { callWorker } from "./worker";

/**
 * Kernel-specific options that parameterize the bare-kernel validation test.
 *
 * The three supported kernels (mihomo, stash, sing-box) differ only in:
 *   - output file extension (.yaml vs .json)
 *   - validator binary + flags
 *   - an optional SKIP_GEO_DOWNLOAD env var (mihomo/stash only)
 *   - whether tailscale nodes must be filtered out before validation (stash)
 *   - whether a fetch mock is needed (sing-box, for any provider URLs in proxy.yaml)
 */
export interface BareKernelTestOptions {
	/** Kernel display name, e.g. "Mihomo". Used in error messages. */
	name: string;
	/** Output file extension, e.g. "yaml" or "json". */
	fileExtension: string;
	/** Full check command, e.g. "mihomo -t -f" or "sing-box check -c". */
	checkCommand: string;
	/** Extra env vars passed to the validator (e.g. SKIP_GEO_DOWNLOAD=1). */
	env?: Record<string, string>;
	/** When true, tailscale nodes are filtered out before building the config. */
	filterTailscale?: boolean;
	/** When true, stubs global fetch with a minimal mock (for sing-box). */
	stubFetch?: boolean;
}

/**
 * Build a config from proxy.yaml for the given kernel type, write it to a temp
 * file, run the validator binary, and return whether validation succeeded.
 */
export async function runBareKernelTest(
	options: BareKernelTestOptions,
	type: string,
): Promise<boolean> {
	const {
		name,
		fileExtension,
		checkCommand,
		env: extraEnv = {},
		filterTailscale = false,
		stubFetch = false,
	} = options;

	const testConfigPath = path.join(
		process.cwd(),
		`${name.toLowerCase()}-kernel-test.${fileExtension}`,
	);
	const proxyYamlPath = path.join(process.cwd(), "proxy.yaml");

	if (!fs.existsSync(proxyYamlPath)) {
		throw new Error("proxy.yaml not found");
	}
	const parsedYaml = YAML.parse(fs.readFileSync(proxyYamlPath, "utf-8"));

	const params = new URLSearchParams();
	params.set("type", type);
	if (parsedYaml.secret) params.set("secret", parsedYaml.secret);
	if (parsedYaml.gh_proxy) params.set("gh_proxy", parsedYaml.gh_proxy);

	if (parsedYaml.provider) {
		for (const p of parsedYaml.provider) {
			params.set(p.name, p.url);
		}
	}

	if (parsedYaml.proxy) {
		const proxies = (parsedYaml.proxy as unknown[])
			.map((p: unknown) => coerceProxyNode(p))
			.filter(
				(p): p is LooseProxyNode => p !== null && (!filterTailscale || p.type !== "tailscale"),
			);
		const uris = proxies.flatMap((p) => buildProxyUri(p)).filter(Boolean);
		if (uris.length > 0) params.set("proxies", uris.join("\n"));
	}

	if (stubFetch) {
		const mockFetch = vi.fn((input: RequestInfo | URL) => {
			const url =
				typeof input === "string"
					? input
					: input instanceof URL
						? input.toString()
						: (input as Request).url;
			const parsedUrl = new URL(url);
			if (parsedUrl.hostname === "cloudflare-dns.com") {
				return new Response(JSON.stringify({ Answer: [{ data: "1.1.1.1" }] }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}
			if (url.includes("ipwho.is") || url.includes("country.is")) {
				return new Response(JSON.stringify({ success: true, country_code: "US", country: "US" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}
			if (url.startsWith("http://") || url.startsWith("https://")) {
				return new Response(
					JSON.stringify({
						outbounds: [
							{
								type: "trojan",
								tag: "JP-Trojan-Node",
								server: "jp.trojan.com",
								server_port: 443,
								password: "pw",
							},
							{
								type: "vless",
								tag: "US-Vless-Node",
								server: "us.vless.com",
								server_port: 443,
								uuid: "00000000-0000-0000-0000-000000000000",
							},
						],
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			}
			return new Response("", { status: 404 });
		}) as unknown as typeof fetch;
		vi.stubGlobal("fetch", mockFetch);
	}

	try {
		const url = `http://localhost/?${params.toString()}`;
		const res = await callWorker(url);
		const content = await res.text();
		fs.writeFileSync(testConfigPath, content);

		try {
			execSync(`${checkCommand} ${testConfigPath}`, {
				stdio: ["pipe", "pipe", "pipe"],
				env: { ...process.env, ...extraEnv },
			});
			return true;
		} catch (error: unknown) {
			const err = error as { stderr?: { toString(): string }; stdout?: { toString(): string } };
			const stderr = err.stderr?.toString() || "";
			const stdout = err.stdout?.toString() || "";
			console.error(`${name} ${type} validation failed:\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`);
			return false;
		} finally {
			if (fs.existsSync(testConfigPath)) {
				fs.unlinkSync(testConfigPath);
			}
		}
	} finally {
		if (stubFetch) {
			vi.unstubAllGlobals();
		}
	}
}
