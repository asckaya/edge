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

  test("sing-box", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://sub.com") {
        const encoded = btoa("trojan://pw@example.com:443?sni=example.com#SubNode");
        return new Response(encoded, { status: 200 });
      }
      return originalFetch(input);
    }) as typeof fetch;
    globalThis.fetch = mockFetch;

    try {
      const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
      const json = JSON.parse(await res.text());
      const ruleSetTags = json.route.rule_set.map((item: any) => item.tag);

      expect(Array.isArray(json.outbounds)).toBe(true);
      expect(json.route.rule_set.length).toBeGreaterThan(20);
      expect(json.route.rule_set[0].url).toContain("MetaCubeX/meta-rules-dat/sing/geo/");
      expect(ruleSetTags).toContain("category-speedtest");
      expect(ruleSetTags).toContain("category-ntp");
      expect(ruleSetTags).toContain("category-container");
      expect(json.route.rule_set.find((item: any) => item.tag === "adblockfilters")?.url).toContain("217heidai/adblockfilters");
      expect(json.outbounds.some((item: any) => item.tag === "🧪 测速专线")).toBe(true);
      expect(json.outbounds.some((item: any) => item.tag === "🕓 NTP 服务")).toBe(true);
      expect(json.inbounds.some((item: any) => item.type === "mixed" && item.listen === "0.0.0.0" && item.listen_port === 7897)).toBe(true);
      expect(json.experimental.clash_api.external_controller).toBe("0.0.0.0:9090");
      expect(json.route.override_android_vpn).toBeUndefined();
      expect(json.outbounds.some((item: any) => item.type === "trojan")).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("sing-box parses sing-box subscription outbounds", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://sub.com") {
        return new Response(JSON.stringify({
          outbounds: [
            { type: "selector", tag: "auto", outbounds: ["jp-1", "hk-1"] },
            {
              type: "trojan",
              tag: "jp-1",
              server: "jp.example.com",
              server_port: 443,
              password: "pw1",
              tls: { enabled: true, server_name: "jp.example.com" }
            },
            {
              type: "shadowsocks",
              tag: "hk-1",
              server: "hk.example.com",
              server_port: 8388,
              method: "aes-256-gcm",
              password: "pw2"
            },
            { type: "direct", tag: "direct" }
          ]
        }), { status: 200 });
      }

      if (url.startsWith("https://cloudflare-dns.com/dns-query")) {
        return new Response(JSON.stringify({ Status: 3, Answer: [] }), { status: 200 });
      }

      if (url.startsWith("https://ipwho.is/")) {
        return new Response(JSON.stringify({ success: false }), { status: 200 });
      }

      return originalFetch(input);
    }) as typeof fetch;
    globalThis.fetch = mockFetch;

    try {
      const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
      const json = JSON.parse(await res.text());
      const tags = json.outbounds.map((item: any) => item.tag);

      expect(tags).toContain("🏳️ Airport 01");
      expect(tags).toContain("🏳️ Airport 02");
      expect(json.outbounds.some((item: any) => item.type === "trojan" && item.server === "jp.example.com")).toBe(true);
      expect(json.outbounds.some((item: any) => item.type === "shadowsocks" && item.server === "hk.example.com")).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("sing-box parses anytls outbounds and commented mihomo yaml subscriptions", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://json-sub.com") {
        return new Response(JSON.stringify({
          outbounds: [
            {
              type: "anytls",
              tag: "sg-anytls",
              server: "sg.example.com",
              server_port: 443,
              password: "pw-anytls",
              tls: { enabled: true, server_name: "sg.example.com" }
            }
          ]
        }), { status: 200 });
      }

      if (url === "http://yaml-sub.com") {
        return new Response(`# comment\nport: 7890\nproxies:\n  - name: "YAML-SS"\n    type: ss\n    server: yaml.example.com\n    port: 8388\n    cipher: aes-256-gcm\n    password: yaml-pw\n    plugin: obfs\n    plugin-opts:\n      mode: tls\n      host: plugin.example.com\n`, { status: 200 });
      }

      if (url.startsWith("https://cloudflare-dns.com/dns-query")) {
        return new Response(JSON.stringify({ Status: 3, Answer: [] }), { status: 200 });
      }

      if (url.startsWith("https://ipwho.is/")) {
        return new Response(JSON.stringify({ success: false }), { status: 200 });
      }

      return originalFetch(input);
    }) as typeof fetch;
    globalThis.fetch = mockFetch;

    try {
      const res = await callWorker("http://localhost/?type=sing-box&Json=http://json-sub.com&Yaml=http://yaml-sub.com");
      const json = JSON.parse(await res.text());

      expect(json.outbounds.some((item: any) => item.type === "anytls" && item.tag === "🏳️ Json 01")).toBe(true);
      expect(json.outbounds.some((item: any) => item.type === "shadowsocks" && item.tag === "🏳️ Yaml 01")).toBe(true);
      expect(json.outbounds.some((item: any) => item.type === "shadowsocks" && item.tag === "🏳️ Yaml 01" && item.plugin === "obfs-local" && item.plugin_opts === "obfs=tls;obfs-host=plugin.example.com")).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("sing-box renames subscription nodes with geoip flag and provider sequence", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      const parsedUrl = new URL(url);

      if (url === "http://sub.com") {
        return new Response(JSON.stringify({
          outbounds: [
            {
              type: "trojan",
              tag: "node-1",
              server: "jp.real.site",
              server_port: 443,
              password: "pw1",
              tls: { enabled: true, server_name: "jp.real.site" }
            },
            {
              type: "trojan",
              tag: "node-2",
              server: "us.real.site",
              server_port: 443,
              password: "pw2",
              tls: { enabled: true, server_name: "us.real.site" }
            }
          ]
        }), { status: 200 });
      }

      if (parsedUrl.hostname === "cloudflare-dns.com" && parsedUrl.pathname === "/dns-query" && parsedUrl.searchParams.get("name") === "jp.real.site") {
        return new Response(JSON.stringify({ Answer: [{ data: "1.1.1.1" }] }), { status: 200 });
      }

      if (parsedUrl.hostname === "cloudflare-dns.com" && parsedUrl.pathname === "/dns-query" && parsedUrl.searchParams.get("name") === "us.real.site") {
        return new Response(JSON.stringify({ Answer: [{ data: "8.8.8.8" }] }), { status: 200 });
      }

      if (url === "https://ipwho.is/1.1.1.1") {
        return new Response(JSON.stringify({ success: true, country_code: "JP" }), { status: 200 });
      }

      if (url === "https://ipwho.is/8.8.8.8") {
        return new Response(JSON.stringify({ success: true, country_code: "US" }), { status: 200 });
      }

      if (url === "https://api.country.is/1.1.1.1") {
        return new Response(JSON.stringify({ country: "JP" }), { status: 200 });
      }

      if (url === "https://api.country.is/8.8.8.8") {
        return new Response(JSON.stringify({ country: "US" }), { status: 200 });
      }

      return originalFetch(input);
    }) as typeof fetch;
    globalThis.fetch = mockFetch;

    try {
      const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
      const json = JSON.parse(await res.text());
      const tags = json.outbounds.filter((item: any) => item.type === "trojan").map((item: any) => item.tag);

      expect(tags).toContain("🇯🇵 Airport 01");
      expect(tags).toContain("🇺🇸 Airport 02");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("sing-box collapses alert subscriptions into one warning node", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "http://sub.com/fallback") {
        return new Response(JSON.stringify({
          outbounds: [
            {
              type: "shadowsocks",
              tag: "您的订阅可能被泄露",
              server: "127.0.0.1",
              server_port: 1,
              method: "aes-128-gcm",
              password: "pw"
            },
            {
              type: "shadowsocks",
              tag: "为了您的账号安全",
              server: "127.0.0.1",
              server_port: 1,
              method: "aes-128-gcm",
              password: "pw"
            }
          ]
        }), { status: 200 });
      }

      return originalFetch(input);
    }) as typeof fetch;
    globalThis.fetch = mockFetch;

    try {
      const res = await callWorker("http://localhost/?type=sing-box&BYG=http://sub.com/fallback");
      const json = JSON.parse(await res.text());
      const outbounds = json.outbounds.filter((item: any) => item.type === "shadowsocks");

      expect(outbounds.length).toBe(1);
      expect(outbounds[0].tag).toBe("⚠️ BYG 订阅失效");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("sing-box enables utls for reality outbounds", async () => {
    const realityUri = "vless://u@reality.example.com:443?security=reality&pbk=pk123&sid=abcd1234&sni=cdn.example.com&fp=chrome#Reality";
    const res = await callWorker(`http://localhost/?type=sing-box&proxies=${encodeURIComponent(realityUri)}`);
    const json = JSON.parse(await res.text());
    const outbound = json.outbounds.find((item: any) => item.type === "vless" && item.tag === "Reality");

    expect(outbound).toBeDefined();
    expect(outbound.tls.reality.public_key).toBe("pk123");
    expect(outbound.tls.reality.short_id).toBe("abcd1234");
    expect(outbound.tls.utls.enabled).toBe(true);
    expect(outbound.tls.utls.fingerprint).toBe("chrome");
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
