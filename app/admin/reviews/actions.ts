"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createReview(formData: FormData) {
  const supabase = createAdminClient();
  const authorName = String(formData.get("author_name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 5);
  if (!authorName || !body) return;

  const { error } = await supabase.from("reviews").insert({
    author_name: authorName,
    body,
    rating,
    approved: formData.get("approved") === "on",
  });
  if (error) throw error;

  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function setReviewApproved(id: string, approved: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("reviews").update({ approved }).eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function deleteReview(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/reviews");
  revalidatePath("/");
}
