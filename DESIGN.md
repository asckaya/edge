# Edge Engine UI Design System & Aesthetic Specification (design.md)

This document establishes the official Design System and UI Specification for **Edge Engine**, ensuring complete visual cohesion, premium aesthetics, responsive behavior, theme switching (Dark/Light), and bilingual support (ZH/EN) across the main web application and all diagnostic subpages (`/ip.html`, `/dns.html`, `/webrtc.html`, `/claude.html`, `/tools.html`).

---

## 1. Design Vision & Brand Identity

- **Concept**: _Cybernetic Precision & Distributed Edge Intelligence_
- **Theme**: Ultra-clean Glassmorphism with synchronized Dark (`#030303`) & Light (`#ffffff`) themes.
- **Vibe**: High-tech, trustworthy, state-of-the-art developer infrastructure toolchain.

---

## 2. Color Palette & Theme Tokens

### Dark Mode (`.dark`, Default)

- **Background Main**: `#030303` (Pure Obsidian)
- **Mesh Radial Glow 1**: `rgba(99, 102, 241, 0.08)` (Indigo Glow, 140px blur)
- **Mesh Radial Glow 2**: `rgba(59, 130, 246, 0.08)` (Cyan/Blue Glow, 140px blur)
- **Surface Glass**: `rgba(9, 9, 11, 0.7)` with `backdrop-filter: blur(24px)`
- **Card Background**: `rgba(9, 9, 11, 0.4)` / `bg-zinc-950/40`
- **Border Default**: `rgba(39, 39, 42, 0.8)` / `border-zinc-900`
- **Border Hover**: `rgba(99, 102, 241, 0.5)` (Indigo Accent Border)
- **Text Main**: `#fafafa` (`zinc-50`)
- **Text Muted**: `#a1a1aa` (`zinc-400`)
- **Text Dim**: `#71717a` (`zinc-500`)

### Light Mode (`.light`)

- **Background Main**: `#ffffff` (Pure White)
- **Mesh Radial Glow 1**: `rgba(99, 102, 241, 0.04)`
- **Mesh Radial Glow 2**: `rgba(59, 130, 246, 0.04)`
- **Surface Glass**: `rgba(255, 255, 255, 0.85)` with `backdrop-filter: blur(24px)`
- **Card Background**: `rgba(255, 255, 255, 0.9)` / `bg-white`
- **Border Default**: `rgba(228, 228, 231, 0.9)` / `border-zinc-200`
- **Border Hover**: `rgba(99, 102, 241, 0.4)`
- **Text Main**: `#09090b` (`zinc-950`)
- **Text Muted**: `#71717a` (`zinc-500`)
- **Text Dim**: `#a1a1aa` (`zinc-400`)

### Accent Palette

- **Indigo (Primary Action)**: `#6366f1` / `indigo-500`
- **Blue (IP & Egress)**: `#3b82f6` / `blue-500`
- **Emerald (DNS & Security)**: `#10b981` / `emerald-500`
- **Amber (WebRTC & Alerts)**: `#f59e0b` / `amber-500`
- **Purple (AI & Claude)**: `#a855f7` / `purple-500`
- **Cyan (Tools & Utilities)**: `#06b6d4` / `cyan-500`

---

## 3. Typography & Font Stack

- **Display & Headings**: `"Outfit Variable"`, `"Outfit"`, sans-serif (`font-extrabold`)
- **Body & Controls**: `"Inter Variable"`, `"Inter"`, sans-serif (`font-medium`)
- **Code & Network IP Data**: `"JetBrains Mono"`, monospace (`font-mono`)

---

## 4. Shared Header & Control Component

Every page (homepage and subpages) MUST render the standardized isometric header with language (`ZH`/`EN`) and theme (`☀️`/`🌙`) toggle buttons:

```html
<header class="header-bar">
	<div class="brand">
		<a href="/" class="logo-box">
			<div class="logo-glow"></div>
			<svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
			</svg>
		</a>
		<div class="brand-text">
			<div class="brand-title">
				<a href="/" class="home-link">Edge Engine</a>
				<span class="version-badge">v2026.08.05</span>
			</div>
			<span
				class="brand-subtitle"
				data-zh="边缘分布式诊断核心"
				data-en="Distributed Edge Diagnostics Core"
				>边缘分布式诊断核心</span
			>
		</div>
	</div>

	<div class="status-group">
		<div class="status-pill green">
			<span class="status-dot"></span>
			<span data-zh="核心状态: 正常" data-en="Status: Operational">核心状态: 正常</span>
		</div>
		<div class="status-pill indigo">
			<span data-zh="延迟: < 0.1ms" data-en="Latency: < 0.1ms">延迟: < 0.1ms</span>
		</div>
		<button type="button" class="btn-ctrl" onclick="toggleLang()" id="langToggleBtn">🌐 EN</button>
		<button type="button" class="btn-ctrl" onclick="toggleTheme()" id="themeToggleBtn">☀️</button>
		<a href="/" class="btn-home" data-zh="🏠 返回主页" data-en="🏠 Home">🏠 返回主页</a>
	</div>
</header>
```

---

## 5. Subpage Consistency Checklist

| Page           | Dark/Light Theme | ZH/EN Toggle | Shared Header Logo | Shared Pill Nav | Font Stack     |
| -------------- | ---------------- | ------------ | ------------------ | --------------- | -------------- |
| `/` (Home)     | Yes              | Yes          | Yes                | Yes             | Outfit + Inter |
| `/ip.html`     | Yes              | Yes          | Yes                | Yes             | Outfit + Mono  |
| `/dns.html`    | Yes              | Yes          | Yes                | Yes             | Outfit + Mono  |
| `/webrtc.html` | Yes              | Yes          | Yes                | Yes             | Outfit + Mono  |
| `/claude.html` | Yes              | Yes          | Yes                | Yes             | Outfit + Inter |
| `/tools.html`  | Yes              | Yes          | Yes                | Yes             | Outfit + Mono  |
