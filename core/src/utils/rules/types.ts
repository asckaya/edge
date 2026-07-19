export type RuleSetKind = "geosite" | "geoip";

export interface GeoXCategory {
	geosite: string[];
	geoip?: string[];
}

export interface RuleSetDefinition {
	kind: RuleSetKind;
	tag: string;
	remoteName?: string;
	url?: string;
	format?: "binary" | "source";
}

export interface RouteRuleDefinition {
	type?: "logical";
	mode?: "and" | "or";
	rules?: RouteRuleDefinition[];
	rule_set?: string | string[];
	domain_suffix?: string[];
	port?: number | number[];
	network?: string | string[];
	protocol?: string | string[];
	action?: "route" | "reject" | "sniff" | "hijack-dns";
	outbound?: string;
	ip_cidr?: string[];
	no_resolve?: boolean;
	invert?: boolean;
}
