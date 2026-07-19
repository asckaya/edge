import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

/**
 * Force `Content-Type: text/markdown; charset=utf-8` on .md responses.
 * Without this, Vite dev server returns `text/markdown` with no charset, and
 * browsers decode the UTF-8 bytes as latin-1 — garbling non-ASCII text.
 */
function markdownCharset(): Plugin {
	return {
		name: "markdown-charset",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (req.url?.endsWith(".md")) {
					res.setHeader("Content-Type", "text/markdown; charset=utf-8");
				}
				next();
			});
		},
	};
}

export default defineConfig({
	plugins: [
		tailwindcss(),
		markdownCharset(),
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tanstackStart({
			prerender: { enabled: true, crawlLinks: false },
			router: { routesDirectory: "app" },
		}),
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler", {}]],
			},
		}),
	],
	resolve: {
		alias: {
			"@": srcDir,
		},
	},
});
