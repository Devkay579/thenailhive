import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReviewRow } from "@/lib/supabase/types";

export const REVIEWS_PAGE_SIZE = 20;

export type ReviewsPage = {
  rows: ReviewRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getReviewsAdmin(page = 1): Promise<ReviewsPage> {
  const supabase = createAdminClient();
  const pageSize = REVIEWS_PAGE_SIZE;
  const safePage = Math.max(1, page);

  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { rows: data ?? [], total, page: safePage, pageSize, totalPages };
}
