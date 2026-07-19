export interface Subscription {
	id: number;
	name: string;
	url: string;
}

const SAFE_NAME_PATTERN = /^[a-zA-Z0-9_\u4e00-\u9fa5]*$/;
const HTTP_URL_PATTERN = /^https?:\/\/.+/;

export interface SubscriptionAnalysis {
	activeCount: number;
	allNamesSafe: boolean;
	allUrlsValid: boolean;
	duplicateNames: Set<string>;
}

export function isSafeSubscriptionName(name: string): boolean {
	return SAFE_NAME_PATTERN.test(name);
}

export function isValidSubscriptionUrl(url: string): boolean {
	return url === "" || HTTP_URL_PATTERN.test(url);
}

export function analyzeSubscriptions(subscriptions: Subscription[]): SubscriptionAnalysis {
	const nameCounts = new Map<string, number>();
	let activeCount = 0;
	let allNamesSafe = true;
	let allUrlsValid = true;

	for (const subscription of subscriptions) {
		const name = subscription.name.trim();
		const url = subscription.url.trim();

		// If the row is completely empty, it is ignored
		if (!(name || url)) continue;

		if (name) nameCounts.set(name, (nameCounts.get(name) || 0) + 1);

		if (!(name && isSafeSubscriptionName(name))) {
			allNamesSafe = false;
		}
		if (!(url && isValidSubscriptionUrl(url))) {
			allUrlsValid = false;
		}

		if (name && url && isSafeSubscriptionName(name) && isValidSubscriptionUrl(url)) {
			activeCount += 1;
		}
	}

	const duplicateNames = new Set<string>();
	for (const [name, count] of nameCounts) {
		if (count > 1) duplicateNames.add(name);
	}

	return { activeCount, allNamesSafe, allUrlsValid, duplicateNames };
}

export function countNonEmptyLines(input: string): number {
	let count = 0;
	for (const line of input.split(/\r?\n/)) {
		if (line.trim()) count += 1;
	}
	return count;
}

export function normalizeNonEmptyLines(input: string): string {
	const lines: string[] = [];
	for (const line of input.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (trimmed) lines.push(trimmed);
	}
	return lines.join("\n");
}

export interface ProxiesValidationResult {
	isValid: boolean;
	errors: string[];
}

export function validateProxiesText(text: string, lang: "zh" | "en"): ProxiesValidationResult {
	const errors: string[] = [];
	const trimmed = text.trim();
	if (!trimmed) {
		return { isValid: true, errors };
	}

	const lines = trimmed.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;
		const trimmedLine = line.trim();
		if (!trimmedLine) continue;

		if (/https?:\/\//i.test(line)) {
			if (lang === "zh") {
				errors.push(
					`第 ${i + 1} 行包含 http:// 或 https:// 协议链接。自建节点输入框不能填写 HTTP/HTTPS 订阅链接，请将其移至下方的「远程订阅提供商」中。`,
				);
			} else {
				errors.push(
					`Line ${i + 1} contains http:// or https:// protocols. Raw Proxies input cannot contain HTTP/HTTPS subscription URLs. Please move it to "Remote Providers" below.`,
				);
			}
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
