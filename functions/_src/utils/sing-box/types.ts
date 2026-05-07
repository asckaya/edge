import { LooseProxyNode } from '../proxy-node';
import { ResolvedSubscription } from '../subscription-parser';

export const MAIN_SELECTOR_TAG = '🚀 节点选择';
export const DOWNLOAD_SELECTOR_TAG = '📦 资源下载';
export const SELF_HOSTED_GROUP_TAG = 'Self-Hosted';
export const DIRECT_TAG = 'direct';
export const BLOCK_TAG = 'block';
export const LOCAL_DNS_TAG = 'local-dns';
export const REMOTE_DNS_TAG = 'remote-dns';
export const AUTO_SELECT_TAG = '♻️ 自动选择';

export type RuleSetKind = 'geosite' | 'geoip';

export interface RuleSetDefinition {
  kind: RuleSetKind;
  tag: string;
  remoteName?: string;
  url?: string;
  format?: 'binary' | 'source';
}

export interface RouteRuleDefinition {
  type?: 'logical';
  mode?: 'and' | 'or';
  rules?: any[];
  rule_set?: string | string[];
  domain_suffix?: string[];
  port?: number | number[];
  network?: string | string[];
  protocol?: string | string[];
  action: 'route' | 'reject' | 'sniff' | 'hijack-dns';
  outbound?: string;
}

export interface GroupDefinition {
  tag: string;
  layout: 'default' | 'direct-first' | 'block-first' | 'direct-only' | 'main-direct' | 'direct-main';
}

export interface BuildSingBoxOptions {
  secret: string;
  subscriptions: ResolvedSubscription[];
  customNodes: LooseProxyNode[];
  ghProxy?: string | null;
  isWhite?: boolean;
  isBlack?: boolean;
  isDual?: boolean;
}

export interface TaggedNode {
  tag: string;
  providerName: string;
  node: LooseProxyNode;
}

export interface ProviderSelector {
  providerName: string;
  selectTag: string;
  autoTag: string;
  nodeTags: string[];
}

export interface GeoLabelContext {
  ipCache: Map<string, Promise<string | null>>;
  countryCache: Map<string, Promise<string | null>>;
}
