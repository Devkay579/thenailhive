import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { NailTile } from "@/components/ui/NailTile";
import { Kicker } from "@/components/ui/SectionHeading";
import { ZoomableImage } from "@/components/ZoomableImage";
import { AnimatedSection, AnimatedStagger, AnimatedStaggerItem } from "@/components/AnimatedSection";
import { PageHero } from "@/components/three/PageHero";
import { formatNaira } from "@/lib/mock-data";
import { getServices, getToeServices, getAddons } from "@/lib/data/services";

export const metadata: Metadata = pageMetadata({
  title: "Services & Prices | THENAILHIVE",
  description: "Browse THENAILHIVE's services and prices for GelX, acrylic, BIAB, toes, nail art and removal.",
  path: "/services",
});

function PriceLine({ label, price, suffix }: { label: string; price: number; suffix?: string }) {
  return (
    <li className="flex items-end text-sm">
      <span className="text-ink-700">{label}</span>
      <span className="leader" aria-hidden="true" />
      <span className="shrink-0 font-display text-base font-semibold text-wine-900">
        {formatNaira(price)}
        {suffix ? <span className="ml-1 font-sans text-xs font-normal text-ink-700">{suffix}</span> : null}
      </span>
    </li>
  );
}

export default async function ServicesPage() {
  const [services, toeServices, addons] = await Promise.all([
    getServices(),
    getToeServices(),
    getAddons(),
  ]);

  return (
    <>
      <PageHero
        index="02"
        eyebrow="Quality. Creativity. You."
        title="Services &"
        accent="Prices"
        subtitle="Priced by length, with premium products on every set and art that's entirely yours."
      />

      <section className="grain py-14 sm:py-20">
        <Container>
          <AnimatedStagger className="divide-y divide-ink-950/10 border-b border-ink-950/10">
            {services.map((service, i) => (
              <AnimatedStaggerItem key={service.slug}>
                <article className="grid gap-6 py-10 sm:grid-cols-[auto_1fr] sm:gap-10 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                  <div className={`print w-40 sm:w-44 ${i % 2 === 0 ? "-rotate-2" : "rotate-2"}`}>
                    {service.imageUrl ? (
                      <ZoomableImage
                        src={service.imageUrl}
                        alt={service.name}
                        sizes="176px"
                        className="aspect-square w-full"
                      />
                    ) : (
                      <NailTile variant={i} className="w-full" />
                    )}
                    <p className="py-2 text-center font-script text-sm italic text-wine-900">
                      N&ordm; {String(i + 1).padStart(2, "0")}
                    </p>
                  </div>

                  <div className="max-w-xl">
                    <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-950">
                      {service.name}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-700">{service.blurb}</p>

                    {service.prices.length > 0 ? (
                      <ul className="mt-6 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
                        {service.prices.map((p) => (
                          <PriceLine key={p.length} label={p.length} price={p.price} />
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-6 flex items-baseline gap-3 text-sm text-ink-700">
                        Starting from
                        <span className="font-display text-3xl font-semibold text-wine-900">
                          {formatNaira(service.startingFrom ?? 0)}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="sm:col-start-2 lg:col-start-auto">
                    <Button href={`/book?service=${service.slug}`} className="w-full sm:w-auto">
                      Book Now
                    </Button>
                  </div>
                </article>
              </AnimatedStaggerItem>
            ))}
          </AnimatedStagger>

          <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-12">
            {/* Toes */}
            <AnimatedSection>
              <div className="paper-stack mr-3 h-[calc(100%-10px)] rounded-sm p-7 sm:p-9">
                <Kicker>Pedicure-ready</Kicker>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-950">
                  Toes
                </h2>
                <ul className="mt-6 space-y-3">
                  {toeServices.map((t) => (
                    <PriceLine key={t.name} label={t.name} price={t.price} />
                  ))}
                </ul>
                <Button href="/book?service=toes" variant="outline" className="mt-8">
                  Book Toes
                </Button>
              </div>
            </AnimatedSection>

            {/* Extras */}
            <AnimatedSection delay={0.1}>
              <div className="grain grain-light h-full rounded-sm bg-wine-900 p-7 text-cream-50 shadow-[10px_10px_0_var(--color-blush-300)] sm:p-9">
                <Kicker tone="dark">Add-ons</Kicker>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                  Extras &amp; <span className="font-script font-medium italic text-blush-300">Nail Art</span>
                </h2>
                <ul className="mt-6 space-y-3">
                  {addons.map((a) => (
                    <li key={a.name} className="flex items-end text-sm">
                      <span className="text-cream-100/85">{a.name}</span>
                      <span className="leader border-cream-50/25" aria-hidden="true" />
                      <span className="shrink-0 font-display text-base font-semibold text-blush-300">
                        {formatNaira(a.price)}
                        {a.suffix ? <span className="ml-1 font-sans text-xs font-normal text-cream-100/60">{a.suffix}</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 font-script text-lg italic text-cream-100/70">
                  Charged separately and added to your appointment total.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </Container>
      </section>
    </>
  );
}
