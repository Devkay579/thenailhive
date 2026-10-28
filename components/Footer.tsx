import Link from "next/link";
import { getBusinessInfo } from "@/lib/data/settings";

function buildSocials(businessInfo: Awaited<ReturnType<typeof getBusinessInfo>>) {
  return [
    {
      label: "Instagram",
      href: `https://instagram.com/${businessInfo.instagram}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "TikTok",
      href: `https://tiktok.com/@${businessInfo.tiktok}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path
            d="M14 3v10.5a3.5 3.5 0 1 1-3-3.46M14 3c.3 2.2 2 4 4.5 4.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/${businessInfo.whatsappNumber}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path
            d="M4 20l1.4-4.1A8 8 0 1 1 8.6 19L4 20Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9 10.5c.4 2 2 3.6 4 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];
}

export async function Footer() {
  const businessInfo = await getBusinessInfo();
  const socials = buildSocials(businessInfo);


  return (
    <footer className="grain grain-light mt-auto overflow-hidden bg-wine-950 pb-24 text-cream-100 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-script text-3xl italic leading-tight text-blush-300 sm:text-4xl">
              {businessInfo.tagline}
            </p>
            <div className="mt-6">
              <Link
                href="/book"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-cream-50"
              >
                <span className="border-b border-cream-50/40 pb-0.5 group-hover:border-cream-50">
                  Book an appointment
                </span>
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-2.5 text-sm">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blush-300/70">
              Explore
            </p>
            {[
              ["/services", "Services & Prices"],
              ["/gallery", "Gallery"],
              ["/about", "About"],
              ["/reviews", "Leave a review"],
              ["/contact", "Get in touch"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="w-fit text-cream-100/80 transition-colors hover:text-blush-300">
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 text-sm">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blush-300/70">
              Say hello
            </p>
            <p className="text-cream-100/80">{businessInfo.phone}</p>
            <p className="text-cream-100/80">@{businessInfo.instagram}</p>
            <div className="mt-2 flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-50/25 text-cream-100 transition-colors hover:border-blush-300 hover:bg-blush-300 hover:text-wine-950"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-2 border-t border-cream-100/15 pt-5 text-xs text-cream-100/55 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} THENAILHIVE. All rights reserved.</p>
          <p>Nails &middot; Beauty &middot; Confidence</p>
        </div>
      </div>

      {/* Oversized wordmark, cropped by the page edge */}
      <p
        aria-hidden="true"
        className="mt-6 select-none whitespace-nowrap text-center font-display text-[15.5vw] font-semibold leading-[0.78] tracking-tight text-wine-900 lg:text-[11.5rem]"
      >
        THENAILHIVE
      </p>
    </footer>
  );
}