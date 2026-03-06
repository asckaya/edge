import { describe, expect, test } from "bun:test";
import worker from "../index";

describe("Edge Subscription Worker - Routing", () => {
  const env = {
    ASSETS: {
      fetch: async (req: Request) => {
        return new Response(`Serving asset: ${new URL(req.url).pathname}`, { status: 200 });
      }
    }
  };

  test("Redirects /ui to /ui/", async () => {
    const req = new Request("http://localhost/ui");
    const res = await worker.fetch(req, env, {});
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("http://localhost/ui/");
  });

  test("API handles / with parameters", async () => {
    const req = new Request("http://localhost/?proxies=test");
    const res = await worker.fetch(req, env, {});
    expect(res.headers.get("content-type")).toContain("text/yaml");
    const text = await res.text();
    expect(text).toContain("proxies:");
  });

  test("API returns error on / without parameters", async () => {
    const req = new Request("http://localhost/");
    const res = await worker.fetch(req, env, {});
    const text = await res.text();
    expect(text).toContain("Missing parameters");
  });
});
