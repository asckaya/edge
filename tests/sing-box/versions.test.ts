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

  test("Mini Edition", async () => {
    globalThis.fetch = mockFetch;
    try {
      const res = await callWorker("http://localhost/?type=sing-box-mini&Sub=http://sub.com");
      const json = await res.json() as any;
      expect(json.route.rule_set.length).toBe(20);
      expect(json.outbounds.some((item: any) => item.tag === "🎬 流媒体")).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("Micro Edition", async () => {
    globalThis.fetch = mockFetch;
    try {
      const res = await callWorker("http://localhost/?type=sing-box-micro&Sub=http://sub.com");
      const json = await res.json() as any;
      expect(json.route.final).toBe("direct");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
