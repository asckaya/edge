interface ParserContext {
	name: string;
	hostname: string;
	port: string;
	mainPortNum: number | string;
	password: string;
}

type ProtocolParser = (url: URL, ctx: ParserContext) => Record<string, unknown>;

function decodeUserInfo(value: string): string {
	return decodeURIComponent(value);
}

// True if any of `keys` is present in the URL query with value "1" or "true".
function boolParam(url: URL, ...keys: string[]): boolean {
	for (const k of keys) {
		const v = url.searchParams.get(k);
		if (v === "1" || v === "true") return true;
	}
	return false;
}

// Optional boolean: returns true for "1"/"true", false for any other non-empty
// value, and undefined when the key is absent or empty. Used for booleans that
// distinguish "absent" from "explicitly false" (e.g. tailscale flags).
function optBoolParam(url: URL, key: string): boolean | undefined {
	const v = url.searchParams.get(key);
	if (v == null || v === "") return undefined;
	return v === "1" || v === "true";
}

// Returns the first present query value among `keys`, or undefined.
function strParam(url: URL, ...keys: string[]): string | undefined {
	for (const k of keys) {
		const v = url.searchParams.get(k);
		if (v != null && v !== "") return v;
	}
	return undefined;
}

// Splits a CSV query value into a string array, or undefined if absent.
function csvParam(url: URL, key: string): string[] | undefined {
	const v = url.searchParams.get(key);
	return v ? v.split(",") : undefined;
}

// Copy simple string query params to node fields. For each field name, reads
// the query param of the same name and sets `node[field] = value` when a
// non-empty value is present. Replaces the verbose
// `const x = url.searchParams.get('x'); if (x) node.x = x;` pattern.
function pickStr(url: URL, node: Record<string, unknown>, ...fields: string[]): void {
	for (const f of fields) {
		const v = url.searchParams.get(f);
		if (v) node[f] = v;
	}
}

// Parses the first present query value among `keys` as int if possible,
// otherwise returns the raw string. Returns undefined if no key is present.
function intOrStrParam(url: URL, ...keys: string[]): string | number | undefined {
	const v = strParam(url, ...keys);
	if (v == null) return undefined;
	const n = parseInt(v, 10);
	return Number.isNaN(n) ? v : n;
}

// Decodes a base64-encoded JSON string; falls back to the raw string on failure.
function decodeBase64JsonOrRaw(v: string): unknown {
	try {
		return JSON.parse(Buffer.from(v, "base64").toString("utf-8"));
	} catch {
		return v;
	}
}

function parseSip003PluginOpts(raw: string): Record<string, unknown> {
	const opts: Record<string, unknown> = {};
	for (const pair of raw.split(";")) {
		const trimmed = pair.trim();
		if (!trimmed) continue;
		const eq = trimmed.indexOf("=");
		if (eq === -1) {
			opts[trimmed] = "";
		} else {
			const key = trimmed.slice(0, eq).trim();
			const value = trimmed.slice(eq + 1).trim();
			if (key) opts[key] = value;
		}
	}
	return opts;
}

export const PROTOCOL_PARSERS: Record<string, ProtocolParser> = {
	tailscale: (url, { name, password }) => {
		const node: Record<string, unknown> = {
			name,
			type: "tailscale",
			"auth-key": decodeUserInfo(url.username) || password,
			"control-url": url.searchParams.get("control-url") || "https://controlplane.tailscale.com",
		};
		pickStr(url, node, "hostname", "state-dir", "exit-node");
		const acceptRoutes = optBoolParam(url, "accept-routes");
		if (acceptRoutes !== undefined) node["accept-routes"] = acceptRoutes;
		const ephemeral = optBoolParam(url, "ephemeral");
		if (ephemeral !== undefined) node.ephemeral = ephemeral;
		const exitNodeAllowLanAccess = optBoolParam(url, "exit-node-allow-lan-access");
		if (exitNodeAllowLanAccess !== undefined)
			node["exit-node-allow-lan-access"] = exitNodeAllowLanAccess;
		node.udp = url.searchParams.get("udp") !== "false";
		return node;
	},
	hysteria2: (url, { name, hostname, mainPortNum, password, port }) => {
		const node: Record<string, unknown> = {
			name,
			type: "hysteria2",
			server: hostname,
			port: mainPortNum,
			password,
			sni: url.searchParams.get("sni") || hostname,
			"skip-cert-verify": boolParam(url, "insecure"),
			udp: url.searchParams.get("udp") !== "false",
		};

		const alpn = csvParam(url, "alpn");
		if (alpn) node.alpn = alpn;

		const ports = url.searchParams.get("mport") || url.searchParams.get("ports") || port;
		if (ports?.includes("-")) node.ports = ports;

		const obfs = url.searchParams.get("obfs");
		if (obfs) {
			node.obfs = obfs;
			pickStr(url, node, "obfs-password");
		}

		pickStr(url, node, "up", "down", "hop-interval", "fingerprint");
		return node;
	},
	vless: (url, { name, hostname, mainPortNum }) => {
		const securityParam = url.searchParams.get("security") || "";
		const hasPbk = !!url.searchParams.get("pbk");
		const isReality = securityParam === "reality" || (securityParam === "" && hasPbk);
		const isTls = securityParam === "tls" || isReality;

		const node: Record<string, unknown> = {
			name,
			type: "vless",
			server: hostname,
			port: mainPortNum,
			uuid: decodeUserInfo(url.username),
			tls: isTls,
			"skip-cert-verify": boolParam(url, "allowInsecure", "insecure"),
			network: url.searchParams.get("type") || "tcp",
			udp: true,
		};

		const flow = url.searchParams.get("flow");
		if (flow) node.flow = flow;

		if (node.network === "ws") {
			const wsOpts: Record<string, unknown> = { path: url.searchParams.get("path") || "/" };
			const host = url.searchParams.get("host");
			if (host) wsOpts.headers = { Host: host };
			node["ws-opts"] = wsOpts;
		} else if (node.network === "grpc") {
			node["grpc-opts"] = { serviceName: url.searchParams.get("serviceName") || "" };
		}

		if (isReality) {
			node["reality-opts"] = {
				"public-key": url.searchParams.get("pbk") || "",
				"short-id": url.searchParams.get("sid") || "",
			};
		}
		pickStr(url, node, "flow", "packet-encoding");
		const fp = url.searchParams.get("fp") || url.searchParams.get("client-fingerprint");
		if (fp) node["client-fingerprint"] = fp;
		pickStr(url, node, "fingerprint");
		const sni = url.searchParams.get("sni");
		if (sni) node.servername = sni;
		const alpn = csvParam(url, "alpn");
		if (alpn) node.alpn = alpn;
		const smux = url.searchParams.get("smux");
		if (smux) node.smux = decodeBase64JsonOrRaw(smux);
		return node;
	},
	trojan: (url, { name, hostname, mainPortNum }) => {
		const node: Record<string, unknown> = {
			name,
			type: "trojan",
			server: hostname,
			port: mainPortNum,
			password: decodeUserInfo(url.username),
			"skip-cert-verify": boolParam(url, "insecure"),
			sni: url.searchParams.get("sni") || hostname,
			udp: true,
		};
		const alpn = csvParam(url, "alpn");
		if (alpn) node.alpn = alpn;
		const fp = url.searchParams.get("fp") || url.searchParams.get("client-fingerprint");
		if (fp) node["client-fingerprint"] = fp;
		const network = url.searchParams.get("type");
		if (network) {
			node.network = network;
			if (network === "ws") {
				const wsOpts: Record<string, unknown> = { path: url.searchParams.get("path") || "/" };
				const host = url.searchParams.get("host");
				if (host) wsOpts.headers = { Host: host };
				node["ws-opts"] = wsOpts;
			} else if (network === "grpc") {
				node["grpc-opts"] = { serviceName: url.searchParams.get("serviceName") || "" };
			}
		}
		const securityParam = url.searchParams.get("security");
		if (securityParam === "reality" || url.searchParams.get("pbk")) {
			node["reality-opts"] = {
				"public-key": url.searchParams.get("pbk") || "",
				"short-id": url.searchParams.get("sid") || "",
			};
		}
		const fingerprint = url.searchParams.get("fingerprint");
		if (fingerprint) node.fingerprint = fingerprint;
		const smux = url.searchParams.get("smux");
		if (smux) node.smux = decodeBase64JsonOrRaw(smux);
		return node;
	},
	ss: (url, { name, hostname, mainPortNum }) => {
		let method = "aes-256-gcm";
		let ssPassword = decodeUserInfo(url.password);
		const userPass = decodeUserInfo(url.username);

		if (!(userPass.includes(":") || ssPassword)) {
			const decoded = Buffer.from(userPass, "base64").toString("utf-8");
			if (decoded.includes(":")) {
				const parts = decoded.split(":");
				method = parts[0] as string;
				ssPassword = parts.slice(1).join(":");
			}
		} else if (userPass.includes(":")) {
			const parts = userPass.split(":");
			method = parts[0] as string;
			ssPassword = parts.slice(1).join(":");
		} else {
			method = userPass;
		}

		return {
			name,
			type: "ss",
			server: hostname,
			port: mainPortNum,
			cipher: method,
			password: ssPassword,
			udp: true,
			...(url.searchParams.get("plugin")
				? { plugin: url.searchParams.get("plugin") as string }
				: {}),
			...(() => {
				const rawOpts = url.searchParams.get("plugin-opts") || url.searchParams.get("plugin_opts");
				return rawOpts ? { "plugin-opts": parseSip003PluginOpts(rawOpts) } : {};
			})(),
			...(url.searchParams.get("udp-over-tcp") === "1" ? { "udp-over-tcp": true } : {}),
			...(url.searchParams.get("udp-over-tcp-version")
				? { "udp-over-tcp-version": url.searchParams.get("udp-over-tcp-version") as string }
				: {}),
			...(url.searchParams.get("smux")
				? (() => {
						const v = url.searchParams.get("smux") as string;
						return { smux: decodeBase64JsonOrRaw(v) };
					})()
				: {}),
		};
	},
	tuic: (url, { name, hostname, mainPortNum, password }) => {
		const node: Record<string, unknown> = {
			name,
			type: "tuic",
			server: hostname,
			port: mainPortNum,
			uuid: decodeUserInfo(url.username),
			password: decodeUserInfo(url.password) || password,
			sni: url.searchParams.get("sni") || hostname,
			"skip-cert-verify": boolParam(url, "insecure"),
			udp: true,
		};

		const alpn = csvParam(url, "alpn");
		if (alpn) node.alpn = alpn;

		const disableSni = url.searchParams.get("disable_sni") || url.searchParams.get("disable-sni");
		if (disableSni != null) node["disable-sni"] = disableSni === "1" || disableSni === "true";

		const reduceRtt = url.searchParams.get("reduce_rtt") || url.searchParams.get("reduce-rtt");
		if (reduceRtt != null) node["reduce-rtt"] = reduceRtt === "1" || reduceRtt === "true";

		const fastOpen = url.searchParams.get("fast_open") || url.searchParams.get("fast-open");
		if (fastOpen != null) node["fast-open"] = fastOpen === "1" || fastOpen === "true";

		const congestionController = url.searchParams.get("congestion_control");
		if (congestionController) node["congestion-controller"] = congestionController;

		const udpRelayMode = url.searchParams.get("udp_relay_mode");
		if (udpRelayMode) node["udp-relay-mode"] = udpRelayMode;

		pickStr(
			url,
			node,
			"ip",
			"heartbeat-interval",
			"request-timeout",
			"max-udp-relay-packet-size",
			"max-open-streams",
			"token",
		);

		return node;
	},
	wireguard: (url, { name, hostname, mainPortNum }) => {
		const node: Record<string, unknown> = {
			name,
			type: "wireguard",
			server: hostname,
			port: mainPortNum,
			"private-key": decodeUserInfo(url.username),
			"public-key": "",
			udp: true,
		};

		const ipParam = url.searchParams.get("ip");
		if (ipParam) {
			const ips = ipParam.split(",");
			node.ip = ips.length > 1 ? ips : ips[0];
		} else {
			node.ip = "10.0.0.1/24";
		}

		const pubKey =
			url.searchParams.get("public-key") ||
			url.searchParams.get("peer_public_key") ||
			url.searchParams.get("peer-public-key");
		if (pubKey) node["public-key"] = pubKey;

		const preshared =
			url.searchParams.get("preshared-key") || url.searchParams.get("preshared_key");
		if (preshared) node["preshared-key"] = preshared;

		const mtu = url.searchParams.get("mtu");
		if (mtu) node.mtu = parseInt(mtu, 10);

		const reservedParam = url.searchParams.get("reserved");
		if (reservedParam) {
			node.reserved = reservedParam.split(",").map((value) => parseInt(value, 10) || 0);
		}

		const allowedIps = url.searchParams.get("allowed-ips");
		if (allowedIps) node["allowed-ips"] = allowedIps.split(",");
		const ipv6 = url.searchParams.get("ipv6");
		if (ipv6) node.ipv6 = ipv6;
		const persistentKeepalive = url.searchParams.get("persistent-keepalive");
		if (persistentKeepalive) node["persistent-keepalive"] = persistentKeepalive;
		const remoteDnsResolve = url.searchParams.get("remote-dns-resolve");
		if (remoteDnsResolve === "1") node["remote-dns-resolve"] = true;
		const dns = url.searchParams.get("dns");
		if (dns) node.dns = dns.includes(",") ? dns.split(",") : dns;
		return node;
	},
	anytls: (url, { name, hostname, mainPortNum, password }) => {
		const node: Record<string, unknown> = {
			name,
			type: "anytls",
			server: hostname,
			port: mainPortNum,
			password: decodeUserInfo(url.username) || password,
			sni: url.searchParams.get("sni") || hostname,
			"skip-cert-verify": boolParam(url, "insecure"),
			udp: url.searchParams.get("udp") !== "false",
		};

		const alpn = csvParam(url, "alpn");
		if (alpn) {
			node.alpn = alpn;
		}

		const checkInterval = intOrStrParam(
			url,
			"idle-session-check-interval",
			"idle_session_check_interval",
		);
		if (checkInterval != null) node["idle-session-check-interval"] = checkInterval;

		const timeout = intOrStrParam(url, "idle-session-timeout", "idle_session_timeout");
		if (timeout != null) node["idle-session-timeout"] = timeout;

		const minIdle = intOrStrParam(url, "min-idle-session", "min_idle_session");
		if (minIdle != null) node["min-idle-session"] = minIdle;

		const fp =
			url.searchParams.get("client-fingerprint") ||
			url.searchParams.get("client_fingerprint") ||
			url.searchParams.get("fp");
		if (fp) {
			node["client-fingerprint"] = fp;
		}

		pickStr(url, node, "fingerprint");
		const smux = url.searchParams.get("smux");
		if (smux) node.smux = decodeBase64JsonOrRaw(smux);

		return node;
	},
	socks: (url, { name, hostname, mainPortNum, password }) => {
		const node: Record<string, unknown> = {
			name,
			type: "socks",
			server: hostname,
			port: mainPortNum,
			udp: true,
		};
		const user = decodeUserInfo(url.username);
		const pw = decodeUserInfo(url.password) || password;
		if (user) node.username = user;
		if (pw) node.password = pw;
		if (url.searchParams.get("tls") === "true") {
			node.tls = true;
			const sni = url.searchParams.get("sni");
			if (sni) node.sni = sni;
			if (boolParam(url, "insecure")) {
				node["skip-cert-verify"] = true;
			}
		}
		const fingerprint = url.searchParams.get("fingerprint");
		if (fingerprint) node.fingerprint = fingerprint;
		return node;
	},
	http: (url, { name, hostname, mainPortNum, password }) => {
		const node: Record<string, unknown> = {
			name,
			type: "http",
			server: hostname,
			port: mainPortNum,
			udp: true,
		};
		const user = decodeUserInfo(url.username);
		const pw = decodeUserInfo(url.password) || password;
		if (user) node.username = user;
		if (pw) node.password = pw;
		if (url.searchParams.get("tls") === "true") {
			node.tls = true;
			const sni = url.searchParams.get("sni");
			if (sni) node.sni = sni;
			if (boolParam(url, "insecure")) {
				node["skip-cert-verify"] = true;
			}
		}
		const headers = url.searchParams.get("headers");
		if (headers) node.headers = decodeBase64JsonOrRaw(headers);
		const fingerprint = url.searchParams.get("fingerprint");
		if (fingerprint) node.fingerprint = fingerprint;
		return node;
	},
	snell: (url, { name, hostname, mainPortNum, password }) => {
		const node: Record<string, unknown> = {
			name,
			type: "snell",
			server: hostname,
			port: mainPortNum,
			psk: decodeUserInfo(url.username) || password,
			udp: url.searchParams.get("udp") !== "false",
		};
		const version = url.searchParams.get("version");
		if (version) {
			const n = parseInt(version, 10);
			node.version = Number.isNaN(n) ? version : n;
		}
		if (url.searchParams.get("reuse") === "1") node.reuse = true;
		const userkey = url.searchParams.get("userkey");
		if (userkey) node.userkey = userkey;
		const mode = url.searchParams.get("mode");
		if (mode) node.mode = mode;
		const obfsOpts = url.searchParams.get("obfs-opts");
		if (obfsOpts) {
			node["obfs-opts"] = parseSip003PluginOpts(obfsOpts);
		}
		const fp = url.searchParams.get("fp") || url.searchParams.get("client-fingerprint");
		if (fp) node["client-fingerprint"] = fp;
		return node;
	},
	juicity: (url, { name, hostname, mainPortNum }) => {
		const node: Record<string, unknown> = {
			name,
			type: "juicity",
			server: hostname,
			port: mainPortNum,
			uuid: decodeUserInfo(url.username),
			password: decodeUserInfo(url.password),
			udp: true,
		};
		const sni = url.searchParams.get("sni") || url.searchParams.get("peer");
		if (sni) node.sni = sni;
		const alpn = csvParam(url, "alpn");
		if (alpn) node.alpn = alpn;
		const cc =
			url.searchParams.get("congestion_control") || url.searchParams.get("congestion-control");
		if (cc) node["congestion-control"] = cc;
		const pinned = url.searchParams.get("pinned_certchain_sha256");
		if (pinned) {
			node["pinned-certchain-sha256"] = pinned;
			node["server-cert-fingerprint"] = pinned;
		}
		if (boolParam(url, "allow_insecure", "allowInsecure", "skipVerify")) {
			node["skip-cert-verify"] = true;
		}
		return node;
	},
	naive: (url, { name, hostname, mainPortNum }) => {
		const node: Record<string, unknown> = {
			name,
			type: "naive",
			server: hostname,
			port: mainPortNum,
			udp: true,
		};
		const user = decodeUserInfo(url.username);
		const pw = decodeUserInfo(url.password);
		if (user) node.username = user;
		if (pw) node.password = pw;
		const sni = url.searchParams.get("sni") || url.searchParams.get("peer");
		if (sni) node.sni = sni;
		const cc = url.searchParams.get("cc") || url.searchParams.get("quic-congestion-control");
		if (cc) node["quic-congestion-control"] = cc;
		const ic = intOrStrParam(url, "insecure_concurrency", "insecure-concurrency");
		if (ic != null) node["insecure-concurrency"] = ic;
		if (
			url.searchParams.get("udp_over_tcp") === "1" ||
			url.searchParams.get("udp-over-tcp") === "1"
		) {
			node["udp-over-tcp"] = true;
		}
		const eh = url.searchParams.get("extra_headers") || url.searchParams.get("extra-headers");
		if (eh) node["extra-headers"] = decodeBase64JsonOrRaw(eh);
		// Scheme naive+quic:// vs naive+https:// — encode via protocol prefix in url.protocol.
		// The dispatcher passes the protocol; for naive+quic the builder emits `quic: true`.
		// We infer quic from URL scheme if present (set by dispatcher).
		return node;
	},
	masque: (url, { name, hostname, mainPortNum }) => {
		const node: Record<string, unknown> = {
			name,
			type: "masque",
			server: hostname,
			port: mainPortNum,
			"private-key": decodeUserInfo(url.username),
			"public-key": "",
			udp: true,
		};
		pickStr(url, node, "public-key", "ip", "ipv6");
		const mtu = intOrStrParam(url, "mtu");
		if (mtu != null) node.mtu = mtu;
		pickStr(url, node, "network", "sni");
		if (boolParam(url, "insecure")) node["skip-cert-verify"] = true;
		pickStr(url, node, "congestion-controller", "bbr-profile");
		const hsTimeout = strParam(url, "handshake-timeout");
		if (hsTimeout != null) node["handshake-timeout"] = hsTimeout;
		pickStr(url, node, "dialer-proxy");
		if (url.searchParams.get("remote-dns-resolve") === "1") node["remote-dns-resolve"] = true;
		const dns = url.searchParams.get("dns");
		if (dns) node.dns = dns.includes(",") ? dns.split(",") : dns;
		return node;
	},
	mieru: (url, { name, hostname, mainPortNum }) => {
		const node: Record<string, unknown> = {
			name,
			type: "mieru",
			server: hostname,
			port: mainPortNum,
			username: decodeUserInfo(url.username),
			password: decodeUserInfo(url.password),
			udp: true,
		};
		pickStr(
			url,
			node,
			"port-range",
			"transport",
			"multiplexing",
			"handshake-mode",
			"traffic-pattern",
		);
		return node;
	},
	trusttunnel: (url, { name, hostname, mainPortNum }) => {
		const node: Record<string, unknown> = {
			name,
			type: "trusttunnel",
			server: hostname,
			port: mainPortNum,
			username: decodeUserInfo(url.username),
			password: decodeUserInfo(url.password),
			udp: true,
		};
		if (url.searchParams.get("quic") === "1") node.quic = true;
		pickStr(url, node, "sni");
		const alpn = csvParam(url, "alpn");
		if (alpn) node.alpn = alpn;
		if (boolParam(url, "insecure")) node["skip-cert-verify"] = true;
		const fp = url.searchParams.get("fp");
		if (fp) node["client-fingerprint"] = fp;
		if (url.searchParams.get("health-check") === "1") node["health-check"] = true;
		pickStr(url, node, "name-cert-verify");
		const pinned = url.searchParams.get("pinned_certchain_sha256");
		if (pinned) node["server-cert-fingerprint"] = pinned;
		pickStr(url, node, "congestion-controller", "bbr-profile");
		const maxConns = intOrStrParam(url, "max-connections");
		if (maxConns != null) node["max-connections"] = maxConns;
		const minStreams = intOrStrParam(url, "min-streams");
		if (minStreams != null) node["min-streams"] = minStreams;
		const maxStreams = intOrStrParam(url, "max-streams");
		if (maxStreams != null) node["max-streams"] = maxStreams;
		return node;
	},
	shadowtls: (url, { name, hostname, mainPortNum }) => {
		const node: Record<string, unknown> = {
			name,
			type: "shadowtls",
			server: hostname,
			port: mainPortNum,
			udp: true,
		};
		const version = url.searchParams.get("version");
		if (version) {
			const n = parseInt(version, 10);
			node.version = Number.isNaN(n) ? version : n;
		}
		pickStr(url, node, "password", "sni", "detour");
		if (boolParam(url, "insecure")) node["skip-cert-verify"] = true;
		const pinned = url.searchParams.get("pinned_certchain_sha256");
		if (pinned) node["server-cert-fingerprint"] = pinned;
		return node;
	},
};
PROTOCOL_PARSERS.wg = PROTOCOL_PARSERS.wireguard as ProtocolParser;
PROTOCOL_PARSERS.shadowsocks = PROTOCOL_PARSERS.ss as ProtocolParser;
