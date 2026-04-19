import YAML from 'yaml';
import { Subscription } from '../types';
import { coerceProxyNode, coerceProxyNodes, LooseProxyNode } from './proxy-node';
import { parseProxyTextToNodes } from './proxy-parser';

export interface ResolvedSubscription extends Subscription {
  nodes: LooseProxyNode[];
}

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

function looksLikeStructuredConfig(input: string): boolean {
  return (
    input.startsWith('proxies:') ||
    input.startsWith('- name:') ||
    input.startsWith('outbounds:') ||
    input.includes('"outbounds"') ||
    input.includes('\noutbounds:') ||
    input.startsWith('{') ||
    input.startsWith('[')
  );
}

function applySingBoxTls(node: Record<string, any>, outbound: Record<string, any>, proto: string): void {
  const tls = outbound.tls;
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

function applySingBoxTransport(node: Record<string, any>, outbound: Record<string, any>): void {
  const transport = outbound.transport;
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

function parseSingBoxOutbound(outbound: any): LooseProxyNode | null {
  if (!outbound || typeof outbound !== 'object') return null;

  const rawType = String(outbound.type || '').toLowerCase();
  const tag = String(outbound.tag || '').trim();
  const server = outbound.server;
  const serverPort = outbound.server_port;

  if (!tag || !server || serverPort == null) return null;

  const node: Record<string, any> = {
    name: tag,
    type: rawType === 'shadowsocks' ? 'ss' : rawType,
    server: String(server),
    port: serverPort,
    udp: true,
  };

  if (rawType === 'hysteria2') {
    node.password = outbound.password || '';
    if (Array.isArray(outbound.server_ports) && outbound.server_ports.length > 0) {
      node.ports = outbound.server_ports.join(',');
    }
    if (outbound.obfs && typeof outbound.obfs === 'object') {
      node.obfs = outbound.obfs.type;
      if (outbound.obfs.password) node['obfs-password'] = outbound.obfs.password;
    }
  } else if (rawType === 'vless') {
    node.uuid = outbound.uuid || '';
    if (outbound.flow) node.flow = outbound.flow;
  } else if (rawType === 'vmess') {
    node.uuid = outbound.uuid || '';
    node.alterId = outbound.alter_id || 0;
    if (outbound.security) node.cipher = outbound.security;
  } else if (rawType === 'trojan') {
    node.password = outbound.password || '';
  } else if (rawType === 'shadowsocks') {
    node.cipher = outbound.method || '';
    node.password = outbound.password || '';
    if (outbound.plugin) node.plugin = outbound.plugin;
    if (outbound.plugin_opts) node['plugin-opts'] = outbound.plugin_opts;
  } else if (rawType === 'tuic') {
    node.uuid = outbound.uuid || '';
    node.password = outbound.password || '';
    if (outbound.congestion_control) node['congestion-controller'] = outbound.congestion_control;
    if (outbound.udp_relay_mode) node['udp-relay-mode'] = outbound.udp_relay_mode;
  } else if (rawType === 'anytls') {
    node.password = outbound.password || '';
    if (outbound.idle_session_check_interval) node.idle_session_check_interval = outbound.idle_session_check_interval;
    if (outbound.idle_session_timeout) node.idle_session_timeout = outbound.idle_session_timeout;
    if (outbound.min_idle_session != null) node.min_idle_session = outbound.min_idle_session;
  } else if (rawType === 'wireguard') {
    node['private-key'] = outbound.private_key || '';
    node['peer-public-key'] = outbound.peer_public_key || '';
    node['preshared-key'] = outbound.pre_shared_key || undefined;
    node.ip = outbound.local_address || outbound.address || '10.0.0.1/24';
    if (outbound.mtu) node.mtu = outbound.mtu;
    if (Array.isArray(outbound.reserved)) node.reserved = outbound.reserved;
  } else {
    return null;
  }

  applySingBoxTls(node, outbound, rawType);
  applySingBoxTransport(node, outbound);

  return coerceProxyNode(node);
}

function parseSingBoxOutbounds(input: any): LooseProxyNode[] {
  if (!input || typeof input !== 'object' || !Array.isArray(input.outbounds)) return [];
  return input.outbounds
    .map((outbound: any) => parseSingBoxOutbound(outbound))
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
      const nodes = parseSubscriptionContent(body);

      return {
        ...sub,
        nodes,
      };
    }),
  );
}
