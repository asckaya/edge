import { describe, expect, test } from "vitest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import YAML from "yaml";
import { onRequest } from "../../functions/[[path]]";
import { coerceProxyNode } from "../../functions/_src/utils/proxy-node";
import { buildProxyUri } from "../../functions/_src/utils/proxy-builder";

/**
 * Sing-box Bare Kernel Test
 * 
 * This test generates a real configuration based on proxy.yaml and passes it 
 * to the 'sing-box' binary with the 'check' command to ensure validity.
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

describe("Sing-box Bare Kernel Validation", () => {
  const testConfigPath = path.join(process.cwd(), "sing-box-kernel-test.json");
  const proxyYamlPath = path.join(process.cwd(), "proxy.yaml");

  const runBareTest = async (type: string) => {
    if (!fs.existsSync(proxyYamlPath)) {
        throw new Error("proxy.yaml not found");
    }
    const yamlContent = fs.readFileSync(proxyYamlPath, 'utf-8');
    const parsedYaml = YAML.parse(yamlContent);

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
      // Run sing-box check -c to verify the configuration
      execSync(`sing-box check -c ${testConfigPath}`, { 
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });
      return true;
    } catch (error: any) {
      const stderr = error.stderr?.toString() || "";
      const stdout = error.stdout?.toString() || "";
      console.error(`Sing-box ${type} validation failed:\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`);
      return false;
    } finally {
      if (fs.existsSync(testConfigPath)) {
        fs.unlinkSync(testConfigPath);
      }
    }
  };

  test("Sing-box Full Mode", async () => {
    const success = await runBareTest("sing-box");
    expect(success).toBe(true);
  }, 30000);

  test("Sing-box Dual Mode", async () => {
    const success = await runBareTest("sing-box-dual");
    expect(success).toBe(true);
  }, 30000);

  test("Sing-box White Mode", async () => {
    const success = await runBareTest("sing-box-white");
    expect(success).toBe(true);
  }, 30000);

  test("Sing-box Black Mode", async () => {
    const success = await runBareTest("sing-box-black");
    expect(success).toBe(true);
  }, 30000);
});
