import { parseProxyTextToNodes, parseProxyUri } from './_src/utils/proxy-parser';
import { buildSingBoxConfig } from './_src/utils/sing-box';
import { buildMihomoConfig } from './_src/utils/mihomo';
import { fetchSubscriptionNodes, parseSubscriptionContent } from './_src/utils/subscription-parser';
import { Subscription, RequestParamsSchema } from './_src/types';

interface PagesFunctionContext {
  request: Request;
  next: () => Response | Promise<Response>;
}

export const onRequest = async (context: PagesFunctionContext) => {
  const { request, next } = context;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  if (searchParams.toString() === '') {
    return next();
  }

  const paramsObj: Record<string, unknown> = {};
  for (const [key, value] of searchParams.entries()) {
    paramsObj[key] = value;
  }

  const dynamicSubscriptions: Subscription[] = [];
  for (const [key, value] of searchParams.entries()) {
    if (!key || !value || ['secret', 'proxies', 'type', 'gh_proxy'].includes(key)) continue;
    if (value.startsWith('http://') || value.startsWith('https://')) {
      dynamicSubscriptions.push({ name: key, url: value });
    }
  }
  (paramsObj as any).subscriptions = dynamicSubscriptions;

  const parseResult = RequestParamsSchema.safeParse(paramsObj);
  if (!parseResult.success) {
    return new Response(`Invalid parameters: ${parseResult.error.message}`, { status: 400 });
  }

  const { type: configType, secret: providedSecret, proxies: customProxiesRaw, gh_proxy: ghProxy, subscriptions } = parseResult.data;
  
  const isStash = configType.startsWith('stash');
  const isSingBox = configType.startsWith('sing-box');
  const isWhite = configType.endsWith('-white');
  const isBlack = configType.endsWith('-black');
  const isDual = configType.endsWith('-dual');

  if (subscriptions.length === 0 && !customProxiesRaw) {
    return new Response('Edge Subscription API - Missing parameters. Visit / for the interface. Add ?proxies=... or ?SubName=SubUrl', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Parse custom proxies once for both kernels
  const { nodes: customProxyNodes, rawLines: customProxyRawLines } = parseProxyTextToNodes(customProxiesRaw);
  const customProxyNames = [
    ...customProxyNodes.map(n => n.name),
    ...customProxyRawLines.map(line => {
      const nameMatch = line.match(/- name:\s*['"]?([^'"]+)['"]?/);
      return nameMatch ? nameMatch[1] : null;
    }).filter((n): n is string => !!n)
  ];

  if (isSingBox) {
    const resolvedSubscriptions = subscriptions.length > 0
      ? await fetchSubscriptionNodes(subscriptions, 'sing-box')
      : [];

    const finalConfig = await buildSingBoxConfig({
      secret: providedSecret,
      subscriptions: resolvedSubscriptions,
      customNodes: parseSubscriptionContent(customProxiesRaw),
      ghProxy,
      isWhite,
      isBlack,
      isDual,
    });

    return Response.json(finalConfig, { headers: { 'Cache-Control': 'no-cache' } });
  }

  // Mihomo/Stash Logic
  const customProxiesYaml = parseProxyUri(customProxiesRaw);
  const finalYaml = buildMihomoConfig({
    secret: providedSecret,
    subscriptions,
    customProxies: customProxiesYaml,
    customProxyNames,
    ghProxy,
    isStash,
    isWhite,
    isBlack,
    isDual
  });

  return new Response(finalYaml, {
    headers: {
      'content-type': 'text/yaml; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
};
;
