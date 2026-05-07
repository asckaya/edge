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

describe("Mihomo Kernel", () => {
  test("Full Edition", async () => {
    const res = await callWorker("http://localhost/?type=mihomo&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    expect(yaml["proxy-providers"]?.Airport).toBeDefined();
    expect(yaml["proxy-groups"]).toBeInstanceOf(Array);
    // Ensure scenario groups exist in Full
    expect(yaml["proxy-groups"].some((g: any) => g.name === "📹 油管视频")).toBe(true);
  });

  test("Dual Edition", async () => {
    const res = await callWorker("http://localhost/?type=mihomo-dual&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    // In Dual mode, scenario groups should be redirected to 🚀 节点选择 in rules
    expect(yaml.rules.some((r: string) => r.includes("🚀 节点选择") && r.includes("youtube"))).toBe(true);
    // And groups should be simplified (using mini groups)
    expect(yaml["proxy-groups"].some((g: any) => g.name === "📹 油管视频")).toBe(false);
  });

  test("White Edition", async () => {
    const res = await callWorker("http://localhost/?type=mihomo-white&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    // White-list: CN rules direct, MATCH → proxy
    expect(yaml.rules.some((r: string) => r.includes("MATCH,🚀 节点选择"))).toBe(true);
    expect(yaml["proxy-groups"].some((g: { name: string }) => g.name === "🔒 国内服务")).toBe(true);
  });

  test("Black Edition", async () => {
    const res = await callWorker("http://localhost/?type=mihomo-black&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    // Black-list: overseas rules proxy, MATCH → direct
    expect(yaml.rules.some((r: string) => r.includes("MATCH,DIRECT"))).toBe(true);
    expect(yaml["proxy-groups"].some((g: { name: string }) => g.name === "🔒 国内服务")).toBe(true);
  });
});
