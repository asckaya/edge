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

describe("Proxy URI Parsing", () => {
  test("VMess WS/gRPC", async () => {
    const vmessWS = "vmess://" + btoa(JSON.stringify({ v: "2", ps: "V-WS", add: "h", port: 443, id: "u", net: "ws", path: "/p", host: "h.com", tls: "tls" }));
    const res = await callWorker(`http://localhost/?proxies=${encodeURIComponent(vmessWS)}`);
    const yaml = YAML.parse(await res.text());
    const proxy = yaml.proxies[0];
    expect(proxy.type).toBe("vmess");
    expect(proxy.network).toBe("ws");
    expect(proxy["ws-opts"].path).toBe("/p");
  });

  test("Hysteria2 Complex", async () => {
    const hy2 = "hysteria2://auth@h:1234?mport=2000-3000#Hy2";
    const res = await callWorker(`http://localhost/?proxies=${encodeURIComponent(hy2)}`);
    const yaml = YAML.parse(await res.text());
    const proxy = yaml.proxies[0];
    expect(proxy.type).toBe("hysteria2");
    expect(proxy.ports).toBe("2000-3000");
  });

  test("VLESS Reality", async () => {
    const vlessReality = "vless://u@h:443?security=reality&pbk=pk&sid=id&sni=s.com&type=grpc&serviceName=sn#V-Reality";
    const res = await callWorker(`http://localhost/?proxies=${encodeURIComponent(vlessReality)}`);
    const yaml = YAML.parse(await res.text());
    const proxy = yaml.proxies[0];
    expect(proxy["reality-opts"]).toBeDefined();
    expect(proxy["reality-opts"]["public-key"]).toBe("pk");
  });

  test("Shadowsocks Formats", async () => {
    const ssPlain = "ss://YWVzLTI1Ni1nY206cGFzczE@h:443#SS-B64";
    const res = await callWorker(`http://localhost/?proxies=${encodeURIComponent(ssPlain)}`);
    const yaml = YAML.parse(await res.text());
    const proxy = yaml.proxies[0];
    expect(proxy.cipher).toBe("aes-256-gcm");
  });

  test("WireGuard", async () => {
    const wg = "wireguard://priv@h:443?public-key=pub&ip=10.0.0.1/24&reserved=1,2,3&mtu=1450#WG";
    const res = await callWorker(`http://localhost/?proxies=${encodeURIComponent(wg)}`);
    const yaml = YAML.parse(await res.text());
    const proxy = yaml.proxies[0];
    expect(proxy["private-key"]).toBe("priv");
    expect(proxy["reserved"]).toEqual([1, 2, 3]);
  });
});
