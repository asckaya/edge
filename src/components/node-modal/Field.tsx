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
 * Renders the canonical `space-y-1.5` / `label-caps` / control block.
 */
export default function Field({ label, htmlFor, children, className = "" }: FieldProps) {
	return (
		<div className={`space-y-1.5 ${className}`}>
			<label htmlFor={htmlFor} className="label-caps">
				{label}
			</label>
			{children}
		</div>
	);
}
