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
    "rule-set:openai,anthropic,google-gemini,deepseek,perplexity,category-dev": ["https://8.8.8.8/dns-query", "8.8.8.8"]
    "rule-set:geolocation-!cn": ["https://8.8.8.8/dns-query", "8.8.8.8"]
    "rule-set:geolocation-cn,cn": ["https://dns.alidns.com/dns-query", "223.5.5.5"]
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
    - "time.*.com"
    - "time.*.gov"
    - "time.*.edu.cn"
    - "time.*.apple.com"
    - "time1.*.com"
    - "time2.*.com"
    - "time3.*.com"
    - "time4.*.com"
    - "time5.*.com"
    - "time6.*.com"
    - "time7.*.com"
    - "ntp.*.com"
    - "ntp1.*.com"
    - "ntp2.*.com"
    - "ntp3.*.com"
    - "ntp4.*.com"
    - "ntp5.*.com"
    - "ntp6.*.com"
    - "ntp7.*.com"
    - "*.time.edu.cn"
    - "*.ntp.org.cn"
    - "+.pool.ntp.org"
    - "time1.cloud.tencent.com"
    - "music.163.com"
    - "*.music.163.com"
    - "*.126.net"
    - "musicapi.taihe.com"
    - "music.taihe.com"
    - "songsearch.kugou.com"
    - "trackercdn.kugou.com"
    - "*.kuwo.cn"
    - "api-jooxtt.sanook.com"
    - "api.joox.com"
    - "joox.com"
    - "y.qq.com"
    - "*.y.qq.com"
    - "streamoc.music.tc.qq.com"
    - "mobileoc.music.tc.qq.com"
    - "isure.stream.qqmusic.qq.com"
    - "dl.stream.qqmusic.qq.com"
    - "aqqmusic.tc.qq.com"
    - "amobile.music.tc.qq.com"
    - "*.xiami.com"
    - "*.music.migu.cn"
    - "music.migu.cn"
    - "*.msftconnecttest.com"
    - "*.msftncsi.com"
    - "msftconnecttest.com"
    - "msftncsi.com"
    - "localhost.ptlogin2.qq.com"
    - "localhost.sec.qq.com"
    - "+.srv.nintendo.net"
    - "+.stun.playstation.net"
    - "xbox.*.microsoft.com"
    - "xnotify.xboxlive.com"
    - "+.battlenet.com.cn"
    - "+.wotgame.cn"
    - "+.wggames.cn"
    - "+.wowsgame.cn"
    - "+.wargaming.net"
    - "proxy.golang.org"
    - "stun.*.*"
    - "stun.*.*.*"
    - "+.stun.*.*"
    - "+.stun.*.*.*"
    - "+.stun.*.*.*.*"
    - "heartbeat.belkin.com"
    - "*.linksys.com"
    - "*.linksyssmartwifi.com"
    - "*.router.asus.com"
    - "mesu.apple.com"
    - "swscan.apple.com"
    - "swquery.apple.com"
    - "swdownload.apple.com"
    - "swcdn.apple.com"
    - "swdist.apple.com"
    - "lens.l.google.com"
    - "stun.l.google.com"
    - "+.nflxvideo.net"
    - "*.square-enix.com"
    - "*.finalfantasyxiv.com"
    - "*.ffxiv.com"
    - "*.mcdn.bilivideo.cn"
    - "+.ext.skype.com"
    - "+.skype.com"
    - "+.skypeforbusiness.com"
    - "+.teams.microsoft.com"
    - "teams.microsoft.com"
    - "*.teams.microsoft.com"
    - "*.s-microsoft.com"
    - "+.msecnd.net"
    - "+.visualstudio.com"
    - "*.vsassets.io"
    - "+.vo.msecnd.net"
    - "+.aspnetcdn.com"
    - "+.microsoft.com"
    - "+.msn.com"
    - "+.windows.com"
    - "+.microsoftonline.com"
    - "+.office.com"
    - "+.office365.com"
    - "+.outlook.com"
    - "+.sharepoint.com"
    - "broadcast.xboxlive.com"
    - "github.com"
    - "*.github.com"
    - "githubusercontent.com"
    - "*.githubusercontent.com"
    - "+.gitlab.com"
    - "+.bitbucket.org"
    - "+.gitea.com"
    - "+.sourceforge.net"
    - "+.launchpad.net"
    - "+.codeberg.org"

profile:
  store-selected: true
  store-fake-ip: false

sniffer:
  enable: true
  parse-pure-ip: true
  sniff:
    TLS: { ports: [443, 8443] }
    HTTP: { ports: [80, 8080-8880], override-destination: true }
    QUIC: { ports: [443, 8443] }

geodata-mode: true
geo-auto-update: true
geodata-loader: standard
geo-update-interval: 24
geox-url:
  geoip: https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.dat
  geosite: https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat
  mmdb: https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country.mmdb
  asn: https://github.com/xishang0128/geoip/releases/download/latest/GeoLite2-ASN.mmdb
`;
