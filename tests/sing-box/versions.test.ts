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

describe("Sing-box Kernel - Versions", () => {
  const originalFetch = globalThis.fetch;
  const mockFetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "http://sub.com") {
      const encoded = btoa("trojan://pw@example.com:443?sni=example.com#SubNode");
      return new Response(encoded, { status: 200 });
    }
    return originalFetch(input);
  }) as unknown as typeof fetch;

  test("Full Edition", async () => {
    globalThis.fetch = mockFetch;
    try {
      const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
      const json = await res.json() as any;
      expect(json.outbounds).toBeDefined();
      expect(json.route.rule_set.length).toBeGreaterThan(20);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("Dual Edition", async () => {
    globalThis.fetch = mockFetch;
    try {
      const res = await callWorker("http://localhost/?type=sing-box-dual&Airport=http://sub.com");
      const json = await res.json() as any;
      // All scenario rules should point to 🚀 节点选择
      expect(json.route.rules.some((r: any) => r.outbound === "🚀 节点选择" && r.rule_set?.includes("google"))).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("White Edition", async () => {
    globalThis.fetch = mockFetch;
    try {
      const res = await callWorker("http://localhost/?type=sing-box-white&Sub=http://sub.com");
      const json = await res.json() as any;
      // White-list: final route to proxy
      expect(json.route.final).toBe("🚀 节点选择");
      expect(json.outbounds.some((item: any) => item.tag === "🔒 国内服务")).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("Black Edition", async () => {
    globalThis.fetch = mockFetch;
    try {
      const res = await callWorker("http://localhost/?type=sing-box-black&Sub=http://sub.com");
      const json = await res.json() as any;
      // Black-list: final route to direct
      expect(json.route.final).toBe("direct");
      expect(json.outbounds.some((item: any) => item.tag === "🔒 国内服务")).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
