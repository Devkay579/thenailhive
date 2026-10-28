import type { Metadata } from "next";

/** The public site address, used for canonical links, the sitemap and
 * social previews. Set NEXT_PUBLIC_SITE_URL once a custom domain is live;
 * until then Vercel's production URL (set automatically) is used. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "THENAILHIVE";
export const HOME_TITLE = "THENAILHIVE | Nails. Beauty. Confidence.";
export const HOME_DESCRIPTION =
  "THENAILHIVE offers GelX, acrylic, BIAB, nail art and more. Browse our work, check prices and book your appointment online.";

/** Title, description, canonical URL and the matching Open Graph tags for a
 * public page. Next merges metadata shallowly, so each page's openGraph
 * replaces the root one wholesale -- this keeps siteName/locale on every page.
 * The share image comes from app/opengraph-image.tsx automatically. */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_NG",
      url: path,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
