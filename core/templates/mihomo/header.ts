import {
	CLASH_API_PORT,
	EXTERNAL_UI_URL,
	MIXED_PORT,
	TUN_EXCLUDE_ADDRESSES,
} from "../../src/utils/shared-constants";
import { GEODATA_URLS_YAML } from "../shared/geox";

export const configMihomoHeader = `tun:
  enable: false
  stack: system
  auto-route: true
  auto-redirect: true
  auto-detect-interface: true
  endpoint-independent-nat: true
  strict-route: true
  inet4-route-address-exclude:
${TUN_EXCLUDE_ADDRESSES.map((addr) => `    - ${addr}`).join("\n")}
  dns-hijack:
    - any:53
    - tcp://any:53
    - any:1053
    - tcp://any:1053
  loopback-address:
    - 10.7.0.1

ipv6: false
log-level: info
mixed-port: ${MIXED_PORT}
allow-lan: true
unified-delay: true
tcp-concurrent: true
geodata-mode: true


external-controller: 0.0.0.0:${CLASH_API_PORT}
external-controller-cors:
  allow-origins:
    - "*"
  allow-private-network: true
secret: "{{SECRET}}"
external-ui: ./ui
external-ui-url: "${EXTERNAL_UI_URL}"

${GEODATA_URLS_YAML}
`;
