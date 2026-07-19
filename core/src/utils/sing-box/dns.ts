import { DNS_FAKEIP_RULE_SETS } from "../rules-registry";
import {
	DNS_LOCAL_SERVER,
	DNS_REMOTE_SERVER,
	FAKE_IP_RANGE_SINGBOX,
	PROXY_SELECTOR_TAG,
} from "../shared-constants";
import { FAKEIP_DNS_TAG, LOCAL_DNS_TAG, REMOTE_DNS_TAG } from "./types";

export function buildDns(tailscaleNodeName?: string): Record<string, unknown> {
	const dns: Record<string, unknown> = {
		servers: [
			{
				type: "udp",
				tag: LOCAL_DNS_TAG,
				server: DNS_LOCAL_SERVER,
				server_port: 53,
			},
			{
				type: "https",
				tag: REMOTE_DNS_TAG,
				server: DNS_REMOTE_SERVER,
				detour: PROXY_SELECTOR_TAG,
			},
			{
				type: "fakeip",
				tag: FAKEIP_DNS_TAG,
				inet4_range: FAKE_IP_RANGE_SINGBOX,
			},
		],
		rules: [
			{ rule_set: ["private", "geolocation-cn", "cn"], action: "route", server: LOCAL_DNS_TAG },
			{ domain_suffix: [".arpa"], action: "route", server: LOCAL_DNS_TAG },
			{
				query_type: ["A", "AAAA"],
				rule_set: DNS_FAKEIP_RULE_SETS,
				action: "route",
				server: FAKEIP_DNS_TAG,
			},
			{
				rule_set: DNS_FAKEIP_RULE_SETS,
				action: "route",
				server: REMOTE_DNS_TAG,
			},
			{
				query_type: ["A", "AAAA"],
				action: "route",
				server: FAKEIP_DNS_TAG,
			},
		],
		final: LOCAL_DNS_TAG,
		strategy: "ipv4_only",
		reverse_mapping: true,
		optimistic: {
			enabled: true,
			timeout: "3d",
		},
	};

	if (tailscaleNodeName) {
		(dns.servers as Record<string, unknown>[]).push({
			type: "tailscale",
			tag: "tailscale-dns",
			endpoint: tailscaleNodeName,
		});
		(dns.rules as Record<string, unknown>[]).unshift({
			domain_suffix: [".ts.net"],
			action: "route",
			server: "tailscale-dns",
		});
	}

	return dns;
}
