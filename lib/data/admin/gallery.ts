import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GalleryItemRow } from "@/lib/supabase/types";

export const GALLERY_PAGE_SIZE = 24;

export type GalleryPage = {
  rows: GalleryItemRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getGalleryAdmin(page = 1): Promise<GalleryPage> {
  const supabase = createAdminClient();
  const pageSize = GALLERY_PAGE_SIZE;
  const safePage = Math.max(1, page);

  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("gallery_items")
    .select("*", { count: "exact" })
    .order("sort_order")
    .range(from, to);
  if (error) throw error;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { rows: data ?? [], total, page: safePage, pageSize, totalPages };
}
