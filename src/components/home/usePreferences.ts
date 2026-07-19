import { type MouseEvent, useEffect, useState } from "react";
import type { Language } from "./translations";

type Theme = "dark" | "light";
type ViewTransitionDocument = Document & {
	startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

function applyDocumentTheme(theme: Theme): void {
	document.documentElement.classList.toggle("dark", theme === "dark");
}

export function usePreferences() {
	const [theme, setTheme] = useState<Theme>("dark");
	const [lang, setLang] = useState<Language>("zh");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			const savedTheme = localStorage.getItem("theme") as Theme | null;
			const savedLang = localStorage.getItem("lang") as Language | null;
			const initialTheme = savedTheme || "dark";
			setTheme(initialTheme);
			applyDocumentTheme(initialTheme);
			if (savedLang) setLang(savedLang);
			setMounted(true);
		}, 0);
		return () => clearTimeout(timer);
	}, []);

	const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
		const nextTheme: Theme = theme === "dark" ? "light" : "dark";
		const applyTheme = () => {
			setTheme(nextTheme);
			localStorage.setItem("theme", nextTheme);
			applyDocumentTheme(nextTheme);
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
		transition.ready.then(() => {
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

	return { theme, lang, mounted, toggleTheme, toggleLang };
}
