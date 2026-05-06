import { describe, expect, test } from "vitest";
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
    
    expect(yaml["rule-providers"]).toBeUndefined();
    // Check that we are using GEOSITE
    expect(yaml.rules.some((r: string) => r.includes("GEOSITE,category-ads-all"))).toBe(true);
    // 4 base groups + 7 regional/auto groups + 2 for "Airport" sub = 13
    expect(yaml["proxy-groups"].length).toBe(13);
  });
  test("Mihomo Mini", async () => {
    const res = await callWorker("http://localhost/?type=mihomo-mini&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    
    expect(yaml["rule-providers"]).toBeUndefined();
    // Check that we are using GEOSITE
    expect(yaml.rules.some((r: string) => r.includes("GEOSITE,category-ads-all"))).toBe(true);
    // 4 base groups + 7 regional/auto groups + 2 for "Airport" sub = 13
    expect(yaml["proxy-groups"].length).toBe(13);
  });

  test("sing-box-mini", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://sub.com") {
        const encoded = btoa("trojan://pw@example.com:443?sni=example.com#SubNode");
        return new Response(encoded, { status: 200 });
      }
      return originalFetch(input);
    }) as unknown as typeof fetch;
    globalThis.fetch = mockFetch;

    try {
      const res = await callWorker("http://localhost/?type=sing-box-mini&Sub=http://sub.com");
      const json = await res.json() as any;
      
      expect(json.outbounds).toBeDefined();
      expect(json.route).toBeDefined();
      // Should only contain mini rule sets
      expect(json.route.rule_set.length).toBe(8);
      // Ensure "adblockfilters" is in rule_set
      expect(json.route.rule_set.some((r: any) => r.tag === "adblockfilters")).toBe(true);
      // Ensure large groups are removed
      expect(json.outbounds.some((item: any) => item.tag === "🎬 流媒体")).toBe(false);
      // Basic mini group exists
      expect(json.outbounds.some((item: any) => item.tag === "🔒 国内服务")).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("Mihomo Micro", async () => {
    const res = await callWorker("http://localhost/?type=mihomo-micro&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    
    // Check for black-list rules
    expect(yaml.rules.some((r: string) => r.includes("MATCH,DIRECT"))).toBe(true);
    expect(yaml.rules.some((r: string) => r.includes("GEOSITE,google,🔍 谷歌服务"))).toBe(true);
    // 4 base + 7 regional/auto + 2 sub = 13
    expect(yaml["proxy-groups"].length).toBe(13);
  });

  test("sing-box-micro", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://sub.com") {
        const encoded = btoa("trojan://pw@example.com:443?sni=example.com#SubNode");
        return new Response(encoded, { status: 200 });
      }
      return originalFetch(input);
    }) as unknown as typeof fetch;
    globalThis.fetch = mockFetch;

    try {
      const res = await callWorker("http://localhost/?type=sing-box-micro&Sub=http://sub.com");
      const json = await res.json() as any;
      
      expect(json.route.final).toBe("direct");
      // Should contain blocked rules
      expect(json.route.rule_set.some((r: any) => r.tag === "google")).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
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

      expect(tags).toContain("🇯🇵 Airport 01 (jp-1)");
      expect(tags).toContain("🇭🇰 Airport 02 (hk-1)");
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

      expect(json.outbounds.some((item: any) => item.type === "anytls" && item.tag === "🇸🇬 Json 01 (sg-anytls)")).toBe(true);
      expect(json.outbounds.some((item: any) => item.type === "shadowsocks" && item.tag === "🏳️ Yaml 01 (YAML-SS)")).toBe(true);
      expect(json.outbounds.some((item: any) => item.type === "shadowsocks" && item.tag === "🏳️ Yaml 01 (YAML-SS)" && item.plugin === "obfs-local" && item.plugin_opts === "obfs=tls;obfs-host=plugin.example.com")).toBe(true);
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

      expect(tags).toContain("🇯🇵 Airport 01 (node-1)");
      expect(tags).toContain("🇺🇸 Airport 02 (node-2)");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("sing-box prefers country hints from original node names", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://sub.com") {
        return new Response(JSON.stringify({
          outbounds: [
            {
              type: "trojan",
              tag: "🇯🇵Japan 01",
              server: "us-origin.example.net",
              server_port: 443,
              password: "pw1",
              tls: { enabled: true, server_name: "us-origin.example.net" }
            },
            {
              type: "trojan",
              tag: "TW-X1-1",
              server: "unknown.example.net",
              server_port: 443,
              password: "pw2",
              tls: { enabled: true, server_name: "unknown.example.net" }
            }
          ]
        }), { status: 200 });
      }

      return originalFetch(input);
    }) as typeof fetch;
    globalThis.fetch = mockFetch;

    try {
      const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
      const json = JSON.parse(await res.text());
      const tags = json.outbounds.filter((item: any) => item.type === "trojan").map((item: any) => item.tag);

      expect(tags).toContain("🇯🇵 Airport 01 (🇯🇵Japan 01)");
      expect(tags).toContain("🇹🇼 Airport 02 (TW-X1-1)");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("sing-box filters informational subscription nodes", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://sub.com") {
        return new Response(JSON.stringify({
          outbounds: [
            {
              type: "vless",
              tag: "剩余流量：463.56 GB",
              server: "info.example.net",
              server_port: 443,
              uuid: "11111111-1111-1111-1111-111111111111"
            },
            {
              type: "vless",
              tag: "套餐到期：2027-04-25",
              server: "expire.example.net",
              server_port: 443,
              uuid: "22222222-2222-2222-2222-222222222222"
            },
            {
              type: "vless",
              tag: "🇯🇵Japan 01",
              server: "jp.example.net",
              server_port: 443,
              uuid: "33333333-3333-3333-3333-333333333333"
            }
          ]
        }), { status: 200 });
      }

      return originalFetch(input);
    }) as typeof fetch;
    globalThis.fetch = mockFetch;

    try {
      const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
      const json = JSON.parse(await res.text());
      const tags = json.outbounds.filter((item: any) => item.type === "vless").map((item: any) => item.tag);

      expect(tags).toEqual(["🇯🇵 Airport 01 (🇯🇵Japan 01)"]);
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
