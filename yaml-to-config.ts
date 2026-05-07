import fs from 'fs';
import YAML from 'yaml';
import { onRequest } from './functions/[[path]]';
import { buildProxyUri } from './functions/_src/utils/proxy-builder';
import { coerceProxyNode } from './functions/_src/utils/proxy-node';
import { ProxyNode } from './functions/_src/types';

/**
 * Local Config Generator
 * Directly converts a local YAML config to a final proxy configuration.
 *
 * Usage: pnpm tsx yaml-to-config.ts [--type <config-type>] [--output <file>]
 *   Types: mihomo, mihomo-dual, mihomo-white, mihomo-black
 *          stash, stash-dual, stash-white, stash-black
 *          sing-box, sing-box-dual, sing-box-white, sing-box-black
 */

async function main() {
    const typeIdx = process.argv.indexOf('--type');
    const configType = typeIdx !== -1 ? (process.argv[typeIdx + 1] ?? 'mihomo') : 'mihomo';
    
    const outputIdx = process.argv.indexOf('--output');
    const outputFile = outputIdx !== -1 ? process.argv[outputIdx + 1] : null;

    let configFile = 'proxy.yaml';
    if (!fs.existsSync(configFile)) {
        configFile = 'example.yaml';
    }

    if (!fs.existsSync(configFile)) {
        console.error('✘ No configuration file found!');
        process.exit(1);
    }

    console.log(`ℹ Reading from ${configFile} (Mode: ${configType})`);
    const yamlContent = fs.readFileSync(configFile, 'utf-8');
    const parsedYaml = YAML.parse(yamlContent);

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
            .map((p: Record<string, unknown>) => coerceProxyNode(p))
            .filter((p: ReturnType<typeof coerceProxyNode>): p is ProxyNode => Boolean(p));
        const uris = proxies.flatMap(p => buildProxyUri(p)).filter(Boolean);
        if (uris.length > 0) params.set('proxies', uris.join('\n'));
    }

    // Mock Cloudflare Pages Request
    const url = `http://localhost/?${params.toString()}`;
    const request = new Request(url);

    // Mock Context
    const context: { request: Request; env: Record<string, unknown>; params: Record<string, string>; waitUntil: () => void; next: () => Promise<Response> } = {
        request,
        env: {},
        params: {},
        waitUntil: () => {},
        next: () => new Response('Fallback'),
    };

    console.log('⏳ Generating configuration...');
    const response = await onRequest(context);
    const result = await response.text();

    if (outputFile) {
        fs.writeFileSync(outputFile, result);
        console.log(`✔ Configuration saved to ${outputFile}`);
    } else {
        console.log('\n--- BEGIN CONFIG ---\n');
        console.log(result);
        console.log('\n--- END CONFIG ---\n');
    }
}

main().catch(err => {
    console.error('✘ Unexpected error:', err);
    process.exit(1);
});
