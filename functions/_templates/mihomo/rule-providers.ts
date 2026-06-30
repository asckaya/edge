// Mihomo specific rule providers (drastically reduced thanks to GEOSITE/GEOIP)

export const configMihomoRuleProviders = `rule-providers:
  adblockfilters:
    type: http
    format: mrs
    behavior: domain
    url: "https://raw.githubusercontent.com/217heidai/adblockfilters/main/rules/adblockmihomo.mrs"
    path: ./ruleset/adblockfilters.mrs
    interval: 28800

  fake-ip-filter:
    type: http
    behavior: domain
    format: text
    interval: 86400
    url: "https://cdn.jsdelivr.net/gh/juewuy/ShellCrash@dev/public/fake_ip_filter.list"
    path: ./ruleset/fake_ip_filter.list
`;
