import { LOCAL_DNS_TAG, REMOTE_DNS_TAG } from './types';

export function buildDns(): Record<string, unknown> {
  return {
    servers: [
      { type: 'udp', tag: LOCAL_DNS_TAG, server: '223.5.5.5' },
      { type: 'tls', tag: REMOTE_DNS_TAG, server: '1.1.1.1' },
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
}
