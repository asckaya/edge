import { RouteRuleDefinition, RuleSetDefinition } from '../sing-box/types';

export function renderMihomoRules(rules: RouteRuleDefinition[], definitions: RuleSetDefinition[], finalMatch: string): string {
  const defMap = new Map(definitions.map(d => [d.tag, d]));
  
  const yamlLines = rules.map(r => {
    if (r.action !== 'route' || !r.outbound) return null;

    const outbound = r.outbound;

    if (r.rule_set) {
      const sets = Array.isArray(r.rule_set) ? r.rule_set : [r.rule_set];
      return sets.map(s => {
        const def = defMap.get(s);
        if (!def) return null;
        const type = def.mihomoType || (def.kind === 'geoip' ? 'GEOIP' : 'GEOSITE');
        const name = def.remoteName || def.tag;
        const noResolve = def.kind === 'geoip' ? ',no-resolve' : '';
        return `  - ${type},${name},${outbound}${noResolve}`;
      }).filter(Boolean).join('\n');
    }

    if (r.domain_suffix) {
      const suffixes = Array.isArray(r.domain_suffix) ? r.domain_suffix : [r.domain_suffix];
      return suffixes.map(s => `  - DOMAIN-SUFFIX,${s},${outbound}`).join('\n');
    }

    if (r.port) {
      const ports = Array.isArray(r.port) ? r.port : [r.port];
      return ports.map(p => `  - DST-PORT,${p},${outbound}`).join('\n');
    }

    return null;
  }).filter(Boolean);

  return `rules:\n${yamlLines.join('\n')}\n  - MATCH,${finalMatch}`;
}
