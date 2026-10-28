"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const reviewSchema = z.object({
  authorName: z.string().trim().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(600),
});

export type SubmitReviewState =
  | { ok: true }
  | { ok: false; message: string }
  | null;

export async function submitReview(
  _prevState: SubmitReviewState,
  formData: FormData,
): Promise<SubmitReviewState> {
  const parsed = reviewSchema.safeParse({
    authorName: formData.get("author_name"),
    rating: formData.get("rating"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Please fill in your name, a rating, and a review (at least 10 characters)." };
  }

  const supabase = createAdminClient();
  // Always unapproved -- never trust a public submission to publish itself.
  const { error } = await supabase.from("reviews").insert({
    author_name: parsed.data.authorName,
    rating: parsed.data.rating,
    body: parsed.data.body,
    approved: false,
  });

  if (error) {
    return { ok: false, message: "Something went wrong submitting your review. Please try again." };
  }

  return { ok: true };
}
