import { GEODATA_URLS, GEODATA_URLS_LITE, GEOX_ALLOWED_WHITE, GEOX_ALLOWED_BLACK } from '../../../_templates/shared/geox';
import { RULE_SET_DEFINITIONS, ROUTE_RULES, filterAndMapRouteRules } from '../rules-registry';
import { DIRECT_TAG, PROXY_SELECTOR_TAG, GROUP_TAGS } from '../shared-constants';
import { buildRuleSetUrl } from './utils';

export function buildRoute(ruleSets: Record<string, unknown>[], isWhite = false, isBlack = false, ghProxy?: string | null, isDual = false): Record<string, unknown> {
  const selectedGeoUrls = (isWhite || isBlack) ? GEODATA_URLS_LITE : GEODATA_URLS;
  const allowedWhite = new Set(GEOX_ALLOWED_WHITE);
  const allowedBlack = new Set(GEOX_ALLOWED_BLACK);

  const filteredDefinitions = RULE_SET_DEFINITIONS.filter((d) => 
    isWhite ? allowedWhite.has(d.tag) : isBlack ? allowedBlack.has(d.tag) : true
  );

  const remoteRuleSets = filteredDefinitions.map((d) => {
    const remote: Record<string, unknown> = { type: 'remote', tag: d.tag, format: d.format || 'binary', url: buildRuleSetUrl(d, ghProxy), download_detour: PROXY_SELECTOR_TAG };
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

  const coreOutbounds = new Set([GROUP_TAGS.CN_SERVICES, GROUP_TAGS.AD_BLOCK, DIRECT_TAG, GROUP_TAGS.REJECT, PROXY_SELECTOR_TAG]);
  let activeRules = ROUTE_RULES;
  if (isWhite) {
    activeRules = filterAndMapRouteRules(ROUTE_RULES, allowedWhite, DIRECT_TAG, coreOutbounds);
  } else if (isBlack) {
    activeRules = filterAndMapRouteRules(ROUTE_RULES, allowedBlack, PROXY_SELECTOR_TAG, coreOutbounds);
  } else if (isDual) {
    activeRules = filterAndMapRouteRules(ROUTE_RULES, null, PROXY_SELECTOR_TAG, coreOutbounds);
  }

  // White: fallback to proxy; Black: fallback to direct
  const finalRoute = isBlack ? 'direct' : PROXY_SELECTOR_TAG;
  return { rules: activeRules, rule_set: remoteRuleSets, final: finalRoute, auto_detect_interface: true, default_domain_resolver: 'local-dns' };
}


