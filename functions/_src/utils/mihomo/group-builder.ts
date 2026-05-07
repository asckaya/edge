import { GROUP_TAGS, SCENARIO_GROUPS, DIRECT_REDIRECT_GROUPS, CORE_GROUPS } from '../shared-constants';

export interface GroupOptions {
  providersList: string;
  autoGroupsList: string;
  selfHostedGroup: string;
  isStash?: boolean;
  isSingleSub?: boolean;
}

export function renderMihomoGroups(options: GroupOptions, isMinimal = false): string {
  const { providersList, autoGroupsList, selfHostedGroup, isStash, isSingleSub } = options;

  // When it's a single sub, the provider names in providersList are NOT manual groups, 
  // so we shouldn't put them in the 'proxies' list. Instead, we'll use the 'use' field.
  const effectiveProvidersForProxies = isSingleSub ? '' : providersList;

  const scenarioProxies = `[${GROUP_TAGS.PROXY}, ${isStash ? 'DIRECT, REJECT, ♻️ 自动选择' : 'DIRECT, REJECT, ⚡ 自动选择'}, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇹🇼 台湾节点, ${autoGroupsList}, ${effectiveProvidersForProxies}, ${selfHostedGroup}]`;

  const defaultProxies = isStash 
    ? `[DIRECT, REJECT, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇹🇼 台湾节点, ${autoGroupsList}, ${effectiveProvidersForProxies}, ${selfHostedGroup}]`
    : `[DIRECT, REJECT, ⚡ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇹🇼 台湾节点, ${autoGroupsList}, ${effectiveProvidersForProxies}, ${selfHostedGroup}]`;

  const commonFilter = 'filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"';
  const autoTag = isStash ? '♻️ 自动选择' : '⚡ 自动选择';

  // Base groups always present
  const groups: any[] = [
    {
      name: GROUP_TAGS.PROXY,
      type: 'select',
      proxies: defaultProxies,
      use: isSingleSub ? `[${providersList}]` : undefined
    },
    {
      name: autoTag,
      type: 'url-test',
      url: 'https://www.gstatic.com/generate_204',
      interval: 300,
      tolerance: 50,
      use: `[${providersList}]`,
      filter: commonFilter.split(': ')[1].replace(/"/g, ''),
      'include-all-proxies': isStash ? true : undefined
    }
  ];

  // Region groups
  const regions = [
    { name: '🇭🇰 香港节点', filter: '(?i)港|HK|HongKong|Hong Kong|🇭🇰' },
    { name: '🇯🇵 日本节点', filter: '(?i)日|JP|Japan|🇯🇵' },
    { name: '🇺🇸 美国节点', filter: '(?i)美|US|USA|United States|🇺🇸' },
    { name: '🇸🇬 新加坡节点', filter: '(?i)新|SG|Singapore|🇸🇬' },
    { name: '🇹🇼 台湾节点', filter: '(?i)台|TW|Taiwan|🇹🇼' }
  ];

  regions.forEach(r => {
    groups.push({
      name: r.name,
      type: 'url-test',
      url: 'https://www.gstatic.com/generate_204',
      interval: 300,
      tolerance: 50,
      use: `[${providersList}]`,
      filter: r.filter,
      'include-all-proxies': isStash ? true : undefined
    });
  });

  // Scenario and Core groups
  if (!isMinimal) {
    const allGroups = [
      ...SCENARIO_GROUPS, 
      ...DIRECT_REDIRECT_GROUPS, 
      ...CORE_GROUPS.filter(g => ![GROUP_TAGS.DIRECT, GROUP_TAGS.REJECT, GROUP_TAGS.PROXY].includes(g))
    ];
    allGroups.forEach(name => {
      let proxies = scenarioProxies;
      const type = 'select';
      let filter = commonFilter.split(': ')[1].replace(/"/g, '');
      let use = `[${providersList}]`;

      // Overrides for specific groups
      if (name === GROUP_TAGS.AD_BLOCK) {
        proxies = `[REJECT, DIRECT, ${GROUP_TAGS.PROXY}, ${autoGroupsList}]`;
        use = '';
        filter = '';
      } else if (name === GROUP_TAGS.CN_SERVICES) {
        proxies = `[DIRECT, REJECT, ${GROUP_TAGS.PROXY}, ${autoGroupsList}]`;
      } else if (name === GROUP_TAGS.PRIVATE_NET) {
        proxies = `[DIRECT, REJECT, ${GROUP_TAGS.PROXY}, ${autoGroupsList}]`;
      } else if (name === GROUP_TAGS.NTP_SERVICES) {
        proxies = `[DIRECT, ${GROUP_TAGS.PROXY}]`;
        use = '';
        filter = '';
      } else if (name === GROUP_TAGS.BT_PT) {
        proxies = `[DIRECT, ${GROUP_TAGS.PROXY}, REJECT, ${autoGroupsList}]`;
      } else if (name === GROUP_TAGS.SPEEDTEST) {
        proxies = `[${GROUP_TAGS.PROXY}, DIRECT, ${autoGroupsList}]`;
      }

      groups.push({
        name,
        type,
        proxies,
        use: use || undefined,
        filter: filter || undefined,
        'include-all-proxies': (isStash && use) ? true : undefined
      });
    });
  } else {
    // Minimal mode basic groups
    groups.push({ name: GROUP_TAGS.CN_SERVICES, type: 'select', proxies: `[DIRECT, REJECT, ${GROUP_TAGS.PROXY}, ${autoGroupsList}]`, use: `[${providersList}]`, 'include-all-proxies': isStash ? true : undefined });
    groups.push({ name: GROUP_TAGS.AD_BLOCK, type: 'select', proxies: `[REJECT, DIRECT, ${GROUP_TAGS.PROXY}]` });
    groups.push({ name: GROUP_TAGS.FINAL, type: 'select', proxies: `[${GROUP_TAGS.PROXY}, ${defaultProxies.substring(1)}`, use: `[${providersList}]`, 'include-all-proxies': isStash ? true : undefined });
  }

  // Convert to YAML
  let yaml = 'proxy-groups:\n';
  groups.forEach(g => {
    yaml += `  - name: ${g.name}\n    type: ${g.type}\n`;
    if (g.proxies) yaml += `    proxies: ${g.proxies}\n`;
    if (g.use) yaml += `    use: ${g.use}\n`;
    if (g.url) yaml += `    url: ${g.url}\n`;
    if (g.interval) yaml += `    interval: ${g.interval}\n`;
    if (g.tolerance) yaml += `    tolerance: ${g.tolerance}\n`;
    if (g.filter) yaml += `    filter: "${g.filter}"\n`;
    if (g['include-all-proxies']) yaml += `    include-all-proxies: true\n`;
  });

  return yaml;
}
