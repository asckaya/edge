import fs from 'fs';
import YAML from 'yaml';
import { cac } from 'cac';
import pc from 'picocolors';
import { buildProxyUri } from './functions/_src/utils/proxy-builder';
import { ProxyNode } from './functions/_src/types';
import { coerceProxyNode } from './functions/_src/utils/proxy-node';

const cli = cac('gen-url');

cli
  .command('', 'Generate Worker URL')
  .option('--type <type>', 'Target config type (mihomo, sing-box, stash, etc.)', { default: 'mihomo' })
  .option('--gh-proxy <url>', 'GitHub proxy URL')
  .action((options) => {
    const configType = options.type;
    const cliGhProxy = options.ghProxy;
    
    const validTypes = [
        'mihomo', 'mihomo-dual', 'mihomo-white', 'mihomo-black',
        'stash', 'stash-dual', 'stash-white', 'stash-black',
        'sing-box', 'sing-box-dual', 'sing-box-white', 'sing-box-black'
    ];
    if (!validTypes.includes(configType)) {
        console.error(pc.red(`\n✘ Unknown --type "${configType}". Valid values: ${validTypes.join(', ')}`));
        process.exit(1);
    }

    let configFile = 'proxy.yaml';
    if (!fs.existsSync(configFile)) {
        configFile = 'example.yaml';
    }

    if (!fs.existsSync(configFile)) {
        console.error(pc.red(`✘ No configuration file found!`));
        console.error('Create proxy.yaml or use example.yaml.');
        process.exit(1);
    }

    console.log(pc.blue(`ℹ Reading configuration from ${configFile}`));

    const yamlContent = fs.readFileSync(configFile, 'utf-8');
    let parsedYaml;
    try {
        parsedYaml = YAML.parse(yamlContent);
    } catch (e: unknown) {
         console.error(pc.red(`✘ Error parsing ${configFile}: ${(e as any).message}`));
         process.exit(1);
    }

    const workerDomain = parsedYaml?.worker || 'https://your-worker.workers.dev/';
    if (!parsedYaml?.worker) {
        console.warn(pc.yellow('⚠ No "worker:" field found in proxy.yaml, using placeholder URL'));
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
         console.error(pc.red(`✘ Error validating proxies in ${configFile}: ${(e as any).message}`));
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
    
    console.log(pc.green('\n✔ Worker URL Generated Successfully!'));
    console.log(pc.magenta(`  Mode: ${modeLabels[configType]}`));
    console.log(pc.cyan(finalUrl) + '\n');
  });

cli.help();
cli.parse();
