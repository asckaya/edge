import { ArrowRight } from "lucide-react";

interface SectionHeadProps {
	/** Two-digit spec-sheet index, e.g. "01". */
	index: string;
	title: string;
	desc: string;
	aside?: React.ReactNode;
}

/** Numbered, spec-sheet style section header shared by every page. */
export default function SectionHead({ index, title, desc, aside }: SectionHeadProps) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-4 pb-6">
			<div className="min-w-0">
				<div className="eyebrow flex items-center gap-2">
					<span className="text-ink">{index}</span>
					<span className="h-px w-6 bg-hairline" aria-hidden="true" />
					<span className="truncate">{title}</span>
				</div>
				<p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-body/80">{desc}</p>
			</div>
			{aside}
		</div>
	);
}

/** Small mono arrow used inside section asides. */
export function SectionArrow() {
	return <ArrowRight className="size-3 text-faint" strokeWidth={2} />;
}
