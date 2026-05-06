// Mihomo specific rule providers (drastically reduced thanks to GEOSITE/GEOIP)

export const configMihomoRuleProviders = `rule-providers:
  adblockfilters:
    type: http
    format: mrs
    behavior: domain
    url: "https://raw.githubusercontent.com/217heidai/adblockfilters/main/rules/adblockmihomo.mrs"
    path: ./ruleset/adblockfilters.mrs
    interval: 28800
`;
