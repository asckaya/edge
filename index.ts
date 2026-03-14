import { configMihomoHeader } from './templates/mihomo/header';
import { configMihomoGroupsHeader, configMihomoGroupsMid } from './templates/mihomo/groups';
import { configMihomoFooter } from './templates/mihomo/footer';
import { configStashHeader } from './templates/stash/header';
import { configStashGroupsHeader, configStashGroupsMid } from './templates/stash/groups';
import { configStashFooter } from './templates/stash/footer';
import { configStashMiniGroupsHeader, configStashMiniGroupsMid } from './templates/stash/mini/groups-mini';
import { configStashMiniRuleProviders } from './templates/stash/mini/rule-providers-mini';
import { configStashMiniRules } from './templates/stash/mini/rules-mini';
import { configRuleProviders } from './templates/shared/rule-providers';
import { configRules } from './templates/shared/rules';

import { parseProxyUri } from './src/utils/proxy-parser';
import { Subscription } from './src/types';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Move Web UI to /ui/ and let Cloudflare Assets handle it automatically.
    // We only handle the redirect from /ui to /ui/ to ensure relative paths work.
    if (url.pathname === '/ui') {
      return Response.redirect(new URL('/ui/', request.url).toString(), 301);
    }

    // Config type: 'stash' for iOS Stash app, 'stash-mini' for low-memory iOS (<50MB), default is mihomo/clash-meta
    const configType = searchParams.get('type')?.toLowerCase() || 'mihomo';
    const isStash = configType === 'stash';
    const isStashMini = configType === 'stash-mini';

    const providedSecret = searchParams.get('secret') || 'edge-default';

    const subscriptions: Subscription[] = [];

    for (const [key, value] of searchParams.entries()) {
      if (!key || !value || key === 'secret' || key === 'proxies' || key === 'type') continue;
      if (value.startsWith('http://') || value.startsWith('https://')) {
        subscriptions.push({ name: key, url: value });
      }
    }

    if (subscriptions.length === 0 && !searchParams.get('proxies')) {
      return new Response('Edge Subscription API - Missing parameters. Visit /ui for the interface. Add ?proxies=... or ?SubName=SubUrl', {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    // Parse custom proxies
    let customProxies = searchParams.get('proxies') || '';
    let customProxyNames: string[] = [];

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
    const userAgent = (isStash || isStashMini) ? 'Stash' : 'clash.meta';

    subscriptions.forEach((sub) => {
      const { name, url: subUrl } = sub;
      const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      providerNames.push(name);
      const autoGroupName = `⚡ ${name} 自动选择`;
      autoGroupNames.push(autoGroupName);

      // 1. Regular Provder
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
  - name: ${autoGroupName}
    type: url-test
    use: [${name}]
    url: https://www.gstatic.com/generate_204
    interval: 300
    lazy: false
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
    const tplGroupsHeader = isStashMini ? configStashMiniGroupsHeader : isStash ? configStashGroupsHeader : configMihomoGroupsHeader;
    const tplGroupsMid = isStashMini ? configStashMiniGroupsMid : isStash ? configStashGroupsMid : configMihomoGroupsMid;
    const tplHeader = (isStash || isStashMini) ? configStashHeader : configMihomoHeader.replace(/{{SECRET}}/g, providedSecret);
    const tplFooter = (isStash || isStashMini) ? configStashFooter : configMihomoFooter;
    const tplRuleProviders = isStashMini ? configStashMiniRuleProviders : configRuleProviders;
    const tplRules = isStashMini ? configStashMiniRules : configRules;

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

    const ghProxy = searchParams.get('gh_proxy');
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
  },
};
