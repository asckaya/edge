import { ProxyNode } from '../types';

export function buildProxyUri(node: ProxyNode): string[] {
  const p: any = node;
  const name = encodeURIComponent(p.name);
  const proto = p.type || '';

  if (proto === 'hysteria2') {
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
  }

  if (proto === 'vless') {
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
    if (p['ws-opts']?.path) q.set('path', p['ws-opts'].path);
    if (p['grpc-opts']?.serviceName) q.set('serviceName', p['grpc-opts'].serviceName);
    return [`vless://${uuid}@${server}:${port}?${q.toString()}#${name}`];
  }

  if (proto === 'trojan') {
    const pw = p.password || '';
    const server = p.server || '';
    const port = p.port || '443';
    const q = new URLSearchParams();
    if (p.sni) q.set('sni', p.sni);
    return [`trojan://${pw}@${server}:${port}?${q.toString()}#${name}`];
  }

  if (proto === 'ss' || proto === 'shadowsocks') {
    const cipher = p.cipher || 'aes-256-gcm';
    const pw = p.password || '';
    const server = p.server || '';
    const port = p.port || '443';
    return [`ss://${btoa(`${cipher}:${pw}`)}@${server}:${port}#${name}`];
  }

  if (proto === 'vmess') {
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
    return [`vmess://${btoa(JSON.stringify(obj))}`];
  }

  if (proto === 'tuic') {
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
  }

  if (proto === 'wireguard' || proto === 'wg') {
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
  }

  console.warn(`\x1b[33m⚠ Unknown protocol "${proto}" for proxy "${p.name}", skipping\x1b[0m`);
  return [];
}
