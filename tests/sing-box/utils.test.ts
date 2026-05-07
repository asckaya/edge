import { describe, expect, test } from "vitest";
import { onRequest } from "../../functions/[[path]]";

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

describe("Sing-box Kernel - Utils", () => {
  const originalFetch = globalThis.fetch;

  test("Node Renaming", async () => {
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      const parsedUrl = new URL(url);
      if (url === "http://sub.com") {
        return new Response(JSON.stringify({
          outbounds: [{ type: "trojan", tag: "node-1", server: "jp.real.site", server_port: 443, password: "pw1", tls: { enabled: true, server_name: "jp.real.site" } }]
        }), { status: 200 });
      }
      if (parsedUrl.hostname === "cloudflare-dns.com") return new Response(JSON.stringify({ Answer: [{ data: "1.1.1.1" }] }), { status: 200 });
      if (url === "https://ipwho.is/1.1.1.1") return new Response(JSON.stringify({ success: true, country_code: "JP" }), { status: 200 });
      if (url === "https://api.country.is/1.1.1.1") return new Response(JSON.stringify({ country: "JP" }), { status: 200 });
      return originalFetch(input);
    }) as unknown as typeof fetch;
    globalThis.fetch = mockFetch;
    try {
      const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
      const json = await res.json() as any;
      expect(json.outbounds.some((item: any) => item.tag === "🇯🇵 Airport 01 (node-1)")).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("Renaming Prefers Hints", async () => {
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://sub.com") {
        return new Response(JSON.stringify({
          outbounds: [{ type: "trojan", tag: "TW-X1-1", server: "unknown.net", server_port: 443, password: "pw2" }]
        }), { status: 200 });
      }
      return originalFetch(input);
    }) as unknown as typeof fetch;
    globalThis.fetch = mockFetch;
    try {
      const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
      const json = await res.json() as any;
      expect(json.outbounds.some((item: any) => item.tag === "🇹🇼 Airport 01 (TW-X1-1)")).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("Informational Node Filtering", async () => {
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://sub.com") {
        return new Response(JSON.stringify({
          outbounds: [
            { type: "vless", tag: "剩余流量：463.56 GB", server: "i.net", server_port: 443, uuid: "u1" },
            { type: "vless", tag: "🇯🇵Japan 01", server: "j.net", server_port: 443, uuid: "u2" }
          ]
        }), { status: 200 });
      }
      return originalFetch(input);
    }) as unknown as typeof fetch;
    globalThis.fetch = mockFetch;
    try {
      const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
      const json = await res.json() as any;
      const tags = json.outbounds.filter((item: any) => item.type === "vless").map((item: any) => item.tag);
      expect(tags).toEqual(["🇯🇵 Airport 01 (🇯🇵Japan 01)"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
