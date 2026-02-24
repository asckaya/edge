import worker from './index';
import fs from 'fs';

/**
 * Local Test Script for Subscription Converter (TypeScript)
 * 
 * Usage: 
 * bun local-test.ts
 */

const ResponseMock = class {
  body: string;
  init?: Record<string, any>;
  constructor(body: string, init?: Record<string, any>) {
    this.body = body;
    this.init = init;
  }
  async text(): Promise<string> {
    return this.body;
  }
} as unknown as typeof Response;

(globalThis as any).Response = (globalThis as any).Response || ResponseMock;

async function runLocalTest() {
  const vlessUri = 'vless://uuid@host:443?security=reality&sni=sni.com&fp=chrome&pbk=public_key&sid=short_id&type=grpc&serviceName=grpc_service#VLESS-Reality-gRPC';
  const trojanUri = 'trojan://password@host:443?sni=sni.com&security=tls#Trojan-TLS';
  const ssUri = 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@host:443#SS-Classic';
  const vmessUri = 'vmess://' + btoa(JSON.stringify({
    v: "2",
    ps: "VMess-WS-TLS",
    add: "host",
    port: "443",
    id: "uuid",
    aid: "0",
    scy: "auto",
    net: "ws",
    type: "none",
    host: "host.com",
    path: "/path",
    tls: "tls",
    sni: "sni.com"
  }));

  const hy2Uri = 'hysteria2://auth@host:20000-40000?sni=sni.com&insecure=1#SigHy2';
  
  const tuicUri = 'tuic://uuid:password@host:443?sni=sni.com&alpn=h3&congestion_control=bbr&udp_relay_mode=native#TUIC-Node';
  const wgUri = 'wireguard://private_key@host:443?public-key=peer_pub_key&ip=10.0.0.1%2F24&mtu=1420#WireGuard-Node';
  
  const customProxiesUri = [vlessUri, trojanUri, ssUri, vmessUri, hy2Uri, tuicUri, wgUri].join('\n');

  const params = [
    ['secret', 'my-custom-pass-789'],
    ['Provider1', 'https://example.com/sub1'],
    ['proxies', customProxiesUri]
  ];
  
  const queryString = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  
  console.log(`Testing with params: ${params.map(p => p.join('=')).join(', ')}`);

  const mockRequest = {
    url: `http://localhost/?${queryString}`,
    headers: new Map(),
  } as any;

  try {
    const response = await worker.fetch(mockRequest, {}, {});
    const content = await response.text();
    
    const outputFile = 'output.yaml';
    fs.writeFileSync(outputFile, content);
    
    console.log(`\x1b[32m✔ Success!\x1b[0m Result written to \x1b[36m${outputFile}\x1b[0m`);
    console.log('\n--- Preview (Proxy Groups) ---');
    
    const lines = content.split('\n');
    const start = lines.findIndex(l => l.startsWith('proxy-groups:'));
    if (start !== -1) {
      console.log(lines.slice(start, start + 25).join('\n'));
    }
    
  } catch (error) {
    console.error('\x1b[31m✘ Test Failed:\x1b[0m', error);
  }
}

runLocalTest();
