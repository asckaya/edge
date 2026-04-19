import YAML from 'yaml';
import { Subscription } from '../types';
import { coerceProxyNodes, LooseProxyNode } from './proxy-node';
import { parseProxyTextToNodes } from './proxy-parser';

export interface ResolvedSubscription extends Subscription {
  nodes: LooseProxyNode[];
}

const BASE64_PATTERN = /^[A-Za-z0-9+/=_-\s]+$/;

function stripBom(input: string): string {
  return input.replace(/^\uFEFF/, '').trim();
}

function decodeBase64Text(input: string): string | null {
  const collapsed = input.replace(/\s+/g, '');
  if (!collapsed || collapsed.length < 16 || !BASE64_PATTERN.test(collapsed)) return null;

  const normalized = collapsed.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));

  try {
    const binary = atob(normalized + padding);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function looksLikeStructuredConfig(input: string): boolean {
  return (
    input.startsWith('proxies:') ||
    input.startsWith('- name:') ||
    input.startsWith('{') ||
    input.startsWith('[')
  );
}

function parseStructuredProxyList(input: string): LooseProxyNode[] {
  try {
    const parsed = YAML.parse(input);

    if (Array.isArray(parsed)) {
      return coerceProxyNodes(parsed);
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.proxies)) {
      return coerceProxyNodes(parsed.proxies);
    }
  } catch {
    return [];
  }

  return [];
}

export function parseSubscriptionContent(input: string): LooseProxyNode[] {
  const raw = stripBom(input);
  if (!raw) return [];

  if (looksLikeStructuredConfig(raw)) {
    const structured = parseStructuredProxyList(raw);
    if (structured.length > 0) return structured;
  }

  const decoded = decodeBase64Text(raw);
  if (decoded) {
    const decodedRaw = stripBom(decoded);
    if (decodedRaw) {
      if (looksLikeStructuredConfig(decodedRaw)) {
        const structured = parseStructuredProxyList(decodedRaw);
        if (structured.length > 0) return structured;
      }

      const parsedText = parseProxyTextToNodes(decodedRaw);
      if (parsedText.nodes.length > 0) return parsedText.nodes;
    }
  }

  return parseProxyTextToNodes(raw).nodes;
}

export async function fetchSubscriptionNodes(
  subscriptions: Subscription[],
  userAgent: string,
): Promise<ResolvedSubscription[]> {
  return Promise.all(
    subscriptions.map(async (sub) => {
      const response = await fetch(sub.url, {
        headers: {
          'User-Agent': userAgent,
          Accept: '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch "${sub.name}" (${response.status})`);
      }

      const body = await response.text();
      const nodes = parseSubscriptionContent(body);

      return {
        ...sub,
        nodes,
      };
    }),
  );
}
