import { describe, expect, test } from "bun:test";
import { onRequest } from "../functions/[[path]]";

describe("Edge Subscription Worker - Routing", () => {
  const nextResponse = new Response("Static Asset Content", { status: 200 });
  
  const callWorker = async (url: string) => {
    const req = new Request(url);
    return onRequest({
      request: req,
      next: async () => nextResponse,
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

  test("Sub-path without params falls back to assets", async () => {
    const res = await callWorker("http://localhost/some-page");
    const text = await res.text();
    expect(text).toBe("Static Asset Content");
  });
});
