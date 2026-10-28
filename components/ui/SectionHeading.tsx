import { cn } from "@/lib/cn";

/** Small-caps kicker like a magazine section marker: "Nº 02 — The Menu". */
export function Kicker({
  index,
  children,
  tone = "light",
  className = "",
}: {
  index?: string;
  children: React.ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] sm:text-xs",
        tone === "light" ? "text-wine-700" : "text-blush-300",
        className,
      )}
    >
      {index ? (
        <span className="font-display text-sm normal-case tracking-normal italic">
          N&ordm;&nbsp;{index}
        </span>
      ) : null}
      <span
        aria-hidden="true"
        className={cn("h-px w-8", tone === "light" ? "bg-wine-700/40" : "bg-blush-300/40")}
      />
      {children}
    </p>
  );
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  accent,
  align = "left",
  tone = "light",
  className = "",
}: {
  index?: string;
  eyebrow?: string;
  title: string;
  /** Optional trailing words set in italic script, e.g. title="The" accent="Menu". */
  accent?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" ? "flex flex-col items-center text-center" : "text-left", className)}>
      {eyebrow ? (
        <Kicker index={index} tone={tone}>
          {eyebrow}
        </Kicker>
      ) : null}
      <h2
        className={cn(
          "mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl",
          tone === "light" ? "text-ink-950" : "text-cream-50",
        )}
      >
        {title}
        {accent ? (
          <>
            {" "}
            <span
              className={cn(
                "font-script font-medium italic",
                tone === "light" ? "text-wine-900" : "text-blush-300",
              )}
            >
              {accent}
            </span>
          </>
        ) : null}
      </h2>
    </div>
  );
}
