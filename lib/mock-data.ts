// Shared type shapes for pricing/gallery content (used by lib/data/* to type
// live Supabase reads) plus the testimonials/values content that stays
// static until real reviews exist to replace it.

export type LengthPrice = {
  length: "Short" | "Medium" | "Long" | "XL";
  price: number;
};

export type ServiceCategory = {
  slug: string;
  name: string;
  blurb: string;
  prices: LengthPrice[];
  startingFrom?: number;
  imageUrl?: string | null;
};

export type ToeService = { name: string; price: number };

export type AddonPrice = { name: string; price: number; suffix?: string };

export type GalleryCategory = "Acrylic" | "Gel" | "BIAB" | "Nail Art" | "Toes";

export type GalleryItem = {
  id: string;
  category: GalleryCategory;
  title: string;
  serviceSlug: string;
};

export const testimonials = [
  {
    name: "Sarah M.",
    rating: 5,
    quote:
      "My nails are always perfect. The attention to detail is unmatched. I'll always come back!",
  },
  {
    name: "Tolu M.",
    rating: 5,
    quote: "Best nail tech in Lagos. Clean, calm and professional.",
  },
  {
    name: "Amaka O.",
    rating: 5,
    quote:
      "The designs are always so creative and unique. I love the vibe!",
  },
];

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}
