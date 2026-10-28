"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteBooking } from "@/app/admin/bookings/actions";

/** Two-step delete: the first click asks for confirmation inline. */
export function DeleteBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBooking(bookingId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Booking deleted.");
      router.push("/admin/bookings");
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-full border border-wine-700/40 px-4 py-2 text-sm font-medium text-wine-700 hover:border-wine-700 hover:bg-wine-700/5"
      >
        Delete booking
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-wine-700/30 bg-wine-700/5 p-4">
      <p className="text-sm text-ink-950">
        Delete this booking permanently? This can&apos;t be undone, and the client won&apos;t be notified.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="rounded-full bg-wine-700 px-4 py-2 text-sm font-medium text-cream-50 hover:bg-wine-800 disabled:opacity-60"
        >
          {isPending ? "Deleting…" : "Yes, delete it"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="rounded-full border border-blush-300 px-4 py-2 text-sm font-medium text-ink-700 hover:border-wine-700 disabled:opacity-60"
        >
          Keep it
        </button>
      </div>
    </div>
  );
}
