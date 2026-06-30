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
  nameserver:
    - 223.5.5.5
    - https://doh.pub/dns-query
  fake-ip-filter:
    - "+.m2m"
    - "injections.adguard.org"
    - "local.adguard.org"
    - "+.bogon"
    - "+.local"
    - "+.lan"
    - "+.internal"
    - "+.localdomain"
    - "home.arpa"
    - "dns.msftncsi.com"
    - "*.srv.nintendo.net"
    - "*.stun.playstation.net"
    - "xbox.*.microsoft.com"
    - "*.xboxlive.com"
    - "*.turn.twilio.com"
    - "*.stun.twilio.com"
    - "stun.syncthing.net"
    - "stun.*"
    - "lancache.steamcontent.com"

profile:
  store-selected: true
`;
