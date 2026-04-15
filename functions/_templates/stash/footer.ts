// Stash iOS footer: DNS + profile
//
// Differences from Mihomo:
// - No sniffer section (QUIC sniffer not stable on Stash)
// - No geodata-mode / geox-url (Stash manages its own GeoIP data)
// - No find-process-mode / global-client-fingerprint (Mihomo-only)
// - DNS nameserver-policy uses "geosite:" syntax instead of "rule-set:"
// - Simplified fake-ip-filter (Stash has iOS memory constraints)
// - profile.store-fake-ip omitted (not supported)

export const configStashFooter = `
mode: rule

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
    "geosite:category-ai-chat-!cn": "https://8.8.8.8/dns-query"
    "geosite:geolocation-!cn": "https://1.1.1.1/dns-query"
    "geosite:geolocation-cn,geosite:cn": "https://dns.alidns.com/dns-query"
  fallback:
    - 8.8.8.8
    - https://8.8.8.8/dns-query
  fallback-filter:
    geoip: true
    ipcidr: [240.0.0.0/4, 0.0.0.0/32, 127.0.0.1/32]
    domain:
      - +.google.com
      - +.facebook.com
      - +.twitter.com
      - +.youtube.com
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
    - "+.pool.ntp.org"
    - "time.*.com"
    - "time.*.gov"
    - "time.*.edu.cn"
    - "time.*.apple.com"
    - "ntp.*.com"
    - "*.time.edu.cn"
    - "*.ntp.org.cn"
    - "time1.cloud.tencent.com"
    - "*.msftconnecttest.com"
    - "*.msftncsi.com"
    - "localhost.ptlogin2.qq.com"
    - "+.srv.nintendo.net"
    - "+.stun.playstation.net"
    - "xbox.*.microsoft.com"
    - "stun.*.*"
    - "stun.*.*.*"
    - "+.stun.*.*"
    - "mesu.apple.com"
    - "swscan.apple.com"
    - "swquery.apple.com"
    - "lens.l.google.com"
    - "stun.l.google.com"
    - "+.nflxvideo.net"
    - "+.ext.skype.com"
    - "+.skype.com"
    - "+.teams.microsoft.com"
    - "+.microsoft.com"
    - "+.msn.com"
    - "+.windows.com"
    - "+.microsoftonline.com"
    - "+.office.com"
    - "+.office365.com"
    - "broadcast.xboxlive.com"
    - "+.github.com"
    - "+.githubusercontent.com"
    - "+.gitlab.com"
    - "+.bitbucket.org"
    - "+.gitea.com"
    - "+.sourceforge.net"
    - "+.launchpad.net"
    - "+.codeberg.org"

profile:
  store-selected: true
`;
