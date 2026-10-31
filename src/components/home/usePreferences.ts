import { type MouseEvent, useEffect, useState } from "react";
import type { Language } from "./translations";

type Theme = "dark" | "light";
/** `system` follows the OS `prefers-color-scheme`; the others are explicit overrides. */
type ThemePreference = Theme | "system";

type ViewTransitionDocument = Document & {
	startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemTheme(): Theme {
	if (typeof window === "undefined") return "light";
	return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function resolveTheme(preference: ThemePreference): Theme {
	return preference === "system" ? systemTheme() : preference;
}

function applyDocumentTheme(theme: Theme): void {
	document.documentElement.classList.toggle("dark", theme === "dark");
}

export function usePreferences() {
	const [preference, setPreference] = useState<ThemePreference>("system");
	const [theme, setTheme] = useState<Theme>("light");
	const [lang, setLang] = useState<Language>("zh");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const savedTheme = localStorage.getItem("theme") as ThemePreference | null;
		const savedLang = localStorage.getItem("lang") as Language | null;
		const initialPreference: ThemePreference = savedTheme ?? "system";
		setPreference(initialPreference);
		setTheme(resolveTheme(initialPreference));
		applyDocumentTheme(resolveTheme(initialPreference));
		if (savedLang) setLang(savedLang);
		setMounted(true);
	}, []);

	// Follow live OS changes while the preference is `system`.
	useEffect(() => {
		if (preference !== "system") return;
		const query = window.matchMedia(DARK_QUERY);
		const onChange = () => {
			const next = systemTheme();
			setTheme(next);
			applyDocumentTheme(next);
		};
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, [preference]);

	const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
		const nextPreference: ThemePreference = theme === "dark" ? "light" : "dark";
		const applyTheme = () => {
			const next = resolveTheme(nextPreference);
			setPreference(nextPreference);
			setTheme(next);
			localStorage.setItem("theme", nextPreference);
			applyDocumentTheme(next);
		};

		const transitionDocument = document as ViewTransitionDocument;
		if (
			!transitionDocument.startViewTransition ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		) {
			applyTheme();
			return;
		}

		const { clientX: x, clientY: y } = event;
		const endRadius = Math.hypot(
			Math.max(x, window.innerWidth - x),
			Math.max(y, window.innerHeight - y),
		);
		const transition = transitionDocument.startViewTransition(applyTheme);
		void transition.ready.then(() => {
			document.documentElement.animate(
				{ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
				{
					duration: 450,
					easing: "cubic-bezier(0.4, 0, 0.2, 1)",
					pseudoElement: "::view-transition-new(root)",
				},
			);
		});
	};

	const toggleLang = () => {
		const nextLang = lang === "zh" ? "en" : "zh";
		setLang(nextLang);
		localStorage.setItem("lang", nextLang);
	};

	return { theme, preference, lang, mounted, toggleTheme, toggleLang };
}
