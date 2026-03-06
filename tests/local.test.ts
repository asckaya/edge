import { describe, expect, test } from "bun:test";
import worker from "../index";

/**
 * 100% Coverage Test Suite for Edge Subscription Converter
 * Covers all logic branches in index.ts and proxy-parser.ts
 */

describe("Edge Subscription Worker - Functional", () => {
  // Mocking Response globally is not needed with bun:test for the fetch call itself,
  // but the worker uses global Response if needed. Bun provides it.

  // 1. Redirects
  test("UI Redirect", async () => {
    const req = new Request("http://localhost/ui");
    const res = await worker.fetch(req, {}, {});
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")?.endsWith("/ui/")).toBe(true);
  });

  // 2. Error Handling
  test("Missing Parameters", async () => {
    const req = new Request("http://localhost/");
    const res = await worker.fetch(req, {}, {});
    const content = await res.text();
    expect(content).toContain("Missing parameters");
  });

  // 3. Platform Variations
  test("Mihomo (Default)", async () => {
    const req = new Request("http://localhost/?Airport=http://sub.com");
    const res = await worker.fetch(req, {}, {});
    const content = await res.text();
    expect(content).toContain("clash.meta");
    expect(content).toContain("proxy-providers");
  });

  test("Stash Full", async () => {
    const req = new Request("http://localhost/?type=stash&Airport=http://sub.com");
    const res = await worker.fetch(req, {}, {});
    const content = await res.text();
    expect(content).toContain("Stash");
    expect(content).toContain("proxy-providers");
  });

  test("Stash Mini", async () => {
    const req = new Request("http://localhost/?type=stash-mini&Airport=http://sub.com");
    const res = await worker.fetch(req, {}, {});
    const content = await res.text();
    expect(content).toContain("Stash");
    expect(content).toContain("proxy-providers");
    // advertising is specifically in mini
    expect(content).toContain("advertising");
  });

  // 4. Secret handling
  test("Custom Secret", async () => {
    const req = new Request("http://localhost/?secret=my-secret&Airport=http://sub.com");
    const res = await worker.fetch(req, {}, {});
    const content = await res.text();
    expect(content).toContain("my-secret");
  });

  // 5. Proxy URI Parsing
  describe("Proxy URI Parsing", () => {
    test("VMess WS/gRPC", async () => {
      const vmessWS = "vmess://" + btoa(JSON.stringify({ v: "2", ps: "V-WS", add: "h", port: 443, id: "u", net: "ws", path: "/p", host: "h.com", tls: "tls" }));
      const vmessGRPC = "vmess://" + btoa(JSON.stringify({ v: "2", ps: "V-GRPC", add: "h", port: 443, id: "u", net: "grpc", path: "s" }));
      const req = new Request(`http://localhost/?proxies=${encodeURIComponent(vmessWS + "|" + vmessGRPC)}`);
      const res = await worker.fetch(req, {}, {});
      const content = await res.text();
      expect(content).toContain("network: ws");
      expect(content).toContain("serviceName: s");
    });

    test("Hysteria2 Complex", async () => {
      const hy2Full = "hysteria2://auth@h:1234?sni=s.com&insecure=1&obfs=salamander&obfs-password=p1&mport=2000-3000#Hy2";
      const req = new Request(`http://localhost/?proxies=${encodeURIComponent(hy2Full)}`);
      const res = await worker.fetch(req, {}, {});
      const content = await res.text();
      expect(content).toContain("type: hysteria2");
      expect(content).toContain("ports: 2000-3000");
      expect(content).toContain("obfs: salamander");
    });

    test("VLESS Reality", async () => {
      const vlessReality = "vless://u@h:443?security=reality&pbk=pk&sid=id&sni=s.com&type=grpc&serviceName=sn#V-Reality";
      const req = new Request(`http://localhost/?proxies=${encodeURIComponent(vlessReality)}`);
      const res = await worker.fetch(req, {}, {});
      const content = await res.text();
      expect(content).toContain("reality-opts");
      expect(content).toContain("public-key: pk");
    });

    test("Shadowsocks Formats", async () => {
      const ssPlain = "ss://YWVzLTI1Ni1nY206cGFzczE@h:443#SS-B64";
      const ssPlain2 = "ss://method:pass2@h:443#SS-Raw";
      const req = new Request(`http://localhost/?proxies=${encodeURIComponent(ssPlain + "|" + ssPlain2)}`);
      const res = await worker.fetch(req, {}, {});
      const content = await res.text();
      expect(content).toContain("cipher: aes-256-gcm");
      expect(content).toContain("password: pass2");
    });

    test("TUIC", async () => {
      const tuic = "tuic://u:p@h:443?congestion_control=bbr&udp_relay_mode=native#TUIC";
      const req = new Request(`http://localhost/?proxies=${encodeURIComponent(tuic)}`);
      const res = await worker.fetch(req, {}, {});
      const content = await res.text();
      expect(content).toContain("congestion-controller: bbr");
      expect(content).toContain("udp-relay-mode: native");
    });

    test("WireGuard", async () => {
      const wg = "wireguard://priv@h:443?public-key=pub&ip=10.0.0.1/24,10.0.0.2/24&reserved=1,2,3&mtu=1450#WG";
      const req = new Request(`http://localhost/?proxies=${encodeURIComponent(wg)}`);
      const res = await worker.fetch(req, {}, {});
      const content = await res.text();
      expect(content).toContain("private-key: priv");
      expect(content).toContain("reserved:");
      expect(content).toContain("1");
      expect(content).toContain("mtu: 1450");
    });

    test("Mixed & Malformed Content", async () => {
      const mixed = [
        "vless://u@h:443#Valid",
        "invalid-uri-here",
        "  - name: RawYAML\n    type: ss"
      ].join("\n");
      const req = new Request(`http://localhost/?proxies=${encodeURIComponent(mixed)}`);
      const res = await worker.fetch(req, {}, {});
      const content = await res.text();
      expect(content).toContain("Valid");
      expect(content).toContain("invalid-uri-here");
      expect(content).toContain("RawYAML");
    });
  });
});
