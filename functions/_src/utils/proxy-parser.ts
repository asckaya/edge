import YAML from 'yaml';
import { LooseProxyNode, coerceProxyNode } from './proxy-node';

interface ParserContext {
  name: string;
  hostname: string;
  port: string;
  mainPortNum: number | string;
  password: string;
}

type ProtocolParser = (url: URL, ctx: ParserContext) => Record<string, any>;

const PROTOCOL_PARSERS: Record<string, ProtocolParser> = {
  tailscale: (url, { name, password }) => {
    const node: Record<string, any> = {
      name,
      type: 'tailscale',
      'auth-key': url.username || password,
      'control-url': url.searchParams.get('control-url') || 'https://controlplane.tailscale.com',
    };
    const hostnameParam = url.searchParams.get('hostname');
    if (hostnameParam) node.hostname = hostnameParam;
    
    const stateDir = url.searchParams.get('state-dir');
    if (stateDir) node['state-dir'] = stateDir;
    
    const acceptRoutes = url.searchParams.get('accept-routes');
    if (acceptRoutes) node['accept-routes'] = acceptRoutes === 'true';
    
    const exitNode = url.searchParams.get('exit-node');
    if (exitNode) node['exit-node'] = exitNode;
    
    const ephemeral = url.searchParams.get('ephemeral');
    if (ephemeral) node.ephemeral = ephemeral === 'true';

    node.udp = url.searchParams.get('udp') !== 'false';
    return node;
  },
  hysteria2: (url, { name, hostname, mainPortNum, password, port }) => {
    const node: Record<string, any> = {
      name,
      type: 'hysteria2',
      server: hostname,
      port: mainPortNum,
      password,
      sni: url.searchParams.get('sni') || hostname,
      'skip-cert-verify': url.searchParams.get('insecure') === '1' || url.searchParams.get('insecure') === 'true',
      alpn: url.searchParams.get('alpn')?.split(',') || ['h3'],
      udp: url.searchParams.get('udp') !== 'false',
    };

    const ports = url.searchParams.get('mport') || url.searchParams.get('ports') || port;
    if (ports && ports.includes('-')) node.ports = ports;

    const obfs = url.searchParams.get('obfs');
    if (obfs) {
      node.obfs = obfs;
      const obfsPassword = url.searchParams.get('obfs-password');
      if (obfsPassword) node['obfs-password'] = obfsPassword;
    }
    return node;
  },
  vless: (url, { name, hostname, mainPortNum }) => {
    const node: Record<string, any> = {
      name,
      type: 'vless',
      server: hostname,
      port: mainPortNum,
      uuid: url.username,
      security: url.searchParams.get('security') || '',
      tls: url.searchParams.get('security') === 'tls' || url.searchParams.get('security') === 'reality',
      'skip-cert-verify': true,
      network: url.searchParams.get('type') || 'tcp',
      udp: true,
    };

    const flow = url.searchParams.get('flow');
    if (flow) node.flow = flow;

    if (node.network === 'ws') {
      node['ws-opts'] = { path: url.searchParams.get('path') || '/' };
      const host = url.searchParams.get('host');
      if (host) node['ws-opts'].headers = { Host: host };
    } else if (node.network === 'grpc') {
      node['grpc-opts'] = { serviceName: url.searchParams.get('serviceName') || '' };
    }

    if (node.security === 'reality') {
      node['reality-opts'] = {
        'public-key': url.searchParams.get('pbk') || '',
        'short-id': url.searchParams.get('sid') || '',
      };
    }
    const fingerprint = url.searchParams.get('fp') || url.searchParams.get('client-fingerprint');
    if (fingerprint) node['client-fingerprint'] = fingerprint;
    const sni = url.searchParams.get('sni');
    if (sni) node.servername = sni;
    return node;
  },
  trojan: (url, { name, hostname, mainPortNum }) => {
    return {
      name,
      type: 'trojan',
      server: hostname,
      port: mainPortNum,
      password: url.username,
      'skip-cert-verify': true,
      sni: url.searchParams.get('sni') || hostname,
      udp: true,
    };
  },
  ss: (url, { name, hostname, mainPortNum }) => {
    let method = 'aes-256-gcm';
    let ssPassword = url.password || '';
    const userPass = url.username;

    if (!userPass.includes(':') && !ssPassword) {
      try {
        const decoded = atob(userPass);
        if (decoded.includes(':')) {
          const parts = decoded.split(':');
          method = parts[0];
          ssPassword = parts.slice(1).join(':');
        }
      } catch {}
    } else if (userPass.includes(':')) {
      const parts = userPass.split(':');
      method = parts[0];
      ssPassword = parts.slice(1).join(':');
    } else {
      method = userPass;
    }

    return {
      name,
      type: 'ss',
      server: hostname,
      port: mainPortNum,
      cipher: method,
      password: ssPassword,
      udp: true,
    };
  },
  tuic: (url, { name, hostname, mainPortNum, password }) => {
    const node: Record<string, any> = {
      name,
      type: 'tuic',
      server: hostname,
      port: mainPortNum,
      uuid: url.username,
      password: url.password || password,
      sni: url.searchParams.get('sni') || hostname,
      alpn: url.searchParams.get('alpn')?.split(',') || ['h3'],
      'skip-cert-verify': url.searchParams.get('insecure') === '1' || url.searchParams.get('insecure') === 'true',
      'disable-sni': false,
      'reduce-rtt': true,
      'fast-open': true,
      udp: true,
    };

    const congestionController = url.searchParams.get('congestion_control');
    if (congestionController) node['congestion-controller'] = congestionController;

    const udpRelayMode = url.searchParams.get('udp_relay_mode');
    if (udpRelayMode) node['udp-relay-mode'] = udpRelayMode;

    const ip = url.searchParams.get('ip');
    if (ip) node.ip = ip;

    return node;
  },
  wireguard: (url, { name, hostname, mainPortNum }) => {
    const node: Record<string, any> = {
      name,
      type: 'wireguard',
      server: hostname,
      port: mainPortNum,
      'private-key': url.username,
      'public-key': 'default-placeholder-pub',
      udp: true,
    };

    const ipParam = url.searchParams.get('ip');
    if (ipParam) {
      const ips = ipParam.split(',');
      node.ip = ips.length > 1 ? ips : ips[0];
    } else {
      node.ip = '10.0.0.1/24';
    }

    const pubKey = url.searchParams.get('public-key') || url.searchParams.get('peer_public_key');
    if (pubKey) node['peer-public-key'] = pubKey;

    const preshared = url.searchParams.get('preshared-key') || url.searchParams.get('preshared_key');
    if (preshared) node['preshared-key'] = preshared;

    const mtu = url.searchParams.get('mtu');
    if (mtu) node.mtu = parseInt(mtu, 10);

    const reservedParam = url.searchParams.get('reserved');
    if (reservedParam) {
      node.reserved = reservedParam.split(',').map((value) => parseInt(value, 10) || 0);
    }
    return node;
  },
};
PROTOCOL_PARSERS.wg = PROTOCOL_PARSERS.wireguard;
PROTOCOL_PARSERS.shadowsocks = PROTOCOL_PARSERS.ss;

function formatRawLine(trimmedUri: string): string {
  return trimmedUri.startsWith('  -') ? trimmedUri : `  - ${trimmedUri}`;
}

export function parseProxyLine(line: string): { node?: LooseProxyNode; rawLine?: string } {
  const trimmedUri = line.trim();
  if (!trimmedUri) return {};

  if (!trimmedUri.includes('://') && !trimmedUri.startsWith('vmess://')) {
    return { rawLine: formatRawLine(trimmedUri) };
  }

  try {
    let node: Record<string, unknown> = {};

    if (trimmedUri.startsWith('vmess://')) {
      const vmessData = JSON.parse(atob(trimmedUri.replace('vmess://', '')));
      node = {
        name: vmessData.ps || 'VMess-Proxy',
        type: 'vmess',
        server: vmessData.add,
        port: vmessData.port,
        uuid: vmessData.id,
        alterId: vmessData.aid || 0,
        cipher: vmessData.scy || 'auto',
        udp: true,
        tls: vmessData.tls === 'tls',
        'skip-cert-verify': true,
      };
      if (vmessData.sni) node.servername = vmessData.sni;
      if (vmessData.net === 'ws') {
        node.network = 'ws';
        node['ws-opts'] = { path: vmessData.path || '/' };
        if (vmessData.host) node['ws-opts'].headers = { Host: vmessData.host };
      } else if (vmessData.net === 'grpc') {
        node.network = 'grpc';
        node['grpc-opts'] = { serviceName: vmessData.path || '' };
      }
    } else {
      let uriToParse = trimmedUri;
      const portRangeMatch = trimmedUri.match(/:(\d+-\d+)([\?#]|$)/);
      if (portRangeMatch) {
        uriToParse = trimmedUri.replace(portRangeMatch[1], '443');
      }

      const url = new URL(uriToParse);
      const protocol = url.protocol.replace(':', '');
      const name = decodeURIComponent(url.hash.substring(1)) || `${protocol.toUpperCase()}-Proxy`;
      const hostname = url.hostname;

      const port = portRangeMatch ? portRangeMatch[1] : (url.port || (protocol === 'vmess' ? '80' : '443'));
      const mainPort = port.includes('-') ? port.split('-')[0] : port;
      const mainPortNum = parseInt(mainPort, 10) || mainPort;
      const password = decodeURIComponent(url.username || url.password || url.searchParams.get('auth') || '');

      const parser = PROTOCOL_PARSERS[protocol];
      if (!parser) {
        return { rawLine: formatRawLine(trimmedUri) };
      }
      node = parser(url, { name, hostname, port, mainPortNum, password });
    }

    const validatedNode = coerceProxyNode(node);
    if (!validatedNode) return { rawLine: formatRawLine(trimmedUri) };
    return { node: validatedNode };
  } catch {
    return { rawLine: formatRawLine(trimmedUri) };
  }
}

export function parseProxyTextToNodes(uri: string): { nodes: LooseProxyNode[]; rawLines: string[] } {
  if (!uri) return { nodes: [], rawLines: [] };

  const uris = uri.split(/[|\n]/).filter((value) => value.trim());
  const nodes: LooseProxyNode[] = [];
  const rawLines: string[] = [];

  for (const value of uris) {
    const parsed = parseProxyLine(value);
    if (parsed.node) nodes.push(parsed.node);
    if (parsed.rawLine) rawLines.push(parsed.rawLine);
  }

  return { nodes, rawLines };
}

export function parseProxyUri(uri: string): string {
  if (!uri) return '';

  const { nodes, rawLines } = parseProxyTextToNodes(uri);
  return 'proxies:\n' +
    (nodes.length > 0 ? YAML.stringify(nodes).split('\n').map((line) => line ? `  ${line}` : line).join('\n') : '') +
    (rawLines.length > 0 ? '\n' + rawLines.join('\n') + '\n' : '');
}
