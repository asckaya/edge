import {
	Ban,
	Bot,
	Code,
	Globe,
	HardDrive,
	HelpCircle,
	Network,
	Shuffle,
	Tv,
	Zap,
} from "lucide-react";
import type { ComponentType } from "react";

export interface FlowItem {
	name: string;
	icon: ComponentType<{ className?: string }>;
	color: string;
	tag?: string;
}

export interface FlowStep {
	title: string;
	items: FlowItem[];
}

export type Lang = "zh" | "en";
export type Mode = "" | "-dual" | "-white" | "-black";
export interface FlowData {
	title: string;
	desc: string;
	steps: FlowStep[];
}

export const FLOW_DATA: Record<Mode, Record<Lang, FlowData>> = {
	"-dual": {
		zh: {
			title: "双模智能分流架构 (Dual-Mode)",
			desc: "合并海外特化场景，大幅精简节点选择页面，推荐日常主力使用。",
			steps: [
				{
					title: "1. 流量入口 (Input)",
					items: [
						{ name: "DNS 流量 (端口53/UDP)", icon: Network, color: "text-blue-500 bg-blue-500/5" },
						{ name: "国外流量 (QUIC/UDP 443)", icon: Zap, color: "text-amber-500 bg-amber-500/5" },
						{ name: "全部应用流量", icon: Shuffle, color: "text-indigo-500 bg-indigo-500/5" },
					],
				},
				{
					title: "2. 分流核心 (Rules)",
					items: [
						{
							name: "拦截非国区 QUIC 流量",
							tag: "REJECT",
							icon: Ban,
							color: "text-red-500 bg-red-500/5",
						},
						{
							name: "本地 / 私有 / 大陆规则 (CN)",
							tag: "DIRECT",
							icon: HardDrive,
							color: "text-emerald-500 bg-emerald-500/5",
						},
						{
							name: "海外规则集 (AI / 视频 / 开发)",
							tag: "PROXY",
							icon: Globe,
							color: "text-purple-500 bg-purple-500/5",
						},
						{
							name: "漏网之鱼 (未匹配流量)",
							tag: "PROXY",
							icon: HelpCircle,
							color: "text-zinc-500 bg-zinc-500/5",
						},
					],
				},
				{
					title: "3. 出口策略组 (Outbounds)",
					items: [
						{ name: "REJECT", icon: Ban, color: "text-red-500 bg-red-500/5 border-red-500/20" },
						{
							name: "DIRECT",
							icon: HardDrive,
							color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/20",
						},
						{
							name: "🚀 节点选择 (统一出口)",
							icon: Globe,
							color:
								"text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-500/20 animate-pulse-slow",
						},
					],
				},
			],
		},
		en: {
			title: "Dual-Mode Smart Routing",
			desc: "Consolidates all foreign scenarios into a single outbound for a cleaner UI.",
			steps: [
				{
					title: "1. Input Traffic",
					items: [
						{
							name: "DNS Traffic (Port 53/UDP)",
							icon: Network,
							color: "text-blue-500 bg-blue-500/5",
						},
						{ name: "Foreign QUIC (UDP 443)", icon: Zap, color: "text-amber-500 bg-amber-500/5" },
						{ name: "App Traffic", icon: Shuffle, color: "text-indigo-500 bg-indigo-500/5" },
					],
				},
				{
					title: "2. Matching Rules",
					items: [
						{
							name: "Block Foreign QUIC (HTTP/3)",
							tag: "REJECT",
							icon: Ban,
							color: "text-red-500 bg-red-500/5",
						},
						{
							name: "Local / Private / China Rules",
							tag: "DIRECT",
							icon: HardDrive,
							color: "text-emerald-500 bg-emerald-500/5",
						},
						{
							name: "Foreign Rules (AI/Media/Dev)",
							tag: "PROXY",
							icon: Globe,
							color: "text-purple-500 bg-purple-500/5",
						},
						{
							name: "Final Match (Unmatched)",
							tag: "PROXY",
							icon: HelpCircle,
							color: "text-zinc-500 bg-zinc-500/5",
						},
					],
				},
				{
					title: "3. Outbounds",
					items: [
						{ name: "REJECT", icon: Ban, color: "text-red-500 bg-red-500/5 border-red-500/20" },
						{
							name: "DIRECT",
							icon: HardDrive,
							color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/20",
						},
						{
							name: "🚀 Proxy Select (Unified)",
							icon: Globe,
							color:
								"text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-500/20 animate-pulse-slow",
						},
					],
				},
			],
		},
	},
	"-white": {
		zh: {
			title: "白名单直连优先架构 (Whitelist)",
			desc: "国内流量与未定义流量全部直连，仅匹配明确规定的海外规则时走代理。",
			steps: [
				{
					title: "1. 流量入口 (Input)",
					items: [
						{ name: "DNS 规则流量", icon: Network, color: "text-blue-500 bg-blue-500/5" },
						{ name: "全部网络请求", icon: Shuffle, color: "text-indigo-500 bg-indigo-500/5" },
					],
				},
				{
					title: "2. 分流核心 (Rules)",
					items: [
						{
							name: "广告 / 跟踪域名拦截",
							tag: "REJECT",
							icon: Ban,
							color: "text-red-500 bg-red-500/5",
						},
						{
							name: "明确白名单规则 (国外域名/IP)",
							tag: "PROXY",
							icon: Globe,
							color: "text-purple-500 bg-purple-500/5",
						},
						{
							name: "其余全部未匹配流量 (默认)",
							tag: "DIRECT",
							icon: HardDrive,
							color: "text-emerald-500 bg-emerald-500/5",
						},
					],
				},
				{
					title: "3. 出口策略组 (Outbounds)",
					items: [
						{ name: "REJECT", icon: Ban, color: "text-red-500 bg-red-500/5 border-red-500/20" },
						{
							name: "DIRECT (主默认出口)",
							icon: HardDrive,
							color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/20 animate-pulse-slow",
						},
						{
							name: "🚀 节点选择",
							icon: Globe,
							color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-500/20",
						},
					],
				},
			],
		},
		en: {
			title: "Whitelist Direct-First Routing",
			desc: "Domestic and unmatched traffic goes direct. Proxies are only matched for explicit foreign rule-sets.",
			steps: [
				{
					title: "1. Input Traffic",
					items: [
						{ name: "DNS Rules", icon: Network, color: "text-blue-500 bg-blue-500/5" },
						{ name: "Network Requests", icon: Shuffle, color: "text-indigo-500 bg-indigo-500/5" },
					],
				},
				{
					title: "2. Matching Rules",
					items: [
						{
							name: "Ads & Tracking domains",
							tag: "REJECT",
							icon: Ban,
							color: "text-red-500 bg-red-500/5",
						},
						{
							name: "Explicit Whitelist (Foreign domains)",
							tag: "PROXY",
							icon: Globe,
							color: "text-purple-500 bg-purple-500/5",
						},
						{
							name: "All other unmatched traffic (Default)",
							tag: "DIRECT",
							icon: HardDrive,
							color: "text-emerald-500 bg-emerald-500/5",
						},
					],
				},
				{
					title: "3. Outbounds",
					items: [
						{ name: "REJECT", icon: Ban, color: "text-red-500 bg-red-500/5 border-red-500/20" },
						{
							name: "DIRECT (主默认出口)",
							icon: HardDrive,
							color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/20 animate-pulse-slow",
						},
						{
							name: "🚀 节点选择",
							icon: Globe,
							color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-500/20",
						},
					],
				},
			],
		},
	},
	"-black": {
		zh: {
			title: "黑名单代理优先架构 (Blacklist)",
			desc: "除明确规定的大陆/私有流量直连外，其余所有国外及未定义流量全部默认走代理。",
			steps: [
				{
					title: "1. 流量入口 (Input)",
					items: [
						{ name: "DNS 规则流量", icon: Network, color: "text-blue-500 bg-blue-500/5" },
						{ name: "全部网络请求", icon: Shuffle, color: "text-indigo-500 bg-indigo-500/5" },
					],
				},
				{
					title: "2. 分流核心 (Rules)",
					items: [
						{
							name: "广告 / 跟踪域名拦截",
							tag: "REJECT",
							icon: Ban,
							color: "text-red-500 bg-red-500/5",
						},
						{
							name: "国内流量 / 局域网 / CN 规则",
							tag: "DIRECT",
							icon: HardDrive,
							color: "text-emerald-500 bg-emerald-500/5",
						},
						{
							name: "其余全部未匹配流量 (默认)",
							tag: "PROXY",
							icon: Globe,
							color: "text-purple-500 bg-purple-500/5",
						},
					],
				},
				{
					title: "3. 出口策略组 (Outbounds)",
					items: [
						{ name: "REJECT", icon: Ban, color: "text-red-500 bg-red-500/5 border-red-500/20" },
						{
							name: "DIRECT",
							icon: HardDrive,
							color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/20",
						},
						{
							name: "🚀 节点选择 (主默认出口)",
							icon: Globe,
							color:
								"text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-500/20 animate-pulse-slow",
						},
					],
				},
			],
		},
		en: {
			title: "Blacklist Proxy-First Routing",
			desc: "All traffic goes through proxies by default unless explicitly matched to domestic/private rules.",
			steps: [
				{
					title: "1. Input Traffic",
					items: [
						{ name: "DNS Rules", icon: Network, color: "text-blue-500 bg-blue-500/5" },
						{ name: "Network Requests", icon: Shuffle, color: "text-indigo-500 bg-indigo-500/5" },
					],
				},
				{
					title: "2. Matching Rules",
					items: [
						{
							name: "Ads & Tracking domains",
							tag: "REJECT",
							icon: Ban,
							color: "text-red-500 bg-red-500/5",
						},
						{
							name: "China Traffic / LAN / CN Rules",
							tag: "DIRECT",
							icon: HardDrive,
							color: "text-emerald-500 bg-emerald-500/5",
						},
						{
							name: "All other unmatched traffic (Default)",
							tag: "PROXY",
							icon: Globe,
							color: "text-purple-500 bg-purple-500/5",
						},
					],
				},
				{
					title: "3. Outbounds",
					items: [
						{ name: "REJECT", icon: Ban, color: "text-red-500 bg-red-500/5 border-red-500/20" },
						{
							name: "DIRECT",
							icon: HardDrive,
							color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/20",
						},
						{
							name: "🚀 Proxy Select (Main Outbound)",
							icon: Globe,
							color:
								"text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-500/20 animate-pulse-slow",
						},
					],
				},
			],
		},
	},
	"": {
		zh: {
			title: "全场景微操分流架构 (Full Scenario)",
			desc: "针对极其精细的特定网络场景（如开发、学术、AI、Emby、油管）进行各自独立的策略组配置。",
			steps: [
				{
					title: "1. 流量入口 (Input)",
					items: [
						{ name: "DNS 解析流量", icon: Network, color: "text-blue-500 bg-blue-500/5" },
						{
							name: "网络数据流 (TCP/UDP)",
							icon: Shuffle,
							color: "text-indigo-500 bg-indigo-500/5",
						},
					],
				},
				{
					title: "2. 分流核心 (Rules)",
					items: [
						{
							name: "AI 人工智能规则 (ChatGPT)",
							tag: "AI",
							icon: Bot,
							color: "text-purple-500 bg-purple-500/5",
						},
						{
							name: "油管视频规则 (YouTube)",
							tag: "YOUTUBE",
							icon: Tv,
							color: "text-red-500 bg-red-500/5",
						},
						{
							name: "EMBY 媒体规则 (Emby)",
							tag: "EMBY",
							icon: Tv,
							color: "text-orange-500 bg-orange-500/5",
						},
						{
							name: "开发工具规则 (GitHub)",
							tag: "DEV",
							icon: Code,
							color: "text-sky-500 bg-sky-500/5",
						},
						{
							name: "全球手动 (剩余非CN流量)",
							tag: "GLOBAL",
							icon: Globe,
							color: "text-indigo-500 bg-indigo-500/5",
						},
					],
				},
				{
					title: "3. 出口策略组 (Outbounds)",
					items: [
						{
							name: "💬 AI 服务 (默认: 节点选择)",
							icon: Bot,
							color: "text-purple-600 dark:text-purple-400 bg-purple-500/5 border-purple-500/20",
						},
						{
							name: "📹 油管视频 (默认: 节点选择)",
							icon: Tv,
							color: "text-red-600 dark:text-red-400 bg-red-500/5 border-red-500/20",
						},
						{
							name: "🎥 EMBY 专线 (默认: 节点选择)",
							icon: Tv,
							color: "text-orange-600 dark:text-orange-400 bg-orange-500/5 border-orange-500/20",
						},
						{
							name: "🐱 开发工具 (默认: 节点选择)",
							icon: Code,
							color: "text-sky-600 dark:text-sky-400 bg-sky-500/5 border-sky-500/20",
						},
						{
							name: "🚀 节点选择 (主出向组)",
							icon: Globe,
							color:
								"text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-500/20 animate-pulse-slow",
						},
					],
				},
			],
		},
		en: {
			title: "Full Scenario Granular Routing",
			desc: "Routes specific domains to independent scenario outbounds for fine-grained traffic control.",
			steps: [
				{
					title: "1. Input Traffic",
					items: [
						{ name: "DNS Resolve Traffic", icon: Network, color: "text-blue-500 bg-blue-500/5" },
						{
							name: "Data Stream (TCP/UDP)",
							icon: Shuffle,
							color: "text-indigo-500 bg-indigo-500/5",
						},
					],
				},
				{
					title: "2. Matching Rules",
					items: [
						{
							name: "AI Services (ChatGPT/Gemini)",
							tag: "AI",
							icon: Bot,
							color: "text-purple-500 bg-purple-500/5",
						},
						{
							name: "YouTube Stream Rules",
							tag: "YOUTUBE",
							icon: Tv,
							color: "text-red-500 bg-red-500/5",
						},
						{
							name: "EMBY Media Rules",
							tag: "EMBY",
							icon: Tv,
							color: "text-orange-500 bg-orange-500/5",
						},
						{
							name: "Dev Tools (GitHub/Docker)",
							tag: "DEV",
							icon: Code,
							color: "text-sky-500 bg-sky-500/5",
						},
						{
							name: "Other Global Traffic",
							tag: "GLOBAL",
							icon: Globe,
							color: "text-indigo-500 bg-indigo-500/5",
						},
					],
				},
				{
					title: "3. Outbounds",
					items: [
						{
							name: "💬 AI Services (Default: Proxy)",
							icon: Bot,
							color: "text-purple-600 dark:text-purple-400 bg-purple-500/5 border-purple-500/20",
						},
						{
							name: "📹 YouTube (Default: Proxy)",
							icon: Tv,
							color: "text-red-600 dark:text-red-400 bg-red-500/5 border-red-500/20",
						},
						{
							name: "🎥 EMBY Services (Default: Proxy)",
							icon: Tv,
							color: "text-orange-600 dark:text-orange-400 bg-orange-500/5 border-orange-500/20",
						},
						{
							name: "🐱 Developer Tools (Default: Proxy)",
							icon: Code,
							color: "text-sky-600 dark:text-sky-400 bg-sky-500/5 border-sky-500/20",
						},
						{
							name: "🚀 Proxy Select (Main Outbound)",
							icon: Globe,
							color:
								"text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-500/20 animate-pulse-slow",
						},
					],
				},
			],
		},
	},
};
