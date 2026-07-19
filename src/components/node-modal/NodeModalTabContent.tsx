import { Sliders } from "lucide-react";
import type { NodeFormValues, NodeProtocol } from "@/lib/node-uri";
import type { Language } from "../home/translations";
import Field from "./Field";
import type { NodeModalTranslation } from "./translations";
import type { NodeFormUpdater } from "./useNodeForm";

interface NodeModalTabContentProps {
	activeTab: "basic" | "auth" | "advanced";
	form: NodeFormValues;
	updateField: NodeFormUpdater;
	changeProtocol: (protocol: NodeProtocol) => void;
	lang: Language;
	t: NodeModalTranslation;
}

export default function NodeModalTabContent({
	activeTab,
	form,
	updateField,
	changeProtocol,
	lang,
	t,
}: NodeModalTabContentProps) {
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
	const isTailscaleOrWG = protocol === "tailscale" || protocol === "wireguard";

	const passwordLabel =
		protocol === "tailscale"
			? t.tailscaleKey
			: protocol === "socks" || protocol === "http"
				? lang === "zh"
					? "密码 (可选)"
					: "Password (Optional)"
				: t.password;
	const uuidLabel =
		protocol === "socks" || protocol === "http"
			? lang === "zh"
				? "用户名 (可选)"
				: "Username (Optional)"
			: t.uuid;

	return (
		<div className="p-6 overflow-y-auto space-y-6 text-zinc-800 dark:text-zinc-200">
			{/* TAB 1: Topology */}
			{activeTab === "basic" && (
				<div className="space-y-4 animate-reveal">
					<Field label={t.protocol}>
						<div className="relative">
							<select
								value={protocol}
								onChange={(e) => changeProtocol(e.target.value as NodeProtocol)}
								className="w-full modern-input appearance-none bg-white dark:bg-zinc-950 pr-10 cursor-pointer"
							>
								<option value="vless">
									VLESS (Reality / CDN {lang === "zh" ? "推荐" : "Rec"})
								</option>
								<option value="vmess">
									VMess ({lang === "zh" ? "经典中转协议" : "Classic TLS"})
								</option>
								<option value="trojan">
									Trojan ({lang === "zh" ? "安全混淆" : "Secure Obfs"})
								</option>
								<option value="anytls">
									AnyTLS ({lang === "zh" ? "Shadowsocks 混淆" : "SS Obfs"})
								</option>
								<option value="hysteria2">
									Hysteria2 ({lang === "zh" ? "双边加速 UDP" : "UDP BBR"})
								</option>
								<option value="tuic">
									TUIC v5 ({lang === "zh" ? "低延迟 QUIC" : "QUIC Low Latency"})
								</option>
								<option value="ss">
									Shadowsocks ({lang === "zh" ? "经典 TCP/UDP" : "Shadowsocks"})
								</option>
								<option value="wireguard">
									WireGuard ({lang === "zh" ? "原生隧道" : "Native Tunnel"})
								</option>
								<option value="tailscale">
									Tailscale ({lang === "zh" ? "网状对等网" : "Mesh VPN"})
								</option>
								<option value="socks">
									Socks5 ({lang === "zh" ? "标准代理" : "Socks5 Proxy"})
								</option>
								<option value="http">
									HTTP ({lang === "zh" ? "标准明文/TLS代理" : "HTTP/HTTPS Proxy"})
								</option>
							</select>
							<div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
								<Sliders className="h-4 w-4" />
							</div>
						</div>
					</Field>

					{protocol !== "tailscale" && (
						<div className="grid grid-cols-12 gap-4">
							<Field label={t.server} className="col-span-8">
								<input
									type="text"
									value={host}
									onChange={(e) => updateField("host", e.target.value)}
									placeholder="node.example.com"
									className="w-full modern-input font-mono text-sm"
								/>
							</Field>
							<Field label={t.port} className="col-span-4">
								<input
									type={protocol === "hysteria2" ? "text" : "number"}
									value={port}
									onChange={(e) => updateField("port", e.target.value)}
									placeholder={
										protocol === "hysteria2"
											? lang === "zh"
												? "443 或 20000-30000"
												: "443 or 20000-30000"
											: protocol === "socks"
												? "1080"
												: protocol === "http"
													? "80"
													: "443"
									}
									className="w-full modern-input font-mono text-sm"
								/>
							</Field>
						</div>
					)}

					<Field label={t.name}>
						<input
							type="text"
							value={name}
							onChange={(e) => updateField("name", e.target.value)}
							placeholder={lang === "zh" ? "例如: HKG-Premium-01" : "e.g. HKG-Premium-01"}
							className="w-full modern-input"
						/>
					</Field>
				</div>
			)}

			{/* TAB 2: Credentials */}
			{activeTab === "auth" && (
				<div className="space-y-4 animate-reveal">
					{(protocol === "vless" ||
						protocol === "vmess" ||
						protocol === "tuic" ||
						protocol === "socks" ||
						protocol === "http") && (
						<Field label={uuidLabel}>
							<input
								type="text"
								value={uuid}
								onChange={(e) => updateField("uuid", e.target.value)}
								placeholder={
									protocol === "socks" || protocol === "http"
										? "admin"
										: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
								}
								className="w-full modern-input font-mono text-[12px]"
							/>
						</Field>
					)}

					{(protocol === "trojan" ||
						protocol === "hysteria2" ||
						protocol === "tuic" ||
						protocol === "ss" ||
						protocol === "anytls" ||
						protocol === "tailscale" ||
						protocol === "socks" ||
						protocol === "http") && (
						<Field label={passwordLabel}>
							<input
								type={protocol === "tailscale" ? "text" : "password"}
								value={password}
								onChange={(e) => updateField("password", e.target.value)}
								placeholder={protocol === "tailscale" ? "tskey-auth-..." : "••••••••"}
								className="w-full modern-input font-mono text-[12px]"
							/>
						</Field>
					)}

					{protocol === "ss" && (
						<Field label={t.cipher}>
							<select
								value={cipher}
								onChange={(e) => updateField("cipher", e.target.value)}
								className="w-full modern-input bg-white dark:bg-zinc-950 cursor-pointer"
							>
								<option value="aes-128-gcm">aes-128-gcm</option>
								<option value="aes-256-gcm">aes-256-gcm</option>
								<option value="chacha20-ietf-poly1305">chacha20-ietf-poly1305</option>
							</select>
						</Field>
					)}

					{/* Wireguard keys */}
					{protocol === "wireguard" && (
						<div className="space-y-4">
							<Field label={t.privateKey}>
								<input
									type="text"
									value={privateKey}
									onChange={(e) => updateField("privateKey", e.target.value)}
									className="w-full modern-input font-mono text-[12px]"
								/>
							</Field>
							<Field label={t.publicKey}>
								<input
									type="text"
									value={publicKey}
									onChange={(e) => updateField("publicKey", e.target.value)}
									className="w-full modern-input font-mono text-[12px]"
								/>
							</Field>
						</div>
					)}

					{/* Informative text for tailscale */}
					{protocol === "tailscale" && (
						<div className="p-3 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-lg text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
							{t.tailscaleInfo}
						</div>
					)}
				</div>
			)}

			{/* TAB 3: Advanced */}
			{activeTab === "advanced" && !isTailscaleOrWG && (
				<div className="space-y-4 animate-reveal">
					{(protocol === "vless" ||
						protocol === "vmess" ||
						protocol === "trojan" ||
						protocol === "hysteria2" ||
						protocol === "tuic" ||
						protocol === "anytls" ||
						protocol === "socks" ||
						protocol === "http") && (
						<Field label={t.sni}>
							<input
								type="text"
								value={sni}
								disabled={protocol !== "socks" && protocol !== "http" && security === "none"}
								onChange={(e) => updateField("sni", e.target.value)}
								placeholder="domain.example.com"
								className="w-full modern-input font-mono text-sm disabled:opacity-50"
							/>
						</Field>
					)}

					{(protocol === "socks" || protocol === "http") && (
						<Field label={lang === "zh" ? "安全传输 (TLS)" : "Transport Security (TLS)"}>
							<select
								value={security}
								onChange={(e) => updateField("security", e.target.value)}
								className="w-full modern-input bg-white dark:bg-zinc-950 cursor-pointer"
							>
								<option value="none">{lang === "zh" ? "明文 (None)" : "None"}</option>
								<option value="tls">TLS</option>
							</select>
						</Field>
					)}

					{protocol === "vless" && (
						<div className="grid grid-cols-2 gap-4">
							<Field label={t.flow}>
								<select
									value={encryption}
									onChange={(e) => updateField("encryption", e.target.value)}
									className="w-full modern-input bg-white dark:bg-zinc-950 cursor-pointer"
								>
									<option value="none">{lang === "zh" ? "无 (None)" : "None"}</option>
									<option value="xtls-rprx-vision">XTLS Vision</option>
								</select>
							</Field>
							<Field label={t.network}>
								<select
									value={network}
									onChange={(e) => updateField("network", e.target.value)}
									className="w-full modern-input bg-white dark:bg-zinc-950 cursor-pointer"
								>
									<option value="tcp">TCP</option>
									<option value="ws">WebSocket (WS)</option>
									<option value="grpc">gRPC</option>
								</select>
							</Field>
						</div>
					)}

					{protocol === "tuic" && (
						<div className="grid grid-cols-2 gap-4">
							<Field label={t.alpn}>
								<input
									type="text"
									value={alpn}
									onChange={(e) => updateField("alpn", e.target.value)}
									className="w-full modern-input font-mono"
								/>
							</Field>
							<Field label={t.congestion}>
								<select
									value={congestion}
									onChange={(e) => updateField("congestion", e.target.value)}
									className="w-full modern-input bg-white dark:bg-zinc-950 cursor-pointer"
								>
									<option value="bbr">BBR</option>
									<option value="cubic">CUBIC</option>
								</select>
							</Field>
						</div>
					)}

					{protocol === "hysteria2" && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<Field label={t.obfs}>
									<select
										value={obfs}
										onChange={(e) => updateField("obfs", e.target.value)}
										className="w-full modern-input bg-white dark:bg-zinc-950 cursor-pointer"
									>
										<option value="none">{lang === "zh" ? "无 (None)" : "None"}</option>
										<option value="salamander">Salamander</option>
									</select>
								</Field>
								{obfs !== "none" && (
									<Field label={t.obfsPw}>
										<input
											type="password"
											value={obfsPassword}
											onChange={(e) => updateField("obfsPassword", e.target.value)}
											className="w-full modern-input font-mono"
										/>
									</Field>
								)}
							</div>
						</div>
					)}

					{protocol === "anytls" && (
						<div className="grid grid-cols-2 gap-4">
							<Field label={t.fingerprint}>
								<select
									value={fingerprint}
									onChange={(e) => updateField("fingerprint", e.target.value)}
									className="w-full modern-input bg-white dark:bg-zinc-950 cursor-pointer"
								>
									<option value="chrome">Chrome ({lang === "zh" ? "默认" : "Default"})</option>
									<option value="firefox">Firefox</option>
									<option value="safari">Safari</option>
									<option value="random">Random ({lang === "zh" ? "随机" : "Random"})</option>
								</select>
							</Field>
							<Field label={t.timeout}>
								<input
									type="number"
									value={idleTimeout}
									onChange={(e) => updateField("idleTimeout", e.target.value)}
									placeholder="30"
									className="w-full modern-input font-mono"
								/>
							</Field>
						</div>
					)}
				</div>
			)}

			{/* TAB SPECIAL: WireGuard & Tailscale Specific Settings */}
			{activeTab === "basic" && isTailscaleOrWG && (
				<div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-4 animate-reveal">
					{protocol === "wireguard" && (
						<div className="grid grid-cols-2 gap-4">
							<Field label={t.localIp}>
								<input
									type="text"
									value={localIp}
									onChange={(e) => updateField("localIp", e.target.value)}
									className="w-full modern-input font-mono text-xs"
								/>
							</Field>
							<Field label={t.mtu}>
								<input
									type="number"
									value={mtu}
									onChange={(e) => updateField("mtu", e.target.value)}
									className="w-full modern-input font-mono text-xs"
								/>
							</Field>
						</div>
					)}

					{protocol === "tailscale" && (
						<div className="space-y-4">
							<Field label={t.controlUrl}>
								<input
									type="text"
									value={controlUrl}
									onChange={(e) => updateField("controlUrl", e.target.value)}
									className="w-full modern-input font-mono text-xs"
								/>
							</Field>
							<div className="grid grid-cols-2 gap-4">
								<Field label={t.hostname}>
									<input
										type="text"
										value={hostname}
										onChange={(e) => updateField("hostname", e.target.value)}
										placeholder="edge-node"
										className="w-full modern-input font-mono text-xs"
									/>
								</Field>
								<Field label={t.exitNode}>
									<input
										type="text"
										value={exitNode}
										onChange={(e) => updateField("exitNode", e.target.value)}
										placeholder="100.64.0.1"
										className="w-full modern-input font-mono text-xs"
									/>
								</Field>
							</div>
							<div className="flex flex-wrap gap-x-4 gap-y-2 pt-1.5">
								<label className="flex items-center gap-2 cursor-pointer select-none">
									<input
										type="checkbox"
										checked={tailscaleUdp}
										onChange={(e) => updateField("tailscaleUdp", e.target.checked)}
										className="accent-indigo-500 rounded cursor-pointer w-4 h-4"
									/>
									<span className="text-xs text-zinc-600 dark:text-zinc-400">{t.udp}</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer select-none">
									<input
										type="checkbox"
										checked={acceptRoutes}
										onChange={(e) => updateField("acceptRoutes", e.target.checked)}
										className="accent-indigo-500 rounded cursor-pointer w-4 h-4"
									/>
									<span className="text-xs text-zinc-600 dark:text-zinc-400">{t.acceptRoutes}</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer select-none">
									<input
										type="checkbox"
										checked={ephemeral}
										onChange={(e) => updateField("ephemeral", e.target.checked)}
										className="accent-indigo-500 rounded cursor-pointer w-4 h-4"
									/>
									<span className="text-xs text-zinc-600 dark:text-zinc-400">{t.ephemeral}</span>
								</label>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
