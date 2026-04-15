import fs from 'fs';
import YAML from 'yaml';
import { buildProxyUri } from './functions/_src/utils/proxy-builder';
import { ProxyNode, AnyProxySchema } from './functions/_src/types';

/**
 * URL Generation Utility
 * Reads proxy.yaml and generates a Cloudflare Worker subscription URL.
 *
 * Usage: bun gen-url.ts [--type <config-type>]
 *   --type mihomo      Mihomo / Clash Meta (default)
 *   --type stash       Stash iOS — full rule set
 *   --type stash-mini  Stash iOS — low-memory (<50 MB), 15 rule-providers
 */

function generateUrl() {
    // Parse --type <value>
    const typeIdx = process.argv.indexOf('--type');
    const configType = typeIdx !== -1 ? (process.argv[typeIdx + 1] ?? 'mihomo') : 'mihomo';
    const validTypes = ['mihomo', 'stash', 'stash-mini'];
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
            proxies = parsedYaml.proxy.map((p: any) => AnyProxySchema.parse(p));
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
        mihomo: 'Mihomo / Clash Meta',
        stash: 'Stash iOS (full)',
        'stash-mini': 'Stash iOS Mini — low-memory (<50 MB)',
    };
    
    console.log('\n\x1b[32m✔ Worker URL Generated Successfully!\x1b[0m');
    console.log(`\x1b[35m  Mode: ${modeLabels[configType]}\x1b[0m`);
    console.log('\x1b[36m' + finalUrl + '\x1b[0m\n');
}

generateUrl();

