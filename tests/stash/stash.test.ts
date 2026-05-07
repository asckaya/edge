import { describe, expect, test } from "vitest";
import YAML from "yaml";
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

describe("Stash Kernel", () => {
  test("Full Edition", async () => {
    const res = await callWorker("http://localhost/?type=stash&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    expect(yaml["external-controller"]).toBeUndefined(); // Stash doesn't use this field
    expect(yaml["proxy-providers"]?.Airport).toBeDefined();
    expect(yaml.dns).toBeDefined();
  });

  test("Dual Edition", async () => {
    const res = await callWorker("http://localhost/?type=stash-dual&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    expect(yaml.rules.some((r: string) => r.includes("🚀 节点选择") && r.includes("youtube"))).toBe(true);
  });

  test("White Edition", async () => {
    const res = await callWorker("http://localhost/?type=stash-white&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    expect(yaml.rules.some((r: string) => r.includes("MATCH,🚀 节点选择"))).toBe(true);
    expect(yaml["proxy-groups"].some((g: { name: string }) => g.name === "🔒 国内服务")).toBe(true);
  });

  test("Black Edition", async () => {
    const res = await callWorker("http://localhost/?type=stash-black&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    expect(yaml.rules.some((r: string) => r.includes("MATCH,DIRECT"))).toBe(true);
    expect(yaml["proxy-groups"].some((g: { name: string }) => g.name === "🔒 国内服务")).toBe(true);
  });
});
