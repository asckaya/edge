import fs from "node:fs";
import { cac } from "cac";
import pc from "picocolors";
import { buildTargetUrl } from "./lib/build-target-url";
import { validateTarget } from "./lib/validate-target";

const cli = cac("gen-url");

cli
	.command("", "Generate Worker URL")
	.option("--type <type>", "Target config type (mihomo, sing-box, stash)", { default: "mihomo" })
	.option("--mode <mode>", "Routing mode (full, dual, white, black)")
	.option("--rules <rules>", "Rule granularity (category, granular)", { default: "category" })
	.option("--gh-proxy <url>", "GitHub proxy URL")
	.action((options) => {
		const { configType, configMode, configRules } = validateTarget(
			options.type,
			options.mode,
			options.rules,
		);
		const cliGhProxy = options.ghProxy;

		let configFile = "proxy.yaml";
		if (!fs.existsSync(configFile)) {
			configFile = "example.yaml";
		}

		if (!fs.existsSync(configFile)) {
			console.error(pc.red(`✘ No configuration file found!`));
			console.error("Create proxy.yaml or use example.yaml.");
			process.exit(1);
		}

		console.log(pc.blue(`ℹ Reading configuration from ${configFile}`));

		const { url: targetUrl, base } = buildTargetUrl({ ghProxy: cliGhProxy ?? undefined });

		// Append type/mode/rules for this generation
		const params = new URLSearchParams(targetUrl.split("?")[1] || "");
		params.set("type", configType);
		params.set("mode", configMode);
		if (configRules && configRules !== "category") {
			params.set("rules", configRules);
		}
		const finalUrl = `${base}/?${params.toString()}`;

		const modeLabels: Record<string, string> = {
			full: "Full",
			dual: "Dual (Domestic/Global)",
			white: "White (Domestic-Direct)",
			black: "Black (Overseas-Proxy)",
		};

		console.log(pc.green("\n✔ Worker URL Generated Successfully!"));
		console.log(
			pc.magenta(
				`  Target: ${configType} / Mode: ${modeLabels[configMode]} / Rules: ${configRules}`,
			),
		);
		console.log(`${pc.cyan(finalUrl)}\n`);
	});

cli.help();
cli.parse();
