import { configMihomoHeader } from './_templates/mihomo/header';
import { configMihomoGroupsHeader, configMihomoGroupsMid } from './_templates/mihomo/groups';
import { configMihomoFooter } from './_templates/mihomo/footer';
import { configStashHeader } from './_templates/stash/header';
import { configStashGroupsHeader, configStashGroupsMid } from './_templates/stash/groups';
import { configStashFooter } from './_templates/stash/footer';
import { configMihomoMiniGroupsHeader, configMihomoMiniGroupsMid } from './_templates/mihomo/groups-mini';
import { configMihomoMiniRuleProviders } from './_templates/mihomo/rule-providers-mini';
import { configMihomoMiniRules } from './_templates/mihomo/rules-mini';
import { configMihomoMicroRules } from './_templates/mihomo/rules-micro';
import { configMihomoRuleProviders } from './_templates/mihomo/rule-providers';
import { configMihomoRules } from './_templates/mihomo/rules';
import { GEODATA_URLS, GEODATA_URLS_LITE } from './_templates/shared/geox';

import { parseProxyUri } from './_src/utils/proxy-parser';
import { buildSingBoxConfig } from './_src/utils/sing-box';
import { fetchSubscriptionNodes, parseSubscriptionContent } from './_src/utils/subscription-parser';
import { Subscription, RequestParamsSchema } from './_src/types';

interface PagesFunctionContext {
  request: Request;
  next: () => Response | Promise<Response>;
}

export const onRequest = async (context: PagesFunctionContext) => {
  const { request, next } = context;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // New Routing Logic: Both Web UI and API are at the root.
  // We distinguish them by the presence of query parameters.
  if (searchParams.toString() === '') {
    // If no parameters are provided, fall back to the static Web UI.
    return next();
  }

  // Parse search params into a plain object for Zod
  const paramsObj: Record<string, any> = {};
  for (const [key, value] of searchParams.entries()) {
    paramsObj[key] = value;
  }

  // Collect dynamic subscriptions: [ProviderName]=URL
  const dynamicSubscriptions: Subscription[] = [];
  for (const [key, value] of searchParams.entries()) {
    if (!key || !value || ['secret', 'proxies', 'type', 'gh_proxy'].includes(key)) continue;
    if (value.startsWith('http://') || value.startsWith('https://')) {
      dynamicSubscriptions.push({ name: key, url: value });
    }
  }
  paramsObj.subscriptions = dynamicSubscriptions;

  const parseResult = RequestParamsSchema.safeParse(paramsObj);
  if (!parseResult.success) {
    return new Response(`Invalid parameters: ${parseResult.error.message}`, { status: 400 });
  }

  const { type: configType, secret: providedSecret, proxies: customProxiesRaw, gh_proxy: ghProxy, subscriptions } = parseResult.data;
  
  const isStash = configType === 'stash' || configType === 'stash-mini' || configType === 'stash-micro';
  const isSingBox = configType === 'sing-box' || configType === 'sing-box-mini' || configType === 'sing-box-micro';
  const isMini = configType === 'stash-mini' || configType === 'mihomo-mini' || configType === 'sing-box-mini';
  const isMicro = configType === 'stash-micro' || configType === 'mihomo-micro' || configType === 'sing-box-micro';

  if (subscriptions.length === 0 && !customProxiesRaw) {
    return new Response('Edge Subscription API - Missing parameters. Visit / for the interface. Add ?proxies=... or ?SubName=SubUrl', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // Parse custom proxies
  let customProxies = customProxiesRaw;
  let customProxyNames: string[] = [];
  const customProxyNodes = customProxies ? parseSubscriptionContent(customProxies) : [];

  if (isSingBox) {
    const singBoxUserAgent = 'sing-box';
    const resolvedSubscriptions = subscriptions.length > 0
      ? await fetchSubscriptionNodes(subscriptions, singBoxUserAgent)
      : [];

    const finalConfig = await buildSingBoxConfig({
      secret: providedSecret,
      subscriptions: resolvedSubscriptions,
      customNodes: customProxyNodes,
      ghProxy,
      isMini,
      isMicro,
    });

    return new Response(finalConfig, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  }

  if (customProxies) {
    const lines = customProxies.split(/[|\n]/).filter(l => l.trim());
    for (const line of lines) {
      if (line.includes('#')) {
        customProxyNames.push(decodeURIComponent(line.split('#')[1].trim()));
      } else if (line.startsWith('vmess://')) {
        try {
          const vmessData = JSON.parse(atob(line.replace('vmess://', '')));
          customProxyNames.push(vmessData.ps || 'VMess-Proxy');
        } catch (e) {}
      } else {
        const nameMatch = line.match(/- name:\s*['"]?([^'"]+)['"]?/);
        if (nameMatch) customProxyNames.push(nameMatch[1]);
      }
    }

    if (customProxies.includes('://')) {
      customProxies = parseProxyUri(customProxies);
    } else {
      customProxies = `proxies:\n${customProxies.split('\n').map(l => l.startsWith('  -') ? l : `  - ${l}`).join('\n')}\n`;
    }
  }

  // Build proxy-providers and dynamic groups
  let proxyProvidersSection = 'proxy-providers:\n';
  let dynamicGroupsSection = '';
  const providerNames: string[] = [];
  const autoGroupNames: string[] = [];

  // User-Agent adapts to config type
  const userAgent = isStash ? 'Stash' : 'clash.meta';

  subscriptions.forEach((sub) => {
    const { name, url: subUrl } = sub;
    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    providerNames.push(name);
    const autoGroupName = `⚡ ${name} 自动选择`;
    autoGroupNames.push(autoGroupName);

    // 1. Regular Provider
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

    dynamicGroupsSection += `  - name: ${name}
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
  });

  const providersList = providerNames.join(', ');
  const autoGroupsList = autoGroupNames.join(', ');

  // Self-hosted group
  const configSelfHostedGroup = customProxyNames.length > 0
    ? `  - name: Self-Hosted\n    type: select\n    proxies: [${customProxyNames.join(', ')}]\n`
    : '';
  const selfHostedPlaceholder = customProxyNames.length > 0 ? 'Self-Hosted' : '';

  // Select the right templates based on config type
  const useMiniTemplates = isMini || isMicro;
  const tplGroupsHeader = useMiniTemplates ? configMihomoMiniGroupsHeader : isStash ? configStashGroupsHeader : configMihomoGroupsHeader;
  const tplGroupsMid = useMiniTemplates ? configMihomoMiniGroupsMid : isStash ? configStashGroupsMid : configMihomoGroupsMid;
  
  const selectedGeoUrls = useMiniTemplates ? GEODATA_URLS_LITE : GEODATA_URLS;
  const tplHeader = (isStash ? configStashHeader : configMihomoHeader)
    .replace(/{{SECRET}}/g, providedSecret)
    .replace(/{{GEOIP_URL}}/g, selectedGeoUrls.geoip)
    .replace(/{{GEOSITE_URL}}/g, selectedGeoUrls.geosite)
    .replace(/{{MMDB_URL}}/g, selectedGeoUrls.mmdb)
    .replace(/{{ASN_URL}}/g, selectedGeoUrls.asn);

  const tplFooter = isStash ? configStashFooter : configMihomoFooter;
  const tplRuleProviders = useMiniTemplates ? configMihomoMiniRuleProviders : configMihomoRuleProviders;
  const tplRules = isMicro ? configMihomoMicroRules : isMini ? configMihomoMiniRules : configMihomoRules;

  const fillPlaceholders = (s: string) => s
    .replace(/{{PROVIDERS_LIST}}/g, providersList)
    .replace(/{{AUTO_GROUPS_LIST}}/g, autoGroupsList)
    .replace(/{{SELF_HOSTED_GROUP}}/g, selfHostedPlaceholder)
    // Clean up any trailing ", ]" or ",  ]" caused by empty placeholders
    .replace(/,\s*]/g, ']')
    // Clean up leading "[ , " caused by empty first placeholders
    .replace(/\[\s*,/g, '[')
    // Clean up consecutive ", ," from multiple empty expansions
    .replace(/,\s*,/g, ',')
    // One more pass for overlapping matches like ", , ,"
    .replace(/,\s*,/g, ',');

  const groupsHeader = fillPlaceholders(tplGroupsHeader);
  const groupsMid = fillPlaceholders(tplGroupsMid);

  let finalYaml = [
    tplHeader,
    subscriptions.length > 0 ? proxyProvidersSection : '',
    customProxies,
    groupsHeader,
    configSelfHostedGroup,
    dynamicGroupsSection,
    groupsMid,
    tplFooter,
    tplRuleProviders,
    tplRules,
  ].join('\n');

  if (ghProxy) {
    finalYaml = finalYaml.replace(/https:\/\/(raw\.)?githubusercontent\.com\//g, `${ghProxy}https://$1githubusercontent.com/`);
    finalYaml = finalYaml.replace(/https:\/\/github\.com\//g, `${ghProxy}https://github.com/`);
  }

  return new Response(finalYaml, {
    headers: {
      'content-type': 'text/yaml; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
};
