import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { Kicker } from "@/components/ui/SectionHeading";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { getBookableServices, getBookableAddons } from "@/lib/data/services";
import { getBusinessInfo } from "@/lib/data/settings";

export const metadata: Metadata = pageMetadata({
  title: "Book an Appointment | THENAILHIVE",
  description: "Book your THENAILHIVE appointment online in a few steps.",
  path: "/book",
});

export default async function BookPage() {
  const [services, addons, businessInfo] = await Promise.all([
    getBookableServices(),
    getBookableAddons(),
    getBusinessInfo(),
  ]);

  return (
    <>
      <section className="border-b border-ink-950/10 bg-blush-100/60">
        <Container className="max-w-5xl py-10 sm:py-14">
          <Kicker>Booking</Kicker>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.95] tracking-tight text-ink-950 sm:text-6xl">
            Book your{" "}
            <span className="font-script font-medium italic text-wine-900">appointment</span>
          </h1>
          <p className="mt-4 max-w-md text-sm text-ink-700 sm:text-base">
            Six quick steps. Your slot is held as soon as you confirm.
          </p>
        </Container>
      </section>

      <section className="py-10 sm:py-14">
        <Container className="max-w-5xl">
          <Suspense fallback={null}>
            <BookingWizard
              services={services}
              addons={addons}
              depositPercent={businessInfo.depositPercent}
              policyText={businessInfo.policyText}
            />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
