import { MIXED_PORT } from "../../src/utils/shared-constants";
import { GEODATA_URLS_YAML } from "../shared/geox";

export const configStashHeader = `ipv6: false
log-level: info
mixed-port: ${MIXED_PORT}
allow-lan: true
unified-delay: true
tcp-concurrent: true
geodata-mode: true

${GEODATA_URLS_YAML}
`;
