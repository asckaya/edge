import { GroupDefinition } from './types';
import { GROUP_TAGS, SCENARIO_GROUPS } from '../shared-constants';
import { RULE_SET_DEFINITIONS as REGISTRY_RULE_SET_DEFINITIONS, ROUTE_RULES as REGISTRY_ROUTE_RULES } from '../rules-registry';

export const REGION_DEFINITIONS: Array<{ code: string; tag: string }> = [
  { code: 'HK', tag: '🇭🇰 香港节点' },
  { code: 'US', tag: '🇺🇸 美国节点' },
  { code: 'JP', tag: '🇯🇵 日本节点' },
  { code: 'SG', tag: '🇸🇬 新加坡节点' },
  { code: 'TW', tag: '🇼🇸 台湾节点' },
];

export const RULE_SET_DEFINITIONS = REGISTRY_RULE_SET_DEFINITIONS;
export const ROUTE_RULES = REGISTRY_ROUTE_RULES;

export const GROUP_DEFINITIONS: GroupDefinition[] = [
  { tag: GROUP_TAGS.CN_SERVICES, layout: 'direct-main' },
  { tag: GROUP_TAGS.PRIVATE_NET, layout: 'direct-main' },
  { tag: GROUP_TAGS.AD_BLOCK, layout: 'block-first' },
  { tag: GROUP_TAGS.NTP_SERVICES, layout: 'direct-main' },
  { tag: GROUP_TAGS.BT_PT, layout: 'direct-main' },
  ...SCENARIO_GROUPS.map(tag => ({ tag, layout: 'main-direct' as const }))
];
