import YAML from 'yaml';
import { Subscription } from '../types';
import { coerceProxyNode, coerceProxyNodes, LooseProxyNode } from './proxy-node';
import { parseProxyTextToNodes } from './proxy-parser';

export interface ResolvedSubscription extends Subscription {
  nodes: LooseProxyNode[];
}

const ALERT_KEYWORDS = [
  '订阅',
  '泄露',
  '账号安全',
  '重新',
  '导入',
  '失效',
  '过期',
  'warning',
  'alert',
  'expired',
  'invalid',
  'banned',
];

const BASE64_PATTERN = /^[A-Za-z0-9+/=_-\s]+$/;

function stripBom(input: string): string {
  return input.replace(/^\uFEFF/, '').trim();
}

function decodeBase64Text(input: string): string | null {
  const collapsed = input.replace(/\s+/g, '');
  if (!collapsed || collapsed.length < 16 || !BASE64_PATTERN.test(collapsed)) return null;

  const normalized = collapsed.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));

  try {
    const binary = atob(normalized + padding);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}


function applySingBoxTls(node: Record<string, unknown>, outbound: Record<string, unknown>, proto: string): void {
  const tls = outbound.tls as Record<string, unknown> | undefined;
  if (!tls || typeof tls !== 'object' || tls.enabled !== true) return;

  node.tls = true;
  if (tls.insecure) node['skip-cert-verify'] = true;
  if (Array.isArray(tls.alpn) && tls.alpn.length > 0) node.alpn = tls.alpn;

  if (tls.server_name) {
    if (proto === 'trojan' || proto === 'hysteria2' || proto === 'tuic') {
      node.sni = tls.server_name;
    } else {
      node.servername = tls.server_name;
    }
  }

  if (tls.utls && typeof tls.utls === 'object' && tls.utls.enabled === true) {
    node.utls = {
      enabled: true,
      ...(tls.utls.fingerprint ? { fingerprint: tls.utls.fingerprint } : {}),
    };
  }

  if (tls.reality && typeof tls.reality === 'object' && tls.reality.enabled === true) {
    node.security = 'reality';
    node['reality-opts'] = {
      'public-key': tls.reality.public_key || '',
      'short-id': tls.reality.short_id || '',
    };
  } else if (proto === 'vless') {
    node.security = 'tls';
  }
}

function applySingBoxTransport(node: Record<string, unknown>, outbound: Record<string, unknown>): void {
  const transport = outbound.transport as Record<string, unknown> | undefined;
  if (!transport || typeof transport !== 'object') return;

  if (transport.type === 'ws') {
    node.network = 'ws';
    node['ws-opts'] = {
      path: transport.path || '/',
      ...(transport.headers && typeof transport.headers === 'object' ? { headers: transport.headers } : {}),
    };
    return;
  }

  if (transport.type === 'grpc') {
    node.network = 'grpc';
    node['grpc-opts'] = {
      serviceName: transport.service_name || '',
    };
    return;
  }

  if (transport.type === 'http') {
    node.network = 'http';
    node['http-opts'] = {
      path: transport.path || '/',
      ...(transport.host ? { host: Array.isArray(transport.host) ? transport.host : [transport.host] } : {}),
    };
  }
}

function parseSingBoxOutbound(outbound: unknown): LooseProxyNode | null {
  if (!outbound || typeof outbound !== 'object') return null;

  const outboundObj = outbound as any;
  const rawType = String(outboundObj.type || '').toLowerCase();
  const tag = String(outboundObj.tag || '').trim();
  const server = outboundObj.server;
  const serverPort = outboundObj.server_port;

  if (!tag || !server || serverPort == null) return null;

  const node: Record<string, any> = {
    name: tag,
    type: rawType === 'shadowsocks' ? 'ss' : rawType,
    server: String(server),
    port: serverPort,
    udp: true,
  };

  if (rawType === 'hysteria2') {
    node.password = outboundObj.password || '';
    if (Array.isArray(outboundObj.server_ports) && outboundObj.server_ports.length > 0) {
      node.ports = outboundObj.server_ports.join(',');
    }
    if (outboundObj.obfs && typeof outboundObj.obfs === 'object') {
      node.obfs = outboundObj.obfs.type;
      if (outboundObj.obfs.password) node['obfs-password'] = outboundObj.obfs.password;
    }
  } else if (rawType === 'vless') {
    node.uuid = outboundObj.uuid || '';
    if (outboundObj.flow) node.flow = outboundObj.flow;
  } else if (rawType === 'vmess') {
    node.uuid = outboundObj.uuid || '';
    node.alterId = outboundObj.alter_id || 0;
    if (outboundObj.security) node.cipher = outboundObj.security;
  } else if (rawType === 'trojan') {
    node.password = outboundObj.password || '';
  } else if (rawType === 'shadowsocks') {
    node.cipher = outboundObj.method || '';
    node.password = outboundObj.password || '';
    if (outboundObj.plugin) node.plugin = outboundObj.plugin;
    if (outboundObj.plugin_opts) node['plugin-opts'] = outboundObj.plugin_opts;
  } else if (rawType === 'tuic') {
    node.uuid = outboundObj.uuid || '';
    node.password = outboundObj.password || '';
    if (outboundObj.congestion_control) node['congestion-controller'] = outboundObj.congestion_control;
    if (outboundObj.udp_relay_mode) node['udp-relay-mode'] = outboundObj.udp_relay_mode;
  } else if (rawType === 'anytls') {
    node.password = outboundObj.password || '';
    if (outboundObj.idle_session_check_interval) node.idle_session_check_interval = outboundObj.idle_session_check_interval;
    if (outboundObj.idle_session_timeout) node.idle_session_timeout = outboundObj.idle_session_timeout;
    if (outboundObj.min_idle_session != null) node.min_idle_session = outboundObj.min_idle_session;
  } else if (rawType === 'wireguard') {
    node['private-key'] = outboundObj.private_key || '';
    node['peer-public-key'] = outboundObj.peer_public_key || '';
    node['preshared-key'] = outboundObj.pre_shared_key || undefined;
    node.ip = outboundObj.local_address || outboundObj.address || '10.0.0.1/24';
    if (outboundObj.mtu) node.mtu = outboundObj.mtu;
    if (Array.isArray(outboundObj.reserved)) node.reserved = outboundObj.reserved;
  } else {
    return null;
  }

  applySingBoxTls(node, outboundObj, rawType);
  applySingBoxTransport(node, outboundObj);

  return coerceProxyNode(node);
}

function parseSingBoxOutbounds(input: unknown): LooseProxyNode[] {
  if (!input || typeof input !== 'object' || !Array.isArray((input as Record<string, unknown>).outbounds)) return [];
  return ((input as Record<string, unknown>).outbounds as unknown[])
    .map((outbound: unknown) => parseSingBoxOutbound(outbound))
    .filter((item: LooseProxyNode | null): item is LooseProxyNode => Boolean(item));
}

function parseStructuredProxyList(input: string): LooseProxyNode[] {
  try {
    const parsed = YAML.parse(input);

    if (Array.isArray(parsed)) {
      return coerceProxyNodes(parsed);
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.proxies)) {
      return coerceProxyNodes(parsed.proxies);
    }

    const singBoxOutbounds = parseSingBoxOutbounds(parsed);
    if (singBoxOutbounds.length > 0) {
      return singBoxOutbounds;
    }
  } catch {
    return [];
  }

  return [];
}

export function parseSubscriptionContent(input: string): LooseProxyNode[] {
  const raw = stripBom(input);
  if (!raw) return [];

  const structured = parseStructuredProxyList(raw);
  if (structured.length > 0) return structured;

  const decoded = decodeBase64Text(raw);
  if (decoded) {
    const decodedRaw = stripBom(decoded);
    if (decodedRaw) {
      const decodedStructured = parseStructuredProxyList(decodedRaw);
      if (decodedStructured.length > 0) return decodedStructured;

      const parsedText = parseProxyTextToNodes(decodedRaw);
      if (parsedText.nodes.length > 0) return parsedText.nodes;
    }
  }

  return parseProxyTextToNodes(raw).nodes;
}

function isLoopbackPlaceholderNode(node: LooseProxyNode): boolean {
  const server = String(node.server || '').trim().toLowerCase();
  const port = Number(node.port);
  return (server === '127.0.0.1' || server === 'localhost' || server === '::1') && port === 1;
}

function isAlertPlaceholderNode(node: LooseProxyNode): boolean {
  if (!isLoopbackPlaceholderNode(node)) return false;
  const name = String(node.name || '').trim().toLowerCase();
  return ALERT_KEYWORDS.some((keyword) => name.includes(keyword));
}

function collapseAlertSubscription(sub: Subscription, nodes: LooseProxyNode[]): LooseProxyNode[] {
  if (nodes.length === 0) return nodes;
  if (!nodes.every((node) => isAlertPlaceholderNode(node))) return nodes;

  return [{
    name: `⚠️ ${sub.name} 订阅失效`,
    type: 'ss',
    server: '127.0.0.1',
    port: 1,
    cipher: 'aes-128-gcm',
    password: '00000000-0000-0000-0000-000000000000',
    udp: false,
    __subscriptionAlert: true,
  } as LooseProxyNode];
}

export async function fetchSubscriptionNodes(
  subscriptions: Subscription[],
  userAgent: string,
): Promise<ResolvedSubscription[]> {
  return Promise.all(
    subscriptions.map(async (sub) => {
      const response = await fetch(sub.url, {
        headers: {
          'User-Agent': userAgent,
          Accept: '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch "${sub.name}" (${response.status})`);
      }

      const body = await response.text();
      const nodes = collapseAlertSubscription(sub, parseSubscriptionContent(body));

      return {
        ...sub,
        nodes,
      };
    }),
  );
}
