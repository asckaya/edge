import { LOCAL_DNS_TAG, REMOTE_DNS_TAG } from './types';

export function buildDns(tailscaleNodeName?: string): Record<string, unknown> {
  const dns: any = {
    servers: [
      { type: 'udp', tag: LOCAL_DNS_TAG, server: '223.5.5.5' },
      { type: 'https', tag: REMOTE_DNS_TAG, server: '1.12.12.12' },
    ],
    rules: [
      { rule_set: ['private', 'geolocation-cn', 'cn'], action: 'route', server: LOCAL_DNS_TAG },
      {
        rule_set: ['category-ai-chat-!cn', 'geolocation-!cn', 'category-dev', 'category-container', 'microsoft-dev', 'jetbrains', 'gitlab'],
        action: 'route',
        server: REMOTE_DNS_TAG,
      },
    ],
    final: REMOTE_DNS_TAG,
    strategy: 'prefer_ipv4',
    reverse_mapping: true,
  };

  if (tailscaleNodeName) {
    dns.servers.push({
      type: 'tailscale',
      tag: 'tailscale-dns',
      endpoint: tailscaleNodeName,
    });
    dns.rules.unshift({
      domain_suffix: ['.ts.net'],
      action: 'route',
      server: 'tailscale-dns',
    });
  }

  return dns;
}
