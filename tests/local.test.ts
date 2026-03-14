import { describe, expect, test } from "bun:test";
import YAML from "yaml";
import worker from "../index";

/**
 * Logical Verification Test Suite for Edge Subscription Converter
 * Parses generated YAML to ensure correct structure and logic.
 */

describe("Edge Subscription Worker - Logical", () => {
  // 1. Redirects
  test("UI Redirect", async () => {
    const req = new Request("http://localhost/ui");
    const res = await worker.fetch(req, {}, {});
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")?.endsWith("/ui/")).toBe(true);
  });

  // 2. Error Handling
  test("Missing Parameters", async () => {
    const req = new Request("http://localhost/");
    const res = await worker.fetch(req, {}, {});
    const content = await res.text();
    expect(content).toContain("Missing parameters");
  });

  // 3. Platform Variations
  test("Mihomo (Default)", async () => {
    const req = new Request("http://localhost/?Airport=http://sub.com");
    const res = await worker.fetch(req, {}, {});
    const yaml = YAML.parse(await res.text());
    
    expect(yaml["external-controller"]).toBeDefined();
    expect(yaml["proxy-providers"]?.Airport).toBeDefined();
    expect(yaml["proxy-groups"]).toBeInstanceOf(Array);
  });

  test("Stash Full", async () => {
    const req = new Request("http://localhost/?type=stash&Airport=http://sub.com");
    const res = await worker.fetch(req, {}, {});
    const yaml = YAML.parse(await res.text());
    
    expect(yaml["external-controller"]).toBeUndefined();
    expect(yaml["proxy-providers"]?.Airport).toBeDefined();
    expect(yaml.dns).toBeDefined();
  });

  test("Stash Mini", async () => {
    const req = new Request("http://localhost/?type=stash-mini&Airport=http://sub.com");
    const res = await worker.fetch(req, {}, {});
    const yaml = YAML.parse(await res.text());
    
    expect(yaml["rule-providers"]?.advertising).toBeDefined();
    // 19 base groups + 2 for "Airport" sub = 21
    expect(yaml["proxy-groups"].length).toBe(21);
  });

  // 4. Secret handling
  test("Custom Secret", async () => {
    const req = new Request("http://localhost/?secret=my-secret&Airport=http://sub.com");
    const res = await worker.fetch(req, {}, {});
    const yaml = YAML.parse(await res.text());
    expect(yaml["secret"]).toBe("my-secret");
  });

  // 5. Optimized Node Chaining Logic
  test("Mihomo Optimized Node Chaining", async () => {
    const req = new Request("http://localhost/?Airport=http://sub.com");
    const res = await worker.fetch(req, {}, {});
    const yaml = YAML.parse(await res.text());
    
    const groups = yaml["proxy-groups"];
    const entranceGroup = groups.find((g: any) => g.name === "🏮 入口节点");
    const exitGroup = groups.find((g: any) => g.name === "🛫 出口节点");
    
    // 1. System groups exist and Entrance uses Dialer Proxy
    expect(entranceGroup).toBeDefined();
    expect(exitGroup).toBeDefined();
    expect(entranceGroup["dialer-proxy"]).toBe("🛫 出口节点");
    
    // 2. Entrance group contains the standard airport group/auto-select
    expect(entranceGroup.proxies).toContain("Airport");
    expect(entranceGroup.proxies).toContain("⚡ Airport 自动选择");
    
    // 3. NO subscription-specific (链) groups should exist in providers or groups
    expect(yaml["proxy-providers"]?.Airport_dialer).toBeUndefined();
    expect(groups.some((g: any) => g.name.includes("(链)"))).toBe(false);
  });

  // 6. Proxy URI Parsing
  describe("Proxy URI Parsing", () => {
    test("VMess WS/gRPC", async () => {
      const vmessWS = "vmess://" + btoa(JSON.stringify({ v: "2", ps: "V-WS", add: "h", port: 443, id: "u", net: "ws", path: "/p", host: "h.com", tls: "tls" }));
      const req = new Request(`http://localhost/?proxies=${encodeURIComponent(vmessWS)}`);
      const res = await worker.fetch(req, {}, {});
      const yaml = YAML.parse(await res.text());
      const proxy = yaml.proxies[0];
      expect(proxy.type).toBe("vmess");
      expect(proxy.network).toBe("ws");
      expect(proxy["ws-opts"].path).toBe("/p");
    });

    test("Hysteria2 Complex", async () => {
      const hy2 = "hysteria2://auth@h:1234?mport=2000-3000#Hy2";
      const req = new Request(`http://localhost/?proxies=${encodeURIComponent(hy2)}`);
      const res = await worker.fetch(req, {}, {});
      const yaml = YAML.parse(await res.text());
      const proxy = yaml.proxies[0];
      expect(proxy.type).toBe("hysteria2");
      expect(proxy.ports).toBe("2000-3000");
    });

    test("VLESS Reality", async () => {
      const vlessReality = "vless://u@h:443?security=reality&pbk=pk&sid=id&sni=s.com&type=grpc&serviceName=sn#V-Reality";
      const req = new Request(`http://localhost/?proxies=${encodeURIComponent(vlessReality)}`);
      const res = await worker.fetch(req, {}, {});
      const yaml = YAML.parse(await res.text());
      const proxy = yaml.proxies[0];
      expect(proxy["reality-opts"]).toBeDefined();
      expect(proxy["reality-opts"]["public-key"]).toBe("pk");
    });

    test("Shadowsocks Formats", async () => {
      const ssPlain = "ss://YWVzLTI1Ni1nY206cGFzczE@h:443#SS-B64";
      const req = new Request(`http://localhost/?proxies=${encodeURIComponent(ssPlain)}`);
      const res = await worker.fetch(req, {}, {});
      const yaml = YAML.parse(await res.text());
      const proxy = yaml.proxies[0];
      expect(proxy.cipher).toBe("aes-256-gcm");
    });

    test("WireGuard", async () => {
      const wg = "wireguard://priv@h:443?public-key=pub&ip=10.0.0.1/24&reserved=1,2,3&mtu=1450#WG";
      const req = new Request(`http://localhost/?proxies=${encodeURIComponent(wg)}`);
      const res = await worker.fetch(req, {}, {});
      const yaml = YAML.parse(await res.text());
      const proxy = yaml.proxies[0];
      expect(proxy["private-key"]).toBe("priv");
      expect(proxy["reserved"]).toEqual([1, 2, 3]);
    });
  });
});
