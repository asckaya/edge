import { describe, expect, test } from "bun:test";
import { buildProxyUri } from "../functions/_src/utils/proxy-builder";
import { ProxyNode } from "../functions/_src/types";

describe("buildProxyUri", () => {
  test("builds vless protocol", () => {
    const node: ProxyNode = {
      name: "VLESS-Node",
      type: "vless",
      server: "server.com",
      port: 443,
      uuid: "uuid-1234",
      tls: true,
      network: "grpc",
      servername: "sni.com",
      "reality-opts": {
        "public-key": "public_key",
        "short-id": "short_id"
      },
      "grpc-opts": {
        serviceName: "g"
      }
    };
    
    const uris = buildProxyUri(node);
    expect(uris).toHaveLength(1);
    const uri = uris[0];

    expect(uri).toStartWith("vless://uuid-1234@server.com:443");
    expect(uri).toContain("type=grpc");
    expect(uri).toContain("sni=sni.com");
    expect(uri).toContain("pbk=public_key");
    expect(uri).toContain("sid=short_id");
    expect(uri).toContain("serviceName=g");
    expect(uri).toContain("#VLESS-Node");
  });

  test("builds hysteria2 protocol with port range", () => {
    const node: ProxyNode = {
      name: "Hy2-Node",
      type: "hysteria2",
      server: "hy2.server.com",
      port: 20000,
      password: "password",
      sni: "sni.com",
      "skip-cert-verify": true,
      alpn: ["h3", "h2"],
      ports: "20000-40000"
    };

    const uris = buildProxyUri(node);
    expect(uris).toHaveLength(1);
    const uri = uris[0];

    expect(uri).toStartWith("hysteria2://password@hy2.server.com:20000");
    expect(uri).toContain("mport=20000-40000");
    expect(uri).toContain("sni=sni.com");
    expect(uri).toContain("insecure=1");
    expect(uri).toContain("alpn=h3%2Ch2");
    expect(uri).toContain("#Hy2-Node");
  });

  test("builds tuic protocol", () => {
    const node: ProxyNode = {
      name: "TUIC-Node",
      type: "tuic",
      server: "tuic.server.com",
      port: 443,
      uuid: "uuid",
      password: "password",
      sni: "sni.com",
      alpn: ["h3"],
      "congestion-controller": "bbr",
      "udp-relay-mode": "native",
      "skip-cert-verify": true
    };

    const uris = buildProxyUri(node);
    expect(uris).toHaveLength(1);
    const uri = uris[0];

    expect(uri).toStartWith("tuic://uuid:password@tuic.server.com:443");
    expect(uri).toContain("sni=sni.com");
    expect(uri).toContain("congestion_control=bbr");
    expect(uri).toContain("udp_relay_mode=native");
    expect(uri).toContain("insecure=1");
    expect(uri).toContain("#TUIC-Node");
  });

  test("builds wireguard protocol", () => {
    const node: ProxyNode = {
      name: "WG-Node",
      type: "wireguard",
      server: "wg.server.com",
      port: 443,
      "private-key": "priv_key",
      "peer-public-key": "peer_pub",
      "public-key": "pub_something", // proxy parser defaults placeholder depending on format
      ip: ["10.0.0.2/24", "fd00::2"],
      mtu: 1420,
      reserved: [1, 2, 3]
    };

    const uris = buildProxyUri(node);
    expect(uris).toHaveLength(1);
    const uri = uris[0];

    expect(uri).toStartWith("wireguard://priv_key@wg.server.com:443");
    expect(uri).toContain("peer_public_key=peer_pub");
    expect(uri).toContain("ip=10.0.0.2%2F24%2Cfd00%3A%3A2");
    expect(uri).toContain("mtu=1420");
    expect(uri).toContain("reserved=1%2C2%2C3");
    expect(uri).toContain("#WG-Node");
  });
});
