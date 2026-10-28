import { Container } from "@/components/ui/Container";
import { Kicker } from "@/components/ui/SectionHeading";

/**
 * Editorial masthead for inner pages: section number, an oversized title
 * whose last word is set in italic script, and a short standfirst on the
 * right, closed off by a double rule like a magazine page.
 */
export function PageHero({
  index,
  eyebrow,
  title,
  accent,
  subtitle,
}: {
  index: string;
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <section className="grain bg-blush-100/60">
      <Container className="pb-10 pt-14 sm:pb-14 sm:pt-20">
        <Kicker index={index}>{eyebrow}</Kicker>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight text-ink-950 sm:text-7xl">
            {title}
            {accent ? (
              <>
                {" "}
                <span className="font-script font-medium italic text-wine-900">{accent}</span>
              </>
            ) : null}
          </h1>
          {subtitle ? (
            <p className="max-w-sm text-base leading-relaxed text-ink-700 lg:justify-self-end lg:pb-2">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div aria-hidden="true" className="mt-10 space-y-1">
          <div className="h-px bg-ink-950/25" />
          <div className="h-px bg-ink-950/10" />
        </div>
      </Container>
    </section>
  );
}
