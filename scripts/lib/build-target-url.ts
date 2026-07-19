import fs from "node:fs";
import YAML from "yaml";
import type { ProxyNode } from "../../core/src/types";
import { buildProxyUri } from "../../core/src/utils/proxy-builder";
import { coerceProxyNode } from "../../core/src/utils/proxy-node";

export interface TargetUrlOptions {
	/** Path to proxy.yaml. Defaults to 'proxy.yaml', falls back to 'example.yaml'. */
	configFile?: string;
	/** Override gh_proxy. Falls back to yaml value. */
	ghProxy?: string | null;
}

export interface BuildResult {
	/** Kernel-agnostic target URL (no type/mode params). */
	url: string;
	/** Worker base URL (no trailing slash). */
	base: string;
	/** Parsed yaml object. */
	yaml: Record<string, unknown>;
}

/**
 * Build a kernel-agnostic target URL from proxy.yaml.
 * The URL contains only content params (secret, providers, proxies, gh_proxy);
 * type/mode are intentionally omitted so the short link resolves them at access time.
 */
export function buildTargetUrl(options: TargetUrlOptions = {}): BuildResult {
	let configFile = options.configFile ?? "proxy.yaml";
	if (!fs.existsSync(configFile)) {
		configFile = "example.yaml";
	}
	if (!fs.existsSync(configFile)) {
		throw new Error(
			`No configuration file found: tried ${options.configFile ?? "proxy.yaml"} and example.yaml`,
		);
	}

	const yamlContent = fs.readFileSync(configFile, "utf-8");
	const parsedYaml = (YAML.parse(yamlContent) ?? {}) as Record<string, unknown>;

	const workerDomain = (parsedYaml.worker as string) || "https://your-worker.workers.dev/";
	const secret = (parsedYaml.secret as string) || "";
	const providers = (Array.isArray(parsedYaml.provider) ? parsedYaml.provider : []) as Array<{
		name: string;
		url: string;
	}>;
	const yamlGhProxy = (parsedYaml.gh_proxy as string) || null;
	const ghProxy = options.ghProxy ?? yamlGhProxy;

	const proxies: ProxyNode[] = Array.isArray(parsedYaml.proxy)
		? (parsedYaml.proxy as unknown[])
				.map((p) => coerceProxyNode(p))
				.filter((p): p is ProxyNode => Boolean(p))
		: [];

	const params = new URLSearchParams();
	if (secret) params.set("secret", secret);
	if (ghProxy) params.set("gh_proxy", ghProxy);
	for (const p of providers) {
		if (p.name && p.url) params.set(p.name, p.url);
	}
	const proxyUris = proxies.flatMap((p) => buildProxyUri(p)).filter(Boolean);
	if (proxyUris.length > 0) params.set("proxies", proxyUris.join("\n"));

	const base = workerDomain.replace(/\/$/, "");
	return { url: `${base}/?${params.toString()}`, base, yaml: parsedYaml };
}
