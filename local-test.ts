import worker from './index';
import fs from 'fs';

/**
 * Enhanced Local Test Script for Subscription Converter
 * Tests all available configuration types and multiple protocols.
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

async function runTests() {
  const customProxies = [
    'vless://uuid@host:443?security=reality&sni=sni.com&fp=chrome&pbk=public_key&sid=short_id&type=grpc&serviceName=grpc_service#VLESS-Reality-gRPC',
    'trojan://password@host:443?sni=sni.com&security=tls#Trojan-TLS',
    'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@host:443#SS-Classic',
    'vmess://' + btoa(JSON.stringify({ v: "2", ps: "VMess-WS-TLS", add: "host", port: "443", id: "uuid", aid: "0", scy: "auto", net: "ws", type: "none", host: "host.com", path: "/path", tls: "tls", sni: "sni.com" })),
    'hysteria2://auth@host:20000-40000?sni=sni.com&insecure=1#SigHy2',
    'tuic://uuid:password@host:443?sni=sni.com&alpn=h3&congestion_control=bbr&udp_relay_mode=native#TUIC-Node',
    'wireguard://private_key@host:443?public-key=peer_pub_key&ip=10.0.0.1%2F24&mtu=1420#WireGuard-Node'
  ].join('\n');

  const types = ['mihomo', 'stash', 'stash-mini'];
  
  console.log('🚀 Starting Edge local tests...');

  for (const type of types) {
    console.log(`\nTesting type: \x1b[36m${type}\x1b[0m`);
    
    const params = [
      ['type', type],
      ['secret', 'test-secret-123'],
      ['proxies', customProxies]
    ];
    
    const queryString = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const mockRequest = {
      url: `http://localhost/?${queryString}`,
      headers: new Map(),
    } as any;

    try {
      const response = await worker.fetch(mockRequest, {}, {});
      const content = await response.text();
      
      const fileName = `output-${type}.yaml`;
      fs.writeFileSync(fileName, content);
      
      console.log(`  \x1b[32m✔ Success!\x1b[0m Result written to \x1b[36m${fileName}\x1b[0m`);
      
      // Basic validation
      if (content.includes('not found')) {
        console.error(`  \x1b[31m✘ Error:\x1b[0m Potential undefined proxy reference found in output!`);
      }
      
      // Check for mandatory groups based on type
      const mandatoryGroups = type === 'stash-mini' ? 
        ['🚀 节点选择', '🛑 广告拦截', '🎬 流媒体'] : 
        ['🚀 节点选择', '🛑 广告拦截', '🎬 苹果视频', '🎬 流媒体'];
        
      for (const group of mandatoryGroups) {
        if (!content.includes(group)) {
          console.error(`  \x1b[31m✘ Error:\x1b[0m Mandatory group "${group}" missing in ${type}!`);
        }
      }

    } catch (error) {
      console.error(`  \x1b[31m✘ Test Failed for ${type}:\x1b[0m`, error);
    }
  }
  
  console.log('\n✨ All tests completed.');
}

runTests();
