import * as v from "valibot";

export const BaseProxySchema = v.object({
	name: v.string(),
	type: v.string(),
	server: v.string(),
	port: v.union([v.number(), v.string()]),
	udp: v.optional(v.boolean(), true),
	// mihomo BasicOption (`dialer-proxy`) and Stash 3.2.5+ accept this on any proxy.
	"dialer-proxy": v.optional(v.string()),
});

export const Hysteria2Schema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("hysteria2"),
	password: v.string(),
	sni: v.optional(v.string()),
	"skip-cert-verify": v.optional(v.boolean()),
	"name-cert-verify": v.optional(v.string()),
	alpn: v.optional(v.array(v.string())),
	ports: v.optional(v.string()),
	obfs: v.optional(v.string()),
	"obfs-password": v.optional(v.string()),
	up: v.optional(v.union([v.number(), v.string()])),
	down: v.optional(v.union([v.number(), v.string()])),
	"hop-interval": v.optional(v.string()),
	"fast-open": v.optional(v.boolean()),
	fingerprint: v.optional(v.string()),
	// mihomo-only tuning surface (hysteria2.en.md).
	"server-cert-fingerprint": v.optional(v.string()),
	"bbr-profile": v.optional(v.string()),
	cwnd: v.optional(v.union([v.number(), v.string()])),
	"udp-mtu": v.optional(v.union([v.number(), v.string()])),
	"handshake-timeout": v.optional(v.union([v.number(), v.string()])),
	"obfs-min-packet-size": v.optional(v.union([v.number(), v.string()])),
	"obfs-max-packet-size": v.optional(v.union([v.number(), v.string()])),
	"realm-opts": v.optional(v.unknown()),
	"ech-opts": v.optional(v.unknown()),
	"initial-stream-receive-window": v.optional(v.union([v.number(), v.string()])),
	"max-stream-receive-window": v.optional(v.union([v.number(), v.string()])),
	"initial-connection-receive-window": v.optional(v.union([v.number(), v.string()])),
	"max-connection-receive-window": v.optional(v.union([v.number(), v.string()])),
});

export const VlessSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("vless"),
	uuid: v.string(),
	tls: v.optional(v.boolean()),
	"skip-cert-verify": v.optional(v.boolean()),
	"name-cert-verify": v.optional(v.string()),
	flow: v.optional(v.string()),
	encryption: v.optional(v.string()),
	network: v.optional(v.string()),
	"ws-opts": v.optional(v.unknown()),
	"grpc-opts": v.optional(v.unknown()),
	"h2-opts": v.optional(v.unknown()),
	"reality-opts": v.optional(v.unknown()),
	servername: v.optional(v.string()),
	alpn: v.optional(v.array(v.string())),
	"packet-encoding": v.optional(v.string()),
	fingerprint: v.optional(v.string()),
	// mihomo transports/encodings for vless (transport.en.md).
	"xhttp-opts": v.optional(v.unknown()),
	"http-opts": v.optional(v.unknown()),
	"packet-addr": v.optional(v.boolean()),
	xudp: v.optional(v.boolean()),
	"ech-opts": v.optional(v.unknown()),
	smux: v.optional(v.unknown()),
});

export const TrojanSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("trojan"),
	password: v.string(),
	"skip-cert-verify": v.optional(v.boolean()),
	"name-cert-verify": v.optional(v.string()),
	sni: v.optional(v.string()),
	alpn: v.optional(v.array(v.string())),
	"client-fingerprint": v.optional(v.string()),
	network: v.optional(v.string()),
	"ws-opts": v.optional(v.unknown()),
	"grpc-opts": v.optional(v.unknown()),
	"h2-opts": v.optional(v.unknown()),
	"reality-opts": v.optional(v.unknown()),
	"ss-opts": v.optional(v.unknown()),
	fingerprint: v.optional(v.string()),
	smux: v.optional(v.unknown()),
});

export const SsSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("ss"),
	cipher: v.string(),
	password: v.string(),
	plugin: v.optional(v.string()),
	"plugin-opts": v.optional(v.record(v.string(), v.unknown())),
	"udp-over-tcp": v.optional(v.boolean()),
	"udp-over-tcp-version": v.optional(v.string()),
	"client-fingerprint": v.optional(v.string()),
	smux: v.optional(v.unknown()),
});

export const VmessSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("vmess"),
	uuid: v.string(),
	alterId: v.optional(v.union([v.number(), v.string()])),
	cipher: v.optional(v.string()),
	tls: v.optional(v.boolean()),
	"skip-cert-verify": v.optional(v.boolean()),
	"name-cert-verify": v.optional(v.string()),
	network: v.optional(v.string()),
	"ws-opts": v.optional(v.unknown()),
	"grpc-opts": v.optional(v.unknown()),
	"h2-opts": v.optional(v.unknown()),
	servername: v.optional(v.string()),
	alpn: v.optional(v.array(v.string())),
	"client-fingerprint": v.optional(v.string()),
	"packet-encoding": v.optional(v.string()),
	"global-padding": v.optional(v.boolean()),
	"authenticated-length": v.optional(v.boolean()),
	"reality-opts": v.optional(v.unknown()),
	fingerprint: v.optional(v.string()),
	// mihomo vmess extras (vmess.go).
	"packet-addr": v.optional(v.boolean()),
	xudp: v.optional(v.boolean()),
	"http-opts": v.optional(v.unknown()),
	"mkcp-opts": v.optional(v.unknown()),
	"mekya-opts": v.optional(v.unknown()),
	"tlsmirror-opts": v.optional(v.unknown()),
	"shadow-tls-opts": v.optional(v.unknown()),
	"restls-opts": v.optional(v.unknown()),
	"jls-opts": v.optional(v.unknown()),
	"ech-opts": v.optional(v.unknown()),
	smux: v.optional(v.unknown()),
});

export const TuicSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("tuic"),
	uuid: v.optional(v.string()),
	password: v.optional(v.string()),
	token: v.optional(v.union([v.string(), v.array(v.string())])),
	sni: v.optional(v.string()),
	alpn: v.optional(v.array(v.string())),
	"disable-sni": v.optional(v.boolean()),
	"reduce-rtt": v.optional(v.boolean()),
	"fast-open": v.optional(v.boolean()),
	"udp-relay-mode": v.optional(v.string()),
	"udp-over-stream": v.optional(v.boolean()),
	"congestion-controller": v.optional(v.string()),
	"skip-cert-verify": v.optional(v.boolean()),
	"name-cert-verify": v.optional(v.string()),
	ip: v.optional(v.union([v.string(), v.array(v.string())])),
	"heartbeat-interval": v.optional(v.union([v.number(), v.string()])),
	"request-timeout": v.optional(v.union([v.number(), v.string()])),
	"max-udp-relay-packet-size": v.optional(v.union([v.number(), v.string()])),
	"max-open-streams": v.optional(v.union([v.number(), v.string()])),
	// mihomo/stash tuning knobs (tuic.go, tuic.en.md).
	"udp-over-stream-version": v.optional(v.union([v.number(), v.string()])),
	"bbr-profile": v.optional(v.string()),
	cwnd: v.optional(v.union([v.number(), v.string()])),
	"recv-window-conn": v.optional(v.union([v.number(), v.string()])),
	"recv-window": v.optional(v.union([v.number(), v.string()])),
	"disable-mtu-discovery": v.optional(v.boolean()),
	"max-datagram-frame-size": v.optional(v.union([v.number(), v.string()])),
	"ech-opts": v.optional(v.unknown()),
});

export const AnyTlsSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("anytls"),
	password: v.string(),
	"skip-cert-verify": v.optional(v.boolean()),
	"name-cert-verify": v.optional(v.string()),
	sni: v.optional(v.string()),
	alpn: v.optional(v.array(v.string())),
	"client-fingerprint": v.optional(v.string()),
	"reality-opts": v.optional(v.unknown()),
	"idle-session-check-interval": v.optional(v.union([v.number(), v.string()])),
	"idle-session-timeout": v.optional(v.union([v.number(), v.string()])),
	"min-idle-session": v.optional(v.union([v.number(), v.string()])),
	fingerprint: v.optional(v.string()),
	// mihomo anytls extras (anytls.go); REALITY is NOT one of them.
	"disable-reuse": v.optional(v.boolean()),
	"client-metadata": v.optional(v.unknown()),
	smux: v.optional(v.unknown()),
});

export const WireguardSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("wireguard"),
	ip: v.union([v.string(), v.array(v.string())]),
	"public-key": v.string(),
	"private-key": v.string(),
	"peer-public-key": v.optional(v.string()),
	"preshared-key": v.optional(v.string()),
	reserved: v.optional(v.array(v.number())),
	mtu: v.optional(v.union([v.number(), v.string()])),
	"allowed-ips": v.optional(v.array(v.string())),
	ipv6: v.optional(v.string()),
	"persistent-keepalive": v.optional(v.union([v.number(), v.string()])),
	"remote-dns-resolve": v.optional(v.boolean()),
	dns: v.optional(v.union([v.string(), v.array(v.string())])),
	// mihomo wireguard.go extras (single-peer flat form is embedded too).
	peers: v.optional(v.unknown()),
	workers: v.optional(v.union([v.number(), v.string()])),
	"ip-stack": v.optional(v.string()),
	"amnezia-wg-option": v.optional(v.unknown()),
	"refresh-server-ip-interval": v.optional(v.union([v.number(), v.string()])),
});

export const TailscaleSchema = v.object({
	name: v.string(),
	type: v.literal("tailscale"),
	hostname: v.optional(v.string()),
	"auth-key": v.string(),
	"control-url": v.optional(v.string(), "https://controlplane.tailscale.com"),
	"state-dir": v.optional(v.string()),
	udp: v.optional(v.boolean(), true),
	"accept-routes": v.optional(v.boolean()),
	"exit-node": v.optional(v.string()),
	ephemeral: v.optional(v.boolean()),
	"exit-node-allow-lan-access": v.optional(v.boolean()),
});

export const SocksSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("socks"),
	username: v.optional(v.string()),
	password: v.optional(v.string()),
	tls: v.optional(v.boolean()),
	"skip-cert-verify": v.optional(v.boolean()),
	"name-cert-verify": v.optional(v.string()),
	sni: v.optional(v.string()),
	fingerprint: v.optional(v.string()),
});

export const HttpSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("http"),
	username: v.optional(v.string()),
	password: v.optional(v.string()),
	tls: v.optional(v.boolean()),
	"skip-cert-verify": v.optional(v.boolean()),
	"name-cert-verify": v.optional(v.string()),
	sni: v.optional(v.string()),
	path: v.optional(v.string()),
	headers: v.optional(v.unknown()),
	fingerprint: v.optional(v.string()),
});

export const SnellSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("snell"),
	psk: v.string(),
	version: v.optional(v.union([v.number(), v.string()])),
	reuse: v.optional(v.boolean()),
	userkey: v.optional(v.string()),
	mode: v.optional(v.string()),
	"obfs-opts": v.optional(v.unknown()),
	"client-fingerprint": v.optional(v.string()),
	"server-cert-fingerprint": v.optional(v.string()),
});

export const JuicitySchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("juicity"),
	uuid: v.string(),
	password: v.string(),
	sni: v.optional(v.string()),
	alpn: v.optional(v.array(v.string())),
	"skip-cert-verify": v.optional(v.boolean()),
	"server-cert-fingerprint": v.optional(v.string()),
	"pinned-certchain-sha256": v.optional(v.string()),
	"congestion-control": v.optional(v.string()),
});

export const NaiveSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("naive"),
	username: v.optional(v.string()),
	password: v.optional(v.string()),
	quic: v.optional(v.boolean()),
	"quic-congestion-control": v.optional(v.string()),
	"insecure-concurrency": v.optional(v.union([v.number(), v.string()])),
	"extra-headers": v.optional(v.unknown()),
	"udp-over-tcp": v.optional(v.unknown()),
	sni: v.optional(v.string()),
	"skip-cert-verify": v.optional(v.boolean()),
	"server-cert-fingerprint": v.optional(v.string()),
});

export const MasqueSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("masque"),
	"private-key": v.string(),
	"public-key": v.string(),
	ip: v.optional(v.string()),
	ipv6: v.optional(v.string()),
	mtu: v.optional(v.union([v.number(), v.string()])),
	network: v.optional(v.string()),
	sni: v.optional(v.string()),
	"skip-cert-verify": v.optional(v.boolean()),
	"congestion-controller": v.optional(v.string()),
	"bbr-profile": v.optional(v.string()),
	"handshake-timeout": v.optional(v.union([v.number(), v.string()])),
	"dialer-proxy": v.optional(v.string()),
	"remote-dns-resolve": v.optional(v.boolean()),
	dns: v.optional(v.union([v.string(), v.array(v.string())])),
	// mihomo masque extras (masque.go).
	uri: v.optional(v.string()),
	cwnd: v.optional(v.union([v.number(), v.string()])),
	"ip-stack": v.optional(v.string()),
});

export const MieruSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("mieru"),
	username: v.string(),
	password: v.string(),
	"port-range": v.optional(v.string()),
	transport: v.optional(v.string()),
	multiplexing: v.optional(v.string()),
	"handshake-mode": v.optional(v.string()),
	"traffic-pattern": v.optional(v.string()),
});

export const TrusttunnelSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("trusttunnel"),
	username: v.string(),
	password: v.string(),
	quic: v.optional(v.boolean()),
	sni: v.optional(v.string()),
	alpn: v.optional(v.array(v.string())),
	"skip-cert-verify": v.optional(v.boolean()),
	"client-fingerprint": v.optional(v.string()),
	"health-check": v.optional(v.boolean()),
	"name-cert-verify": v.optional(v.string()),
	"server-cert-fingerprint": v.optional(v.string()),
	"congestion-controller": v.optional(v.string()),
	"bbr-profile": v.optional(v.string()),
	"max-connections": v.optional(v.union([v.number(), v.string()])),
	"min-streams": v.optional(v.union([v.number(), v.string()])),
	"max-streams": v.optional(v.union([v.number(), v.string()])),
	cwnd: v.optional(v.union([v.number(), v.string()])),
});

export const ShadowtlsSchema = v.object({
	...BaseProxySchema.entries,
	type: v.literal("shadowtls"),
	version: v.optional(v.union([v.number(), v.string()])),
	password: v.optional(v.string()),
	sni: v.optional(v.string()),
	"skip-cert-verify": v.optional(v.boolean()),
	detour: v.optional(v.string()),
	"server-cert-fingerprint": v.optional(v.string()),
});

export const AnyProxySchema = v.variant("type", [
	Hysteria2Schema,
	VlessSchema,
	TrojanSchema,
	SsSchema,
	VmessSchema,
	TuicSchema,
	AnyTlsSchema,
	WireguardSchema,
	TailscaleSchema,
	SocksSchema,
	HttpSchema,
	SnellSchema,
	JuicitySchema,
	NaiveSchema,
	MasqueSchema,
	MieruSchema,
	TrusttunnelSchema,
	ShadowtlsSchema,
]);

export type ProxyNode = v.InferOutput<typeof AnyProxySchema>;

export const CONFIG_TYPES = ["mihomo", "stash", "sing-box"] as const;
export const CONFIG_MODES = ["full", "dual", "white", "black"] as const;
export const CONFIG_RULES = ["category", "granular"] as const;

export const ConfigTypeSchema = v.picklist(CONFIG_TYPES);
export type ConfigType = v.InferOutput<typeof ConfigTypeSchema>;

export const ConfigModeSchema = v.picklist(CONFIG_MODES);
export type ConfigMode = v.InferOutput<typeof ConfigModeSchema>;

export const ConfigRulesSchema = v.picklist(CONFIG_RULES);
export type ConfigRules = v.InferOutput<typeof ConfigRulesSchema>;

export interface Subscription {
	name: string;
	url: string;
}

export const RequestParamsSchema = v.object({
	type: v.optional(ConfigTypeSchema, "mihomo"),
	mode: v.optional(ConfigModeSchema, "full"),
	rules: v.optional(ConfigRulesSchema, "category"),
	secret: v.optional(v.string(), "edge-default"),
	proxies: v.optional(v.string(), ""),
	gh_proxy: v.optional(v.union([v.literal(""), v.pipe(v.string(), v.url())]), ""),
	subscriptions: v.optional(
		v.array(
			v.object({
				name: v.string(),
				url: v.pipe(v.string(), v.url()),
			}),
		),
		[],
	),
});
