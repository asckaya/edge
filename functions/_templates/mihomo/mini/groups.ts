// Mihomo/Stash Mini/Micro Proxy Groups.
// Simplified 4-group structure for memory efficiency.

export const configMihomoMiniGroupsHeader = `proxy-groups:
  - name: 🚀 节点选择
    type: select
    proxies:
      - ⚡ 自动选择
      - 🇭🇰 香港节点
      - 🇯🇵 日本节点
      - 🇰🇷 韩国节点
      - 🇸🇬 新加坡节点
      - 🇺🇸 美国节点
      - 🇹🇼 台湾节点
      - {{SELF_HOSTED_GROUP}}
      - DIRECT

  - name: 🔒 国内服务
    type: select
    proxies: [DIRECT, REJECT, 🚀 节点选择, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🛒 购物网站
    type: select
    proxies: [🚀 节点选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🛑 广告拦截
    type: select
    proxies:
      - REJECT
      - DIRECT
      - 🚀 节点选择

  - name: 🐟 漏网之鱼
    type: select
    proxies:
      - 🚀 节点选择
      - 🇭🇰 香港节点
      - 🇯🇵 日本节点
      - 🇰🇷 韩国节点
      - 🇸🇬 新加坡节点
      - 🇺🇸 美国节点
      - 🇹🇼 台湾节点
      - DIRECT
`;

export const configMihomoMiniGroupsMid = `
  - name: ⚡ 自动选择
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    use: [{{PROVIDERS_LIST}}]

  - name: 🇭🇰 香港节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    use: [{{PROVIDERS_LIST}}]
    filter: "(?i)港|HK|HongKong"

  - name: 🇯🇵 日本节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    use: [{{PROVIDERS_LIST}}]
    filter: "(?i)日|JP|Japan"

  - name: 🇰🇷 韩国节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    use: [{{PROVIDERS_LIST}}]
    filter: "(?i)韩|KR|Korea"

  - name: 🇸🇬 新加坡节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    use: [{{PROVIDERS_LIST}}]
    filter: "(?i)新|SG|Singapore"

  - name: 🇺🇸 美国节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    use: [{{PROVIDERS_LIST}}]
    filter: "(?i)美|US|USA|UnitedStates"

  - name: 🇹🇼 台湾节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    use: [{{PROVIDERS_LIST}}]
    filter: "(?i)台|TW|Taiwan"
`;
