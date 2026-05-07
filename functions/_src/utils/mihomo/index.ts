import { configMihomoHeader } from '../../../_templates/mihomo/header';
import { configMihomoFooter } from '../../../_templates/mihomo/footer';
import { configStashHeader } from '../../../_templates/stash/header';
import { configStashFooter } from '../../../_templates/stash/footer';
import { configMihomoRuleProviders } from '../../../_templates/mihomo/rule-providers';
import { GEODATA_URLS, GEODATA_URLS_LITE, GEOX_ALLOWED_WHITE, GEOX_ALLOWED_BLACK } from '../../../_templates/shared/geox';
import { BuildMihomoOptions } from './types';
import { PROXY_SELECTOR_TAG, DIRECT_TAG, GROUP_TAGS } from '../shared-constants';
import { RULE_SET_DEFINITIONS, ROUTE_RULES } from '../rules-registry';
import { renderMihomoRules } from './rules-builder';
import { renderMihomoGroups } from './group-builder';

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

  // Build proxy-providers and subscription-specific groups
  let proxyProvidersSection = 'proxy-providers:\n';
  let subGroupsSection = '';
  const providerNames: string[] = [];
  const autoGroupNames: string[] = [];

  const userAgent = isStash ? 'Stash' : 'clash.meta';

  const isSingleSub = subscriptions.length === 1;

  subscriptions.forEach((sub) => {
    const { name, url: subUrl } = sub;
    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    providerNames.push(name);
    
    proxyProvidersSection += `  ${name}:
    type: http
    url: "${subUrl}"
    path: ./providers/${safeName}.yaml
    interval: 3600
    health-check:
      enable: true
      url: "https://www.gstatic.com/generate_204"
      interval: 300
      lazy: true
    header:
      User-Agent:
        - "${userAgent}"
`;

    if (!isSingleSub) {
      const autoGroupName = `⚡ ${name} 自动选择`;
      autoGroupNames.push(autoGroupName);
      
      subGroupsSection += `  - name: ${name}
    type: select
    use: [${name}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"
  - name: ${autoGroupName}
    type: url-test
    use: [${name}]
    url: https://www.gstatic.com/generate_204
    interval: 300
    lazy: false
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"
`;
    }
  });

  const providersList = providerNames.join(', ');
  const autoGroupsList = autoGroupNames.join(', ');
  const selfHostedPlaceholder = customProxyNames.length > 0 ? 'Self-Hosted' : '';

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

  // Group generation
  let proxyGroupsSection = renderMihomoGroups({
    providersList,
    autoGroupsList,
    selfHostedGroup: selfHostedPlaceholder,
    isStash
  }, useMinimalTemplates);

  // Add Self-Hosted group if needed
  if (customProxyNames.length > 0) {
    proxyGroupsSection += `  - name: Self-Hosted\n    type: select\n    proxies: [${customProxyNames.join(', ')}]\n`;
  }

  // Add subscription groups
  proxyGroupsSection += subGroupsSection;

  // Rule generation logic
  const allowedWhite = new Set(GEOX_ALLOWED_WHITE);
  const allowedBlack = new Set(GEOX_ALLOWED_BLACK);
  const coreOutbounds = new Set([GROUP_TAGS.CN_SERVICES, GROUP_TAGS.AD_BLOCK, DIRECT_TAG, GROUP_TAGS.REJECT, PROXY_SELECTOR_TAG]);

  let activeRules = ROUTE_RULES;
  if (isWhite) {
    activeRules = ROUTE_RULES
      .filter((r) => !r.rule_set || (typeof r.rule_set === 'string' ? allowedWhite.has(r.rule_set) : r.rule_set.some((s) => allowedWhite.has(s))))
      .map((r) => {
        if (r.action === 'route' && r.outbound) {
          const outbound = r.outbound;
          if ([GROUP_TAGS.BT_PT, GROUP_TAGS.PRIVATE_NET, GROUP_TAGS.NTP_SERVICES].includes(outbound)) {
            return { ...r, outbound: DIRECT_TAG };
          }
          if (!coreOutbounds.has(outbound)) {
             return { ...r, outbound: DIRECT_TAG };
          }
        }
        return r;
      });
  } else if (isBlack) {
    activeRules = ROUTE_RULES
      .filter((r) => !r.rule_set || (typeof r.rule_set === 'string' ? allowedBlack.has(r.rule_set) : r.rule_set.some((s) => allowedBlack.has(s))))
      .map((r) => {
        if (r.action === 'route' && r.outbound) {
          const outbound = r.outbound;
          if ([GROUP_TAGS.BT_PT, GROUP_TAGS.PRIVATE_NET, GROUP_TAGS.NTP_SERVICES].includes(outbound)) {
            return { ...r, outbound: DIRECT_TAG };
          }
          if (!coreOutbounds.has(outbound)) {
            return { ...r, outbound: PROXY_SELECTOR_TAG };
          }
        }
        return r;
      });
  } else if (isDual) {
    activeRules = ROUTE_RULES.map((r) => {
      if (r.action === 'route' && r.outbound) {
        const outbound = r.outbound;
        if ([GROUP_TAGS.BT_PT, GROUP_TAGS.PRIVATE_NET, GROUP_TAGS.NTP_SERVICES].includes(outbound)) {
          return { ...r, outbound: DIRECT_TAG };
        }
        if (!coreOutbounds.has(outbound)) {
          return { ...r, outbound: PROXY_SELECTOR_TAG };
        }
      }
      return r;
    });
  }

  const finalMatch = isBlack ? DIRECT_TAG : ((isWhite || isDual) ? PROXY_SELECTOR_TAG : GROUP_TAGS.FINAL);
  const tplRules = renderMihomoRules(activeRules, RULE_SET_DEFINITIONS, finalMatch);

  const fillPlaceholders = (s: string) => s
    .replace(/,\s*]/g, ']')
    .replace(/\[\s*,/g, '[')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*,/g, ',');

  const finalGroups = fillPlaceholders(proxyGroupsSection);

  let finalYaml = [
    tplHeader,
    subscriptions.length > 0 ? proxyProvidersSection : '',
    customProxies,
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
