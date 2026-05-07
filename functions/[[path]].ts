import { configMihomoHeader } from './_templates/mihomo/header';
import { configMihomoGroupsHeader, configMihomoGroupsMid } from './_templates/mihomo/full/groups';
import { configMihomoFooter } from './_templates/mihomo/footer';
import { configStashHeader } from './_templates/stash/header';
import { configStashGroupsHeader, configStashGroupsMid } from './_templates/stash/full/groups';
import { configStashFooter } from './_templates/stash/footer';
import { configMihomoMiniGroupsHeader, configMihomoMiniGroupsMid } from './_templates/mihomo/mini/groups';
import { configMihomoMiniRuleProviders } from './_templates/mihomo/mini/rule-providers';
import { configMihomoMiniRules } from './_templates/mihomo/mini/rules';
import { configMihomoMicroRules } from './_templates/mihomo/micro/rules';
import { configMihomoRuleProviders } from './_templates/mihomo/rule-providers';
import { configMihomoRules } from './_templates/mihomo/full/rules';
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
  const paramsObj: Record<string, unknown> = {};
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
  (paramsObj as any).subscriptions = dynamicSubscriptions;

  const parseResult = RequestParamsSchema.safeParse(paramsObj);
  if (!parseResult.success) {
    return new Response(`Invalid parameters: ${parseResult.error.message}`, { status: 400 });
  }

  const { type: configType, secret: providedSecret, proxies: customProxiesRaw, gh_proxy: ghProxy, subscriptions } = parseResult.data;
  
  const isStash = configType === 'stash' || configType === 'stash-mini' || configType === 'stash-micro' || configType === 'stash-dual';
  const isSingBox = configType === 'sing-box' || configType === 'sing-box-mini' || configType === 'sing-box-micro' || configType === 'sing-box-dual';
  const isMini = configType === 'stash-mini' || configType === 'mihomo-mini' || configType === 'sing-box-mini';
  const isMicro = configType === 'stash-micro' || configType === 'mihomo-micro' || configType === 'sing-box-micro';
  const isDual = configType === 'stash-dual' || configType === 'mihomo-dual' || configType === 'sing-box-dual';

  if (subscriptions.length === 0 && !customProxiesRaw) {
    return new Response('Edge Subscription API - Missing parameters. Visit / for the interface. Add ?proxies=... or ?SubName=SubUrl', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // Parse custom proxies
  let customProxies = customProxiesRaw;
  const customProxyNames: string[] = [];
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
      isDual,
    });

    return Response.json(finalConfig, {
      headers: {
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
        } catch {
        }
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
  const useMiniTemplates = isMini || isMicro || isDual;
  let tplGroupsHeader = useMiniTemplates ? configMihomoMiniGroupsHeader : isStash ? configStashGroupsHeader : configMihomoGroupsHeader;
  let tplGroupsMid = useMiniTemplates ? configMihomoMiniGroupsMid : isStash ? configStashGroupsMid : configMihomoGroupsMid;
  
  const selectedGeoUrls = (isMini || isMicro) ? GEODATA_URLS_LITE : GEODATA_URLS;
  const tplHeader = (isStash ? configStashHeader : configMihomoHeader)
    .replace(/{{SECRET}}/g, providedSecret)
    .replace(/{{GEOIP_URL}}/g, selectedGeoUrls.geoip)
    .replace(/{{GEOSITE_URL}}/g, selectedGeoUrls.geosite)
    .replace(/{{MMDB_URL}}/g, selectedGeoUrls.mmdb)
    .replace(/{{ASN_URL}}/g, selectedGeoUrls.asn);

  const tplFooter = isStash ? configStashFooter : configMihomoFooter;
  const tplRuleProviders = useMiniTemplates ? configMihomoMiniRuleProviders : configMihomoRuleProviders;
  let tplRules = isMicro ? configMihomoMicroRules : isMini ? configMihomoMiniRules : configMihomoRules;

  // Dual mode: Redirect all scenario groups to the main proxy group
  if (isDual) {
    // 1. Rule Transformation: Force BT/PT/Private/NTP to DIRECT, and merge others to Proxy.
    const ruleLines = tplRules.split('\n');
    const transformedLines = ruleLines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const groupPart = parts[2];
          const groupName = groupPart.trim();

          // BT/PT, Private, NTP -> DIRECT
          if (['🧲 BT/PT', '🏠 私有网络', '🕓 NTP 服务'].includes(groupName)) {
            parts[2] = groupPart.replace(groupName, 'DIRECT');
            return parts.join(',');
          }

          // Core groups to preserve
          const coreGroups = ['🔒 国内服务', '🛑 广告拦截', 'DIRECT', 'REJECT', '🚀 节点选择'];
          if (!coreGroups.includes(groupName)) {
            parts[2] = groupPart.replace(groupName, '🚀 节点选择');
            return parts.join(',');
          }
        }
      }
      return line;
    });
    tplRules = transformedLines.join('\n');

    // 2. Group Purification: Remove groups that are no longer referenced by rules.
    const groupsToRemove = ['🛒 购物网站', '🐟 漏网之鱼', '🧪 测速专线', '💬 AI 服务', '📹 油管视频', '🔍 谷歌服务', '📲 电报消息', '🐱 开发工具', 'Ⓜ️ 微软服务', '🍏 苹果服务', '🎬 苹果视频', '🌐 社交媒体', '🎬 流媒体', '🎮 游戏平台', '🎮 游戏下载', '📚 教育资源', '🛠️ 生产力工具', '💰 金融服务', '📰 新闻资讯', '🔞 成人内容', '☁️ 云服务', '🌐 非中国'];
    for (const groupName of groupsToRemove) {
      const groupRegex = new RegExp(`\\s+-\\s+name:\\s+${groupName}[^]*?(?=\\s+-\\s+name:|$)`, 'g');
      tplGroupsHeader = tplGroupsHeader.replace(groupRegex, '');
      tplGroupsMid = tplGroupsMid.replace(groupRegex, '');
    }
  }

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
