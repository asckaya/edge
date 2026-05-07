import { describe, expect, test } from "vitest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import YAML from "yaml";
import { onRequest } from "../../functions/[[path]]";
import { coerceProxyNode } from "../../functions/_src/utils/proxy-node";
import { buildProxyUri } from "../../functions/_src/utils/proxy-builder";

/**
 * Mihomo Bare Kernel Test
 * 
 * This test generates a real configuration based on proxy.yaml and passes it 
 * to the 'mihomo' binary with the '-t' flag to ensure validity.
 */

async function callWorker(url: string) {
  const req = new Request(url);
  return onRequest({
    request: req,
    next: () => new Response("Static Asset Content"),
    env: {},
    params: {},
    waitUntil: () => {},
    data: {},
    functionPath: "/"
  } as any);
}

describe("Mihomo Bare Kernel Validation", () => {
  const testConfigPath = path.join(process.cwd(), "mihomo-kernel-test.yaml");
  const proxyYamlPath = path.join(process.cwd(), "proxy.yaml");

  const runBareTest = async (type: string) => {
    // Read real data from proxy.yaml
    if (!fs.existsSync(proxyYamlPath)) {
        throw new Error("proxy.yaml not found");
    }
    const yamlContent = fs.readFileSync(proxyYamlPath, 'utf-8');
    const parsedYaml = YAML.parse(yamlContent);

    // Build URL with real parameters
    const params = new URLSearchParams();
    params.set('type', type);
    if (parsedYaml.secret) params.set('secret', parsedYaml.secret);
    if (parsedYaml.gh_proxy) params.set('gh_proxy', parsedYaml.gh_proxy);
    
    if (parsedYaml.provider) {
        for (const p of parsedYaml.provider) {
            params.set(p.name, p.url);
        }
    }

    if (parsedYaml.proxy) {
        const proxies = parsedYaml.proxy
            .map((p: any) => coerceProxyNode(p))
            .filter((p: any): p is any => Boolean(p));
        const uris = proxies.flatMap((p: any) => buildProxyUri(p)).filter(Boolean);
        if (uris.length > 0) params.set('proxies', uris.join('\n'));
    }

    const url = `http://localhost/?${params.toString()}`;
    const res = await callWorker(url);
    const content = await res.text();
    
    fs.writeFileSync(testConfigPath, content);

    try {
      // Run mihomo -t to verify the configuration
      execSync(`mihomo -t -f ${testConfigPath}`, { 
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, SKIP_GEO_DOWNLOAD: '1' }
      });
      return true;
    } catch (error: any) {
      const stderr = error.stderr?.toString() || "";
      const stdout = error.stdout?.toString() || "";
      console.error(`Mihomo ${type} validation failed:\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`);
      return false;
    } finally {
      if (fs.existsSync(testConfigPath)) {
        fs.unlinkSync(testConfigPath);
      }
    }
  };

  test("Mihomo Full Mode", async () => {
    const success = await runBareTest("mihomo");
    expect(success).toBe(true);
  });

  test("Mihomo Dual Mode", async () => {
    const success = await runBareTest("mihomo-dual");
    expect(success).toBe(true);
  });

  test("Mihomo Minimal Mode", async () => {
    const success = await runBareTest("mihomo-minimal");
    expect(success).toBe(true);
  });
});
