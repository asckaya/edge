// Mihomo/Meta footer: DNS, sniffer, geodata, profile
// All Mihomo-specific features included here.

export const configMihomoFooter = `
mode: rule
find-process-mode: strict

dns:
  enable: true
  listen: "127.0.0.1:1053"
  use-system-hosts: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
  nameserver:
    - https://dns.alidns.com/dns-query
    - 223.5.5.5
  nameserver-policy:
    "geosite:category-ai-chat-!cn,category-dev": ["https://8.8.8.8/dns-query", "8.8.8.8"]
    "geosite:geolocation-!cn": ["https://8.8.8.8/dns-query", "8.8.8.8"]
    "geosite:geolocation-cn,cn": ["https://dns.alidns.com/dns-query", "223.5.5.5"]
  fallback:
    - 8.8.8.8
    - 114.114.114.114
  fallback-filter:
    geoip: true
    ipcidr: [240.0.0.0/4, 0.0.0.0/32, 127.0.0.1/32]
    domain:
      - +.google.com
      - +.facebook.com
      - +.twitter.com
      - +.youtube.com
      - +.google.cn
      - +.googleapis.cn
      - +.googleapis.com
  fake-ip-filter:
    - "*.lan"
    - "*.localdomain"
    - "*.example"
    - "*.invalid"
    - "*.localhost"
    - "*.test"
    - "*.local"
    - "*.home.arpa"
    - "+.tailscale.net"
    - "+.ts.net"
    - "+.et.net"
    - "+.easytier.cn"
    - "+.easytier.top"
    - "localhost.ptlogin2.qq.com"
    - "localhost.sec.qq.com"
    - "geosite:cn"

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
