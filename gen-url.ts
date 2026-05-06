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
        'mihomo', 'mihomo-mini', 'mihomo-micro',
        'stash', 'stash-mini', 'stash-micro',
        'sing-box', 'sing-box-mini', 'sing-box-micro'
    ];
    if (!validTypes.includes(configType)) {
        console.error(`\x1b[31m✘ Unknown --type "${configType}". Valid values: ${validTypes.join(', ')}\x1b[0m`);
        process.exit(1);
    }


    // Parse --gh-proxy <value>
    const ghProxyIdx = process.argv.indexOf('--gh-proxy');
    const cliGhProxy = ghProxyIdx !== -1 ? process.argv[ghProxyIdx + 1] : null;

    const configFile = 'proxy.yaml';

    if (!fs.existsSync(configFile)) {
        console.error(`\x1b[31m✘ ${configFile} not found!\x1b[0m`);
        console.error('Copy example.yaml to proxy.yaml and fill in your values.');
        process.exit(1);
    }

    const yamlContent = fs.readFileSync(configFile, 'utf-8');
    let parsedYaml;
    try {
        parsedYaml = YAML.parse(yamlContent);
    } catch (e: any) {
         console.error(`\x1b[31m✘ Error parsing ${configFile}: ${e.message}\x1b[0m`);
         process.exit(1);
    }

    let workerDomain = parsedYaml?.worker || 'https://your-worker.workers.dev/';
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
              .map((p: any) => coerceProxyNode(p))
              .filter((p: any) => Boolean(p)) as ProxyNode[];
        }
    } catch (e: any) {
         console.error(`\x1b[31m✘ Error validating proxies in ${configFile}: ${e.message}\x1b[0m`);
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
        'mihomo': 'Mihomo Full',
        'mihomo-mini': 'Mihomo Mini (Whitelist)',
        'mihomo-micro': 'Mihomo Micro (Blacklist)',
        'stash': 'Stash Full',
        'stash-mini': 'Stash Mini (Whitelist)',
        'stash-micro': 'Stash Micro (Blacklist)',
        'sing-box': 'sing-box Full',
        'sing-box-mini': 'sing-box Mini (Whitelist)',
        'sing-box-micro': 'sing-box Micro (Blacklist)',
    };
    
    console.log('\n\x1b[32m✔ Worker URL Generated Successfully!\x1b[0m');
    console.log(`\x1b[35m  Mode: ${modeLabels[configType]}\x1b[0m`);
    console.log('\x1b[36m' + finalUrl + '\x1b[0m\n');
}

generateUrl();
