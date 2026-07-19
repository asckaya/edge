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

/**
 * Shared `geox-url:` YAML block (placeholder form) consumed by the mihomo and
 * stash header templates. The four URL placeholders are substituted by the
 * config builder at render time. Kept here so the two kernels cannot drift.
 */
export const GEODATA_URLS_YAML = `geox-url:
  geoip: "{{GEOIP_URL}}"
  geosite: "{{GEOSITE_URL}}"
  mmdb: "{{MMDB_URL}}"
  asn: "{{ASN_URL}}"`;
