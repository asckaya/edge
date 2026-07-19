import YAML from "yaml";
import { toMihomoOutbound } from "./mihomo/outbounds";
import { coerceProxyNode, type LooseProxyNode } from "./proxy-node";

import { PROTOCOL_PARSERS } from "./proxy-protocol-parsers";

export interface ParsedProxyText {
	nodes: LooseProxyNode[];
	rawLines: string[];
}

function formatRawLine(trimmedUri: string): string {
	return trimmedUri.startsWith("  -") ? trimmedUri : `  - ${trimmedUri}`;
}

export function parseProxyLine(line: string): { node?: LooseProxyNode; rawLine?: string } {
	const trimmedUri = line.trim();
	if (!trimmedUri) return {};

	if (!trimmedUri.includes("://")) {
		return { rawLine: formatRawLine(trimmedUri) };
	}

	try {
		let node: Record<string, unknown> = {};

		if (trimmedUri.startsWith("vmess://")) {
			const base64Data = trimmedUri.replace("vmess://", "").trim();
			const vmessData = JSON.parse(Buffer.from(base64Data, "base64").toString("utf-8"));
			node = {
				name: vmessData.ps || "VMess-Proxy",
				type: "vmess",
				server: vmessData.add,
				port: vmessData.port,
				uuid: vmessData.id,
				alterId: vmessData.aid || 0,
				cipher: vmessData.scy || "auto",
				udp: true,
				tls: vmessData.tls === "tls",
				"skip-cert-verify":
					vmessData.allowInsecure === "1" ||
					vmessData.allowInsecure === 1 ||
					vmessData.allowInsecure === true,
			};
			if (vmessData.sni) node.servername = vmessData.sni;
			if (vmessData.net === "ws") {
				node.network = "ws";
				node["ws-opts"] = {
					path: vmessData.path || "/",
					...(vmessData.host ? { headers: { Host: vmessData.host } } : {}),
				};
			} else if (vmessData.net === "grpc") {
				node.network = "grpc";
				node["grpc-opts"] = { serviceName: vmessData.path || "" };
			}
			if (vmessData.alpn) node.alpn = String(vmessData.alpn).split(",");
			if (vmessData.fp) node["client-fingerprint"] = vmessData.fp;
			if (vmessData["packet-encoding"]) node["packet-encoding"] = vmessData["packet-encoding"];
			if (vmessData["global-padding"] != null) node["global-padding"] = vmessData["global-padding"];
			if (vmessData["authenticated-length"] != null)
				node["authenticated-length"] = vmessData["authenticated-length"];
			if (vmessData["reality-opts"]) node["reality-opts"] = vmessData["reality-opts"];
			if (vmessData.fingerprint) node.fingerprint = vmessData.fingerprint;
			if (vmessData.smux != null) node.smux = vmessData.smux;
		} else {
			let uriToParse = trimmedUri;
			const portRangeMatch = trimmedUri.match(/:(\d+-\d+)([?#]|$)/);
			if (portRangeMatch?.[1]) {
				uriToParse = trimmedUri.replace(portRangeMatch[1], "443");
			}

			const url = new URL(uriToParse);
			const rawProtocol = url.protocol.replace(":", "");
			// Map multi-scheme protocols (e.g. naive+https/naive+quic) to their canonical parser key.
			const protocol = rawProtocol.startsWith("naive+") ? "naive" : rawProtocol;
			const name = decodeURIComponent(url.hash.substring(1)) || `${protocol.toUpperCase()}-Proxy`;
			const hostname = url.hostname;

			const port: string = portRangeMatch?.[1]
				? portRangeMatch[1]
				: url.port || (protocol === "vmess" ? "80" : "443");
			const mainPort = port.includes("-") ? (port.split("-")[0] as string) : port;
			const mainPortNum: string | number = parseInt(mainPort, 10) || mainPort;
			const password = decodeURIComponent(
				url.username || url.password || url.searchParams.get("auth") || "",
			);

			const parser = PROTOCOL_PARSERS[protocol];
			if (!parser) {
				return { rawLine: formatRawLine(trimmedUri) };
			}
			node = parser(url, { name, hostname, port, mainPortNum, password });
			// For naive, infer quic flag from the original scheme.
			if (protocol === "naive" && rawProtocol === "naive+quic") {
				(node as Record<string, unknown>).quic = true;
			}
		}

		const validatedNode = coerceProxyNode(node);
		if (!validatedNode) return { rawLine: formatRawLine(trimmedUri) };
		return { node: validatedNode };
	} catch {
		return { rawLine: formatRawLine(trimmedUri) };
	}
}

export function parseProxyTextToNodes(uri: string): ParsedProxyText {
	if (!uri) return { nodes: [], rawLines: [] };

	const nodes: LooseProxyNode[] = [];
	const rawLines: string[] = [];

	for (const value of uri.split(/[|\n]/)) {
		if (!value.trim()) continue;
		const parsed = parseProxyLine(value);
		if (parsed.node) nodes.push(parsed.node);
		if (parsed.rawLine) rawLines.push(parsed.rawLine);
	}

	return { nodes, rawLines };
}

export function renderProxyYaml({ nodes, rawLines }: ParsedProxyText): string {
	if (nodes.length === 0 && rawLines.length === 0) return "";

	const rewritten = nodes
		.map(toMihomoOutbound)
		.filter((n): n is Record<string, unknown> => n !== null);
	const serializedNodes =
		rewritten.length > 0
			? YAML.stringify(rewritten)
					.split("\n")
					.map((line) => (line ? `  ${line}` : line))
					.join("\n")
			: "";
	const serializedRawLines = rawLines.length > 0 ? `\n${rawLines.join("\n")}\n` : "";
	return `proxies:\n${serializedNodes}${serializedRawLines}`;
}

export function parseProxyUri(uri: string): string {
	if (!uri) return "";
	return renderProxyYaml(parseProxyTextToNodes(uri));
}
