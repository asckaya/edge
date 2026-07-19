import { encodeUtf8Base64 } from "./base64";

export type NodeProtocol =
	| "vless"
	| "vmess"
	| "trojan"
	| "anytls"
	| "hysteria2"
	| "tuic"
	| "ss"
	| "wireguard"
	| "tailscale"
	| "socks"
	| "http";

export interface NodeFormValues {
	protocol: NodeProtocol;
	host: string;
	port: string;
	name: string;
	uuid: string;
	password: string;
	sni: string;
	network: string;
	encryption: string;
	security: string;
	cipher: string;
	alpn: string;
	congestion: string;
	obfs: string;
	obfsPassword: string;
	privateKey: string;
	publicKey: string;
	localIp: string;
	mtu: string;
	fingerprint: string;
	idleTimeout: string;
	controlUrl: string;
	hostname: string;
	tailscaleUdp: boolean;
	acceptRoutes: boolean;
	exitNode: string;
	ephemeral: boolean;
}

interface VmessUriOptions {
	name?: string;
	host: string;
	port: string;
	uuid: string;
	network?: string;
	security?: string;
	sni?: string;
}

export function buildVmessUri({
	name,
	host,
	port,
	uuid,
	network = "tcp",
	security = "none",
	sni = "",
}: VmessUriOptions): string {
	const payload = {
		v: "2",
		ps: name || "VMess-Proxy",
		add: host,
		port: Number(port) || port,
		id: uuid,
		aid: 0,
		scy: "auto",
		net: network,
		type: "none",
		host: network === "ws" ? sni : "",
		path: network === "ws" ? "/" : "",
		tls: security === "none" ? "" : "tls",
		sni,
	};

	return `vmess://${encodeUtf8Base64(JSON.stringify(payload))}`;
}

function appendQueryAndName(uri: string, searchParams: URLSearchParams, name: string): string {
	const query = searchParams.toString();
	const encodedName = name ? `#${encodeURIComponent(name)}` : "";
	return query ? `${uri}?${query}${encodedName}` : `${uri}${encodedName}`;
}

export function buildNodeUri(form: NodeFormValues): string | null {
	const {
		protocol,
		host,
		port,
		name,
		uuid,
		password,
		sni,
		network,
		encryption,
		security,
		cipher,
		alpn,
		congestion,
		obfs,
		obfsPassword,
		privateKey,
		publicKey,
		localIp,
		mtu,
		fingerprint,
		idleTimeout,
		controlUrl,
		hostname,
		tailscaleUdp,
		acceptRoutes,
		exitNode,
		ephemeral,
	} = form;

	if (protocol === "tailscale") {
		if (!password) return null;
	} else if (!(host && port)) {
		return null;
	}

	const searchParams = new URLSearchParams();
	let uri: string;

	switch (protocol) {
		case "vless":
		case "trojan":
			uri = `${protocol}://${uuid || password}@${host}:${port}`;
			if (protocol === "vless" && encryption) searchParams.set("encryption", encryption);
			if (security && security !== "none") searchParams.set("security", security);
			if (sni) searchParams.set("sni", sni);
			if (network && network !== "tcp") {
				searchParams.set("type", network);
				if (network === "ws") searchParams.set("path", "/");
			}
			break;
		case "vmess":
			return buildVmessUri({ name, host, port, uuid: uuid || password, network, security, sni });
		case "anytls":
			uri = `anytls://${password}@${host}:${port}`;
			if (sni) searchParams.set("sni", sni);
			if (fingerprint) searchParams.set("client-fingerprint", fingerprint);
			if (idleTimeout) searchParams.set("idle-session-timeout", idleTimeout);
			break;
		case "hysteria2": {
			const isRange = port.includes("-");
			const mainPort = isRange ? port.split("-")[0] : port;
			uri = `hysteria2://${password}@${host}:${mainPort}`;
			if (sni) searchParams.set("sni", sni);
			if (security === "none") searchParams.set("insecure", "1");
			if (isRange) searchParams.set("mport", port);
			if (obfs && obfs !== "none") {
				searchParams.set("obfs", obfs);
				searchParams.set("obfs-password", obfsPassword);
			}
			break;
		}
		case "tuic":
			uri = `tuic://${uuid}:${password}@${host}:${port}`;
			if (sni) searchParams.set("sni", sni);
			if (alpn) searchParams.set("alpn", alpn);
			if (congestion) searchParams.set("congestion_control", congestion);
			break;
		case "ss":
			uri = `ss://${encodeUtf8Base64(`${cipher}:${password}`)}@${host}:${port}`;
			break;
		case "wireguard":
			uri = `wireguard://${privateKey}@${host}:${port}`;
			if (publicKey) searchParams.set("public-key", publicKey);
			if (localIp) searchParams.set("ip", localIp);
			if (mtu) searchParams.set("mtu", mtu);
			break;
		case "tailscale": {
			const controlHost =
				controlUrl && URL.canParse(controlUrl)
					? new URL(controlUrl).host
					: controlUrl || "controlplane.tailscale.com";
			uri = `tailscale://${password}@${controlHost}`;
			if (controlUrl && controlUrl !== "https://controlplane.tailscale.com")
				searchParams.set("control-url", controlUrl);
			if (hostname) searchParams.set("hostname", hostname);
			if (acceptRoutes) searchParams.set("accept-routes", "true");
			if (exitNode) searchParams.set("exit-node", exitNode);
			if (ephemeral) searchParams.set("ephemeral", "true");
			searchParams.set("udp", tailscaleUdp ? "true" : "false");
			break;
		}
		case "socks":
		case "http": {
			const auth = uuid ? (password ? `${uuid}:${password}` : uuid) : "";
			uri = `${protocol}://${auth ? `${auth}@` : ""}${host}:${port}`;
			if (security === "tls") {
				searchParams.set("tls", "true");
				if (sni) searchParams.set("sni", sni);
			}
			break;
		}
	}

	return appendQueryAndName(uri, searchParams, name);
}
