import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import * as v from 'valibot';
import { parseProxyTextToNodes, parseProxyUri } from './_src/utils/proxy-parser';
import { buildSingBoxConfig } from './_src/utils/sing-box';
import { buildMihomoConfig } from './_src/utils/mihomo';
import { fetchSubscriptionNodes, parseSubscriptionContent } from './_src/utils/subscription-parser';
import { RequestParamsSchema } from './_src/types';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());
app.use('*', prettyJSON());

app.get('*', async (c) => {
  const url = new URL(c.req.url);
  const searchParams = url.searchParams;

  const paramsObj = {
    ...Object.fromEntries(searchParams),
    subscriptions: Array.from(searchParams.entries())
      .filter(([key, val]) => key && val && !['secret', 'proxies', 'type', 'gh_proxy'].includes(key) && (val.startsWith('http://') || val.startsWith('https://')))
      .map(([name, url]) => ({ name, url }))
  };

  const parseResult = v.safeParse(RequestParamsSchema, paramsObj);
  if (!parseResult.success) {
    const errorMsg = parseResult.issues.map(issue => `${issue.path?.[0]?.key || ''}: ${issue.message}`).join(', ');
    return c.text(`Invalid parameters: ${errorMsg}`, 400);
  }

  const { type: configType, secret: providedSecret, proxies: customProxiesRaw, gh_proxy: ghProxy, subscriptions } = parseResult.output;
  
  const isStash = configType.startsWith('stash');
  const isSingBox = configType.startsWith('sing-box');
  const isWhite = configType.endsWith('-white');
  const isBlack = configType.endsWith('-black');
  const isDual = configType.endsWith('-dual');

  if (subscriptions.length === 0 && !customProxiesRaw) {
    return c.text('Edge Subscription API - Missing parameters. Visit / for the interface. Add ?proxies=... or ?SubName=SubUrl', 200, {
      'Content-Type': 'text/plain; charset=utf-8'
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

    return c.json(finalConfig, 200, { 'Cache-Control': 'no-cache' });
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

  return c.text(finalYaml, 200, {
    'content-type': 'text/yaml; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
});

export const onRequest = async (context: { request: Request; next: () => Promise<Response> }) => {
  const url = new URL(context.request.url);
  if (url.searchParams.toString() === '') {
    return context.next();
  }
  return handle(app)(context);
};
