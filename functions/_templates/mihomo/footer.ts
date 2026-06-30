// Mihomo/Meta footer: DNS, sniffer, geodata, profile
// All Mihomo-specific features included here.

export const configMihomoFooter = `
mode: rule
find-process-mode: strict

dns:
  enable: true
  listen: 0.0.0.0:1053
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
    - 223.5.5.5
  nameserver:
    - 223.5.5.5
    - https://doh.pub/dns-query
  nameserver-policy:
    "geosite:category-ads-all": rcode://success
    "+.ts.net": "100.100.100.100"
  fake-ip-filter:
    - "+.lan"
    - "+.local"
    - "+.market.xiaomi.com"
    - "*.localdomain"
    - "*.example"
    - "*.invalid"
    - "*.localhost"
    - "*.test"
    - "*.home.arpa"
    - "+.tailscale.net"
    - "+.easytier.cn"
    - "+.easytier.top"
    - "localhost.ptlogin2.qq.com"
    - "localhost.sec.qq.com"
    - "geosite:cn"
    - "+.deepseek.com"
    - "+.openai.com"
    - "+.chatgpt.com"
    - "+.oaistatic.com"
    - "+.oaiusercontent.com"
    - "+.bing.com"
    - "*.msftconnecttest.com"
    - "*.msftncsi.com"
    - "time.*.com"
    - "time.*.gov"
    - "time.*.apple.com"
    - "+.pool.ntp.org"

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
