import fs from "node:fs";
import { cac } from "cac";
import pc from "picocolors";
import { onRequest } from "../core/[[path]]";
import { buildTargetUrl } from "./lib/build-target-url";
import { validateTarget } from "./lib/validate-target";

/**
 * Local Config Generator
 * Directly converts a local YAML config to a final proxy configuration.
 */

const cli = cac("yaml-to-config");

cli
	.command("", "Local Config Generator")
	.option("--type <type>", "Target config type (mihomo, sing-box, stash)", { default: "mihomo" })
	.option("--mode <mode>", "Routing mode (full, dual, white, black)")
	.option("--output <file>", "Output file path")
	.action(async (options) => {
		const { configType, configMode } = validateTarget(options.type, options.mode);
		const outputFile = options.output;

		let configFile = "proxy.yaml";
		if (!fs.existsSync(configFile)) {
			configFile = "example.yaml";
		}

		if (!fs.existsSync(configFile)) {
			console.error(pc.red(`✘ No configuration file found!`));
			process.exit(1);
		}

		console.log(
			pc.blue(`ℹ Reading from ${configFile} (Target: ${configType}, Mode: ${configMode})`),
		);

		// Build the content params from proxy.yaml (secret, providers, proxies, gh_proxy)
		// via the shared helper, then append type/mode for this generation.
		const { url: targetUrl } = buildTargetUrl({ configFile });
		const params = new URLSearchParams(targetUrl.split("?")[1] || "");
		params.set("type", configType);
		params.set("mode", configMode);

		// Mock Cloudflare Pages Request (localhost domain is sufficient for the mock)
		const url = `http://localhost/?${params.toString()}`;
		const request = new Request(url);

		// Mock Context
		const context = {
			request,
			env: {},
			params: {},
			waitUntil: () => {},
			next: () => Promise.resolve(new Response("Fallback")),
		};

		console.log(pc.yellow("⏳ Generating configuration..."));
		const response = await onRequest(context);
		const result = await response.text();

		if (outputFile) {
			fs.writeFileSync(outputFile, result);
			console.log(pc.green(`✔ Configuration saved to ${outputFile}`));
		} else {
			console.log(pc.gray("\n--- BEGIN CONFIG ---\n"));
			console.log(result);
			console.log(pc.gray("\n--- END CONFIG ---\n"));
		}
	});

cli.help();
cli.parse();
