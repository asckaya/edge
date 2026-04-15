import { z } from 'zod';

export const BaseProxySchema = z.object({
  name: z.string(),
  type: z.string(),
  server: z.string(),
  port: z.union([z.number(), z.string()]),
  udp: z.boolean().default(true).optional(),
});

export const Hysteria2Schema = BaseProxySchema.extend({
  type: z.literal("hysteria2"),
  password: z.string(),
  sni: z.string().optional(),
  "skip-cert-verify": z.boolean().optional(),
  alpn: z.array(z.string()).optional(),
  ports: z.string().optional(),
  obfs: z.string().optional(),
  "obfs-password": z.string().optional(),
});

export const VlessSchema = BaseProxySchema.extend({
  type: z.literal("vless"),
  uuid: z.string(),
  tls: z.boolean().optional(),
  "skip-cert-verify": z.boolean().optional(),
  flow: z.string().optional(),
  network: z.string().optional(),
  "ws-opts": z.any().optional(),
  "grpc-opts": z.any().optional(),
  "reality-opts": z.any().optional(),
  servername: z.string().optional(),
});

export const TrojanSchema = BaseProxySchema.extend({
  type: z.literal("trojan"),
  password: z.string(),
  "skip-cert-verify": z.boolean().optional(),
  sni: z.string().optional(),
});

export const SsSchema = BaseProxySchema.extend({
  type: z.literal("ss"),
  cipher: z.string(),
  password: z.string(),
});

export const VmessSchema = BaseProxySchema.extend({
  type: z.literal("vmess"),
  uuid: z.string(),
  alterId: z.union([z.number(), z.string()]).optional(),
  cipher: z.string().optional(),
  tls: z.boolean().optional(),
  "skip-cert-verify": z.boolean().optional(),
  network: z.string().optional(),
  "ws-opts": z.any().optional(),
  "grpc-opts": z.any().optional(),
  servername: z.string().optional(),
});

export const TuicSchema = BaseProxySchema.extend({
  type: z.literal("tuic"),
  uuid: z.string(),
  password: z.string(),
  sni: z.string().optional(),
  alpn: z.array(z.string()).optional(),
  "disable-sni": z.boolean().optional(),
  "reduce-rtt": z.boolean().optional(),
  "fast-open": z.boolean().optional(),
  "udp-relay-mode": z.string().optional(),
  "congestion-controller": z.string().optional(),
  "skip-cert-verify": z.boolean().optional(),
  ip: z.union([z.string(), z.array(z.string())]).optional(),
});

export const WireguardSchema = BaseProxySchema.extend({
  type: z.literal("wireguard"),
  ip: z.union([z.string(), z.array(z.string())]),
  "public-key": z.string(),
  "private-key": z.string(),
  "peer-public-key": z.string().optional(),
  "preshared-key": z.string().optional(),
  reserved: z.array(z.number()).optional(),
  mtu: z.union([z.number(), z.string()]).optional(),
});

export const AnyProxySchema = z.discriminatedUnion("type", [
  Hysteria2Schema,
  VlessSchema,
  TrojanSchema,
  SsSchema,
  VmessSchema,
  TuicSchema,
  WireguardSchema,
]);

export type ProxyNode = z.infer<typeof AnyProxySchema>;

export interface Subscription {
  name: string;
  url: string;
}
