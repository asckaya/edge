import * as v from "valibot";

export const BaseProxySchema = v.object({
	name: v.string(),
	type: v.string(),
	server: v.string(),
	port: v.union([v.number(), v.string()]),
	udp: v.optional(v.boolean(), true),
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
	"idle-session-check-interval": v.optional(v.union([v.number(), v.string()])),
	"idle-session-timeout": v.optional(v.union([v.number(), v.string()])),
	"min-idle-session": v.optional(v.union([v.number(), v.string()])),
	fingerprint: v.optional(v.string()),
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

export const ConfigTypeSchema = v.picklist(CONFIG_TYPES);
export type ConfigType = v.InferOutput<typeof ConfigTypeSchema>;

export const ConfigModeSchema = v.picklist(CONFIG_MODES);
export type ConfigMode = v.InferOutput<typeof ConfigModeSchema>;

export interface Subscription {
	name: string;
	url: string;
}

export const RequestParamsSchema = v.object({
	type: v.optional(ConfigTypeSchema, "mihomo"),
	mode: v.optional(ConfigModeSchema, "full"),
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
