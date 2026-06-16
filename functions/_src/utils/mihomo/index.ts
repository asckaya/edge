import { configMihomoHeader } from '../../../_templates/mihomo/header';
import { configMihomoFooter } from '../../../_templates/mihomo/footer';
import { configStashHeader } from '../../../_templates/stash/header';
import { configStashFooter } from '../../../_templates/stash/footer';
import { configMihomoRuleProviders } from '../../../_templates/mihomo/rule-providers';
import { GEODATA_URLS, GEODATA_URLS_LITE, GEOX_ALLOWED_WHITE, GEOX_ALLOWED_BLACK } from '../../../_templates/shared/geox';
import { BuildMihomoOptions } from './types';
import { PROXY_SELECTOR_TAG, DIRECT_TAG, GROUP_TAGS } from '../shared-constants';
import { RULE_SET_DEFINITIONS, ROUTE_RULES, filterAndMapRouteRules } from '../rules-registry';
import { renderMihomoRules } from './rules-builder';
import { renderMihomoGroups } from './group-builder';
import YAML from 'yaml';

export function buildMihomoConfig(options: BuildMihomoOptions): string {
  const {
    secret,
    subscriptions,
    customProxies,
    customProxyNames,
    ghProxy,
    isStash,
    isWhite,
    isBlack,
    isDual
  } = options;

  // Parse custom proxies once if present
  let customProxiesObj: any = null;
  let customProxiesList: any[] = [];
  if (customProxies) {
    try {
      customProxiesObj = YAML.parse(customProxies);
      if (customProxiesObj && typeof customProxiesObj === 'object' && Array.isArray(customProxiesObj.proxies)) {
        customProxiesList = customProxiesObj.proxies;
      }
    } catch (e) {
      console.error('Error parsing custom proxies YAML:', e);
    }
  }

  // Extract Tailscale proxy names early
  const tailscaleProxyNames = customProxiesList
    .filter((proxy: any) => proxy && proxy.type === 'tailscale' && proxy.name)
    .map((proxy: any) => proxy.name);

  // Filter custom proxy names to exclude Tailscale nodes
  const filteredCustomProxyNames = customProxyNames.filter(name => !tailscaleProxyNames.includes(name));

  // Build proxy-providers and subscription-specific groups
  const userAgent = isStash ? 'Stash' : 'clash.meta';
  const isSingleSub = subscriptions.length === 1;

  const providerNames = subscriptions.map((sub) => sub.name);
  const autoGroupNames = isSingleSub ? [] : subscriptions.map((sub) => `⚡ ${sub.name} 自动选择`);

  const proxyProvidersSection = subscriptions.length === 0
    ? 'proxy-providers:\n'
    : 'proxy-providers:\n' + subscriptions.map((sub) => {
        const safeName = sub.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return `  ${sub.name}:
    type: http
    url: "${sub.url}"
    path: ./providers/${safeName}.yaml
    interval: 3600
    health-check:
      enable: true
      url: "https://www.gstatic.com/generate_204"
      interval: 300
      lazy: true
    header:
      User-Agent:
        - "${userAgent}"`;
      }).join('\n') + '\n';

  const subGroupsSection = isSingleSub
    ? ''
    : subscriptions.map((sub) => {
        const autoGroupName = `⚡ ${sub.name} 自动选择`;
        return `  - name: ${sub.name}
    type: select
    use: [${sub.name}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"
  - name: ${autoGroupName}
    type: url-test
    use: [${sub.name}]
    url: https://www.gstatic.com/generate_204
    interval: 300
    lazy: false
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"`;
      }).join('\n') + '\n';

  const providersList = providerNames.join(', ');
  const autoGroupsList = autoGroupNames.join(', ');
  const selfHostedPlaceholder = filteredCustomProxyNames.length > 0 ? 'Self-Hosted' : '';
  const tailscalePlaceholder = (tailscaleProxyNames.length > 0 && !isStash) ? 'Tailscale' : '';

  const useMinimalTemplates = isWhite || isBlack || isDual;
  const selectedGeoUrls = (isWhite || isBlack) ? GEODATA_URLS_LITE : GEODATA_URLS;
  const tplHeader = (isStash ? configStashHeader : configMihomoHeader)
    .replace(/{{SECRET}}/g, secret)
    .replace(/{{GEOIP_URL}}/g, selectedGeoUrls.geoip)
    .replace(/{{GEOSITE_URL}}/g, selectedGeoUrls.geosite)
    .replace(/{{MMDB_URL}}/g, selectedGeoUrls.mmdb)
    .replace(/{{ASN_URL}}/g, selectedGeoUrls.asn);

  const tplFooter = isStash ? configStashFooter : configMihomoFooter;
  const tplRuleProviders = configMihomoRuleProviders;

  // 1. Prepare airport and self-hosted groups
  let airportAndSelfHostedYaml = '';
  
  // Add Self-Hosted group first in this sub-section
  if (filteredCustomProxyNames.length > 0) {
    airportAndSelfHostedYaml += `  - name: Self-Hosted\n    type: select\n    proxies: [${filteredCustomProxyNames.join(', ')}]\n`;
  }

  // Add Tailscale group next in this sub-section
  if (tailscaleProxyNames.length > 0 && !isStash) {
    airportAndSelfHostedYaml += `  - name: Tailscale\n    type: select\n    proxies: [${tailscaleProxyNames.join(', ')}]\n`;
  }
  
  // Add subscription groups
  if (!isSingleSub) {
    airportAndSelfHostedYaml += subGroupsSection;
  }

  // 2. Generate all groups in the requested order
  const proxyGroupsSection = renderMihomoGroups({
    providersList,
    autoGroupsList,
    selfHostedGroup: selfHostedPlaceholder,
    tailscaleGroup: tailscalePlaceholder,
    isStash,
    isSingleSub
  }, airportAndSelfHostedYaml, useMinimalTemplates);

  // Rule generation logic
  const allowedWhite = new Set(GEOX_ALLOWED_WHITE);
  const allowedBlack = new Set(GEOX_ALLOWED_BLACK);
  const coreOutbounds = new Set([GROUP_TAGS.CN_SERVICES, GROUP_TAGS.AD_BLOCK, DIRECT_TAG, GROUP_TAGS.REJECT, PROXY_SELECTOR_TAG]);

  let activeRules = ROUTE_RULES;
  if (isWhite) {
    activeRules = filterAndMapRouteRules(ROUTE_RULES, allowedWhite, DIRECT_TAG, coreOutbounds);
  } else if (isBlack) {
    activeRules = filterAndMapRouteRules(ROUTE_RULES, allowedBlack, PROXY_SELECTOR_TAG, coreOutbounds);
  } else if (isDual) {
    activeRules = filterAndMapRouteRules(ROUTE_RULES, null, PROXY_SELECTOR_TAG, coreOutbounds);
  }

  if (tailscaleProxyNames.length > 0) {
    const tailscaleOutbound = tailscaleProxyNames[0];
    activeRules = activeRules.flatMap(r => {
      if (r.domain_suffix) {
        const suffixes = Array.isArray(r.domain_suffix) ? r.domain_suffix : [r.domain_suffix];
        if (suffixes.includes('ts.net')) {
          const tailscaleSuffixes = suffixes.filter(s => s === 'ts.net');
          const otherSuffixes = suffixes.filter(s => s !== 'ts.net');
          const rules = [];
          if (otherSuffixes.length > 0) {
            rules.push({ ...r, domain_suffix: otherSuffixes });
          }
          rules.push({ ...r, domain_suffix: tailscaleSuffixes, outbound: tailscaleOutbound });
          return rules;
        }
      }
      return [r];
    });
    activeRules = [
      { ip_cidr: ['100.64.0.0/10', 'fd7a:115c:a1e0::/48'], action: 'route', outbound: tailscaleOutbound, no_resolve: true } as any,
      ...activeRules
    ];
  }

  const finalMatch = isBlack ? DIRECT_TAG : ((isWhite || isDual) ? PROXY_SELECTOR_TAG : GROUP_TAGS.FINAL);
  const tplRules = renderMihomoRules(activeRules, RULE_SET_DEFINITIONS, finalMatch);

  const fillPlaceholders = (s: string) => s
    .replace(/,\s*]/g, ']')
    .replace(/\[\s*,/g, '[')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*,/g, ',');

  const finalGroups = fillPlaceholders(proxyGroupsSection);

  let finalCustomProxies = customProxies;
  if (isStash && customProxiesList.length > 0) {
    const filtered = customProxiesList.filter((p: any) => p && p.type !== 'tailscale');
    finalCustomProxies = filtered.length > 0 
      ? 'proxies:\n' + YAML.stringify(filtered).split('\n').map((line) => line ? `  ${line}` : line).join('\n') 
      : '';
  }

  let finalYaml = [
    tplHeader,
    subscriptions.length > 0 ? proxyProvidersSection : '',
    finalCustomProxies ? finalCustomProxies + '\n' : '',
    finalGroups,
    tplFooter,
    tplRuleProviders,
    tplRules,
  ].join('\n');

  if (ghProxy) {
    finalYaml = finalYaml.replace(/https:\/\/(raw\.)?githubusercontent\.com\//g, `${ghProxy}https://$1githubusercontent.com/`);
    finalYaml = finalYaml.replace(/https:\/\/github\.com\//g, `${ghProxy}https://github.com/`);
  }

  return finalYaml;
}
