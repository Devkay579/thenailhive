export function StepIndicator({
  steps,
  activeIndex,
}: {
  steps: string[];
  activeIndex: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-wine-700">
          {steps[activeIndex]}
        </p>
        <p className="font-display text-sm italic text-ink-700">
          {String(activeIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </p>
      </div>
      <ol className="mt-3 flex items-center gap-1.5" aria-label="Booking progress">
        {steps.map((label, i) => {
          const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "upcoming";
          return (
            <li key={label} className="flex-1" aria-current={state === "active" ? "step" : undefined}>
              <span className="sr-only">
                {label} ({state})
              </span>
              <div
                aria-hidden="true"
                className={`h-1 rounded-full transition-colors duration-300 ${
                  state === "upcoming" ? "bg-ink-950/10" : state === "active" ? "bg-wine-700" : "bg-wine-900"
                }`}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
