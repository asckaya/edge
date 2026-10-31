import type { ReactNode } from "react";

interface FieldProps {
	label: ReactNode;
	htmlFor?: string;
	children: ReactNode;
	/** Applied to the outer wrapper (use for grid placement like `col-span-8`). */
	className?: string;
}

/**
 * Reusable label + control wrapper for the node modal forms.
 * Renders the canonical eyebrow label + control block.
 */
export default function Field({ label, htmlFor, children, className = "" }: FieldProps) {
	return (
		<div className={`space-y-1 ${className}`}>
			<label htmlFor={htmlFor} className="eyebrow block text-[10px] text-mute">
				{label}
			</label>
			{children}
		</div>
	);
}
