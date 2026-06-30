// Mihomo/Meta footer: DNS, sniffer, geodata, profile
// All Mihomo-specific features included here.

export const configMihomoFooter = `
mode: rule
find-process-mode: strict

dns:
  enable: true
  cache-algorithm: arc
  prefer-h3: true
  use-hosts: true
  use-system-hosts: true
  respect-rules: false
  listen: 0.0.0.0:1053
  ipv6: false
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter-mode: blacklist
  fake-ip-filter:
    - 'rule-set:fake-ip-filter'
  nameserver-policy:
    "geosite:category-ads-all": rcode://success
    "+.ts.net": "100.100.100.100"
    "+.arpa": "10.0.0.1"
    "geosite:cn":
      - https://doh.pub/dns-query
      - https://dns.alidns.com/dns-query
    "geosite:gfw":
      - tls://8.8.4.4
      - tls://1.1.1.1
  nameserver:
    - https://doh.pub/dns-query
    - https://dns.alidns.com/dns-query
  fallback:
    - tls://8.8.4.4
    - tls://1.1.1.1
  proxy-server-nameserver:
    - https://doh.pub/dns-query
    - https://dns.alidns.com/dns-query
  direct-nameserver:
    - system
  direct-nameserver-follow-policy: true
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4
    domain:
      - "+.google.com"
      - "+.facebook.com"
      - "+.youtube.com"

profile:
  store-selected: true
  store-fake-ip: true

sniffer:
  enable: true
  override-destination: true
  parse-pure-ip: true
  force-dns-mapping: true
  sniff:
    TLS: { ports: [443, 8443] }
    HTTP: { ports: [80, 8080-8880], override-destination: true }
    QUIC: { ports: [443, 8443] }
  force-domain:
    - "+.netflix.com"
    - "+.nflxvideo.net"
    - "+.amazonaws.com"
    - "+.media.dssott.com"
  skip-domain:
    - "+.apple.com"
    - "Mijia Cloud"
    - "dlg.io.mi.com"
    - "+.oray.com"
    - "+.sunlogin.net"
    - "+.push.apple.com"

geo-auto-update: true
geo-update-interval: 24
`;
