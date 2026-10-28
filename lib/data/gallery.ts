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
