import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ReviewForm } from "@/components/ReviewForm";
import { PageHero } from "@/components/three/PageHero";

export const metadata: Metadata = pageMetadata({
  title: "Leave a Review | THENAILHIVE",
  description: "Share your experience with THENAILHIVE.",
  path: "/reviews",
});

export default function ReviewsPage() {
  return (
    <>
      <PageHero
        index="06"
        eyebrow="We'd love your feedback"
        title="Leave a"
        accent="Note"
        subtitle="Had a set done with us? Let other clients know how it went."
      />
      <section className="grain py-14 sm:py-20">
        <Container className="max-w-xl">
          <AnimatedSection>
            <ReviewForm />
          </AnimatedSection>
        </Container>
      </section>
    </>
  );
}
