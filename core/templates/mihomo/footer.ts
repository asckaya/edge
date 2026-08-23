// Mihomo/Meta footer: DNS, sniffer, geodata, profile
// All Mihomo-specific features included here.

import { DNS_LOCAL_SERVER, FAKE_IP_RANGE } from "../../src/utils/shared-constants";

export const configMihomoFooter = `
mode: rule
find-process-mode: strict

dns:
  enable: true
  cache-algorithm: arc
  use-hosts: true
  use-system-hosts: true
  respect-rules: true
  listen: 0.0.0.0:1053
  ipv6: false
  default-nameserver:
    - ${DNS_LOCAL_SERVER}
    - 119.29.29.29
  enhanced-mode: fake-ip
  fake-ip-range: ${FAKE_IP_RANGE}
  fake-ip-filter-mode: blacklist
  fake-ip-filter:
    - 'rule-set:fake-ip-filter'
  nameserver-policy:
    "geosite:category-ads-all": rcode://success
{{TAILSCALE_NAMESERVER_POLICY}}    "+.arpa": "10.0.0.1"
    "geosite:cn,private":
      - https://223.5.5.5/dns-query
      - https://1.12.12.12/dns-query
    "geosite:geolocation-!cn":
      - https://dns.google/dns-query
      - https://cloudflare-dns.com/dns-query
  nameserver:
    - https://223.5.5.5/dns-query
    - https://1.12.12.12/dns-query
  fallback:
    - https://dns.google/dns-query
    - https://cloudflare-dns.com/dns-query
  proxy-server-nameserver:
    - https://223.5.5.5/dns-query
    - https://1.12.12.12/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 0.0.0.0/8
      - 10.0.0.0/8
      - 100.64.0.0/10
      - 127.0.0.0/8
      - 169.254.0.0/16
      - 172.16.0.0/12
      - 192.0.0.0/24
      - 192.0.2.0/24
      - 192.88.99.0/24
      - 192.168.0.0/16
      - 198.18.0.0/15
      - 198.51.100.0/24
      - 203.0.113.0/24
      - 224.0.0.0/4
      - 240.0.0.0/4
      - 255.255.255.255/32
    domain:
      - "+.google.com"
      - "+.facebook.com"
      - "+.youtube.com"
      - "+.okx.com"
      - "+.binance.com"
      - "+.bybit.com"
      - "+.twitter.com"
      - "+.x.com"

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
