import { type MouseEvent, type ReactNode, useRef } from "react";

type Variant = "default" | "console";

interface InteractiveCardProps {
	children: ReactNode;
	className?: string;
	/** Max tilt in degrees. Defaults to 2.5 (console variant forces 2). */
	maxTilt?: number;
	/** Visual variant. `console` applies shadow-xl, tighter lift and easing. */
	variant?: Variant;
}

const VARIANT_CONFIG: Record<
	Variant,
	{
		tilt: number;
		scale: string;
		cardClass: string;
		hoverClass: string;
		transition: string;
		contentClass: string;
		lift: string;
	}
> = {
	default: {
		tilt: 2.5,
		scale: "1.006, 1.006, 1.006",
		cardClass: "border-zinc-200 dark:border-zinc-900/60 bg-white dark:bg-zinc-950/40 shadow-sm",
		hoverClass: "hover:border-zinc-300 dark:hover:border-zinc-800/80 hover:shadow-lg",
		transition:
			"transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s ease, box-shadow 0.3s ease",
		contentClass: "relative z-10 h-full",
		lift: "translateZ(12px)",
	},
	console: {
		tilt: 2,
		scale: "1.005, 1.005, 1.005",
		cardClass: "border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/60 shadow-xl",
		hoverClass: "hover:border-zinc-300 dark:hover:border-zinc-800",
		transition: "transform 0.2s ease-out, border-color 0.3s ease, box-shadow 0.3s ease",
		contentClass: "relative z-10",
		lift: "translateZ(10px)",
	},
};

export default function InteractiveCard({
	children,
	className = "",
	maxTilt,
	variant = "default",
}: InteractiveCardProps) {
	const cfg = VARIANT_CONFIG[variant];
	const tilt = maxTilt ?? cfg.tilt;
	const cardRef = useRef<HTMLDivElement>(null);

	const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
		const card = cardRef.current;
		if (!card) return;
		const rect = card.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		card.style.setProperty("--mouse-x", `${x}px`);
		card.style.setProperty("--mouse-y", `${y}px`);

		const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * tilt;
		const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * tilt;
		card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${cfg.scale})`;
	};

	const handleMouseLeave = () => {
		if (cardRef.current) {
			cardRef.current.style.transform =
				"perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
		}
	};

	return (
		<div
			role="none"
			ref={cardRef}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			className={`group relative overflow-hidden rounded-2xl border ${cfg.cardClass} transition-all duration-300 ${cfg.hoverClass} ${className}`}
			style={{
				transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
				transformStyle: "preserve-3d",
				transition: cfg.transition,
			}}
		>
			<div
				className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				style={{
					background:
						"radial-gradient(350px circle at var(--mouse-x) var(--mouse-y), var(--color-spotlight), transparent 80%)",
				}}
			/>
			<div className={cfg.contentClass} style={{ transform: cfg.lift }}>
				{children}
			</div>
		</div>
	);
}
