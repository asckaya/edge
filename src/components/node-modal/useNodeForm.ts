import { useState } from "react";
import type { NodeFormValues, NodeProtocol } from "@/lib/node-uri";

export type NodeFormUpdater = <Key extends keyof NodeFormValues>(
	key: Key,
	value: NodeFormValues[Key],
) => void;

const TLS_PROTOCOLS = new Set<NodeProtocol>([
	"vless",
	"vmess",
	"trojan",
	"anytls",
	"hysteria2",
	"tuic",
]);

const INITIAL_FORM: NodeFormValues = {
	protocol: "vless",
	host: "",
	port: "443",
	name: "",
	uuid: "",
	password: "",
	sni: "",
	network: "tcp",
	encryption: "none",
	security: "tls",
	cipher: "aes-256-gcm",
	alpn: "h3",
	congestion: "bbr",
	obfs: "none",
	obfsPassword: "",
	privateKey: "",
	publicKey: "",
	localIp: "10.0.0.1/24",
	mtu: "1420",
	fingerprint: "chrome",
	idleTimeout: "",
	controlUrl: "https://controlplane.tailscale.com",
	hostname: "",
	tailscaleUdp: true,
	acceptRoutes: false,
	exitNode: "",
	ephemeral: false,
};

export function useNodeForm() {
	const [form, setForm] = useState<NodeFormValues>(INITIAL_FORM);

	const updateField: NodeFormUpdater = (key, value) => {
		setForm((current) => ({ ...current, [key]: value }));
	};

	const changeProtocol = (protocol: NodeProtocol) => {
		setForm((current) => ({
			...INITIAL_FORM,
			protocol,
			host: current.host,
			port: current.port,
			name: current.name,
			security: TLS_PROTOCOLS.has(protocol) ? "tls" : "none",
		}));
	};

	return { form, updateField, changeProtocol };
}
