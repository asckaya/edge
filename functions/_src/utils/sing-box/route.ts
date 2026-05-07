import { GEODATA_URLS, GEODATA_URLS_LITE, GEOX_ALLOWED_WHITE, GEOX_ALLOWED_BLACK, GEOX_ALLOWED_DUAL } from '../../../_templates/shared/geox';
import { RULE_SET_DEFINITIONS, ROUTE_RULES } from './definitions';
import { DIRECT_TAG, PROXY_SELECTOR_TAG, GROUP_TAGS } from '../shared-constants';
import { buildRuleSetUrl } from './utils';

export function buildRoute(ruleSets: Record<string, unknown>[], isWhite = false, isBlack = false, ghProxy?: string | null, isDual = false): Record<string, unknown> {
  const selectedGeoUrls = (isWhite || isBlack) ? GEODATA_URLS_LITE : GEODATA_URLS;
  const allowedWhite = new Set(GEOX_ALLOWED_WHITE);
  const allowedBlack = new Set(GEOX_ALLOWED_BLACK);
  const allowedDual = new Set(GEOX_ALLOWED_DUAL);

  const filteredDefinitions = RULE_SET_DEFINITIONS.filter((d) => 
    isDual ? allowedDual.has(d.tag) : isWhite ? allowedWhite.has(d.tag) : isBlack ? allowedBlack.has(d.tag) : true
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

  let activeRules = ROUTE_RULES;
  if (isWhite) {
    activeRules = ROUTE_RULES.filter((r) => !r.rule_set || (typeof r.rule_set === 'string' ? allowedWhite.has(r.rule_set) : r.rule_set.some((s) => allowedWhite.has(s))));
  } else if (isBlack) {
    activeRules = ROUTE_RULES.filter((r) => !r.rule_set || (typeof r.rule_set === 'string' ? allowedBlack.has(r.rule_set) : r.rule_set.some((s) => allowedBlack.has(s))));
  } else if (isDual) {
    const coreOutbounds = new Set([GROUP_TAGS.CN_SERVICES, GROUP_TAGS.AD_BLOCK, DIRECT_TAG, GROUP_TAGS.REJECT, PROXY_SELECTOR_TAG]);
    activeRules = ROUTE_RULES.map((r) => {
      if (r.action === 'route' && r.outbound) {
        const outbound = r.outbound;
        // BT/PT, Private, NTP -> DIRECT
        if ([GROUP_TAGS.BT_PT, GROUP_TAGS.PRIVATE_NET, GROUP_TAGS.NTP_SERVICES].includes(outbound)) {
          return { ...r, outbound: DIRECT_TAG };
        }
        // Non-core -> PROXY_SELECTOR_TAG
        if (!coreOutbounds.has(outbound)) {
          return { ...r, outbound: PROXY_SELECTOR_TAG };
        }
      }
      return r;
    });
  }

  // White: fallback to proxy; Black: fallback to direct
  const finalRoute = isBlack ? 'direct' : PROXY_SELECTOR_TAG;
  return { rules: activeRules, rule_set: remoteRuleSets, final: finalRoute, auto_detect_interface: true, default_domain_resolver: 'local-dns' };
}


