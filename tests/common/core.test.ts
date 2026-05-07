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

describe("Core Routing & Security", () => {
  test("Root Fallback to UI", async () => {
    const res = await callWorker("http://localhost/");
    const content = await res.text();
    expect(content).toBe("Static Asset Content");
  });

  test("Missing Parameters", async () => {
    const res = await callWorker("http://localhost/?foo=bar");
    const content = await res.text();
    expect(content).toContain("Missing parameters");
  });

  test("Custom Secret", async () => {
    const res = await callWorker("http://localhost/?secret=my-secret&Airport=http://sub.com");
    const text = await res.text();
    expect(text).toContain('secret: "my-secret"');
  });
});
