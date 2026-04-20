import { LooseProxyNode, coerceProxyNodes } from './proxy-node';
import { ResolvedSubscription } from './subscription-parser';

const MAIN_SELECTOR_TAG = '🚀 节点选择';
const DOWNLOAD_SELECTOR_TAG = '📦 资源下载';
const SELF_HOSTED_GROUP_TAG = 'Self-Hosted';
const DIRECT_TAG = 'direct';
const BLOCK_TAG = 'block';
const LOCAL_DNS_TAG = 'local-dns';
const REMOTE_DNS_TAG = 'remote-dns';

const SINGBOX_SUPPORTED_TYPES = new Set(['hysteria2', 'vless', 'trojan', 'ss', 'vmess', 'tuic', 'anytls']);

type RuleSetKind = 'geosite' | 'geoip';

interface RuleSetDefinition {
  kind: RuleSetKind;
  tag: string;
  remoteName?: string;
  url?: string;
  format?: 'binary' | 'source';
}

interface RouteRuleDefinition {
  type?: 'logical';
  mode?: 'and' | 'or';
  rules?: any[];
  rule_set?: string | string[];
  domain_suffix?: string[];
  port?: number | number[];
  network?: string | string[];
  protocol?: string | string[];
  action: 'route' | 'reject' | 'sniff' | 'hijack-dns';
  outbound?: string;
}

interface GroupDefinition {
  tag: string;
  layout: 'default' | 'direct-first' | 'block-first' | 'direct-only' | 'main-direct' | 'direct-main';
}

interface BuildSingBoxOptions {
  secret: string;
  subscriptions: ResolvedSubscription[];
  customNodes: LooseProxyNode[];
  ghProxy?: string | null;
}

interface TaggedNode {
  tag: string;
  providerName: string;
  node: LooseProxyNode;
}

interface GeoLabelContext {
  ipCache: Map<string, Promise<string | null>>;
  countryCache: Map<string, Promise<string | null>>;
}

const INFORMATIONAL_NAME_PATTERNS = [
  /剩余流量/i,
  /距离下次重置/i,
  /套餐到期/i,
  /流量重置/i,
  /到期时间/i,
  /expire/i,
  /traffic/i,
];

const COUNTRY_NAME_HINTS: Array<[string, string]> = [
  ['united states', 'US'],
  ['usa', 'US'],
  ['hong kong', 'HK'],
  ['taiwan', 'TW'],
  ['japan', 'JP'],
  ['singapore', 'SG'],
  ['korea', 'KR'],
  ['netherlands', 'NL'],
  ['deutschland', 'DE'],
  ['germany', 'DE'],
  ['france', 'FR'],
  ['italy', 'IT'],
  ['united kingdom', 'GB'],
  ['britain', 'GB'],
  ['england', 'GB'],
  ['canada', 'CA'],
  ['australia', 'AU'],
  ['russia', 'RU'],
  ['india', 'IN'],
  ['turkey', 'TR'],
  ['malaysia', 'MY'],
  ['thailand', 'TH'],
  ['vietnam', 'VN'],
  ['philippines', 'PH'],
  ['indonesia', 'ID'],
];

const COUNTRY_CODE_HINTS: Array<[RegExp, string]> = [
  [/(^|[^A-Z])(US)(?:$|[^A-Z])/, 'US'],
  [/(^|[^A-Z])(JP)(?:$|[^A-Z])/, 'JP'],
  [/(^|[^A-Z])(TW)(?:$|[^A-Z])/, 'TW'],
  [/(^|[^A-Z])(SG)(?:$|[^A-Z])/, 'SG'],
  [/(^|[^A-Z])(HK)(?:$|[^A-Z])/, 'HK'],
  [/(^|[^A-Z])(KR)(?:$|[^A-Z])/, 'KR'],
  [/(^|[^A-Z])(UK)(?:$|[^A-Z])/, 'GB'],
  [/(^|[^A-Z])(GB)(?:$|[^A-Z])/, 'GB'],
  [/(^|[^A-Z])(DE)(?:$|[^A-Z])/, 'DE'],
  [/(^|[^A-Z])(FR)(?:$|[^A-Z])/, 'FR'],
  [/(^|[^A-Z])(IT)(?:$|[^A-Z])/, 'IT'],
  [/(^|[^A-Z])(NL)(?:$|[^A-Z])/, 'NL'],
];

const RULE_SET_DEFINITIONS: RuleSetDefinition[] = [
  { kind: 'geosite', tag: 'advertising', remoteName: 'category-ads-all' },
  {
    kind: 'geosite',
    tag: 'adblockfilters',
    url: 'https://raw.githubusercontent.com/217heidai/adblockfilters/main/rules/adblocksingbox.srs',
  },
  { kind: 'geosite', tag: 'geolocation-cn' },
  { kind: 'geosite', tag: 'geolocation-!cn' },
  { kind: 'geosite', tag: 'cn' },
  { kind: 'geoip', tag: 'cn-ip', remoteName: 'cn' },
  { kind: 'geosite', tag: 'private' },
  { kind: 'geoip', tag: 'private-ip', remoteName: 'private' },
  { kind: 'geosite', tag: 'category-antivirus' },
  { kind: 'geosite', tag: 'win-update' },
  { kind: 'geosite', tag: 'category-speedtest' },
  { kind: 'geosite', tag: 'category-ntp' },
  { kind: 'geosite', tag: 'category-ai-chat-!cn' },
  { kind: 'geosite', tag: 'xai' },
  { kind: 'geosite', tag: 'cursor' },
  { kind: 'geosite', tag: 'windsurf' },
  { kind: 'geosite', tag: 'trae' },
  { kind: 'geosite', tag: 'manus' },
  { kind: 'geosite', tag: 'jetbrains-ai' },
  { kind: 'geosite', tag: 'youtube' },
  { kind: 'geosite', tag: 'netflix' },
  { kind: 'geoip', tag: 'netflix-ip', remoteName: 'netflix' },
  { kind: 'geosite', tag: 'disney' },
  { kind: 'geosite', tag: 'hbo' },
  { kind: 'geosite', tag: 'hulu' },
  { kind: 'geosite', tag: 'primevideo' },
  { kind: 'geosite', tag: 'category-entertainment@!cn' },
  { kind: 'geosite', tag: 'apple' },
  { kind: 'geosite', tag: 'appletv', remoteName: 'apple-tvplus' },
  { kind: 'geosite', tag: 'google' },
  { kind: 'geoip', tag: 'google-ip', remoteName: 'google' },
  { kind: 'geosite', tag: 'microsoft' },
  { kind: 'geosite', tag: 'category-dev' },
  { kind: 'geosite', tag: 'category-container' },
  { kind: 'geosite', tag: 'microsoft-dev' },
  { kind: 'geosite', tag: 'jetbrains' },
  { kind: 'geosite', tag: 'gitlab' },
  { kind: 'geosite', tag: 'category-communication' },
  { kind: 'geosite', tag: 'category-voip' },
  { kind: 'geoip', tag: 'telegram-ip', remoteName: 'telegram' },
  { kind: 'geosite', tag: 'category-forums' },
  { kind: 'geosite', tag: 'category-social-media-!cn' },
  { kind: 'geoip', tag: 'twitter-ip', remoteName: 'twitter' },
  { kind: 'geosite', tag: 'category-games-!cn' },
  { kind: 'geosite', tag: 'category-game-platforms-download' },
  { kind: 'geosite', tag: 'category-scholar-!cn' },
  { kind: 'geosite', tag: 'category-remote-control' },
  { kind: 'geosite', tag: 'category-password-management' },
  { kind: 'geosite', tag: 'tutanota' },
  { kind: 'geosite', tag: 'category-cryptocurrency' },
  { kind: 'geosite', tag: 'paypal' },
  { kind: 'geosite', tag: 'category-finance' },
  { kind: 'geosite', tag: 'category-tech-media' },
  { kind: 'geosite', tag: 'category-news-ir' },
  { kind: 'geosite', tag: 'category-porn' },
  { kind: 'geosite', tag: 'category-public-tracker' },
  { kind: 'geosite', tag: 'category-pt' },
  { kind: 'geosite', tag: 'cloudflare' },
  { kind: 'geoip', tag: 'cloudflare-ip', remoteName: 'cloudflare' },
  { kind: 'geosite', tag: 'dropbox' },
  { kind: 'geosite', tag: 'mega' },
];

const ROUTE_RULES: RouteRuleDefinition[] = [
  { action: 'sniff' },
  {
    type: 'logical',
    mode: 'or',
    rules: [{ protocol: 'dns' }, { port: 53 }],
    action: 'hijack-dns',
  },
  { port: 22, action: 'route', outbound: DIRECT_TAG },
  { port: 11010, action: 'route', outbound: DIRECT_TAG },
  { rule_set: 'private-ip', action: 'route', outbound: '🏠 私有网络' },
  { rule_set: 'private', action: 'route', outbound: '🏠 私有网络' },
  { domain_suffix: ['et.net', 'ts.net'], action: 'route', outbound: DIRECT_TAG },
  { rule_set: 'advertising', action: 'route', outbound: '🛑 广告拦截' },
  { rule_set: 'adblockfilters', action: 'route', outbound: '🛑 广告拦截' },
  { rule_set: 'geolocation-cn', action: 'route', outbound: '🔒 国内服务' },
  { rule_set: 'cn', action: 'route', outbound: '🔒 国内服务' },
  { rule_set: 'cn-ip', action: 'route', outbound: '🔒 国内服务' },
  { rule_set: 'category-antivirus', action: 'route', outbound: '🔒 国内服务' },
  { rule_set: 'win-update', action: 'route', outbound: '🔒 国内服务' },
  { rule_set: 'category-speedtest', action: 'route', outbound: '🧪 测速专线' },
  { rule_set: 'category-ntp', action: 'route', outbound: '🕓 NTP 服务' },
  { rule_set: 'category-dev', action: 'route', outbound: '🐱 开发工具' },
  { rule_set: 'category-container', action: 'route', outbound: '🐱 开发工具' },
  { rule_set: 'microsoft-dev', action: 'route', outbound: '🐱 开发工具' },
  { rule_set: 'jetbrains', action: 'route', outbound: '🐱 开发工具' },
  { rule_set: 'gitlab', action: 'route', outbound: '🐱 开发工具' },
  { rule_set: 'google', action: 'route', outbound: '🔍 谷歌服务' },
  { rule_set: 'google-ip', action: 'route', outbound: '🔍 谷歌服务' },
  { rule_set: 'appletv', action: 'route', outbound: '🎬 苹果视频' },
  { rule_set: 'apple', action: 'route', outbound: '🍏 苹果服务' },
  { rule_set: 'microsoft', action: 'route', outbound: 'Ⓜ️ 微软服务' },
  { rule_set: 'category-ai-chat-!cn', action: 'route', outbound: '💬 AI 服务' },
  { rule_set: 'xai', action: 'route', outbound: '💬 AI 服务' },
  { rule_set: 'cursor', action: 'route', outbound: '💬 AI 服务' },
  { rule_set: 'windsurf', action: 'route', outbound: '💬 AI 服务' },
  { rule_set: 'trae', action: 'route', outbound: '💬 AI 服务' },
  { rule_set: 'manus', action: 'route', outbound: '💬 AI 服务' },
  { rule_set: 'jetbrains-ai', action: 'route', outbound: '💬 AI 服务' },
  { rule_set: 'category-communication', action: 'route', outbound: '📲 电报消息' },
  { rule_set: 'category-voip', action: 'route', outbound: '📲 电报消息' },
  { rule_set: 'telegram-ip', action: 'route', outbound: '📲 电报消息' },
  { rule_set: 'youtube', action: 'route', outbound: '📹 油管视频' },
  { rule_set: 'netflix', action: 'route', outbound: '🎬 流媒体' },
  { rule_set: 'netflix-ip', action: 'route', outbound: '🎬 流媒体' },
  { rule_set: 'disney', action: 'route', outbound: '🎬 流媒体' },
  { rule_set: 'hbo', action: 'route', outbound: '🎬 流媒体' },
  { rule_set: 'hulu', action: 'route', outbound: '🎬 流媒体' },
  { rule_set: 'primevideo', action: 'route', outbound: '🎬 流媒体' },
  { rule_set: 'category-entertainment@!cn', action: 'route', outbound: '🎬 流媒体' },
  { rule_set: 'category-forums', action: 'route', outbound: '🌐 社交媒体' },
  { rule_set: 'category-social-media-!cn', action: 'route', outbound: '🌐 社交媒体' },
  { rule_set: 'twitter-ip', action: 'route', outbound: '🌐 社交媒体' },
  { rule_set: 'category-game-platforms-download', action: 'route', outbound: '🎮 游戏下载' },
  { rule_set: 'category-games-!cn', action: 'route', outbound: '🎮 游戏平台' },
  { rule_set: 'category-scholar-!cn', action: 'route', outbound: '📚 教育资源' },
  { rule_set: 'category-remote-control', action: 'route', outbound: '🛠️ 生产力工具' },
  { rule_set: 'category-password-management', action: 'route', outbound: '🛠️ 生产力工具' },
  { rule_set: 'tutanota', action: 'route', outbound: '🛠️ 生产力工具' },
  { rule_set: 'category-cryptocurrency', action: 'route', outbound: '💰 金融服务' },
  { rule_set: 'paypal', action: 'route', outbound: '💰 金融服务' },
  { rule_set: 'category-finance', action: 'route', outbound: '💰 金融服务' },
  { rule_set: 'category-tech-media', action: 'route', outbound: '📰 新闻资讯' },
  { rule_set: 'category-news-ir', action: 'route', outbound: '📰 新闻资讯' },
  { rule_set: 'category-porn', action: 'route', outbound: '🔞 成人内容' },
  { rule_set: 'category-public-tracker', action: 'route', outbound: '🧲 BT/PT' },
  { rule_set: 'category-pt', action: 'route', outbound: '🧲 BT/PT' },
  { rule_set: 'cloudflare', action: 'route', outbound: '☁️ 云服务' },
  { rule_set: 'cloudflare-ip', action: 'route', outbound: '☁️ 云服务' },
  { rule_set: 'dropbox', action: 'route', outbound: '☁️ 云服务' },
  { rule_set: 'mega', action: 'route', outbound: '☁️ 云服务' },
  { rule_set: 'geolocation-!cn', action: 'route', outbound: '🌐 非中国' },
];

const GROUP_DEFINITIONS: GroupDefinition[] = [
  { tag: '🛑 广告拦截', layout: 'block-first' },
  { tag: '💬 AI 服务', layout: 'default' },
  { tag: '📹 油管视频', layout: 'default' },
  { tag: '🔍 谷歌服务', layout: 'default' },
  { tag: '🏠 私有网络', layout: 'direct-first' },
  { tag: '🔒 国内服务', layout: 'direct-first' },
  { tag: '📲 电报消息', layout: 'default' },
  { tag: '🐱 开发工具', layout: 'default' },
  { tag: 'Ⓜ️ 微软服务', layout: 'default' },
  { tag: '🍏 苹果服务', layout: 'default' },
  { tag: '🎬 苹果视频', layout: 'direct-first' },
  { tag: '🌐 社交媒体', layout: 'default' },
  { tag: '🎬 流媒体', layout: 'default' },
  { tag: '🎮 游戏平台', layout: 'default' },
  { tag: '🎮 游戏下载', layout: 'direct-first' },
  { tag: '📚 教育资源', layout: 'default' },
  { tag: '🛠️ 生产力工具', layout: 'default' },
  { tag: '💰 金融服务', layout: 'default' },
  { tag: '📰 新闻资讯', layout: 'default' },
  { tag: '🔞 成人内容', layout: 'default' },
  { tag: '🧲 BT/PT', layout: 'direct-first' },
  { tag: '☁️ 云服务', layout: 'default' },
  { tag: '🌐 非中国', layout: 'default' },
  { tag: '🐟 漏网之鱼', layout: 'default' },
  { tag: '🧪 测速专线', layout: 'main-direct' },
  { tag: '🕓 NTP 服务', layout: 'direct-main' },
];

function applyGithubProxy(url: string, ghProxy?: string | null): string {
  if (!ghProxy) return url;
  return url
    .replace(/^https:\/\/(raw\.)?githubusercontent\.com\//, `${ghProxy}https://$1githubusercontent.com/`)
    .replace(/^https:\/\/github\.com\//, `${ghProxy}https://github.com/`);
}

function buildRuleSetUrl(definition: RuleSetDefinition, ghProxy?: string | null): string {
  if (definition.url) return applyGithubProxy(definition.url, ghProxy);
  const remoteName = definition.remoteName || definition.tag;
  return applyGithubProxy(
    `https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/${definition.kind}/${remoteName}.srs`,
    ghProxy,
  );
}

function createUniqueTag(base: string, used: Set<string>): string {
  let tag = base;
  let index = 2;
  while (used.has(tag)) {
    tag = `${base} (${index})`;
    index += 1;
  }
  used.add(tag);
  return tag;
}

function isReservedHostname(hostname: string): boolean {
  const value = hostname.toLowerCase();
  return (
    value === 'localhost' ||
    value.endsWith('.localhost') ||
    value.endsWith('.local') ||
    value.endsWith('.lan') ||
    value.endsWith('.example') ||
    value.endsWith('.example.com') ||
    value.endsWith('.example.net') ||
    value.endsWith('.example.org') ||
    value.endsWith('.invalid') ||
    value.endsWith('.test')
  );
}

function isIpAddress(host: string): boolean {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return true;
  return /^[0-9a-f:]+$/i.test(host) && host.includes(':');
}

function isReservedIpAddress(ip: string): boolean {
  const value = String(ip || '').trim().toLowerCase();
  if (!value) return false;
  if (value === '::1') return true;
  if (value.startsWith('fe80:') || value.startsWith('fc') || value.startsWith('fd')) return true;

  const ipv4Match = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) return false;

  const [a, b] = [Number(ipv4Match[1]), Number(ipv4Match[2])];
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function toFlagEmoji(countryCode?: string | null): string {
  const code = String(countryCode || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️';
  return String.fromCodePoint(
    0x1f1e6 + code.charCodeAt(0) - 65,
    0x1f1e6 + code.charCodeAt(1) - 65,
  );
}

function extractCountryCodeFromFlag(name: string): string | null {
  const chars = Array.from(String(name || '').trim());
  for (let index = 0; index < chars.length - 1; index += 1) {
    const first = chars[index].codePointAt(0) || 0;
    const second = chars[index + 1].codePointAt(0) || 0;
    const isRegionalIndicator = (value: number) => value >= 0x1f1e6 && value <= 0x1f1ff;
    if (isRegionalIndicator(first) && isRegionalIndicator(second)) {
      return String.fromCharCode(
        65 + first - 0x1f1e6,
        65 + second - 0x1f1e6,
      );
    }
  }
  return null;
}

function extractCountryCodeFromName(name: string): string | null {
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

async function fetchJson(url: string, headers?: Record<string, string>): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getServerIp(server: string, context: GeoLabelContext): Promise<string | null> {
  const hostname = String(server || '').trim();
  if (!hostname) return Promise.resolve(null);
  if (isIpAddress(hostname)) return Promise.resolve(hostname);
  if (isReservedHostname(hostname)) return Promise.resolve(null);

  const cacheKey = hostname.toLowerCase();
  const cached = context.ipCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const recordTypes = ['A', 'AAAA'];
    for (const type of recordTypes) {
      const query = new URL('https://cloudflare-dns.com/dns-query');
      query.searchParams.set('name', hostname);
      query.searchParams.set('type', type);
      const payload = await fetchJson(query.toString(), {
        Accept: 'application/dns-json',
      });
      const answers = Array.isArray(payload?.Answer) ? payload.Answer : [];
      const ip = answers
        .map((answer: any) => String(answer?.data || '').trim())
        .find((value: string) => Boolean(value) && isIpAddress(value));
      if (ip) return ip;
    }
    return null;
  })();

  context.ipCache.set(cacheKey, promise);
  return promise;
}

function getCountryCode(ip: string, context: GeoLabelContext): Promise<string | null> {
  const cacheKey = String(ip || '').trim();
  if (!cacheKey) return Promise.resolve(null);

  const cached = context.countryCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const providers = [
      async () => {
        const payload = await fetchJson(`https://api.country.is/${encodeURIComponent(cacheKey)}`);
        const countryCode = String(payload?.country || '').trim().toUpperCase();
        return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null;
      },
      async () => {
        const payload = await fetchJson(`https://ipwho.is/${encodeURIComponent(cacheKey)}`);
        if (!payload || payload.success === false) return null;
        const countryCode = String(payload.country_code || '').trim().toUpperCase();
        return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null;
      },
    ];

    for (const provider of providers) {
      const countryCode = await provider();
      if (countryCode) return countryCode;
    }

    return null;
  })();

  context.countryCache.set(cacheKey, promise);
  return promise;
}

async function getCountryCodeFromHost(host: string, context: GeoLabelContext): Promise<string | null> {
  const ip = await getServerIp(host, context);
  if (!ip || isReservedIpAddress(ip)) return null;
  return getCountryCode(ip, context);
}

function extractHostCandidates(node: LooseProxyNode): string[] {
  const candidates = [
    node.server,
    node.sni,
    node.servername,
    node['ws-opts']?.headers?.Host,
    ...(Array.isArray(node['http-opts']?.host) ? node['http-opts'].host : []),
  ];

  const pluginHost = node['plugin-opts']?.host || node.plugin_opts?.host;
  if (pluginHost) candidates.push(pluginHost);

  return Array.from(new Set(candidates.map((value) => String(value || '').trim()).filter(Boolean)));
}

async function getProviderFallbackCountryCode(subscriptionUrl: string, context: GeoLabelContext): Promise<string | null> {
  try {
    const hostname = new URL(subscriptionUrl).hostname;
    if (!hostname || isReservedHostname(hostname)) return null;
    return await getCountryCodeFromHost(hostname, context);
  } catch {
    return null;
  }
}

async function buildGeoNodeLabel(
  providerName: string,
  sequence: number,
  node: LooseProxyNode,
  fallbackCountryCode: string | null,
  context: GeoLabelContext,
): Promise<string> {
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
  const sequenceStr = String(sequence).padStart(2, '0');
  return `${flag} ${providerName} ${sequenceStr} (${originalName})`;
}

function isInformationalNode(node: LooseProxyNode): boolean {
  const name = String(node.name || '').trim();
  if (!name) return false;
  return INFORMATIONAL_NAME_PATTERNS.some((pattern) => pattern.test(name));
}

function normalizeProxyList(nodes: LooseProxyNode[]): LooseProxyNode[] {
  return coerceProxyNodes(nodes)
    .filter((node) => SINGBOX_SUPPORTED_TYPES.has(node.type))
    .filter((node) => !isInformationalNode(node))
    .filter((node) => node.type !== 'wireguard');
}

function buildTls(node: LooseProxyNode): Record<string, any> | undefined {
  const enabled =
    node.tls === true ||
    node.security === 'tls' ||
    node.security === 'reality' ||
    Boolean(node.sni) ||
    Boolean(node.servername) ||
    Boolean(node.alpn);

  if (!enabled) return undefined;

  const tls: Record<string, any> = {
    enabled: true,
  };

  if (node['disable-sni']) tls.disable_sni = true;
  if (node.sni || node.servername) tls.server_name = node.sni || node.servername;
  if (node['skip-cert-verify']) tls.insecure = true;
  if (Array.isArray(node.alpn) && node.alpn.length > 0) tls.alpn = node.alpn;

  const publicKey = node['public-key'] || node['reality-opts']?.['public-key'];
  const shortId = node['short-id'] || node['reality-opts']?.['short-id'];
  const fingerprint =
    node.utls?.fingerprint ||
    node['client-fingerprint'] ||
    node.client_fingerprint ||
    node.fingerprint ||
    node.fp;

  if (node.utls?.enabled === true || fingerprint) {
    tls.utls = {
      enabled: true,
      ...(fingerprint ? { fingerprint: String(fingerprint) } : {}),
    };
  }

  if (publicKey || shortId) {
    tls.reality = {
      enabled: true,
      public_key: publicKey || '',
      short_id: shortId || '',
    };
    if (!tls.utls) {
      tls.utls = {
        enabled: true,
      };
    }
  }

  return tls;
}

function buildTransport(node: LooseProxyNode): Record<string, any> | undefined {
  if (node.network === 'ws') {
    const headers = node['ws-opts']?.headers || {};
    return {
      type: 'ws',
      path: node['ws-opts']?.path || '/',
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    };
  }

  if (node.network === 'grpc') {
    return {
      type: 'grpc',
      service_name: node['grpc-opts']?.serviceName || '',
    };
  }

  if (node.network === 'http') {
    return {
      type: 'http',
      path: node['http-opts']?.path || '/',
      ...(Array.isArray(node['http-opts']?.host) ? { host: node['http-opts'].host } : {}),
    };
  }

  return undefined;
}

function normalizeShadowsocksPluginName(plugin: unknown): string | undefined {
  const value = String(plugin || '').trim();
  if (!value) return undefined;
  if (value === 'obfs' || value === 'simple-obfs') return 'obfs-local';
  if (value === 'v2ray') return 'v2ray-plugin';
  return value;
}

function serializePluginOptionValue(value: unknown): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const items = value.map((item) => serializePluginOptionValue(item)).filter((item): item is string => Boolean(item));
    return items.length > 0 ? items.join(',') : null;
  }
  if (typeof value === 'object') return null;
  return String(value);
}

function buildShadowsocksPluginOpts(plugin: string | undefined, rawPluginOpts: unknown): string | undefined {
  if (typeof rawPluginOpts === 'string') {
    const value = rawPluginOpts.trim();
    return value || undefined;
  }

  if (!rawPluginOpts || typeof rawPluginOpts !== 'object' || Array.isArray(rawPluginOpts)) {
    const value = serializePluginOptionValue(rawPluginOpts);
    return value || undefined;
  }

  const pluginOpts = rawPluginOpts as Record<string, unknown>;

  if (plugin === 'obfs-local') {
    const parts: string[] = [];
    const obfsMode = serializePluginOptionValue(pluginOpts.mode ?? pluginOpts.obfs);
    const obfsHost = serializePluginOptionValue(pluginOpts.host ?? pluginOpts['obfs-host']);
    const obfsUri = serializePluginOptionValue(pluginOpts.uri ?? pluginOpts['obfs-uri']);

    if (obfsMode) parts.push(`obfs=${obfsMode}`);
    if (obfsHost) parts.push(`obfs-host=${obfsHost}`);
    if (obfsUri) parts.push(`obfs-uri=${obfsUri}`);

    if (parts.length > 0) return parts.join(';');
  }

  const parts = Object.entries(pluginOpts)
    .map(([key, value]) => {
      const serialized = serializePluginOptionValue(value);
      if (!serialized) return null;
      return `${key}=${serialized}`;
    })
    .filter((item): item is string => Boolean(item));

  return parts.length > 0 ? parts.join(';') : undefined;
}

function toSingBoxOutbound(node: LooseProxyNode, tag: string): Record<string, any> | null {
  const server = String(node.server);
  const serverPort = typeof node.port === 'number' ? node.port : parseInt(String(node.port), 10);

  if (!Number.isFinite(serverPort)) return null;

  if (node.type === 'hysteria2') {
    const outbound: Record<string, any> = {
      type: 'hysteria2',
      tag,
      server,
      server_port: serverPort,
      password: node.password,
      tls: buildTls(node) || { enabled: true },
    };

    if (node.ports) outbound.server_ports = [String(node.ports)];
    if (node.obfs) outbound.obfs = { type: node.obfs, password: node['obfs-password'] || '' };
    return outbound;
  }

  if (node.type === 'vless') {
    const outbound: Record<string, any> = {
      type: 'vless',
      tag,
      server,
      server_port: serverPort,
      uuid: node.uuid,
    };

    if (node.flow) outbound.flow = node.flow;
    const tls = buildTls(node);
    if (tls) outbound.tls = tls;
    const transport = buildTransport(node);
    if (transport) outbound.transport = transport;
    return outbound;
  }

  if (node.type === 'vmess') {
    const outbound: Record<string, any> = {
      type: 'vmess',
      tag,
      server,
      server_port: serverPort,
      uuid: node.uuid,
      security: node.cipher || 'auto',
      alter_id: Number(node.alterId || 0),
    };

    const tls = buildTls(node);
    if (tls) outbound.tls = tls;
    const transport = buildTransport(node);
    if (transport) outbound.transport = transport;
    return outbound;
  }

  if (node.type === 'trojan') {
    const outbound: Record<string, any> = {
      type: 'trojan',
      tag,
      server,
      server_port: serverPort,
      password: node.password,
      tls: buildTls(node) || { enabled: true },
    };

    const transport = buildTransport(node);
    if (transport) outbound.transport = transport;
    return outbound;
  }

  if (node.type === 'ss') {
    const outbound: Record<string, any> = {
      type: 'shadowsocks',
      tag,
      server,
      server_port: serverPort,
      method: node.cipher,
      password: node.password,
    };

    const plugin = normalizeShadowsocksPluginName(node.plugin);
    const pluginOpts = buildShadowsocksPluginOpts(plugin, node['plugin-opts'] ?? node.plugin_opts);
    if (plugin) outbound.plugin = plugin;
    if (pluginOpts) outbound.plugin_opts = pluginOpts;
    return outbound;
  }

  if (node.type === 'tuic') {
    return {
      type: 'tuic',
      tag,
      server,
      server_port: serverPort,
      uuid: node.uuid,
      password: node.password,
      congestion_control: node['congestion-controller'] || 'cubic',
      udp_relay_mode: node['udp-relay-mode'] || 'native',
      tls: buildTls(node) || { enabled: true },
    };
  }

  if (node.type === 'anytls') {
    const outbound: Record<string, any> = {
      type: 'anytls',
      tag,
      server,
      server_port: serverPort,
      password: node.password,
      tls: buildTls(node) || { enabled: true },
    };

    if (node.idle_session_check_interval) outbound.idle_session_check_interval = node.idle_session_check_interval;
    if (node.idle_session_timeout) outbound.idle_session_timeout = node.idle_session_timeout;
    if (node.min_idle_session != null) outbound.min_idle_session = node.min_idle_session;
    return outbound;
  }

  return null;
}

async function buildTaggedNodes(
  subscriptions: ResolvedSubscription[],
  customNodes: LooseProxyNode[],
): Promise<{
  taggedNodes: TaggedNode[];
  providerSelectors: { providerName: string; selectTag: string; autoTag: string; nodeTags: string[] }[];
  selfHostedNodeTags: string[];
}> {
  const usedTags = new Set<string>([
    MAIN_SELECTOR_TAG,
    DOWNLOAD_SELECTOR_TAG,
    SELF_HOSTED_GROUP_TAG,
    DIRECT_TAG,
    BLOCK_TAG,
    LOCAL_DNS_TAG,
    REMOTE_DNS_TAG,
    ...GROUP_DEFINITIONS.map((group) => group.tag),
  ]);

  const taggedNodes: TaggedNode[] = [];
  const providerSelectors: { providerName: string; selectTag: string; autoTag: string; nodeTags: string[] }[] = [];
  const geoLabelContext: GeoLabelContext = {
    ipCache: new Map(),
    countryCache: new Map(),
  };

  for (const sub of subscriptions) {
    const nodes = normalizeProxyList(sub.nodes);
    if (nodes.length === 0) continue;

    const selectTag = createUniqueTag(`📡 ${sub.name}`, usedTags);
    const autoTag = createUniqueTag(`⚡ ${sub.name} 自动选择`, usedTags);
    const fallbackCountryCode = await getProviderFallbackCountryCode(sub.url, geoLabelContext);
    const baseLabels = await Promise.all(
      nodes.map((node, index) => {
        if (node.__subscriptionAlert) return Promise.resolve(String(node.name));
        return buildGeoNodeLabel(sub.name, index + 1, node, fallbackCountryCode, geoLabelContext);
      }),
    );
    const nodeTags = nodes.map((node, index) => {
      const tag = createUniqueTag(baseLabels[index], usedTags);
      taggedNodes.push({ tag, providerName: sub.name, node });
      return tag;
    });

    providerSelectors.push({
      providerName: sub.name,
      selectTag,
      autoTag,
      nodeTags,
    });
  }

  const normalizedCustomNodes = normalizeProxyList(customNodes);
  const selfHostedNodeTags = normalizedCustomNodes.map((node) => {
    const tag = createUniqueTag(String(node.name), usedTags);
    taggedNodes.push({ tag, providerName: SELF_HOSTED_GROUP_TAG, node });
    return tag;
  });

  return {
    taggedNodes,
    providerSelectors,
    selfHostedNodeTags,
  };
}

function buildGroupChoices(
  providerSelectors: { selectTag: string; autoTag: string }[],
  selfHostedEnabled: boolean,
): {
  mainChoices: string[];
  proxyChoices: string[];
  downloadChoices: string[];
} {
  const autoTags = providerSelectors.map((provider) => provider.autoTag);
  const selectTags = providerSelectors.map((provider) => provider.selectTag);
  const selfHostedTags = selfHostedEnabled ? [SELF_HOSTED_GROUP_TAG] : [];

  return {
    mainChoices: [DOWNLOAD_SELECTOR_TAG, DIRECT_TAG, BLOCK_TAG, ...autoTags, ...selectTags, ...selfHostedTags],
    proxyChoices: [MAIN_SELECTOR_TAG, DIRECT_TAG, BLOCK_TAG, ...autoTags, ...selectTags, ...selfHostedTags],
    downloadChoices: [...autoTags, ...selectTags, ...selfHostedTags, DIRECT_TAG],
  };
}

function buildSelector(tag: string, outbounds: string[], defaultTag?: string): Record<string, any> {
  const uniqueOutbounds = Array.from(new Set(outbounds.filter(Boolean)));
  const selector: Record<string, any> = {
    type: 'selector',
    tag,
    outbounds: uniqueOutbounds,
  };

  if (defaultTag && uniqueOutbounds.includes(defaultTag)) selector.default = defaultTag;
  return selector;
}

function buildUrlTest(tag: string, outbounds: string[]): Record<string, any> {
  return {
    type: 'urltest',
    tag,
    outbounds,
    url: 'https://www.gstatic.com/generate_204',
    interval: '5m',
    tolerance: 50,
    idle_timeout: '30m',
  };
}

function buildGroupOutbounds(layout: GroupDefinition['layout'], proxyChoices: string[]): string[] {
  if (layout === 'direct-only') return [DIRECT_TAG, MAIN_SELECTOR_TAG];
  if (layout === 'direct-main') return [DIRECT_TAG, MAIN_SELECTOR_TAG];
  if (layout === 'main-direct') return [MAIN_SELECTOR_TAG, DIRECT_TAG, ...proxyChoices.filter((tag) => ![MAIN_SELECTOR_TAG, DIRECT_TAG, BLOCK_TAG].includes(tag))];
  if (layout === 'direct-first') return [DIRECT_TAG, BLOCK_TAG, ...proxyChoices];
  if (layout === 'block-first') return [BLOCK_TAG, DIRECT_TAG, ...proxyChoices];
  return proxyChoices;
}

function buildOutbounds(
  taggedNodes: TaggedNode[],
  providerSelectors: { selectTag: string; autoTag: string; nodeTags: string[] }[],
  selfHostedNodeTags: string[],
): Record<string, any>[] {
  const outbounds: Record<string, any>[] = [
    { type: 'direct', tag: DIRECT_TAG },
    { type: 'block', tag: BLOCK_TAG },
  ];

  for (const taggedNode of taggedNodes) {
    const outbound = toSingBoxOutbound(taggedNode.node, taggedNode.tag);
    if (outbound) outbounds.push(outbound);
  }

  const { mainChoices, proxyChoices, downloadChoices } = buildGroupChoices(
    providerSelectors,
    selfHostedNodeTags.length > 0,
  );
  const downloadDefault = downloadChoices.find((tag) => tag !== DIRECT_TAG) || DIRECT_TAG;

  outbounds.push(buildSelector(DOWNLOAD_SELECTOR_TAG, downloadChoices, downloadDefault));

  if (selfHostedNodeTags.length > 0) {
    outbounds.push(buildSelector(SELF_HOSTED_GROUP_TAG, selfHostedNodeTags, selfHostedNodeTags[0]));
  }

  for (const provider of providerSelectors) {
    outbounds.push(buildSelector(provider.selectTag, provider.nodeTags, provider.nodeTags[0]));
    outbounds.push(buildUrlTest(provider.autoTag, provider.nodeTags));
  }

  outbounds.push(buildSelector(MAIN_SELECTOR_TAG, mainChoices, DOWNLOAD_SELECTOR_TAG));

  for (const group of GROUP_DEFINITIONS) {
    const groupOutbounds = buildGroupOutbounds(group.layout, proxyChoices);
    const defaultTag =
      group.layout === 'block-first'
        ? BLOCK_TAG
        : group.layout === 'direct-first' || group.layout === 'direct-only' || group.layout === 'direct-main'
          ? DIRECT_TAG
          : MAIN_SELECTOR_TAG;
    outbounds.push(buildSelector(group.tag, groupOutbounds, defaultTag));
  }

  return outbounds;
}

function buildDns(): Record<string, any> {
  return {
    servers: [
      {
        type: 'udp',
        tag: LOCAL_DNS_TAG,
        server: '223.5.5.5',
      },
      {
        type: 'tls',
        tag: REMOTE_DNS_TAG,
        server: '1.1.1.1',
      },
    ],
    rules: [
      {
        rule_set: ['private', 'geolocation-cn', 'cn'],
        action: 'route',
        server: LOCAL_DNS_TAG,
      },
      {
        rule_set: [
          'category-ai-chat-!cn',
          'geolocation-!cn',
          'category-dev',
          'category-container',
          'microsoft-dev',
          'jetbrains',
          'gitlab',
        ],
        action: 'route',
        server: REMOTE_DNS_TAG,
      },
    ],
    final: REMOTE_DNS_TAG,
    strategy: 'prefer_ipv4',
    reverse_mapping: true,
  };
}

function buildRoute(ruleSets: Record<string, any>[]): Record<string, any> {
  return {
    rules: ROUTE_RULES,
    rule_set: ruleSets,
    final: '🐟 漏网之鱼',
    default_domain_resolver: LOCAL_DNS_TAG,
    auto_detect_interface: true,
  };
}

export async function buildSingBoxConfig(options: BuildSingBoxOptions): Promise<string> {
  const { secret, subscriptions, customNodes, ghProxy } = options;
  const { taggedNodes, providerSelectors, selfHostedNodeTags } = await buildTaggedNodes(subscriptions, customNodes);

  if (taggedNodes.length === 0) {
    throw new Error('No supported sing-box nodes were produced from the provided subscriptions or proxies.');
  }

  const ruleSets = RULE_SET_DEFINITIONS.map((definition) => ({
    type: 'remote',
    tag: definition.tag,
    format: definition.format || 'binary',
    url: buildRuleSetUrl(definition, ghProxy),
    download_detour: DOWNLOAD_SELECTOR_TAG,
    update_interval: '1d',
  }));

  const config = {
    log: {
      level: 'info',
    },
    dns: buildDns(),
    inbounds: [
      {
        type: 'mixed',
        tag: 'mixed-in',
        listen: '0.0.0.0',
        listen_port: 7897,
        set_system_proxy: false,
      },
      {
        type: 'tun',
        tag: 'tun-in',
        address: ['172.19.0.1/30', 'fdfe:dcba:9876::1/126'],
        auto_route: true,
        strict_route: true,
        stack: 'mixed',
      },
    ],
    outbounds: buildOutbounds(taggedNodes, providerSelectors, selfHostedNodeTags),
    route: buildRoute(ruleSets),
    experimental: {
      cache_file: {
        enabled: true,
        store_rdrc: true,
      },
      clash_api: {
        external_controller: '0.0.0.0:9090',
        external_ui_download_url: applyGithubProxy(
          'https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip',
          ghProxy,
        ),
        secret,
        default_mode: 'Rule',
        access_control_allow_origin: ['http://127.0.0.1', 'http://yacd.haishan.me'],
        access_control_allow_private_network: true,
      },
    },
  };

  return JSON.stringify(config, null, 2);
}
