import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getApprovedReviews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("author_name, rating, body")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw error;

  return (data ?? []).map((r) => ({
    name: r.author_name,
    rating: r.rating,
    quote: r.body,
  }));
}
