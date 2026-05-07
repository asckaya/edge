import { GEODATA_URLS, GEODATA_URLS_LITE } from '../../../_templates/shared/geox';
import { RULE_SET_DEFINITIONS, ROUTE_RULES } from './definitions';
import { buildRuleSetUrl } from './utils';

export function buildRoute(ruleSets: Record<string, any>[], isMini = false, isMicro = false, ghProxy?: string | null): Record<string, any> {
  const selectedGeoUrls = (isMini || isMicro) ? GEODATA_URLS_LITE : GEODATA_URLS;
  const allowedMini = new Set(['advertising', 'adblockfilters', 'private-ip', 'private', 'geolocation-cn', 'cn', 'cn-ip', 'geolocation-!cn', 'apple-cn', 'google-cn', 'microsoft@cn', 'steam@cn', 'onedrive', 'category-ai-cn', 'category-netdisk-cn', 'category-ecommerce@cn', 'category-collaborate-cn', 'category-scholar-cn', 'category-bank-cn', 'category-games@cn', 'category-cdn-cn']);
  const allowedMicro = new Set(['advertising', 'adblockfilters', 'private-ip', 'private', 'google', 'google-ip', 'telegram', 'telegram-ip', 'youtube', 'netflix', 'netflix-ip', 'disney', 'category-ai-chat-!cn', 'openai', 'anthropic', 'google-gemini', 'perplexity', 'deepseek', 'category-dev', 'github', 'docker', 'category-social-media-!cn', 'twitter', 'twitter-ip', 'category-games-!cn', 'category-game-platforms-download', 'category-scholar-!cn', 'category-remote-control', 'category-password-management', 'category-entertainment@!cn', 'geolocation-!cn']);

  const filteredDefinitions = RULE_SET_DEFINITIONS.filter((d) => isMini ? allowedMini.has(d.tag) : isMicro ? allowedMicro.has(d.tag) : true);

  const remoteRuleSets = filteredDefinitions.map((d) => {
    const remote: any = { type: 'remote', tag: d.tag, format: d.format || 'binary', url: buildRuleSetUrl(d, ghProxy), download_detour: '🚀 节点选择' };
    if (d.tag === 'adblockfilters') {
      delete remote.download_detour;
    } else {
      const geoUrlMap: Record<string, string> = { geosite: selectedGeoUrls.geosite, geoip: selectedGeoUrls.geoip };
      const baseUrl = geoUrlMap[d.kind];
      // Only replace if baseUrl looks like a directory prefix (doesn't end in .dat or .mmdb)
      if (baseUrl && !baseUrl.endsWith('.dat') && !baseUrl.endsWith('.mmdb')) {
        remote.url = remote.url.replace(/https:\/\/raw\.githubusercontent\.com\/MetaCubeX\/meta-rules-dat\/sing\/geo\/(geosite|geoip)\/.*\.srs/, `${baseUrl}/$1/${d.remoteName || d.tag}.srs`);
      }
    }
    return remote;
  });

  const activeRules = isMicro ? ROUTE_RULES.filter((r) => !r.rule_set || (typeof r.rule_set === 'string' ? allowedMicro.has(r.rule_set) : r.rule_set.some((s) => allowedMicro.has(s)))) : ROUTE_RULES;

  return { rules: activeRules, rule_set: remoteRuleSets, final: isMicro ? 'direct' : '🐟 漏网之鱼', auto_detect_interface: true };
}
