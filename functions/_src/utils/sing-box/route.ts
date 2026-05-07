import { GEODATA_URLS, GEODATA_URLS_LITE } from '../../../_templates/shared/geox';
import { RULE_SET_DEFINITIONS, ROUTE_RULES } from './definitions';
import { DIRECT_TAG } from './types';
import { buildRuleSetUrl } from './utils';

export function buildRoute(ruleSets: Record<string, unknown>[], isWhite = false, isBlack = false, ghProxy?: string | null, isDual = false): Record<string, unknown> {
  const selectedGeoUrls = (isWhite || isBlack) ? GEODATA_URLS_LITE : GEODATA_URLS;
  const allowedWhite = new Set(['advertising', 'adblockfilters', 'private-ip', 'private', 'geolocation-cn', 'cn', 'cn-ip', 'apple-cn', 'google-cn', 'microsoft@cn', 'steam@cn', 'onedrive', 'category-ai-cn', 'category-netdisk-cn', 'category-ecommerce@cn', 'category-collaborate-cn', 'category-scholar-cn', 'category-bank-cn', 'category-games@cn']);
  const allowedBlack = new Set(['advertising', 'adblockfilters', 'private-ip', 'private', 'google', 'google-ip', 'telegram', 'telegram-ip', 'youtube', 'netflix', 'netflix-ip', 'disney', 'category-ai-chat-!cn', 'openai', 'anthropic', 'google-gemini', 'perplexity', 'deepseek', 'category-dev', 'github', 'docker', 'category-social-media-!cn', 'twitter', 'twitter-ip', 'category-games-!cn', 'category-game-platforms-download', 'category-scholar-!cn', 'category-remote-control', 'category-password-management', 'category-entertainment@!cn', 'geolocation-!cn']);
  const allowedDual = new Set(['advertising', 'adblockfilters', 'private-ip', 'private', 'geolocation-cn', 'cn', 'cn-ip', 'geolocation-!cn', 'google', 'youtube', 'telegram', 'category-ai-chat-!cn', 'category-ecommerce', 'category-social-media-!cn', 'category-entertainment@!cn', 'category-games-!cn']);

  const filteredDefinitions = RULE_SET_DEFINITIONS.filter((d) => 
    isDual ? allowedDual.has(d.tag) : isWhite ? allowedWhite.has(d.tag) : isBlack ? allowedBlack.has(d.tag) : true
  );

  const remoteRuleSets = filteredDefinitions.map((d) => {
    const remote: Record<string, unknown> = { type: 'remote', tag: d.tag, format: d.format || 'binary', url: buildRuleSetUrl(d, ghProxy), download_detour: '🚀 节点选择' };
    if (d.tag === 'adblockfilters') {
      delete remote.download_detour;
    } else {
      const geoUrlMap: Record<string, string> = { geosite: selectedGeoUrls.geosite, geoip: selectedGeoUrls.geoip };
      const baseUrl = geoUrlMap[d.kind];
      // Only replace if baseUrl looks like a directory prefix (doesn't end in .dat or .mmdb)
      if (baseUrl && !baseUrl.endsWith('.dat') && !baseUrl.endsWith('.mmdb')) {
        (remote as any).url = (remote as any).url.replace(/https:\/\/raw\.githubusercontent\.com\/MetaCubeX\/meta-rules-dat\/sing\/geo\/(geosite|geoip)\/.*\.srs/, `${baseUrl}/$1/${d.remoteName || d.tag}.srs`);
      }
    }
    return remote;
  });

  let activeRules = ROUTE_RULES;
  if (isWhite) {
    activeRules = ROUTE_RULES.filter((r) => !r.rule_set || (typeof r.rule_set === 'string' ? allowedWhite.has(r.rule_set) : r.rule_set.some((s) => allowedWhite.has(s))));
  } else if (isBlack) {
    activeRules = ROUTE_RULES.filter((r) => !r.rule_set || (typeof r.rule_set === 'string' ? allowedBlack.has(r.rule_set) : r.rule_set.some((s) => allowedBlack.has(s))));
  } else if (isDual) {
    const coreOutbounds = new Set(['🔒 国内服务', '🛑 广告拦截', 'DIRECT', 'REJECT', '🚀 节点选择']);
    activeRules = ROUTE_RULES.map((r) => {
      if (r.action === 'route' && r.outbound) {
        const outbound = r.outbound;
        // BT/PT, Private, NTP -> DIRECT
        if (['🧲 BT/PT', '🏠 私有网络', '🕓 NTP 服务'].includes(outbound)) {
          return { ...r, outbound: DIRECT_TAG };
        }
        // Non-core -> 🚀 节点选择
        if (!coreOutbounds.has(outbound)) {
          return { ...r, outbound: '🚀 节点选择' };
        }
      }
      return r;
    });
  }

  // White: fallback to proxy; Black: fallback to direct
  const finalRoute = isBlack ? 'direct' : '🚀 节点选择';
  return { rules: activeRules, rule_set: remoteRuleSets, final: finalRoute, auto_detect_interface: true, default_domain_resolver: 'local-dns' };
}
