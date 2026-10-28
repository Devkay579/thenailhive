"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { submitReview, type SubmitReviewState } from "@/app/(marketing)/reviews/actions";
import { StarIcon } from "@/components/icons";

export function ReviewForm() {
  const [state, formAction, isPending] = useActionState<SubmitReviewState, FormData>(
    submitReview,
    null,
  );
  const [rating, setRating] = useState(5);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Review submitted — thank you!");
    else toast.error(state.message);
  }, [state]);

  if (state?.ok) {
    return (
      <div className="paper-stack mr-3 rounded-sm p-6 sm:p-9 text-center">
        <p className="font-display text-lg font-semibold text-ink-950">Thank you!</p>
        <p className="mt-1 text-sm text-ink-700">
          Your review has been submitted and will appear once approved.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 paper-stack mr-3 rounded-sm p-6 sm:p-9">
      <div>
        <label htmlFor="author_name" className="block text-sm font-medium text-ink-700">
          Your name
        </label>
        <input
          id="author_name"
          name="author_name"
          type="text"
          required
          minLength={2}
          className="form-field"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-ink-700">Rating</span>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              className="text-wine-900"
            >
              <StarIcon className="h-6 w-6" filled={value <= rating} />
            </button>
          ))}
        </div>
        <input type="hidden" name="rating" value={rating} />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-ink-700">
          Your review
        </label>
        <textarea
          id="body"
          name="body"
          rows={4}
          required
          minLength={10}
          maxLength={600}
          placeholder="Tell us about your visit…"
          className="form-field"
        />
      </div>

      {state?.ok === false ? <p className="text-sm text-wine-700">{state.message}</p> : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Submitting…" : "Submit Review"}
      </Button>
    </form>
  );
}
