import { RuleSetDefinition, GeoLabelContext } from './types';
import { LooseProxyNode, coerceProxyNodes } from '../proxy-node';

export const SINGBOX_SUPPORTED_TYPES = new Set(['hysteria2', 'vless', 'trojan', 'ss', 'vmess', 'tuic', 'anytls']);

export const INFORMATIONAL_NAME_PATTERNS = [
  /剩余流量/i,
  /距离下次重置/i,
  /套餐到期/i,
  /流量重置/i,
  /到期时间/i,
  /expire/i,
  /traffic/i,
];

export const COUNTRY_NAME_HINTS: Array<[string, string]> = [
  ['united states', 'US'], ['usa', 'US'], ['hong kong', 'HK'], ['taiwan', 'TW'], ['japan', 'JP'],
  ['singapore', 'SG'], ['korea', 'KR'], ['netherlands', 'NL'], ['deutschland', 'DE'], ['germany', 'DE'],
  ['france', 'FR'], ['italy', 'IT'], ['united kingdom', 'GB'], ['britain', 'GB'], ['england', 'GB'],
  ['canada', 'CA'], ['australia', 'AU'], ['russia', 'RU'], ['india', 'IN'], ['turkey', 'TR'],
  ['malaysia', 'MY'], ['thailand', 'TH'], ['vietnam', 'VN'], ['philippines', 'PH'], ['indonesia', 'ID'],
];

export const COUNTRY_CODE_HINTS: Array<[RegExp, string]> = [
  [/(^|[^A-Z])(US)(?:$|[^A-Z])/, 'US'], [/(^|[^A-Z])(JP)(?:$|[^A-Z])/, 'JP'], [/(^|[^A-Z])(TW)(?:$|[^A-Z])/, 'TW'],
  [/(^|[^A-Z])(SG)(?:$|[^A-Z])/, 'SG'], [/(^|[^A-Z])(HK)(?:$|[^A-Z])/, 'HK'], [/(^|[^A-Z])(KR)(?:$|[^A-Z])/, 'KR'],
  [/(^|[^A-Z])(UK)(?:$|[^A-Z])/, 'GB'], [/(^|[^A-Z])(GB)(?:$|[^A-Z])/, 'GB'], [/(^|[^A-Z])(DE)(?:$|[^A-Z])/, 'DE'],
  [/(^|[^A-Z])(FR)(?:$|[^A-Z])/, 'FR'], [/(^|[^A-Z])(IT)(?:$|[^A-Z])/, 'IT'], [/(^|[^A-Z])(NL)(?:$|[^A-Z])/, 'NL'],
];

export function applyGithubProxy(url: string, ghProxy?: string | null): string {
  if (!ghProxy) return url;
  return url
    .replace(/^https:\/\/(raw\.)?githubusercontent\.com\//, `${ghProxy}https://$1githubusercontent.com/`)
    .replace(/^https:\/\/github\.com\//, `${ghProxy}https://github.com/`);
}

export function buildRuleSetUrl(definition: RuleSetDefinition, ghProxy?: string | null): string {
  if (definition.url) return applyGithubProxy(definition.url, ghProxy);
  const remoteName = definition.remoteName || definition.tag;
  return applyGithubProxy(
    `https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/${definition.kind}/${remoteName}.srs`,
    ghProxy,
  );
}

export function createUniqueTag(base: string, used: Set<string>): string {
  let tag = base;
  let index = 2;
  while (used.has(tag)) {
    tag = `${base} (${index})`;
    index += 1;
  }
  used.add(tag);
  return tag;
}

export function isIpAddress(host: string): boolean {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return true;
  return /^[0-9a-f:]+$/i.test(host) && host.includes(':');
}

export function isReservedHostname(hostname: string): boolean {
  const value = hostname.toLowerCase();
  return value === 'localhost' || value.endsWith('.localhost') || value.endsWith('.local') || 
         value.endsWith('.lan') || value.endsWith('.example') || value.endsWith('.invalid') || value.endsWith('.test');
}

export function isReservedIpAddress(ip: string): boolean {
  const value = String(ip || '').trim().toLowerCase();
  if (!value) return false;
  if (value === '::1') return true;
  if (value.startsWith('fe80:') || value.startsWith('fc') || value.startsWith('fd')) return true;
  const ipv4Match = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) return false;
  const [a, b] = [Number(ipv4Match[1]), Number(ipv4Match[2])];
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 192 && b === 168) || 
         (a === 172 && b >= 16 && b <= 31) || (a === 100 && b >= 64 && b <= 127);
}

export function toFlagEmoji(countryCode?: string | null): string {
  const code = String(countryCode || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️';
  return String.fromCodePoint(0x1f1e6 + code.charCodeAt(0) - 65, 0x1f1e6 + code.charCodeAt(1) - 65);
}

export function extractCountryCodeFromFlag(name: string): string | null {
  const chars = Array.from(String(name || '').trim());
  for (let index = 0; index < chars.length - 1; index += 1) {
    const first = chars[index].codePointAt(0) || 0;
    const second = chars[index + 1].codePointAt(0) || 0;
    const isRegionalIndicator = (value: number) => value >= 0x1f1e6 && value <= 0x1f1ff;
    if (isRegionalIndicator(first) && isRegionalIndicator(second)) {
      return String.fromCharCode(65 + first - 0x1f1e6, 65 + second - 0x1f1e6);
    }
  }
  return null;
}

export function extractCountryCodeFromName(name: string): string | null {
  const rawName = String(name || '').trim();
  if (!rawName) return null;
  const fromFlag = extractCountryCodeFromFlag(rawName);
  if (fromFlag) return fromFlag;
  const normalized = rawName.toLowerCase();
  for (const [needle, countryCode] of COUNTRY_NAME_HINTS) {
    if (normalized.includes(needle)) return countryCode;
  }
  const upper = rawName.toUpperCase();
  for (const [pattern, countryCode] of COUNTRY_CODE_HINTS) {
    if (pattern.test(upper)) return countryCode;
  }
  return null;
}

export async function fetchJson(url: string, headers?: Record<string, string>): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; } finally { clearTimeout(timeout); }
}

export function getServerIp(server: string, context: GeoLabelContext): Promise<string | null> {
  const hostname = String(server || '').trim();
  if (!hostname || isIpAddress(hostname) || isReservedHostname(hostname)) return Promise.resolve(isIpAddress(hostname) ? hostname : null);
  const cacheKey = hostname.toLowerCase();
  const cached = context.ipCache.get(cacheKey);
  if (cached) return cached;
  const promise = (async () => {
    for (const type of ['A', 'AAAA']) {
      const query = new URL('https://cloudflare-dns.com/dns-query');
      query.searchParams.set('name', hostname);
      query.searchParams.set('type', type);
      const payload = await fetchJson(query.toString(), { Accept: 'application/dns-json' });
      const ip = (payload?.Answer || []).map((a: any) => String(a?.data || '').trim()).find((v: string) => v && isIpAddress(v));
      if (ip) return ip;
    }
    return null;
  })();
  context.ipCache.set(cacheKey, promise);
  return promise;
}

export function getCountryCode(ip: string, context: GeoLabelContext): Promise<string | null> {
  const cacheKey = String(ip || '').trim();
  if (!cacheKey) return Promise.resolve(null);
  const cached = context.countryCache.get(cacheKey);
  if (cached) return cached;
  const promise = (async () => {
    const providers = [
      async () => {
        const p = await fetchJson(`https://api.country.is/${encodeURIComponent(cacheKey)}`);
        const c = String(p?.country || '').trim().toUpperCase();
        return /^[A-Z]{2}$/.test(c) ? c : null;
      },
      async () => {
        const p = await fetchJson(`https://ipwho.is/${encodeURIComponent(cacheKey)}`);
        if (!p || p.success === false) return null;
        const c = String(p.country_code || '').trim().toUpperCase();
        return /^[A-Z]{2}$/.test(c) ? c : null;
      },
    ];
    for (const provider of providers) {
      const c = await provider();
      if (c) return c;
    }
    return null;
  })();
  context.countryCache.set(cacheKey, promise);
  return promise;
}

export async function getCountryCodeFromHost(host: string, context: GeoLabelContext): Promise<string | null> {
  const ip = await getServerIp(host, context);
  if (!ip || isReservedIpAddress(ip)) return null;
  return getCountryCode(ip, context);
}

export function extractHostCandidates(node: LooseProxyNode): string[] {
  const candidates = [node.server, node.sni, node.servername, node['ws-opts']?.headers?.Host, ...(Array.isArray(node['http-opts']?.host) ? node['http-opts'].host : [])];
  const pluginHost = node['plugin-opts']?.host || node.plugin_opts?.host;
  if (pluginHost) candidates.push(pluginHost);
  return Array.from(new Set(candidates.map((v) => String(v || '').trim()).filter(Boolean)));
}

export async function getProviderFallbackCountryCode(subscriptionUrl: string, context: GeoLabelContext): Promise<string | null> {
  try {
    const hostname = new URL(subscriptionUrl).hostname;
    if (!hostname || isReservedHostname(hostname)) return null;
    return await getCountryCodeFromHost(hostname, context);
  } catch { return null; }
}

export async function buildGeoNodeLabel(providerName: string, sequence: number, node: LooseProxyNode, fallbackCountryCode: string | null, context: GeoLabelContext): Promise<string> {
  const originalName = String(node.name || '').trim();
  let countryCode: string | null = extractCountryCodeFromName(originalName);
  if (!countryCode) {
    for (const host of extractHostCandidates(node)) {
      const ip = await getServerIp(host, context);
      if (ip && !isReservedIpAddress(ip)) {
        countryCode = await getCountryCode(ip, context);
        if (countryCode) break;
      }
    }
  }
  if (!countryCode) countryCode = fallbackCountryCode;
  const flag = toFlagEmoji(countryCode);
  return `${flag} ${providerName} ${String(sequence).padStart(2, '0')} (${originalName})`;
}

export function isInformationalNode(node: LooseProxyNode): boolean {
  const name = String(node.name || '').trim();
  return name ? INFORMATIONAL_NAME_PATTERNS.some((p) => p.test(name)) : false;
}

export function normalizeProxyList(nodes: LooseProxyNode[]): LooseProxyNode[] {
  return coerceProxyNodes(nodes).filter((n) => SINGBOX_SUPPORTED_TYPES.has(n.type) && !isInformationalNode(n) && n.type !== 'wireguard');
}
