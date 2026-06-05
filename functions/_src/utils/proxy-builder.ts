import { LooseProxyNode } from './proxy-node';
import { ProxyNode } from '../types';

type ProtocolBuilder = (p: LooseProxyNode, name: string) => string[];

const PROTOCOL_BUILDERS: Record<string, ProtocolBuilder> = {
  hysteria2: (p, name) => {
    const auth = p.password || p.auth || '';
    const server = p.server || '';
    const port = p.port || p.ports?.split('-')[0] || '443';
    const q = new URLSearchParams();
    if (p.sni) q.set('sni', p.sni);
    if (p.alpn) q.set('alpn', Array.isArray(p.alpn) ? p.alpn.join(',') : p.alpn);
    if (p['skip-cert-verify'] || p.insecure) q.set('insecure', '1');
    const portRange = p.ports || (typeof p.port === 'string' && p.port.includes('-') ? p.port : '');
    if (portRange) q.set('mport', portRange);
    q.set('udp', 'true');
    return [`hysteria2://${auth}@${server}:${port}?${q.toString()}#${name}`];
  },
  vless: (p, name) => {
    const uuid = p.uuid || '';
    const server = p.server || '';
    const port = p.port || '443';
    const q = new URLSearchParams();
    if (p.flow) q.set('flow', p.flow);
    if (p.network) q.set('type', p.network);
    if (p.sni || p.servername) q.set('sni', p.sni || p.servername);
    if (p.security) q.set('security', p.security);
    if (p['public-key'] || p['reality-opts']?.['public-key']) {
      q.set('pbk', p['public-key'] || p['reality-opts']['public-key']);
    }
    if (p['short-id'] || p['reality-opts']?.['short-id']) {
      q.set('sid', p['short-id'] || p['reality-opts']['short-id']);
    }
    if (p['client-fingerprint'] || p.client_fingerprint || p.fp) {
      q.set('fp', p['client-fingerprint'] || p.client_fingerprint || p.fp);
    }
    if (p['ws-opts']?.path) q.set('path', p['ws-opts'].path);
    if (p['grpc-opts']?.serviceName) q.set('serviceName', p['grpc-opts'].serviceName);
    return [`vless://${uuid}@${server}:${port}?${q.toString()}#${name}`];
  },
  trojan: (p, name) => {
    const pw = p.password || '';
    const server = p.server || '';
    const port = p.port || '443';
    const q = new URLSearchParams();
    if (p.sni) q.set('sni', p.sni);
    return [`trojan://${pw}@${server}:${port}?${q.toString()}#${name}`];
  },
  ss: (p, name) => {
    const cipher = p.cipher || 'aes-256-gcm';
    const pw = p.password || '';
    const server = p.server || '';
    const port = p.port || '443';
    const base64Auth = Buffer.from(`${cipher}:${pw}`).toString('base64');
    return [`ss://${base64Auth}@${server}:${port}#${name}`];
  },
  vmess: (p) => {
    const obj = {
      v: '2', ps: p.name,
      add: p.server, port: p.port,
      id: p.uuid, aid: p.alterId || '0',
      scy: p.cipher || 'auto',
      net: p.network || 'tcp',
      tls: p.tls ? 'tls' : '',
      sni: p.sni || p.servername || '',
      path: p['ws-opts']?.path || p.path || '',
      host: p['ws-opts']?.headers?.Host || p.host || '',
    };
    const base64Obj = Buffer.from(JSON.stringify(obj)).toString('base64');
    return [`vmess://${base64Obj}`];
  },
  tuic: (p, name) => {
    const uuid = p.uuid || '';
    const pw = p.password || '';
    const server = p.server || '';
    const port = p.port || '443';
    const q = new URLSearchParams();
    if (p.sni) q.set('sni', p.sni);
    if (p.alpn) q.set('alpn', Array.isArray(p.alpn) ? p.alpn.join(',') : p.alpn);
    if (p['congestion-controller']) q.set('congestion_control', p['congestion-controller']);
    if (p['udp-relay-mode']) q.set('udp_relay_mode', p['udp-relay-mode']);
    if (p.ip) q.set('ip', p.ip);
    if (p['skip-cert-verify']) q.set('insecure', '1');
    return [`tuic://${uuid}:${pw}@${server}:${port}?${q.toString()}#${name}`];
  },
  wireguard: (p, name) => {
    const privateKey = p['private-key'] || '';
    const server = p.server || '';
    const port = p.port || '443';
    const q = new URLSearchParams();
    if (p['peer-public-key'] || p['public-key']) q.set('peer_public_key', p['peer-public-key'] || p['public-key']);
    if (p['preshared-key']) q.set('preshared_key', p['preshared-key']);
    if (p.mtu) q.set('mtu', String(p.mtu));
    if (p.reserved) q.set('reserved', Array.isArray(p.reserved) ? p.reserved.join(',') : p.reserved);
    if (p.ip) q.set('ip', Array.isArray(p.ip) ? p.ip.join(',') : p.ip);
    return [`wireguard://${privateKey}@${server}:${port}?${q.toString()}#${name}`];
  },
  tailscale: (p, name) => {
    const authKey = p['auth-key'] || '';
    const q = new URLSearchParams();
    if (p.hostname) q.set('hostname', p.hostname);
    if (p['control-url']) q.set('control-url', p['control-url']);
    if (p['state-dir']) q.set('state-dir', p['state-dir']);
    if (p['accept-routes'] !== undefined) q.set('accept-routes', String(p['accept-routes']));
    if (p['exit-node']) q.set('exit-node', p['exit-node']);
    if (p.ephemeral !== undefined) q.set('ephemeral', String(p.ephemeral));
    q.set('udp', p.udp !== false ? 'true' : 'false');

    let host = 'controlplane.tailscale.com';
    if (p['control-url']) {
      try {
        const u = new URL(p['control-url']);
        host = u.host;
      } catch {}
    }
    return [`tailscale://${authKey}@${host}?${q.toString()}#${name}`];
  },
};

// Aliases
PROTOCOL_BUILDERS.wg = PROTOCOL_BUILDERS.wireguard;
PROTOCOL_BUILDERS.shadowsocks = PROTOCOL_BUILDERS.ss;

export function buildProxyUri(node: ProxyNode): string[] {
  const p = node as LooseProxyNode;
  const name = encodeURIComponent(p.name);
  const proto = p.type || '';

  const builder = PROTOCOL_BUILDERS[proto];
  if (builder) {
    return builder(p, name);
  }

  console.warn(`\x1b[33m⚠ Unknown protocol "${proto}" for proxy "${p.name}", skipping\x1b[0m`);
  return [];
}
