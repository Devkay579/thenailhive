import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GalleryCategory, GalleryItem } from "@/lib/mock-data";
import type { GalleryMediaType } from "@/lib/supabase/types";

export async function getGalleryItems(): Promise<
  (GalleryItem & { imageUrl: string | null; mediaType: GalleryMediaType })[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_items")
    .select("id, category, title, image_url, media_type, service_slug")
    .eq("active", true)
    .order("sort_order");

  if (error) throw error;

  return (data ?? []).map((item) => ({
    id: item.id,
    category: item.category as GalleryCategory,
    title: item.title,
    serviceSlug: item.service_slug ?? "",
    imageUrl: item.image_url,
    mediaType: (item.media_type ?? "image") as GalleryMediaType,
  }));
}

export type GalleryLook = {
  id: string;
  title: string;
  category: GalleryCategory;
  imageUrl: string | null;
  mediaType: GalleryMediaType;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One active gallery item, for "Book this look" (/book?look=<id>). Returns
 * null for anything that isn't a live item, so a stale link just books normally. */
export async function getGalleryLook(id: string | null | undefined): Promise<GalleryLook | null> {
  if (!id || !UUID_RE.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_items")
    .select("id, category, title, image_url, media_type")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    category: data.category as GalleryCategory,
    imageUrl: data.image_url,
    mediaType: (data.media_type ?? "image") as GalleryMediaType,
  };
}
