import { GEOX_CATEGORIES, GEOX_ALLOWED_WHITE, GEOX_ALLOWED_BLACK } from '../../_src/utils/rules-registry';

/**
 * Central registry for all GeoX (GEOSITE / GEOIP) tags used in the project.
 * Categorized for easy reference and reuse across Mihomo, Stash, and Sing-box.
 */

export const GEODATA_URLS = {
  geoip: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/geoip@release/geoip.dat",
  geosite: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
  mmdb: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb",
  asn: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb",
};

export const GEODATA_URLS_LITE = {
  geoip: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip-lite.dat",
  geosite: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite-lite.dat",
  mmdb: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/Country-lite.mmdb",
  asn: "https://testingcf.jsdelivr.net/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb",
};

export const GEOX_REGISTRY = GEOX_CATEGORIES;

export { 
  GEOX_ALLOWED_WHITE, 
  GEOX_ALLOWED_BLACK
};
