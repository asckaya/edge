import { describe, expect, test } from "bun:test";
import { parseProxyUri } from "../functions/_src/utils/proxy-parser";
import YAML from "yaml";

describe("parseProxyUri", () => {
  test("handles empty string", () => {
    expect(parseProxyUri("")).toBe("");
  });

  test("parses vless protocol with reality", () => {
    const uri = "vless://uuid-1234@server.com:443?type=grpc&security=reality&pbk=public_key&sid=short_id&sni=sni.com&serviceName=g#VLESS-Node";
    const yamlString = parseProxyUri(uri);
    const parsed = YAML.parse(yamlString);
    
    expect(parsed.proxies[0]).toMatchObject({
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
    });
  });

  test("parses hysteria2 protocol with port range", () => {
    const uri = "hysteria2://password@hy2.server.com:20000-40000?sni=sni.com&insecure=1&alpn=h3,h2&mport=20000-40000#Hy2-Node";
    const yamlString = parseProxyUri(uri);
    const parsed = YAML.parse(yamlString);

    expect(parsed.proxies[0]).toMatchObject({
      name: "Hy2-Node",
      type: "hysteria2",
      server: "hy2.server.com",
      port: 20000,
      password: "password",
      sni: "sni.com",
      "skip-cert-verify": true,
      alpn: ["h3", "h2"],
      ports: "20000-40000"
    });
  });

  test("parses tuic protocol", () => {
    const uri = "tuic://uuid:password@tuic.server.com:443?sni=sni.com&alpn=h3&congestion_control=bbr&udp_relay_mode=native#TUIC-Node";
    const yamlString = parseProxyUri(uri);
    const parsed = YAML.parse(yamlString);

    expect(parsed.proxies[0]).toMatchObject({
      name: "TUIC-Node",
      type: "tuic",
      server: "tuic.server.com",
      port: 443,
      uuid: "uuid",
      password: "password",
      sni: "sni.com",
      alpn: ["h3"],
      "congestion-controller": "bbr",
      "udp-relay-mode": "native"
    });
  });

  test("parses wireguard protocol", () => {
    const uri = "wireguard://priv_key@wg.server.com:443?public-key=peer_pub&ip=10.0.0.2%2F24,fd00::2&mtu=1420&reserved=1,2,3#WG-Node";
    const yamlString = parseProxyUri(uri);
    const parsed = YAML.parse(yamlString);

    expect(parsed.proxies[0]).toMatchObject({
      name: "WG-Node",
      type: "wireguard",
      server: "wg.server.com",
      port: 443,
      "private-key": "priv_key",
      "peer-public-key": "peer_pub",
      ip: ["10.0.0.2/24", "fd00::2"],
      mtu: 1420,
      reserved: [1, 2, 3]
    });
  });

  test("handles invalid protocol gracefully by appending as-is", () => {
    const uri = "invalid://something?foo=bar#Node";
    const yamlString = parseProxyUri(uri);
    expect(yamlString).toContain("- invalid://something?foo=bar#Node");
  });
});
