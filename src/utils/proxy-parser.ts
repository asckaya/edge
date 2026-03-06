import YAML from 'yaml';
import { AnyProxySchema, ProxyNode } from '../types';

export function parseProxyUri(uri: string): string {
  if (!uri) return '';

  const uris = uri.split(/[|\n]/).filter(u => u.trim());
  const parsedNodes: ProxyNode[] = [];
  const rawLines: string[] = [];

  for (const u of uris) {
    const trimmedUri = u.trim();
    if (!trimmedUri.includes('://') && !trimmedUri.startsWith('vmess://')) {
      rawLines.push(trimmedUri.startsWith('  -') ? trimmedUri : `  - ${trimmedUri}`);
      continue;
    }

    try {
      let node: any = {};

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

        node = {
          name,
          type: protocol,
          server: hostname,
          port: mainPortNum,
          udp: true,
        };

        if (protocol === 'hysteria2') {
          node.password = password;
          node.sni = url.searchParams.get('sni') || hostname;
          node['skip-cert-verify'] = url.searchParams.get('insecure') === '1' || url.searchParams.get('insecure') === 'true';
          node.alpn = url.searchParams.get('alpn')?.split(',') || ['h3'];
          node.udp = url.searchParams.get('udp') !== 'false';
          
          const ports = url.searchParams.get('mport') || url.searchParams.get('ports') || port;
          if (ports && ports.includes('-')) node.ports = ports;

          const obfs = url.searchParams.get('obfs');
          if (obfs) {
            node.obfs = obfs;
            const obfsPassword = url.searchParams.get('obfs-password');
            if (obfsPassword) node['obfs-password'] = obfsPassword;
          }
        } else if (protocol === 'vless') {
          node.uuid = url.username;
          node.tls = url.searchParams.get('security') === 'tls' || url.searchParams.get('security') === 'reality';
          node['skip-cert-verify'] = true;
          
          const flow = url.searchParams.get('flow');
          if (flow) node.flow = flow;

          const network = url.searchParams.get('type') || 'tcp';
          node.network = network;

          if (network === 'ws') {
            node['ws-opts'] = { path: url.searchParams.get('path') || '/' };
            const host = url.searchParams.get('host');
            if (host) node['ws-opts'].headers = { Host: host };
          } else if (network === 'grpc') {
            node['grpc-opts'] = { serviceName: url.searchParams.get('serviceName') || '' };
          }

          if (url.searchParams.get('security') === 'reality') {
            node['reality-opts'] = {
              'public-key': url.searchParams.get('pbk') || '',
              'short-id': url.searchParams.get('sid') || ''
            };
          }
          const sni = url.searchParams.get('sni');
          if (sni) node.servername = sni;

        } else if (protocol === 'trojan') {
          node.password = url.username;
          node['skip-cert-verify'] = true;
          node.sni = url.searchParams.get('sni') || hostname;

        } else if (protocol === 'ss') {
          let method = 'aes-256-gcm';
          let password = url.password || '';
          let userPass = url.username;

          if (!userPass.includes(':') && !password) {
            try {
              const decoded = atob(userPass);
              if (decoded.includes(':')) {
                const parts = decoded.split(':');
                method = parts[0];
                password = parts.slice(1).join(':');
              }
            } catch (e) {}
          } else if (userPass.includes(':')) {
            const parts = userPass.split(':');
            method = parts[0];
            password = parts.slice(1).join(':');
          } else {
            method = userPass;
          }
          node.cipher = method;
          node.password = password;

        } else if (protocol === 'tuic') {
          node.uuid = url.username;
          node.password = url.password || password; // Try URL native, otherwise fallback to `password` variable
          node.sni = url.searchParams.get('sni') || hostname;
          node.alpn = url.searchParams.get('alpn')?.split(',') || ['h3'];
          node['skip-cert-verify'] = url.searchParams.get('insecure') === '1' || url.searchParams.get('insecure') === 'true';
          
          const congestion_controller = url.searchParams.get('congestion_control');
          if (congestion_controller) node['congestion-controller'] = congestion_controller;
          
          const udp_relay_mode = url.searchParams.get('udp_relay_mode');
          if (udp_relay_mode) node['udp-relay-mode'] = udp_relay_mode;
          
          node['disable-sni'] = false;
          node['reduce-rtt'] = true;
          node['fast-open'] = true;
          
          const ip = url.searchParams.get('ip');
          if (ip) node.ip = ip;

        } else if (protocol === 'wireguard' || protocol === 'wg') {
          node.type = 'wireguard';
          node['private-key'] = url.username;
          
          const ipParam = url.searchParams.get('ip');
          if (ipParam) {
             const ips = ipParam.split(',');
             node.ip = ips.length > 1 ? ips : ips[0];
          } else {
             node.ip = '10.0.0.1/24'; // fallback string
          }
          
          const pubKey = url.searchParams.get('public-key') || url.searchParams.get('peer_public_key');
          if (pubKey) node['peer-public-key'] = pubKey;
          
          const preshared = url.searchParams.get('preshared-key') || url.searchParams.get('preshared_key');
          if (preshared) node['preshared-key'] = preshared;

          const mtu = url.searchParams.get('mtu');
          if (mtu) node.mtu = parseInt(mtu, 10);
          
          const reservedParam = url.searchParams.get('reserved');
          if (reservedParam) {
            node.reserved = reservedParam.split(',').map(r => parseInt(r, 10) || 0);
          }
          
          node['public-key'] = 'default-placeholder-pub';
        }
      }

      // Validating against Zod schema
      const validatedNode = AnyProxySchema.parse(node);
      parsedNodes.push(validatedNode);

    } catch (e) {
      // If it fails any kind of parsing (Invalid URL, Zod Schema mismatch, Base64 decode error)
      // gracefully append the raw line
      rawLines.push(trimmedUri.startsWith('  -') ? trimmedUri : `  - ${trimmedUri}`);
    }
  }

  const yamlResult = 'proxies:\n' + 
      (parsedNodes.length > 0 ? YAML.stringify(parsedNodes).split('\n').map(l => l ? `  ${l}` : l).join('\n') : '') +
      (rawLines.length > 0 ? '\n' + rawLines.join('\n') + '\n' : '');

  return yamlResult;
}
