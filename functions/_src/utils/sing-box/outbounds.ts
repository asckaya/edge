import { LooseProxyNode } from '../proxy-node';
import { TaggedNode, MAIN_SELECTOR_TAG, DOWNLOAD_SELECTOR_TAG, SELF_HOSTED_GROUP_TAG, DIRECT_TAG, BLOCK_TAG, AUTO_SELECT_TAG, ProviderSelector } from './types';
import { GROUP_DEFINITIONS } from './definitions';
import { buildGroupChoices, buildGroupOutbounds, buildRegionGroups, buildSelector, buildUrlTest } from './groups';

export function buildTls(node: LooseProxyNode): Record<string, unknown> | undefined {
  const enabled = node.tls === true || node.security === 'tls' || node.security === 'reality' || Boolean(node.sni) || Boolean(node.servername) || Boolean(node.alpn);
  if (!enabled) return undefined;
  const tls: Record<string, unknown> = { enabled: true };
  if (node['disable-sni']) tls.disable_sni = true;
  if (node.sni || node.servername) tls.server_name = node.sni || node.servername;
  if (node['skip-cert-verify']) tls.insecure = true;
  if (Array.isArray(node.alpn) && node.alpn.length > 0) tls.alpn = node.alpn;
  const pk = node['public-key'] || node['reality-opts']?.['public-key'];
  const sid = node['short-id'] || node['reality-opts']?.['short-id'];
  const fp = node.utls?.fingerprint || node['client-fingerprint'] || node.client_fingerprint || node.fingerprint || node.fp;
  if (node.utls?.enabled === true || fp) tls.utls = { enabled: true, ...(fp ? { fingerprint: String(fp) } : {}) };
  if (pk || sid) {
    tls.reality = { enabled: true, public_key: pk || '', short_id: sid || '' };
    if (!tls.utls) tls.utls = { enabled: true };
  }
  return tls;
}

export function buildTransport(node: LooseProxyNode): Record<string, unknown> | undefined {
  if (node.network === 'ws') return { type: 'ws', path: node['ws-opts']?.path || '/', ...(node['ws-opts']?.headers ? { headers: node['ws-opts'].headers } : {}) };
  if (node.network === 'grpc') return { type: 'grpc', service_name: node['grpc-opts']?.serviceName || '' };
  if (node.network === 'http') return { type: 'http', path: node['http-opts']?.path || '/', ...(Array.isArray(node['http-opts']?.host) ? { host: node['http-opts'].host } : {}) };
  return undefined;
}

function normalizeShadowsocksPluginName(plugin: unknown): string | undefined {
  const v = String(plugin || '').trim();
  if (!v) return undefined;
  if (v === 'obfs' || v === 'simple-obfs') return 'obfs-local';
  if (v === 'v2ray') return 'v2ray-plugin';
  return v;
}

function serializePluginOptionValue(v: unknown): string | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v.map(serializePluginOptionValue).filter(Boolean).join(',') || null;
  return typeof v === 'object' ? null : String(v);
}

function buildShadowsocksPluginOpts(plugin: string | undefined, raw: unknown): string | undefined {
  if (typeof raw === 'string') return raw.trim() || undefined;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return serializePluginOptionValue(raw) || undefined;
  const opts = raw as Record<string, unknown>;
  if (plugin === 'obfs-local') {
    const parts: string[] = [];
    const mode = serializePluginOptionValue(opts.mode ?? opts.obfs);
    const host = serializePluginOptionValue(opts.host ?? opts['obfs-host']);
    const uri = serializePluginOptionValue(opts.uri ?? opts['obfs-uri']);
    if (mode) parts.push(`obfs=${mode}`);
    if (host) parts.push(`obfs-host=${host}`);
    if (uri) parts.push(`obfs-uri=${uri}`);
    return parts.length > 0 ? parts.join(';') : undefined;
  }
  const parts = Object.entries(opts).map(([k, v]) => {
    const s = serializePluginOptionValue(v);
    return s ? `${k}=${s}` : null;
  }).filter(Boolean);
  return parts.length > 0 ? parts.join(';') : undefined;
}

export function toSingBoxOutbound(node: LooseProxyNode, tag: string): Record<string, unknown> | null {
  const server = String(node.server);
  const port = typeof node.port === 'number' ? node.port : parseInt(String(node.port), 10);
  if (!Number.isFinite(port)) return null;

  if (node.type === 'hysteria2') {
    const o: any = { type: 'hysteria2', tag, server, server_port: port, password: node.password, tls: buildTls(node) || { enabled: true } };
    if (node.ports) o.server_ports = [String(node.ports)];
    if (node.obfs) o.obfs = { type: node.obfs, password: node['obfs-password'] || '' };
    return o;
  }
  if (node.type === 'vless' || node.type === 'vmess') {
    const type = node.type === 'vless' ? 'vless' : 'vmess';
    const o: any = { type, tag, server, server_port: port, uuid: node.uuid };
    if (type === 'vless' && node.flow) o.flow = node.flow;
    if (type === 'vmess') { o.security = node.cipher || 'auto'; o.alter_id = Number(node.alterId || 0); }
    const tls = buildTls(node); if (tls) o.tls = tls;
    const transport = buildTransport(node); if (transport) o.transport = transport;
    return o;
  }
  if (node.type === 'trojan') {
    const o: any = { type: 'trojan', tag, server, server_port: port, password: node.password, tls: buildTls(node) || { enabled: true } };
    const transport = buildTransport(node); if (transport) o.transport = transport;
    return o;
  }
  if (node.type === 'ss') {
    const o: any = { type: 'shadowsocks', tag, server, server_port: port, method: node.cipher, password: node.password };
    const p = normalizeShadowsocksPluginName(node.plugin);
    const po = buildShadowsocksPluginOpts(p, node['plugin-opts'] ?? node.plugin_opts);
    if (p) o.plugin = p; if (po) o.plugin_opts = po;
    return o;
  }
  if (node.type === 'tuic') return { type: 'tuic', tag, server, server_port: port, uuid: node.uuid, password: node.password, congestion_control: node['congestion-controller'] || 'cubic', udp_relay_mode: node['udp-relay-mode'] || 'native', tls: buildTls(node) || { enabled: true } };
  if (node.type === 'anytls') {
    const o: any = { type: 'anytls', tag, server, server_port: port, password: node.password, tls: buildTls(node) || { enabled: true } };
    if (node.idle_session_check_interval) o.idle_session_check_interval = node.idle_session_check_interval;
    if (node.idle_session_timeout) o.idle_session_timeout = node.idle_session_timeout;
    if (node.min_idle_session != null) o.min_idle_session = node.min_idle_session;
    return o;
  }
  return null;
}

export function buildOutbounds(taggedNodes: TaggedNode[], providerSelectors: ProviderSelector[], selfHostedNodeTags: string[], isMini = false, isMicro = false, isDual = false): Record<string, unknown>[] {
  const nodeOutbounds = taggedNodes.map((tn) => toSingBoxOutbound(tn.node, tn.tag)).filter(Boolean);
  const regionGroups = buildRegionGroups(taggedNodes);
  const allNodeTags = taggedNodes.map((tn) => tn.tag);
  const { mainChoices, proxyChoices, downloadChoices } = buildGroupChoices(providerSelectors, regionGroups, selfHostedNodeTags, allNodeTags);
  const downloadDefault = downloadChoices.find((t) => t !== DIRECT_TAG) || DIRECT_TAG;

  const selectorOutbounds: any[] = [
    buildSelector(MAIN_SELECTOR_TAG, mainChoices, DOWNLOAD_SELECTOR_TAG),
    buildUrlTest(AUTO_SELECT_TAG, allNodeTags),
    ...regionGroups.map((r) => buildUrlTest(r.tag, r.nodeTags)),
  ];

  const useMini = isMini || isMicro;
  let groups = GROUP_DEFINITIONS;
  if (isDual) {
    groups = GROUP_DEFINITIONS.filter((g) => ['🛑 广告拦截', '🔒 国内服务', '🛒 购物网站', '🐟 漏网之鱼'].includes(g.tag));
  } else if (useMini) {
    groups = GROUP_DEFINITIONS.filter((g) => ['🛑 广告拦截', '🔒 国内服务', '🐟 漏网之鱼'].includes(g.tag));
  }

  for (const g of groups) {
    const outbounds = buildGroupOutbounds(g.layout, proxyChoices);
    const def = g.layout === 'block-first' ? BLOCK_TAG : (g.layout.startsWith('direct') ? DIRECT_TAG : MAIN_SELECTOR_TAG);
    selectorOutbounds.push(buildSelector(g.tag, outbounds, def));
  }

  for (const p of providerSelectors) {
    selectorOutbounds.push(buildSelector(p.selectTag, p.nodeTags, p.nodeTags[0]));
    selectorOutbounds.push(buildUrlTest(p.autoTag, p.nodeTags));
  }

  selectorOutbounds.push(buildSelector(DOWNLOAD_SELECTOR_TAG, downloadChoices, downloadDefault));
  if (selfHostedNodeTags.length > 0) selectorOutbounds.push(buildSelector(SELF_HOSTED_GROUP_TAG, selfHostedNodeTags, selfHostedNodeTags[0]));

  return [{ type: 'direct', tag: DIRECT_TAG }, { type: 'block', tag: BLOCK_TAG }, ...selectorOutbounds, ...nodeOutbounds];
}
