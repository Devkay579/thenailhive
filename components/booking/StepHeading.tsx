export function StepHeading({
  n,
  title,
  accent,
  sub,
}: {
  n: number;
  title: string;
  accent?: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="font-display text-sm italic text-wine-700">Step {String(n).padStart(2, "0")}</p>
      <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
        {title}
        {accent ? (
          <>
            {" "}
            <span className="font-script font-medium italic text-wine-900">{accent}</span>
          </>
        ) : null}
      </h2>
      {sub ? <p className="mt-2 text-sm text-ink-700">{sub}</p> : null}
    </div>
  );
}

/** Round tick used on selected options. */
export function Tick({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
        on ? "border-wine-900 bg-wine-900 text-cream-50" : "border-ink-950/25 bg-transparent text-transparent"
      }`}
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3">
        <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

// Shared look for selectable option cards: paper at rest, lifted onto a
// hard blush block with a wine outline when chosen.
export function optionClass(selected: boolean) {
  return `rounded-2xl border text-left transition-[transform,box-shadow,border-color,background-color] duration-150 ${
    selected
      ? "-translate-x-0.5 -translate-y-0.5 border-wine-900 bg-[#fffdf9] shadow-[5px_5px_0_var(--color-blush-300)]"
      : "border-ink-950/12 bg-[#fffdf9] hover:border-wine-700/60 hover:shadow-[3px_3px_0_var(--color-blush-200)]"
  }`;
}
