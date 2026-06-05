import * as v from 'valibot';

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
  alpn: v.optional(v.array(v.string())),
  ports: v.optional(v.string()),
  obfs: v.optional(v.string()),
  "obfs-password": v.optional(v.string()),
});

export const VlessSchema = v.object({
  ...BaseProxySchema.entries,
  type: v.literal("vless"),
  uuid: v.string(),
  tls: v.optional(v.boolean()),
  "skip-cert-verify": v.optional(v.boolean()),
  flow: v.optional(v.string()),
  network: v.optional(v.string()),
  "ws-opts": v.optional(v.any()),
  "grpc-opts": v.optional(v.any()),
  "reality-opts": v.optional(v.any()),
  servername: v.optional(v.string()),
});

export const TrojanSchema = v.object({
  ...BaseProxySchema.entries,
  type: v.literal("trojan"),
  password: v.string(),
  "skip-cert-verify": v.optional(v.boolean()),
  sni: v.optional(v.string()),
});

export const SsSchema = v.object({
  ...BaseProxySchema.entries,
  type: v.literal("ss"),
  cipher: v.string(),
  password: v.string(),
});

export const VmessSchema = v.object({
  ...BaseProxySchema.entries,
  type: v.literal("vmess"),
  uuid: v.string(),
  alterId: v.optional(v.union([v.number(), v.string()])),
  cipher: v.optional(v.string()),
  tls: v.optional(v.boolean()),
  "skip-cert-verify": v.optional(v.boolean()),
  network: v.optional(v.string()),
  "ws-opts": v.optional(v.any()),
  "grpc-opts": v.optional(v.any()),
  servername: v.optional(v.string()),
});

export const TuicSchema = v.object({
  ...BaseProxySchema.entries,
  type: v.literal("tuic"),
  uuid: v.string(),
  password: v.string(),
  sni: v.optional(v.string()),
  alpn: v.optional(v.array(v.string())),
  "disable-sni": v.optional(v.boolean()),
  "reduce-rtt": v.optional(v.boolean()),
  "fast-open": v.optional(v.boolean()),
  "udp-relay-mode": v.optional(v.string()),
  "congestion-controller": v.optional(v.string()),
  "skip-cert-verify": v.optional(v.boolean()),
  ip: v.optional(v.union([v.string(), v.array(v.string())])),
});

export const AnyTlsSchema = v.object({
  ...BaseProxySchema.entries,
  type: v.literal("anytls"),
  password: v.string(),
  "skip-cert-verify": v.optional(v.boolean()),
  sni: v.optional(v.string()),
  idle_session_check_interval: v.optional(v.string()),
  idle_session_timeout: v.optional(v.string()),
  min_idle_session: v.optional(v.union([v.number(), v.string()])),
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
]);

export type ProxyNode = v.InferOutput<typeof AnyProxySchema>;

export const ConfigTypeSchema = v.picklist([
  'mihomo', 'mihomo-white', 'mihomo-black', 'mihomo-dual',
  'stash', 'stash-white', 'stash-black', 'stash-dual',
  'sing-box', 'sing-box-white', 'sing-box-black', 'sing-box-dual'
]);
export type ConfigType = v.InferOutput<typeof ConfigTypeSchema>;

export interface Subscription {
  name: string;
  url: string;
}

export const RequestParamsSchema = v.object({
  type: v.optional(ConfigTypeSchema, 'mihomo'),
  secret: v.optional(v.string(), 'edge-default'),
  proxies: v.optional(v.string(), ''),
  gh_proxy: v.optional(v.pipe(v.string(), v.url())),
  subscriptions: v.optional(v.array(v.object({
    name: v.string(),
    url: v.pipe(v.string(), v.url()),
  })), []),
});

export type RequestParams = v.InferOutput<typeof RequestParamsSchema>;
