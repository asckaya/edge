/**
 * GitHub proxy URL rewriting — shared between mihomo and sing-box builders.
 *
 * Cloudflare often blocks raw.githubusercontent.com / github.com in certain
 * regions. The `ghProxy` parameter is a proxy prefix (e.g.
 * "https://ghproxy.com/") that is prepended to github URLs so rule-set
 * downloads succeed.
 */

function normalizeGhProxy(ghProxy?: string | null): string {
	if (!ghProxy) return "";
	let trimmed = ghProxy.trim();
	if (!trimmed) return "";
	if (!trimmed.endsWith("/")) {
		trimmed += "/";
	}
	return trimmed;
}

export function applyGithubProxy(url: string, ghProxy?: string | null): string {
	if (!ghProxy) return url;
	const proxy = normalizeGhProxy(ghProxy);
	return url
		.replace(
			/^https:\/\/(raw\.)?githubusercontent\.com\//,
			`${proxy}https://$1githubusercontent.com/`,
		)
		.replace(/^https:\/\/github\.com\//, `${proxy}https://github.com/`);
}
