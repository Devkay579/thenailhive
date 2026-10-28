import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Kicker, SectionHeading } from "@/components/ui/SectionHeading";
import { NailTile } from "@/components/ui/NailTile";
import { LogoMark } from "@/components/ui/Logo";
import {
  AnimatedSection,
  AnimatedStagger,
  AnimatedStaggerItem,
} from "@/components/AnimatedSection";
import { TiltCard } from "@/components/three/TiltCard";
import { StarIcon } from "@/components/icons";
import { formatNaira } from "@/lib/mock-data";
import { getAboutContent } from "@/lib/data/about";
import { getFeaturedServiceTiles } from "@/lib/data/services";
import { getApprovedReviews } from "@/lib/data/reviews";
import { getGalleryItems } from "@/lib/data/gallery";
import { getBusinessInfo } from "@/lib/data/settings";
import { HOME_DESCRIPTION, HOME_TITLE, SITE_NAME, SITE_URL, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({ title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/" });

// Prints are scattered on the table at slight angles and square up on hover.
const PRINT_TILT = ["-rotate-3", "rotate-2 sm:translate-y-6", "-rotate-1", "rotate-3 sm:translate-y-4"];
const NOTE_TILT = ["-rotate-2", "rotate-1 sm:translate-y-6", "-rotate-1"];

export default async function HomePage() {
  const [featuredServiceTiles, testimonials, galleryItems, businessInfo, about] = await Promise.all([
    getFeaturedServiceTiles(),
    getApprovedReviews(),
    getGalleryItems(),
    getBusinessInfo(),
    getAboutContent(),
  ]);
  // Edited from admin > About Page (shared with the About page's values).
  const whyUs = about.values;

  // Structured data so search engines can show the business (name, phone,
  // socials) as a rich result rather than a plain link.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NailSalon",
    name: SITE_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    description: HOME_DESCRIPTION,
    priceRange: "₦₦",
    currenciesAccepted: "NGN",
    ...(businessInfo.phone ? { telephone: businessInfo.phone } : {}),
    sameAs: [
      businessInfo.instagram && `https://instagram.com/${businessInfo.instagram}`,
      businessInfo.tiktok && `https://tiktok.com/@${businessInfo.tiktok}`,
    ].filter(Boolean),
  };

  const featuredWork = galleryItems.filter((g) => g.imageUrl && g.mediaType === "image").slice(0, 4);
  // public/hero.jpg sets the hero background: the studio's own portrait shot
  // (img/new.jpg) rotated 90deg clockwise into a 1920x1080 landscape, so the
  // fur sits on the left under the cream wash and the nails on the right. If
  // it's removed, the newest gallery photo stands in.
  const heroImage = existsSync(join(process.cwd(), "public", "hero.jpg"))
    ? "/hero.jpg"
    : (featuredWork[0]?.imageUrl ?? null);

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so no stored value can close the script tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* Hero */}
      <section className="grain relative isolate overflow-hidden">
        {heroImage ? (
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            {/* On desktop the photo sits in the right part of the hero so the
                hands land beside the copy rather than under it. */}
            <div className="absolute inset-0 lg:left-[36%]">
              <Image
                src={heroImage}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 64vw, 100vw"
                className="object-cover"
                unoptimized
              />
            </div>
            {/* Cream wash: solid behind the copy, clearing toward the photo. */}
            <div className="absolute inset-0 bg-gradient-to-b from-cream-50/85 via-cream-50/75 to-cream-50/90 lg:bg-gradient-to-r lg:from-cream-50 lg:from-36% lg:via-cream-50/40 lg:via-50% lg:to-transparent lg:to-65%" />
          </div>
        ) : null}
        {/* Fills the first screen below the sticky nav (4.25rem), and above the
            mobile book bar (5rem) on small screens. */}
        <Container className="flex min-h-[max(32rem,calc(100svh-9.25rem))] items-center py-12 md:min-h-[max(36rem,calc(100svh-4.25rem))] lg:py-20">
          <AnimatedSection className="max-w-xl">
            <Kicker index="01">Nails &middot; Beauty &middot; Confidence</Kicker>
            <h1 className="mt-6 font-display text-[3.4rem] font-semibold leading-[0.92] tracking-tight text-ink-950 sm:text-7xl lg:text-[5.5rem]">
              Your Nails.
              <br />
              Your{" "}
              <span className="font-script font-medium italic text-wine-900">Statement.</span>
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-ink-700 sm:text-lg">
              Luxury nails, made for you. GelX, acrylic, BIAB and nail art
              crafted with precision in every set.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button href="/book" size="lg">
                Book an Appointment
              </Button>
              <Button href="/gallery" variant="outline" size="lg">
                View Gallery
              </Button>
            </div>
            <ul className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-700">
              {["GelX", "Acrylic", "BIAB", "Nail Art", "Toes"].map((s, i) => (
                <li key={s} className="flex items-center gap-4">
                  {i > 0 ? <span aria-hidden="true" className="hidden h-3 w-px bg-ink-700/30 sm:block" /> : null}
                  {s}
                </li>
              ))}
            </ul>
          </AnimatedSection>
        </Container>
      </section>

      {/* The Menu */}
      <section className="grain border-y border-ink-950/10 bg-blush-100/60 py-20 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <AnimatedSection>
            <SectionHeading index="02" eyebrow="Quality sets, premium products, always" title="The" accent="Menu" />
            <p className="mt-6 max-w-sm text-base leading-relaxed text-ink-700">
              Every set is priced by length, with premium products as standard.
              Nail art and extras are added on top &mdash; no surprises.
            </p>
            <Button href="/services" variant="outline" className="mt-8">
              Full Price List
            </Button>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="paper-stack mr-3 -rotate-1 rounded-sm px-6 py-8 transition-transform duration-500 hover:rotate-0 sm:px-10 sm:py-10">
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-wine-700">
                  THENAILHIVE
                </p>
                <p className="mt-1 font-script text-3xl italic text-ink-950">Services &amp; Prices</p>
                <div aria-hidden="true" className="mx-auto mt-4 w-24 space-y-0.5">
                  <div className="h-px bg-wine-900/40" />
                  <div className="h-px bg-wine-900/40" />
                </div>
              </div>

              <ul className="mt-8 space-y-4">
                {featuredServiceTiles.map((tile, i) => (
                  <li key={tile.slug}>
                    <Link href="/services" className="group flex items-center gap-4">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-ink-950/10">
                        {tile.imageUrl ? (
                          <Image src={tile.imageUrl} alt="" fill sizes="44px" className="object-cover" unoptimized />
                        ) : (
                          <NailTile variant={i} className="h-full" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 items-end">
                        <span className="font-display text-base font-semibold text-ink-950 transition-colors group-hover:text-wine-700 sm:text-lg">
                          {tile.label}
                        </span>
                        <span className="leader" aria-hidden="true" />
                        <span className="shrink-0 text-sm text-ink-700">
                          from{" "}
                          <span className="font-display text-base font-semibold text-wine-900">
                            {formatNaira(tile.from)}
                          </span>
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-8 border-t border-dashed border-ink-950/15 pt-4 text-center font-script text-lg italic text-ink-700">
                Extras &amp; nail art priced separately
              </p>
            </div>
          </AnimatedSection>
        </Container>
      </section>

      {/* Featured Work */}
      <section className="overflow-hidden py-20 sm:py-28">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading index="03" eyebrow="A little inspiration for your next set" title="Recent" accent="Sets" />
            <Link href="/gallery" className="group inline-flex items-center gap-2 self-start text-sm font-semibold text-wine-900 sm:self-auto">
              <span className="border-b border-wine-900/40 pb-0.5 group-hover:border-wine-900">See the full gallery</span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>

          <AnimatedStagger className="mt-14 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4 sm:gap-x-7">
            {Array.from({ length: 4 }).map((_, i) => {
              const item = featuredWork[i];
              return (
                <AnimatedStaggerItem key={item?.id ?? i}>
                  <Link
                    href="/gallery"
                    className={`print group block transition-transform duration-500 ease-out hover:z-10 hover:translate-y-0 hover:rotate-0 hover:scale-105 ${PRINT_TILT[i]}`}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {item?.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="(min-width: 640px) 25vw, 50vw"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <NailTile variant={i} className="h-full" />
                      )}
                    </div>
                    <div className="flex items-baseline justify-between px-1 py-2.5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-700">
                        N&ordm; {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate pl-2 font-script text-base italic text-wine-900">
                        {item?.category ?? "Nail Art"}
                      </span>
                    </div>
                  </Link>
                </AnimatedStaggerItem>
              );
            })}
          </AnimatedStagger>
        </Container>
      </section>

      {/* Why Us */}
      <section className="grain border-t border-ink-950/10 py-20 sm:py-28">
        <Container>
          <SectionHeading index="04" eyebrow="The Hive difference" title="Why" accent="THENAILHIVE?" />
          <AnimatedStagger className="mt-14 grid grid-cols-2 border-t border-ink-950/15 lg:grid-cols-4">
            {whyUs.map((item, i) => (
              <AnimatedStaggerItem
                key={`${i}-${item.title}`}
                className={`border-b border-ink-950/15 py-8 pr-5 lg:border-b-0 lg:px-6 ${i % 2 === 1 ? "border-l pl-5" : ""} ${i > 0 ? "lg:border-l" : "lg:pl-0"}`}
              >
                <p className="font-script text-5xl italic leading-none text-wine-900/80">
                  0{i + 1}
                </p>
                <p className="mt-5 font-display text-lg font-semibold text-ink-950">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{item.description}</p>
              </AnimatedStaggerItem>
            ))}
          </AnimatedStagger>
        </Container>
      </section>

      {/* Testimonials: thank-you notes taped to a wine wall */}
      {testimonials.length > 0 && (
        <section className="grain grain-light overflow-hidden bg-wine-900 py-20 sm:py-28">
          <Container>
            <SectionHeading index="05" eyebrow="Real clients. Real results." title="The Hive" accent="Loves You" tone="dark" />

            <AnimatedStagger className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-7">
              {testimonials.map((t, i) => (
                <AnimatedStaggerItem key={t.name}>
                  <figure
                    className={`paper relative flex h-full flex-col px-6 pb-6 pt-9 transition-transform duration-500 hover:rotate-0 ${NOTE_TILT[i % NOTE_TILT.length]}`}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-[-3deg] bg-blush-300/80 shadow-sm"
                    />
                    <div className="flex gap-0.5 text-wine-700">
                      {Array.from({ length: t.rating }).map((_, s) => (
                        <StarIcon key={s} className="h-3.5 w-3.5" filled />
                      ))}
                    </div>
                    <blockquote className="mt-4 font-script text-2xl italic leading-snug text-ink-950">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-auto pt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-wine-900">
                      &mdash; {t.name}
                    </figcaption>
                  </figure>
                </AnimatedStaggerItem>
              ))}
            </AnimatedStagger>

            <p className="mt-16 text-center text-sm text-cream-100/75">
              Had a set done with us?{" "}
              <Link href="/reviews" className="font-semibold text-blush-300 underline decoration-blush-300/40 underline-offset-4 hover:decoration-blush-300">
                Leave us a note &rarr;
              </Link>
            </p>
          </Container>
        </section>
      )}

      {/* CTA: an appointment card */}
      <section className="grain bg-blush-100 py-20 sm:py-28">
        <Container>
          <AnimatedSection className="mx-auto max-w-3xl">
            <TiltCard max={6} glare={false}>
              <div className="flex flex-col overflow-hidden rounded-2xl bg-[#fffdf9] shadow-[0_2px_3px_rgb(26_21_18/0.08),24px_30px_50px_-20px_rgb(46_14_21/0.4)] ring-1 ring-ink-950/10 sm:flex-row">
                <div className="flex-1 p-7 sm:p-10">
                  <Kicker>Appointment Card</Kicker>
                  <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-ink-950 sm:text-5xl">
                    Your next{" "}
                    <span className="font-script font-medium italic text-wine-900">set.</span>
                  </h2>
                  <dl className="mt-7 space-y-4 text-sm">
                    {["Name", "Date", "Time"].map((f) => (
                      <div key={f} className="flex items-end gap-3">
                        <dt className="w-12 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700">{f}</dt>
                        <dd className="flex-1 border-b border-ink-950/25 pb-0.5 font-script text-lg italic text-wine-900/70">
                          {f === "Name" ? "You" : " "}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <Button href="/book" size="lg" className="mt-9">
                    Book Now
                  </Button>
                </div>

                {/* Perforated stub */}
                <div className="relative flex items-center justify-center border-t-2 border-dashed border-ink-950/20 bg-wine-900 px-6 py-6 text-cream-50 sm:w-32 sm:border-l-2 sm:border-t-0 sm:py-0">
                  <span aria-hidden="true" className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-blush-100 sm:-left-3 sm:-top-3" />
                  <span aria-hidden="true" className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-blush-100 sm:-bottom-3 sm:-left-3 sm:right-auto sm:top-auto" />
                  <div className="flex items-center gap-4 sm:rotate-90 sm:whitespace-nowrap">
                    <LogoMark className="h-6 w-6 text-blush-300" />
                    <span className="text-xs font-semibold uppercase tracking-[0.35em]">Admit one</span>
                  </div>
                </div>
              </div>
            </TiltCard>
          </AnimatedSection>
        </Container>
      </section>
    </>
  );
}
