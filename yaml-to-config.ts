import fs from 'fs';
import YAML from 'yaml';
import { cac } from 'cac';
import pc from 'picocolors';
import { onRequest } from './functions/[[path]]';
import { buildProxyUri } from './functions/_src/utils/proxy-builder';
import { coerceProxyNode } from './functions/_src/utils/proxy-node';
import { ProxyNode } from './functions/_src/types';

/**
 * Local Config Generator
 * Directly converts a local YAML config to a final proxy configuration.
 */

const cli = cac('yaml-to-config');

cli
  .command('', 'Local Config Generator')
  .option('--type <type>', 'Target config type (mihomo, sing-box, stash, etc.)', { default: 'mihomo' })
  .option('--output <file>', 'Output file path')
  .action(async (options) => {
    const configType = options.type;
    const outputFile = options.output;

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
      process.exit(1);
    }

    console.log(pc.blue(`ℹ Reading from ${configFile} (Mode: ${configType})`));
    const yamlContent = fs.readFileSync(configFile, 'utf-8');
    let parsedYaml;
    try {
      parsedYaml = YAML.parse(yamlContent);
    } catch (e: unknown) {
      console.error(pc.red(`✘ Error parsing ${configFile}: ${e instanceof Error ? e.message : String(e)}`));
      process.exit(1);
    }

    // Build URL with parameters
    const params = new URLSearchParams();
    params.set('type', configType);
    if (parsedYaml.secret) params.set('secret', parsedYaml.secret);
    if (parsedYaml.gh_proxy) params.set('gh_proxy', parsedYaml.gh_proxy);
    
    if (parsedYaml.provider) {
      for (const p of parsedYaml.provider) {
        params.set(p.name, p.url);
      }
    }

    if (parsedYaml.proxy) {
      const proxies = parsedYaml.proxy
        .map((p: unknown) => coerceProxyNode(p))
        .filter((p: unknown): p is ProxyNode => Boolean(p));
      const uris = proxies.flatMap(p => buildProxyUri(p)).filter(Boolean);
      if (uris.length > 0) params.set('proxies', uris.join('\n'));
    }

    // Mock Cloudflare Pages Request
    const url = `http://localhost/?${params.toString()}`;
    const request = new Request(url);

    // Mock Context
    const context = {
      request,
      env: {},
      params: {},
      waitUntil: () => {},
      next: () => Promise.resolve(new Response('Fallback')),
    };

    console.log(pc.yellow('⏳ Generating configuration...'));
    try {
      const response = await onRequest(context);
      const result = await response.text();

      if (outputFile) {
        fs.writeFileSync(outputFile, result);
        console.log(pc.green(`✔ Configuration saved to ${outputFile}`));
      } else {
        console.log(pc.gray('\n--- BEGIN CONFIG ---\n'));
        console.log(result);
        console.log(pc.gray('\n--- END CONFIG ---\n'));
      }
    } catch (err: unknown) {
      console.error(pc.red(`✘ Error generating config: ${err instanceof Error ? err.message : String(err)}`));
      process.exit(1);
    }
  });

cli.help();

try {
  cli.parse();
} catch (e: unknown) {
  console.error(pc.red(`✘ Command-line parser error: ${e instanceof Error ? e.message : String(e)}`));
  process.exit(1);
}
