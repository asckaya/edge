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

  test("Minimal Edition", async () => {
    const res = await callWorker("http://localhost/?type=mihomo-minimal&Airport=http://sub.com");
    const yaml = YAML.parse(await res.text());
    // Blacklist mode: MATCH should fall through to DIRECT
    expect(yaml.rules.some((r: string) => r.includes("MATCH,DIRECT"))).toBe(true);
    // Only 🚀 节点选择 + ⚡ 自动 + 7 regional + 2 Airport groups (no scenario or CN groups)
    expect(yaml["proxy-groups"].some((g: { name: string }) => g.name === "🔒 国内服务")).toBe(false);
  });
});
