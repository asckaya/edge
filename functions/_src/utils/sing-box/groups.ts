import { LooseProxyNode } from '../proxy-node';
import { TaggedNode, GroupDefinition, MAIN_SELECTOR_TAG, DOWNLOAD_SELECTOR_TAG, SELF_HOSTED_GROUP_TAG, AUTO_SELECT_TAG, DIRECT_TAG, BLOCK_TAG } from './types';
import { REGION_DEFINITIONS, GROUP_DEFINITIONS } from './definitions';
import { buildGeoNodeLabel, createUniqueTag, extractCountryCodeFromName, getProviderFallbackCountryCode, normalizeProxyList } from './utils';
import { ResolvedSubscription } from '../subscription-parser';

export function buildRegionGroups(taggedNodes: TaggedNode[]): { tag: string; nodeTags: string[] }[] {
  const regionMap = new Map<string, string[]>();
  for (const region of REGION_DEFINITIONS) regionMap.set(region.code, []);
  for (const tagged of taggedNodes) {
    const code = extractCountryCodeFromName(tagged.node.name);
    if (code && regionMap.has(code)) regionMap.get(code)?.push(tagged.tag);
  }
  return REGION_DEFINITIONS.map((r) => ({ tag: r.tag, nodeTags: regionMap.get(r.code) || [] })).filter((g) => g.nodeTags.length > 0);
}

export function buildGroupChoices(providerSelectors: { selectTag: string; autoTag: string }[], regionGroups: { tag: string }[], selfHostedNodeTags: string[], allNodeTags: string[]) {
  const autoTags = providerSelectors.map((p) => p.autoTag);
  const selectTags = providerSelectors.map((p) => p.selectTag);
  const regionTags = regionGroups.map((g) => g.tag);
  const selfHostedTags = selfHostedNodeTags.length > 0 ? [SELF_HOSTED_GROUP_TAG] : [];
  const baseChoices = [AUTO_SELECT_TAG, ...regionTags, ...autoTags, ...selectTags, ...selfHostedTags, ...allNodeTags];
  return {
    mainChoices: [DOWNLOAD_SELECTOR_TAG, DIRECT_TAG, BLOCK_TAG, ...baseChoices],
    proxyChoices: [MAIN_SELECTOR_TAG, DIRECT_TAG, BLOCK_TAG, ...baseChoices],
    downloadChoices: [...autoTags, ...selectTags, ...selfHostedTags, DIRECT_TAG],
  };
}

export function buildSelector(tag: string, outbounds: string[], defaultTag?: string): Record<string, any> {
  const unique = Array.from(new Set(outbounds.filter(Boolean)));
  const s: Record<string, any> = { type: 'selector', tag, outbounds: unique };
  if (defaultTag && unique.includes(defaultTag)) s.default = defaultTag;
  return s;
}

export function buildUrlTest(tag: string, outbounds: string[]): Record<string, any> {
  return { type: 'urltest', tag, outbounds, url: 'https://www.gstatic.com/generate_204', interval: '5m', tolerance: 50, idle_timeout: '30m' };
}

export function buildGroupOutbounds(layout: GroupDefinition['layout'], proxyChoices: string[]): string[] {
  if (layout === 'direct-only' || layout === 'direct-main') return [DIRECT_TAG, MAIN_SELECTOR_TAG];
  if (layout === 'main-direct') return [MAIN_SELECTOR_TAG, DIRECT_TAG, ...proxyChoices.filter((t) => ![MAIN_SELECTOR_TAG, DIRECT_TAG, BLOCK_TAG].includes(t))];
  if (layout === 'direct-first') return [DIRECT_TAG, BLOCK_TAG, ...proxyChoices];
  if (layout === 'block-first') return [BLOCK_TAG, DIRECT_TAG, ...proxyChoices];
  return proxyChoices;
}

export async function buildTaggedNodes(subscriptions: ResolvedSubscription[], customNodes: LooseProxyNode[]) {
  const usedTags = new Set<string>([MAIN_SELECTOR_TAG, DOWNLOAD_SELECTOR_TAG, SELF_HOSTED_GROUP_TAG, AUTO_SELECT_TAG, ...REGION_DEFINITIONS.map((r) => r.tag), DIRECT_TAG, BLOCK_TAG, 'local-dns', 'remote-dns', ...GROUP_DEFINITIONS.map((g) => g.tag)]);
  const taggedNodes: TaggedNode[] = [];
  const providerSelectors: any[] = [];
  const context = { ipCache: new Map(), countryCache: new Map() };

  for (const sub of subscriptions) {
    const nodes = normalizeProxyList(sub.nodes);
    if (nodes.length === 0) continue;
    const selectTag = createUniqueTag(`📡 ${sub.name}`, usedTags);
    const autoTag = createUniqueTag(`⚡ ${sub.name} 自动选择`, usedTags);
    const fallback = await getProviderFallbackCountryCode(sub.url, context);
    const baseLabels = await Promise.all(nodes.map((n, i) => n.__subscriptionAlert ? Promise.resolve(String(n.name)) : buildGeoNodeLabel(sub.name, i + 1, n, fallback, context)));
    const nodeTags = nodes.map((n, i) => {
      const t = createUniqueTag(baseLabels[i], usedTags);
      taggedNodes.push({ tag: t, providerName: sub.name, node: n });
      return t;
    });
    providerSelectors.push({ providerName: sub.name, selectTag, autoTag, nodeTags });
  }

  const selfHostedNodeTags = normalizeProxyList(customNodes).map((n) => {
    const t = createUniqueTag(String(n.name), usedTags);
    taggedNodes.push({ tag: t, providerName: SELF_HOSTED_GROUP_TAG, node: n });
    return t;
  });

  return { taggedNodes, providerSelectors, selfHostedNodeTags };
}
