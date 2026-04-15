// Mihomo/Meta header configuration
// Includes TUN, external-controller, and all Mihomo-specific settings.

export const configMihomoHeader = `tun:
  enable: false
  stack: mixed
  auto-route: true
  auto-redirect: true
  auto-detect-interface: true
  inet4-route-address-exclude:
    - 10.0.0.0/8
    - 100.64.0.0/10
    - 100.100.100.101/32
    - 172.16.0.0/12
    - 192.168.0.0/16
  dns-hijack:
    - any:53
    - tcp://any:53
    - any:1053
    - tcp://any:1053
  loopback-address:
    - 10.7.0.1

ipv6: false
log-level: info
mixed-port: 7897
allow-lan: true
unified-delay: true
tcp-concurrent: true

external-controller: 0.0.0.0:9090
external-controller-cors:
  allow-origins:
    - "*"
  allow-private-network: true
secret: "{{SECRET}}"
external-ui: ./ui
external-ui-url: "https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip"
`;
