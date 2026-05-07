import { BuildSingBoxOptions } from './types';
import { buildTaggedNodes } from './groups';
import { buildOutbounds } from './outbounds';
import { buildDns } from './dns';
import { buildRoute } from './route';

export async function buildSingBoxConfig(options: BuildSingBoxOptions): Promise<Record<string, unknown>> {
  const { secret, subscriptions, customNodes, ghProxy, isMinimal = false, isDual = false } = options;
  const { taggedNodes, providerSelectors, selfHostedNodeTags } = await buildTaggedNodes(subscriptions, customNodes);

  if (taggedNodes.length === 0) {
    throw new Error('No supported sing-box nodes were produced from the provided subscriptions or proxies.');
  }

  const outbounds = buildOutbounds(taggedNodes, providerSelectors, selfHostedNodeTags, isMinimal, isDual);
  const dns = buildDns();
  const route = buildRoute([], isMinimal, ghProxy, isDual); // Note: ruleSets param is empty as buildRoute handles definitions internally

  return {
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
      { type: 'mixed', tag: 'mixed-in', listen: '0.0.0.0', listen_port: 7897, sniff: true, set_system_proxy: false },
    ],
    outbounds,
    route,
  };
}
