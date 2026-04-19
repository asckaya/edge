import { describe, expect, test } from "bun:test";
import { onRequest } from "../functions/[[path]]";

describe("Edge Subscription Worker - Routing", () => {
  const callWorker = async (url: string) => {
    const req = new Request(url);
    return onRequest({
      request: req,
      next: async () => new Response("Static Asset Content", { status: 200 }),
      env: {},
      params: {},
    } as any);
  };

  test("Root without params falls back to assets", async () => {
    const res = await callWorker("http://localhost/");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("Static Asset Content");
  });

  test("Root with params handled by API", async () => {
    const res = await callWorker("http://localhost/?Airport=http://sub.com");
    expect(res.headers.get("content-type")).toContain("text/yaml");
    const text = await res.text();
    expect(text).toContain("proxy-providers:");
  });

  test("sing-box returns JSON", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "http://sub.com") {
        return new Response("ss://YWVzLTI1Ni1nY206cGFzczE@h:443#SS-B64", { status: 200 });
      }
      return originalFetch(input);
    }) as typeof fetch;
    globalThis.fetch = mockFetch;

    try {
      const res = await callWorker("http://localhost/?type=sing-box&Airport=http://sub.com");
      expect(res.headers.get("content-type")).toContain("application/json");
      const text = await res.text();
      expect(text).toContain("\"outbounds\"");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("Sub-path without params falls back to assets", async () => {
    const res = await callWorker("http://localhost/some-page");
    const text = await res.text();
    expect(text).toBe("Static Asset Content");
  });
});
