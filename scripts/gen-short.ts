import fs from "node:fs";
import { cac } from "cac";
import pc from "picocolors";
import YAML from "yaml";
import { buildTargetUrl } from "./lib/build-target-url";

const cli = cac("gen-short");

cli
	.command("", "Generate a short link from proxy.yaml (requires admin key for custom slug)")
	.option(
		"--slug <slug>",
		"Custom slug (personal fixed link; requires admin key). Omit for random slug.",
	)
	.option("--access-key <key>", "Access key required to use this slug. Omit for public short link.")
	.option("--ttl <seconds>", "Expiration in seconds (60-31536000). Omit for permanent.")
	.option("--config <file>", "Path to proxy.yaml", { default: "proxy.yaml" })
	.option("--gh-proxy <url>", "GitHub proxy URL override")
	.option("--dry-run", "Print the API request without sending it", { default: false })
	.option(
		"--update",
		"Update an existing slug (PUT instead of POST). Requires --slug and admin key.",
	)
	.option("--delete", "Delete a slug. Requires --slug and admin key.")
	.action(async (options) => {
		// ---------- Load yaml + admin key ----------
		if (!fs.existsSync(options.config)) {
			console.error(pc.red(`✘ Config file not found: ${options.config}`));
			process.exit(1);
		}
		const parsedYaml = (YAML.parse(fs.readFileSync(options.config, "utf-8")) ?? {}) as {
			worker?: string;
			cf?: { admin_key?: string };
		};

		const adminKey = parsedYaml.cf?.admin_key || "";
		const worker = (parsedYaml.worker || "").replace(/\/$/, "");

		if (!worker) {
			console.error(pc.red('✘ No "worker:" field in config. Set it first.'));
			process.exit(1);
		}

		// ---------- Delete mode ----------
		if (options.delete) {
			if (!options.slug) {
				console.error(pc.red("✘ --delete requires --slug"));
				process.exit(1);
			}
			if (!adminKey) {
				console.error(
					pc.red(
						"✘ Deletion requires admin key. Set cf.admin_key in proxy.yaml (run pnpm short --help).",
					),
				);
				process.exit(1);
			}
			console.log(pc.blue(`ℹ Deleting slug "${options.slug}"…`));
			if (options.dryRun) {
				console.log(pc.cyan(`  [dry-run] DELETE ${worker}/api/shorten/${options.slug}`));
				console.log(pc.cyan(`  [dry-run] x-admin-key: ${adminKey}`));
				return;
			}
			const resp = await fetch(`${worker}/api/shorten/${options.slug}`, {
				method: "DELETE",
				headers: { "x-admin-key": adminKey },
			});
			if (!resp.ok) {
				const data = await resp.json().catch(() => ({}) as { error?: string });
				console.error(pc.red(`✘ Delete failed: ${data?.error || resp.status}`));
				process.exit(1);
			}
			console.log(pc.green(`✔ Deleted slug "${options.slug}"`));
			return;
		}

		// ---------- Build target URL ----------
		const { url: targetUrl } = buildTargetUrl({
			configFile: options.config,
			ghProxy: options.ghProxy ?? undefined,
		});
		console.log(pc.gray(`ℹ Target URL (kernel-agnostic):`));
		console.log(pc.gray(`  ${targetUrl.slice(0, 100)}${targetUrl.length > 100 ? "…" : ""}`));

		// ---------- Validate custom slug requirements ----------
		const usingCustomSlug = Boolean(options.slug);
		if (usingCustomSlug && !adminKey && !options.update) {
			console.error(
				pc.red(
					"✘ Custom slug requires admin key. Set cf.admin_key in proxy.yaml (run pnpm short --help).",
				),
			);
			process.exit(1);
		}
		if (options.update && !(options.slug && adminKey)) {
			console.error(pc.red("✘ --update requires both --slug and admin key."));
			process.exit(1);
		}

		// ---------- Build request ----------
		const body: Record<string, unknown> = { target: targetUrl };
		if (options.slug) body.slug = options.slug;
		if (options.accessKey) body.accessKey = options.accessKey;
		if (options.ttl) {
			const ttl = Number(options.ttl);
			if (!Number.isInteger(ttl) || ttl < 60 || ttl > 31536000) {
				console.error(pc.red(`✘ --ttl must be an integer between 60 and 31536000`));
				process.exit(1);
			}
			body.ttlSeconds = ttl;
		}

		const method = options.update ? "PUT" : "POST";
		const endpoint = options.update
			? `${worker}/api/shorten/${options.slug}`
			: `${worker}/api/shorten`;

		console.log(pc.blue(`\nℹ ${method} ${endpoint}`));
		if (options.dryRun) {
			console.log(pc.cyan("  [dry-run] request body:"));
			// Mask sensitive fields in dry-run display
			const display = { ...body };
			if (display.accessKey) display.accessKey = "***";
			console.log(pc.cyan(`  ${JSON.stringify(display, null, 2)}`));
			if (adminKey) console.log(pc.cyan(`  [dry-run] x-admin-key: ${adminKey}`));
			return;
		}

		// ---------- Send request ----------
		const headers: Record<string, string> = { "Content-Type": "application/json" };
		if (adminKey) headers["x-admin-key"] = adminKey;

		const resp = await fetch(endpoint, { method, headers, body: JSON.stringify(body) });
		const data = await resp
			.json()
			.catch(() => ({}) as { error?: string; shortUrl?: string; slug?: string });

		if (!resp.ok) {
			console.error(pc.red(`✘ Failed: ${data?.error || resp.status}`));
			process.exit(1);
		}

		// ---------- Output ----------
		console.log(pc.green("\n✔ Short link created/updated successfully!"));
		if (options.update) {
			console.log(pc.magenta(`  Slug: ${options.slug}`));
		} else {
			console.log(pc.magenta(`  Slug: ${data.slug}`));
		}
		if (data.shortUrl) {
			console.log(pc.cyan(`  Short URL: ${data.shortUrl}`));
		} else if (options.update) {
			// PUT doesn't return shortUrl; reconstruct it
			console.log(pc.cyan(`  Short URL: ${worker}/s/${options.slug}`));
		}

		if (options.accessKey) {
			console.log(pc.yellow(`  Access key: ${options.accessKey}`));
			console.log(
				pc.gray(`  Client URL: ${worker}/s/${options.slug ?? data.slug}?key=${options.accessKey}`),
			);
		}

		if (options.slug) {
			console.log(pc.gray(`\n  Update later:  pnpm gen-short --slug ${options.slug} --update`));
			console.log(pc.gray(`  Delete:        pnpm gen-short --slug ${options.slug} --delete`));
		}
	});

cli.help();
cli.parse();
