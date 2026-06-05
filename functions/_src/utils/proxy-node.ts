import * as v from 'valibot';
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

  const keyMappings: Record<string, string> = {
    peer_public_key: 'peer-public-key',
    pre_shared_key: 'preshared-key',
    auth_key: 'auth-key',
    authKey: 'auth-key',
    control_url: 'control-url',
    controlUrl: 'control-url',
    state_dir: 'state-dir',
    stateDir: 'state-dir',
    accept_routes: 'accept-routes',
    acceptRoutes: 'accept-routes',
    exit_node: 'exit-node',
    exitNode: 'exit-node',
  };

  for (const [fromKey, toKey] of Object.entries(keyMappings)) {
    if (node[fromKey] !== undefined && node[toKey] === undefined) {
      node[toKey] = node[fromKey];
    }
  }

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

  const parsed = v.safeParse(AnyProxySchema, node);
  if (!parsed.success) return null;

  return {
    ...node,
    ...parsed.output,
  };
}

export function coerceProxyNodes(inputs: unknown[]): LooseProxyNode[] {
  return inputs.map((item) => coerceProxyNode(item)).filter((item): item is LooseProxyNode => Boolean(item));
}
