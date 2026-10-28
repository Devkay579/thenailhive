import type { Metadata } from "next";
import Image from "next/image";
import { pageMetadata } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Kicker, SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { NailTile } from "@/components/ui/NailTile";
import { AnimatedSection, AnimatedStagger, AnimatedStaggerItem } from "@/components/AnimatedSection";
import { getAboutContent } from "@/lib/data/about";

export const metadata: Metadata = pageMetadata({
  title: "About | THENAILHIVE",
  description: "Learn about THENAILHIVE's story, values and approach to nail care.",
  path: "/about",
});

// Where each of the three prints sits in the stack, plus the placeholder
// tile shown until a photo is uploaded for it.
const PRINTS = [
  { className: "left-0 top-0 w-[62%] -rotate-6", variant: 1 },
  { className: "right-0 top-[18%] w-[58%] rotate-[5deg]", variant: 0 },
  { className: "bottom-0 left-[14%] w-[60%] -rotate-1", variant: 2 },
];

export default async function AboutPage() {
  const about = await getAboutContent();

  return (
    <>
      <section className="grain overflow-hidden">
        <Container className="grid gap-16 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:pb-28">
          <AnimatedSection>
            {about.kicker ? <Kicker index="04">{about.kicker}</Kicker> : null}
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.98] tracking-tight text-ink-950 sm:text-6xl">
              {about.headingMain}
              {about.headingAccent ? (
                <>
                  {" "}
                  <span className="font-script font-medium italic text-wine-900">{about.headingAccent}</span>
                </>
              ) : null}
            </h1>
            <div
              className={`mt-8 grid gap-5 text-base leading-relaxed text-ink-700 sm:gap-8 ${about.paragraphTwo ? "sm:grid-cols-2" : ""}`}
            >
              {about.paragraphOne ? (
                <p className="whitespace-pre-line first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-wine-900">
                  {about.paragraphOne}
                </p>
              ) : null}
              {about.paragraphTwo ? <p className="whitespace-pre-line">{about.paragraphTwo}</p> : null}
            </div>
            <Button href="/book" size="lg" className="mt-10">
              {about.buttonLabel}
            </Button>
          </AnimatedSection>

          {/* Three prints laid on top of each other */}
          <AnimatedSection delay={0.1} className="relative mx-auto h-[26rem] w-full max-w-sm sm:h-[30rem]">
            {PRINTS.map((print, i) => {
              const photo = about.photos[i];
              return (
                <div key={i} className={`print absolute ${print.className}`}>
                  {photo.url ? (
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={photo.url}
                        alt={photo.caption || "THENAILHIVE nails"}
                        fill
                        sizes="(min-width: 640px) 240px, 60vw"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <NailTile variant={print.variant} />
                  )}
                  <p className="min-h-9 py-2 text-center font-script text-sm italic text-wine-900">{photo.caption}</p>
                </div>
              );
            })}
          </AnimatedSection>
        </Container>
      </section>

      {about.values.length > 0 ? (
      <section className="grain grain-light bg-wine-900 py-20 text-cream-50 sm:py-28">
        <Container>
          <SectionHeading eyebrow={about.valuesEyebrow} title={about.valuesTitle} accent={about.valuesAccent} tone="dark" />
          <AnimatedStagger className="mt-14 grid gap-px overflow-hidden rounded-sm bg-cream-50/15 sm:grid-cols-2 lg:grid-cols-4">
            {about.values.map((item, i) => (
              <AnimatedStaggerItem key={`${i}-${item.title}`} className="bg-wine-900 p-7">
                <p className="font-script text-5xl italic leading-none text-blush-300">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-6 font-display text-xl font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-cream-100/75">{item.description}</p>
              </AnimatedStaggerItem>
            ))}
          </AnimatedStagger>
        </Container>
      </section>
      ) : null}
    </>
  );
}
