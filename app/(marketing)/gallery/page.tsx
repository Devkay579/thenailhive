import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { AnimatedSection } from "@/components/AnimatedSection";
import { GalleryGrid } from "@/components/GalleryGrid";
import { PageHero } from "@/components/three/PageHero";
import { getGalleryItems } from "@/lib/data/gallery";

export const metadata: Metadata = pageMetadata({
  title: "Gallery | THENAILHIVE",
  description: "Browse THENAILHIVE's portfolio of nail sets by category and book the look you love.",
  path: "/gallery",
});

export default async function GalleryPage() {
  const galleryItems = await getGalleryItems();

  return (
    <>
      <PageHero
        index="03"
        eyebrow="Different styles. Same quality."
        title="The"
        accent="Gallery"
        subtitle="Every set here was done in the studio. See one you love? Tap it to book the look."
      />

      <section className="grain py-12 sm:py-16">
        <Container>
          <GalleryGrid items={galleryItems} />
        </Container>
      </section>

      <section className="pb-20 sm:pb-28">
        <Container>
          <AnimatedSection>
            <div className="grain grain-light flex flex-col items-start gap-6 rounded-sm bg-wine-900 px-7 py-10 text-cream-50 shadow-[10px_10px_0_var(--color-blush-300)] sm:flex-row sm:items-center sm:justify-between sm:px-12 sm:py-12">
              <p className="max-w-xl font-display text-2xl font-semibold leading-snug sm:text-3xl">
                Still not sure?{" "}
                <span className="font-script font-medium italic text-blush-300">
                  Book in and we&apos;ll create your perfect set together.
                </span>
              </p>
              <Button href="/book" variant="light" size="lg">
                Book Now
              </Button>
            </div>
          </AnimatedSection>
        </Container>
      </section>
    </>
  );
}
