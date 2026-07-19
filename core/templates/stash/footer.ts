// Stash iOS footer: DNS + profile
//
// Differences from Mihomo:
// - No sniffer section (QUIC sniffer not stable on Stash)
// - No find-process-mode / global-client-fingerprint (Mihomo-only)
// Note: `geodata-mode` and `geox-url` live in stash header.ts, not here.
// - DNS nameserver-policy uses "geosite:" syntax instead of "rule-set:"
// - Simplified fake-ip-filter (Stash has iOS memory constraints)
// - profile.store-fake-ip omitted (not supported)

import { DNS_LOCAL_SERVER, FAKE_IP_RANGE } from "../../src/utils/shared-constants";

export const configStashFooter = `
mode: rule

dns:
  enable: true
  listen: "127.0.0.1:1053"
  use-system-hosts: false
  enhanced-mode: fake-ip
  fake-ip-range: ${FAKE_IP_RANGE}
  default-nameserver:
    - ${DNS_LOCAL_SERVER}
  nameserver:
    - ${DNS_LOCAL_SERVER}
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
