import { BuildSingBoxOptions } from './types';
import { buildTaggedNodes } from './groups';
import { buildOutbounds } from './outbounds';
import { buildDns } from './dns';
import { buildRoute } from './route';

export async function buildSingBoxConfig(options: BuildSingBoxOptions): Promise<Record<string, unknown>> {
  const { secret, subscriptions, customNodes, ghProxy, isWhite = false, isBlack = false, isDual = false } = options;
  const tailscaleNodes = customNodes.filter(n => n.type === 'tailscale');
  const otherCustomNodes = customNodes.filter(n => n.type !== 'tailscale');

  const { taggedNodes, providerSelectors, selfHostedNodeTags, tailscaleNodeTags } = await buildTaggedNodes(subscriptions, otherCustomNodes, tailscaleNodes);

  if (taggedNodes.length === 0 && tailscaleNodes.length === 0) {
    throw new Error('No supported sing-box nodes were produced from the provided subscriptions or proxies.');
  }

  const outbounds = buildOutbounds(taggedNodes, providerSelectors, selfHostedNodeTags, tailscaleNodeTags, isWhite, isBlack, isDual);
  const dns = buildDns();
  const route = buildRoute([], isWhite, isBlack, ghProxy, isDual); // Note: ruleSets param is empty as buildRoute handles definitions internally

  if (tailscaleNodes.length > 0) {
    const tailscaleOutbound = tailscaleNodes[0].name;
    const activeRules = route.rules as any[];
    const updatedRules = activeRules.flatMap(r => {
      if (r.domain_suffix) {
        const suffixes = Array.isArray(r.domain_suffix) ? r.domain_suffix : [r.domain_suffix];
        if (suffixes.includes('ts.net')) {
          const tailscaleSuffixes = suffixes.filter(s => s === 'ts.net');
          const otherSuffixes = suffixes.filter(s => s !== 'ts.net');
          const rules = [];
          if (otherSuffixes.length > 0) {
            rules.push({ ...r, domain_suffix: otherSuffixes });
          }
          rules.push({ ...r, domain_suffix: tailscaleSuffixes, action: 'route', outbound: tailscaleOutbound });
          return rules;
        }
      }
      return [r];
    });

    route.rules = [
      { ip_cidr: ['100.64.0.0/10', 'fd7a:115c:a1e0::/48'], action: 'route', outbound: tailscaleOutbound },
      ...updatedRules
    ];
  }

  const config: Record<string, unknown> = {
    log: { level: 'info', timestamp: true },
    experimental: {
      clash_api: {
        external_controller: '0.0.0.0:9090',
        external_ui: 'zashboard',
        external_ui_download_url: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
        external_ui_download_detour: '🚀 节点选择',
        secret: secret,
        default_mode: 'rule',
      },
      cache_file: { enabled: true, store_fakeip: true },
    },
    dns,
    inbounds: [
      { type: 'mixed', tag: 'mixed-in', listen: '0.0.0.0', listen_port: 7897 },
    ],
    outbounds,
    route,
  };

  if (tailscaleNodes.length > 0) {
    const endpoints: any[] = [];
    tailscaleNodes.forEach(node => {
      const ep: any = {
        type: 'tailscale',
        tag: node.name,
        auth_key: node['auth-key'],
      };
      if (node.hostname) ep.hostname = node.hostname;
      if (node['control-url']) ep.control_url = node['control-url'];
      if (node['state-dir']) ep.state_directory = node['state-dir'];
      if (node['accept-routes'] !== undefined) ep.accept_routes = node['accept-routes'];
      if (node['exit-node']) ep.exit_node = node['exit-node'];
      if (node.ephemeral !== undefined) ep.ephemeral = node.ephemeral;
      endpoints.push(ep);
    });
    config.endpoints = endpoints;
  }

  return config;
}
