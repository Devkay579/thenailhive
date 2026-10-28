import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Kicker } from "@/components/ui/SectionHeading";
import { AnimatedSection } from "@/components/AnimatedSection";
import { WhatsAppIcon } from "@/components/icons";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/three/PageHero";
import { getBusinessInfo } from "@/lib/data/settings";

export const metadata: Metadata = pageMetadata({
  title: "Contact | THENAILHIVE",
  description: "Get in touch with THENAILHIVE via WhatsApp, Instagram or TikTok.",
  path: "/contact",
});

export default async function ContactPage() {
  const businessInfo = await getBusinessInfo();

  const whatsappHref = `https://wa.me/${businessInfo.whatsappNumber}?text=${encodeURIComponent(
    "Hi THENAILHIVE! I'd like to know more about your services.",
  )}`;

  const channels = [
    { label: "WhatsApp", value: businessInfo.phone, href: whatsappHref },
    {
      label: "Instagram",
      value: `@${businessInfo.instagram}`,
      href: `https://instagram.com/${businessInfo.instagram}`,
    },
    {
      label: "TikTok",
      value: `@${businessInfo.tiktok}`,
      href: `https://tiktok.com/@${businessInfo.tiktok}`,
    },
  ];

  return (
    <>
      <PageHero
        index="05"
        eyebrow="We'd love to hear from you"
        title="Get In"
        accent="Touch"
        subtitle="Quick question? WhatsApp is fastest. Booking is still best done online."
      />

      <section className="grain py-14 sm:py-20">
        <Container className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <AnimatedSection>
            <div className="grain grain-light rounded-sm bg-wine-900 p-7 text-cream-50 shadow-[10px_10px_0_var(--color-blush-300)] sm:p-9">
              <WhatsAppIcon className="h-9 w-9 text-blush-300" />
              <p className="mt-5 font-display text-3xl font-semibold leading-tight">
                Chat with us on{" "}
                <span className="font-script font-medium italic text-blush-300">WhatsApp</span>
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream-100/75">
                The fastest way to reach us for quick questions &mdash; booking is
                still best done online.
              </p>
              <Button
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="light"
                size="lg"
                className="mt-8"
              >
                Message {businessInfo.phone}
              </Button>
            </div>

            <ul className="mt-12 border-t border-ink-950/15">
              {channels.map((c) => (
                <li key={c.label} className="border-b border-ink-950/15">
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4 py-5"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-wine-700">
                      {c.label}
                    </span>
                    <span className="flex items-center gap-3 font-display text-lg font-semibold text-ink-950 transition-colors group-hover:text-wine-900">
                      {c.value}
                      <span aria-hidden="true" className="text-wine-900 transition-transform group-hover:translate-x-1">
                        &rarr;
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <Kicker>Or write to us</Kicker>
            <p className="mt-3 font-display text-3xl font-semibold text-ink-950">
              Prefer not to use{" "}
              <span className="font-script font-medium italic text-wine-900">WhatsApp?</span>
            </p>
            <p className="mt-2 text-sm text-ink-700">
              Send us a message below and we&apos;ll reply by email.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </AnimatedSection>
        </Container>
      </section>
    </>
  );
}
