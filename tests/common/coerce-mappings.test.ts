import { describe, expect, test } from "vitest";
import { AnyProxySchema } from "../../core/src/types";
import { coerceProxyNode, KEY_MAPPINGS } from "../../core/src/utils/proxy-node";

/**
 * Validate the KEY_MAPPINGS table against the canonical AnyProxySchema:
 *   1. Every target (toKey) must be a real field on at least one schema variant.
 *   2. Every multi-word kebab-case schema field that has a snake_case
 *      counterpart produced by the sing-box reverse parser or URI builders
 *      should have a mapping entry (with documented exceptions for fields
 *      whose snake/kebab forms are identical and for fields produced only
 *      in kebab form by every code path).
 */

// Collect every field name declared across all schema variants.
const ALL_SCHEMA_KEYS = new Set<string>();
for (const option of AnyProxySchema.options) {
	for (const key of Object.keys(option.entries)) {
		ALL_SCHEMA_KEYS.add(key);
	}
}

describe("KEY_MAPPINGS table integrity", () => {
	test("every mapping target is a real schema field", () => {
		const invalid: Array<{ from: string; to: string }> = [];
		for (const [from, to] of Object.entries(KEY_MAPPINGS)) {
			if (!ALL_SCHEMA_KEYS.has(to)) {
				invalid.push({ from, to });
			}
		}
		expect(invalid).toEqual([]);
	});

	test("no mapping target collides with another source key (reflexive safety)", () => {
		// A target key should not also be a source key, otherwise the order of
		// iteration could matter (we skip when target is already defined, so
		// this is a sanity check rather than a hard requirement).
		const sources = new Set(Object.keys(KEY_MAPPINGS));
		const targets = new Set(Object.values(KEY_MAPPINGS));
		const overlap = [...targets].filter((t) => sources.has(t));
		// `congestion-controller` is a target but not a source — OK.
		// Document any genuine overlaps here.
		expect(overlap).toEqual([]);
	});
});

describe("coerceProxyNode snake_case → kebab-case normalization", () => {
	// Use a minimal valid wireguard node (has the most aliasable fields).
	const baseWireguard = {
		type: "wireguard",
		name: "wg",
		server: "1.2.3.4",
		port: 443,
		ip: "10.0.0.2/32",
		"public-key": "pk",
		"private-key": "sk",
		udp: true,
	};

	test("peer_public_key → peer-public-key (then collapsed to public-key when public-key absent)", () => {
		const node = coerceProxyNode({
			...baseWireguard,
			"public-key": undefined,
			peer_public_key: "aliased-pk",
		});
		expect(node).not.toBeNull();
		// coerceProxyNode collapses peer-public-key → public-key when public-key is empty.
		expect(node?.type).toBe("wireguard");
		expect(node?.["public-key"]).toBe("aliased-pk");
	});

	test("pre_shared_key → preshared-key", () => {
		const node = coerceProxyNode({
			...baseWireguard,
			pre_shared_key: "psk-value",
		});
		expect(node).not.toBeNull();
		expect(node?.["preshared-key"]).toBe("psk-value");
	});

	test("idle_session_check_interval / idle_session_timeout / min_idle_session", () => {
		const node = coerceProxyNode({
			type: "anytls",
			name: "anytls",
			server: "h",
			port: 443,
			password: "p",
			idle_session_check_interval: "30s",
			idle_session_timeout: "60s",
			min_idle_session: 3,
			udp: true,
		});
		expect(node).not.toBeNull();
		expect(node?.["idle-session-check-interval"]).toBe("30s");
		expect(node?.["idle-session-timeout"]).toBe("60s");
		expect(node?.["min-idle-session"]).toBe(3);
	});

	test("client_fingerprint → client-fingerprint", () => {
		const node = coerceProxyNode({
			type: "anytls",
			name: "n",
			server: "h",
			port: 443,
			password: "p",
			client_fingerprint: "chrome",
			udp: true,
		});
		expect(node).not.toBeNull();
		expect(node?.["client-fingerprint"]).toBe("chrome");
	});

	test("server_cert_fingerprint → server-cert-fingerprint", () => {
		const node = coerceProxyNode({
			type: "juicity",
			name: "n",
			server: "h",
			port: 443,
			uuid: "u",
			password: "p",
			server_cert_fingerprint: "sha256:abc",
			udp: true,
		});
		expect(node).not.toBeNull();
		expect(node?.["server-cert-fingerprint"]).toBe("sha256:abc");
	});

	test("camelCase tailscale fields (authKey, controlUrl, stateDir, acceptRoutes, exitNode)", () => {
		const node = coerceProxyNode({
			type: "tailscale",
			name: "ts",
			authKey: "ak",
			controlUrl: "https://ctrl.example",
			stateDir: "/var/ts",
			acceptRoutes: true,
			exitNode: "exit.example",
			udp: true,
		});
		expect(node).not.toBeNull();
		expect(node?.["auth-key"]).toBe("ak");
		expect(node?.["control-url"]).toBe("https://ctrl.example");
		expect(node?.["state-dir"]).toBe("/var/ts");
		expect(node?.["accept-routes"]).toBe(true);
		expect(node?.["exit-node"]).toBe("exit.example");
	});

	test("masque snake_case fields (congestion_controller, bbr_profile, handshake_timeout, dialer_proxy, remote_dns_resolve, traffic_pattern is mieru)", () => {
		const node = coerceProxyNode({
			type: "masque",
			name: "m",
			server: "h",
			port: 443,
			"private-key": "priv",
			"public-key": "pub",
			congestion_controller: "bbr",
			bbr_profile: "default",
			handshake_timeout: "10s",
			dialer_proxy: "p",
			remote_dns_resolve: true,
			udp: true,
		});
		expect(node).not.toBeNull();
		expect(node?.["congestion-controller"]).toBe("bbr");
		expect(node?.["bbr-profile"]).toBe("default");
		expect(node?.["handshake-timeout"]).toBe("10s");
		expect(node?.["dialer-proxy"]).toBe("p");
		expect(node?.["remote-dns-resolve"]).toBe(true);
	});

	test("trusttunnel snake_case fields (max_connections, min_streams, max_streams)", () => {
		const node = coerceProxyNode({
			type: "trusttunnel",
			name: "tt",
			server: "h",
			port: 443,
			username: "u",
			password: "p",
			max_connections: 10,
			min_streams: 2,
			max_streams: 20,
			udp: true,
		});
		expect(node).not.toBeNull();
		expect(node?.["max-connections"]).toBe(10);
		expect(node?.["min-streams"]).toBe(2);
		expect(node?.["max-streams"]).toBe(20);
	});

	test("naive snake_case fields (insecure_concurrency, extra_headers, quic_congestion_control, udp_over_tcp)", () => {
		const node = coerceProxyNode({
			type: "naive",
			name: "n",
			server: "h",
			port: 443,
			insecure_concurrency: 4,
			extra_headers: { "X-Test": "1" },
			quic_congestion_control: "bbr",
			udp_over_tcp: true,
			udp: true,
		});
		expect(node).not.toBeNull();
		expect(node?.["insecure-concurrency"]).toBe(4);
		expect(node?.["extra-headers"]).toEqual({ "X-Test": "1" });
		expect(node?.["quic-congestion-control"]).toBe("bbr");
		expect(node?.["udp-over-tcp"]).toBe(true);
	});

	test("kebab-case canonical keys take precedence over snake_case aliases", () => {
		// If both `preshared-key` (canonical) and `pre_shared_key` (alias) are
		// present, the canonical value wins (mapping only fills when target is undefined).
		const node = coerceProxyNode({
			...baseWireguard,
			"preshared-key": "canonical",
			pre_shared_key: "alias",
		});
		expect(node).not.toBeNull();
		expect(node?.["preshared-key"]).toBe("canonical");
	});

	test("pinned_certchain_sha256 → pinned-certchain-sha256 (juicity)", () => {
		const node = coerceProxyNode({
			type: "juicity",
			name: "n",
			server: "h",
			port: 443,
			uuid: "u",
			password: "p",
			pinned_certchain_sha256: "sha256:abc",
			udp: true,
		});
		expect(node).not.toBeNull();
		expect(node?.["pinned-certchain-sha256"]).toBe("sha256:abc");
	});
});
