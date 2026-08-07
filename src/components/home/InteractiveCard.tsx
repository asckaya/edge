import { type MouseEvent, type ReactNode, useRef } from "react";

type Variant = "default" | "console";

interface InteractiveCardProps {
	children: ReactNode;
	className?: string;
	/** Visual variant. `console` applies shadow-xl. */
	variant?: Variant;
}

const VARIANT_CONFIG: Record<
	Variant,
	{
		cardClass: string;
		hoverClass: string;
		contentClass: string;
	}
> = {
	default: {
		cardClass: "border-zinc-200 dark:border-zinc-900/60 bg-white dark:bg-zinc-950/40 shadow-sm",
		hoverClass: "hover:border-zinc-300 dark:hover:border-zinc-800/80 hover:shadow-lg",
		contentClass: "relative z-10 h-full",
	},
	console: {
		cardClass: "border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/60 shadow-xl",
		hoverClass: "hover:border-zinc-300 dark:hover:border-zinc-800",
		contentClass: "relative z-10",
	},
};

export default function InteractiveCard({
	children,
	className = "",
	variant = "default",
}: InteractiveCardProps) {
	const cfg = VARIANT_CONFIG[variant];
	const cardRef = useRef<HTMLDivElement>(null);

	const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
		const card = cardRef.current;
		if (!card) return;
		const rect = card.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		card.style.setProperty("--mouse-x", `${x}px`);
		card.style.setProperty("--mouse-y", `${y}px`);
	};

	return (
		<div
			role="none"
			ref={cardRef}
			onMouseMove={handleMouseMove}
			className={`group relative overflow-hidden rounded-2xl border ${cfg.cardClass} transition-all duration-300 ${cfg.hoverClass} ${className}`}
		>
			<div
				className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				style={{
					background:
						"radial-gradient(350px circle at var(--mouse-x) var(--mouse-y), var(--color-spotlight), transparent 80%)",
				}}
			/>
			<div className={cfg.contentClass}>{children}</div>
		</div>
	);
}
