import { buildMihomoConfig } from './functions/_src/utils/mihomo';

// Exact parameters from the user's URL
const params = {
  secret: 'ascka0410',
  BYG: 'https://xraguhtfe6.todust.cc/d66f9a949f40e2fb43af11bda9082e51',
  Kitty: 'https://conf1.hokkaido-toyoni.com/oosaka/918bcf56a2342ecec74fc2464850a46a',
  Glados: 'https://update.glados-config.com/mihomo/492724/1b90b54/100266/glados.yaml',
  proxies: 'hysteria2://ascka0410@edge.ascka.qzz.io:443?udp=true#SigHy2'
};

const subscriptions = [
  { name: 'BYG', url: params.BYG },
  { name: 'Kitty', url: params.Kitty },
  { name: 'Glados', url: params.Glados }
];

const customProxyNames = ['SigHy2'];
const customProxiesRaw = 'proxies:\n  - name: SigHy2\n    type: hysteria2\n    server: edge.ascka.qzz.io\n    port: 443\n    udp: true\n    password: ascka0410\n    sni: edge.ascka.qzz.io\n    alpn: [h3]';

const result = buildMihomoConfig({
  secret: params.secret,
  subscriptions,
  customProxies: customProxiesRaw,
  customProxyNames,
  ghProxy: '',
  isStash: false,
  isWhite: false,
  isBlack: false,
  isDual: false
});

console.log(result);
