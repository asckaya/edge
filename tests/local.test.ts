import { describe, expect, test } from "bun:test";
import YAML from "yaml";
import { onRequest } from "../functions/[[path]]";

/**
 * Helper to call the Pages Function in tests
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

describe("Edge Subscription Worker - Logical", () => {
  // 1. Static Asset Fallback
  test("Root Fallback to UI", async () => {
    const res = await callWorker("http://localhost/");
    const content = await res.text();
    expect(content).toBe("Static Asset Content");
  });

  // 2. Error Handling
  test("Missing Parameters (but has some query)", async () => {
    // If there is a query but it doesn't have the right parameters
    const res = await callWorker("http://localhost/?foo=bar");
    const content = await res.text();
    expect(content).toContain("Missing parameters");
  });

  // 3. Platform Variations
  test("Mihomo (Default)", async () => {
    const res = await callWorker("http://localhost/?Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    
    expect(yaml["external-controller"]).toBeDefined();
    expect(yaml["proxy-providers"]?.Airport).toBeDefined();
    expect(yaml["proxy-groups"]).toBeInstanceOf(Array);
  });

  test("Stash Full", async () => {
    const res = await callWorker("http://localhost/?type=stash&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    
    expect(yaml["external-controller"]).toBeUndefined();
    expect(yaml["proxy-providers"]?.Airport).toBeDefined();
    expect(yaml.dns).toBeDefined();
  });

  test("Stash Mini", async () => {
    const res = await callWorker("http://localhost/?type=stash-mini&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    
    expect(yaml["rule-providers"]?.advertising).toBeDefined();
    // 17 base groups + 2 for "Airport" sub = 19
    expect(yaml["proxy-groups"].length).toBe(19);
  });

  // 4. Secret handling
  test("Custom Secret", async () => {
    const res = await callWorker("http://localhost/?secret=my-secret&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    expect(yaml["secret"]).toBe("my-secret");
  });

  // 6. Proxy URI Parsing
  describe("Proxy URI Parsing", () => {
    test("VMess WS/gRPC", async () => {
      const vmessWS = "vmess://" + btoa(JSON.stringify({ v: "2", ps: "V-WS", add: "h", port: 443, id: "u", net: "ws", path: "/p", host: "h.com", tls: "tls" }));
      const res = await callWorker(`http://localhost/?proxies=${encodeURIComponent(vmessWS)}`);
      const yaml = YAML.parse(await res.text());
      const proxy = yaml.proxies[0];
      expect(proxy.type).toBe("vmess");
      expect(proxy.network).toBe("ws");
      expect(proxy["ws-opts"].path).toBe("/p");
    });

    test("Hysteria2 Complex", async () => {
      const hy2 = "hysteria2://auth@h:1234?mport=2000-3000#Hy2";
      const res = await callWorker(`http://localhost/?proxies=${encodeURIComponent(hy2)}`);
      const yaml = YAML.parse(await res.text());
      const proxy = yaml.proxies[0];
      expect(proxy.type).toBe("hysteria2");
      expect(proxy.ports).toBe("2000-3000");
    });

    test("VLESS Reality", async () => {
      const vlessReality = "vless://u@h:443?security=reality&pbk=pk&sid=id&sni=s.com&type=grpc&serviceName=sn#V-Reality";
      const res = await callWorker(`http://localhost/?proxies=${encodeURIComponent(vlessReality)}`);
      const yaml = YAML.parse(await res.text());
      const proxy = yaml.proxies[0];
      expect(proxy["reality-opts"]).toBeDefined();
      expect(proxy["reality-opts"]["public-key"]).toBe("pk");
    });

    test("Shadowsocks Formats", async () => {
      const ssPlain = "ss://YWVzLTI1Ni1nY206cGFzczE@h:443#SS-B64";
      const res = await callWorker(`http://localhost/?proxies=${encodeURIComponent(ssPlain)}`);
      const yaml = YAML.parse(await res.text());
      const proxy = yaml.proxies[0];
      expect(proxy.cipher).toBe("aes-256-gcm");
    });

    test("WireGuard", async () => {
      const wg = "wireguard://priv@h:443?public-key=pub&ip=10.0.0.1/24&reserved=1,2,3&mtu=1450#WG";
      const res = await callWorker(`http://localhost/?proxies=${encodeURIComponent(wg)}`);
      const yaml = YAML.parse(await res.text());
      const proxy = yaml.proxies[0];
      expect(proxy["private-key"]).toBe("priv");
      expect(proxy["reserved"]).toEqual([1, 2, 3]);
    });
  });
});
