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

  test("Mini Edition", async () => {
    const res = await callWorker("http://localhost/?type=mihomo-mini&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    expect(yaml.rules.some((r: string) => r.includes("GEOSITE,category-ads-all"))).toBe(true);
    // 5 base groups + 7 regional/auto groups + 2 for "Airport" sub = 14
    expect(yaml["proxy-groups"].length).toBe(14);
  });

  test("Micro Edition", async () => {
    const res = await callWorker("http://localhost/?type=mihomo-micro&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    expect(yaml.rules.some((r: string) => r.includes("MATCH,DIRECT"))).toBe(true);
    expect(yaml["proxy-groups"].length).toBe(14);
  });
});
