import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Admin desk, API routes and per-customer booking confirmations.
      disallow: ["/admin", "/api/", "/book/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
