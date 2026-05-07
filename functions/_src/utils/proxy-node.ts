import { AnyProxySchema, ProxyNode } from '../types';

export type LooseProxyNode = ProxyNode & Record<string, unknown>;

function normalizeType(type: unknown): string {
  const value = String(type || '').toLowerCase();
  if (value === 'shadowsocks') return 'ss';
  if (value === 'wg') return 'wireguard';
  return value;
}

function normalizePort(port: unknown): number | string | undefined {
  if (typeof port === 'number') return port;
  if (typeof port === 'string') {
    if (/^\d+$/.test(port)) return parseInt(port, 10);
    return port;
  }
  return undefined;
}

export function coerceProxyNode(input: unknown): LooseProxyNode | null {
  if (!input || typeof input !== 'object') return null;

  const node: Record<string, any> = { ...(input as any) };

  if (!node.name && node.tag) node.name = String(node.tag);
  if (node.server_port != null && node.port == null) node.port = node.server_port;
  if (node['peer_public_key'] && !node['peer-public-key']) node['peer-public-key'] = node['peer_public_key'];
  if (node['pre_shared_key'] && !node['preshared-key']) node['preshared-key'] = node['pre_shared_key'];

  node.type = normalizeType(node.type);
  node.port = normalizePort(node.port);

  if (node.type === 'hysteria2') {
    if (!node.port && typeof node.ports === 'string') {
      node.port = normalizePort(node.ports.split('-')[0]);
    }
    if (typeof node.port === 'string' && node.port.includes('-') && !node.ports) {
      node.ports = node.port;
      node.port = normalizePort(node.port.split('-')[0]);
    }
  }

  if (node.type === 'vless' && node.security === 'reality' && node.tls == null) {
    node.tls = true;
  }

  const parsed = AnyProxySchema.safeParse(node);
  if (!parsed.success) return null;

  return {
    ...node,
    ...parsed.data,
  };
}

export function coerceProxyNodes(inputs: unknown[]): LooseProxyNode[] {
  return inputs.map((item) => coerceProxyNode(item)).filter((item): item is LooseProxyNode => Boolean(item));
}
