import { GEODATA_URLS } from '../shared/geox';

export const configStashHeader = `ipv6: false
log-level: info
mixed-port: 7897
allow-lan: true
unified-delay: true
tcp-concurrent: true
geodata-mode: true

geox-url:
  geoip: "${GEODATA_URLS.geoip}"
  geosite: "${GEODATA_URLS.geosite}"
  mmdb: "${GEODATA_URLS.mmdb}"
  asn: "${GEODATA_URLS.asn}"
`;

