import fs from 'fs';
import YAML from 'yaml';
import { buildProxyUri } from './functions/_src/utils/proxy-builder';
import { ProxyNode } from './functions/_src/types';
import { coerceProxyNode } from './functions/_src/utils/proxy-node';

/**
 * URL Generation Utility
 * Reads proxy.yaml and generates a Cloudflare Pages subscription URL.
 *
 * Usage: pnpm gen [--type <config-type>]
 *   Mihomo:   mihomo, mihomo-mini, mihomo-micro
 *   Stash:    stash, stash-mini, stash-micro
 *   sing-box: sing-box, sing-box-mini, sing-box-micro
 */

function generateUrl() {
    // Parse --type <value>
    const typeIdx = process.argv.indexOf('--type');
    const configType = typeIdx !== -1 ? (process.argv[typeIdx + 1] ?? 'mihomo') : 'mihomo';
    const validTypes = [
        'mihomo', 'mihomo-dual', 'mihomo-white', 'mihomo-black',
        'stash', 'stash-dual', 'stash-white', 'stash-black',
        'sing-box', 'sing-box-dual', 'sing-box-white', 'sing-box-black'
    ];
    if (!validTypes.includes(configType)) {
        console.error(`\x1b[31m✘ Unknown --type "${configType}". Valid values: ${validTypes.join(', ')}\x1b[0m`);
        process.exit(1);
    }


    // Parse --gh-proxy <value>
    const ghProxyIdx = process.argv.indexOf('--gh-proxy');
    const cliGhProxy = ghProxyIdx !== -1 ? process.argv[ghProxyIdx + 1] : null;

    let configFile = 'proxy.yaml';
    if (!fs.existsSync(configFile)) {
        configFile = 'example.yaml';
    }

    if (!fs.existsSync(configFile)) {
        console.error(`\x1b[31m✘ No configuration file found!\x1b[0m`);
        console.error('Create proxy.yaml or use example.yaml.');
        process.exit(1);
    }

    console.log(`\x1b[34mℹ Reading configuration from ${configFile}\x1b[0m`);

    const yamlContent = fs.readFileSync(configFile, 'utf-8');
    let parsedYaml;
    try {
        parsedYaml = YAML.parse(yamlContent);
    } catch (e: unknown) {
         console.error(`\x1b[31m✘ Error parsing ${configFile}: ${(e as any).message}\x1b[0m`);
         process.exit(1);
    }

    const workerDomain = parsedYaml?.worker || 'https://your-worker.workers.dev/';
    if (!parsedYaml?.worker) {
        console.warn('\x1b[33m⚠ No "worker:" field found in proxy.yaml, using placeholder URL\x1b[0m');
    }
    const secret = parsedYaml?.secret || '';
    const providers = parsedYaml?.provider || [];
    const yamlGhProxy = parsedYaml?.gh_proxy || null;
    const ghProxy = cliGhProxy || yamlGhProxy;
    
    let proxies: ProxyNode[] = [];
    try {
        if (parsedYaml?.proxy && Array.isArray(parsedYaml.proxy)) {
            proxies = parsedYaml.proxy
              .map((p: unknown) => coerceProxyNode(p))
              .filter((p: unknown): p is ProxyNode => Boolean(p));
        }
    } catch (e: unknown) {
         console.error(`\x1b[31m✘ Error validating proxies in ${configFile}: ${(e as any).message}\x1b[0m`);
         process.exit(1);
    }

    const params = new URLSearchParams();
    if (secret) params.set('secret', secret);
    if (configType !== 'mihomo') params.set('type', configType);
    if (ghProxy) params.set('gh_proxy', ghProxy);

    for (const p of providers) {
        if (p.name && p.url) params.set(p.name, p.url);
    }

    const proxyUris = proxies.flatMap(p => buildProxyUri(p)).filter(Boolean);

    if (proxyUris.length > 0) params.set('proxies', proxyUris.join('\n'));

    const base = workerDomain.replace(/\/$/, '');
    const finalUrl = `${base}/?${params.toString()}`;

    const modeLabels: Record<string, string> = {
        'mihomo': 'Mihomo Full (Category-based)',
        'mihomo-dual': 'Mihomo Dual (Domestic/Global)',
        'mihomo-white': 'Mihomo White (Domestic-Direct)',
        'mihomo-black': 'Mihomo Black (Overseas-Proxy)',
        'stash': 'Stash Full (Category-based)',
        'stash-dual': 'Stash Dual (Domestic/Global)',
        'stash-white': 'Stash White (Domestic-Direct)',
        'stash-black': 'Stash Black (Overseas-Proxy)',
        'sing-box': 'sing-box Full (Category-based)',
        'sing-box-dual': 'sing-box Dual (Domestic/Global)',
        'sing-box-white': 'sing-box White (Domestic-Direct)',
        'sing-box-black': 'sing-box Black (Overseas-Proxy)',
    };
    
    console.log('\n\x1b[32m✔ Worker URL Generated Successfully!\x1b[0m');
    console.log(`\x1b[35m  Mode: ${modeLabels[configType]}\x1b[0m`);
    console.log('\x1b[36m' + finalUrl + '\x1b[0m\n');
}

generateUrl();
