"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateBookingStatus, rescheduleBooking } from "@/app/admin/bookings/actions";
import type { BookingStatus } from "@/lib/supabase/types";
import { inputClass } from "@/components/admin/ui";

const STATUS_TOAST: Partial<Record<BookingStatus, string>> = {
  confirmed: "Booking confirmed — confirmation email sent.",
  cancelled: "Booking cancelled.",
  completed: "Booking marked completed.",
  no_show: "Booking marked as no-show.",
  pending_payment: "Booking reopened as pending.",
};

const NEXT_ACTIONS: Partial<Record<BookingStatus, { label: string; status: BookingStatus; primary?: boolean }[]>> = {
  pending_payment: [
    { label: "Confirm (deposit received)", status: "confirmed", primary: true },
    { label: "Cancel", status: "cancelled" },
  ],
  deposit_paid: [
    { label: "Confirm", status: "confirmed", primary: true },
    { label: "Cancel", status: "cancelled" },
  ],
  confirmed: [
    { label: "Mark Completed", status: "completed", primary: true },
    { label: "Mark No-Show", status: "no_show" },
    { label: "Cancel", status: "cancelled" },
  ],
  completed: [],
  cancelled: [{ label: "Re-open as Pending", status: "pending_payment" }],
  no_show: [{ label: "Re-open as Pending", status: "pending_payment" }],
};

export function BookingActions({ bookingId, status }: { bookingId: string; status: BookingStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);

  function handleStatus(next: BookingStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, next);
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
      } else {
        toast.success(STATUS_TOAST[next] ?? "Booking updated.");
        router.refresh();
      }
    });
  }

  const actions = NEXT_ACTIONS[status] ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.status}
            type="button"
            disabled={isPending}
            onClick={() => handleStatus(a.status)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
              a.primary
                ? "bg-wine-900 text-cream-50 hover:bg-wine-800"
                : "border border-blush-300 text-ink-700 hover:border-wine-700"
            }`}
          >
            {a.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowReschedule((v) => !v)}
          className="rounded-full border border-blush-300 px-4 py-2 text-sm font-medium text-ink-700 hover:border-wine-700"
        >
          Reschedule
        </button>
      </div>

      {error ? <p className="text-sm text-wine-700">{error}</p> : null}

      {showReschedule ? (
        <RescheduleForm
          bookingId={bookingId}
          onDone={() => {
            setShowReschedule(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function RescheduleForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return;
    setError(null);
    startTransition(async () => {
      const result = await rescheduleBooking(bookingId, date, time);
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
      } else {
        toast.success("Booking rescheduled.");
        onDone();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-xl border border-ink-950/10 bg-cream-100 p-3">
      <div>
        <label className="block text-xs font-medium text-ink-700">New date</label>
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} mt-1`} />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink-700">New time</label>
        <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={`${inputClass} mt-1`} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="h-[38px] rounded-full bg-wine-900 px-4 text-sm font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      {error ? <p className="w-full text-sm text-wine-700">{error}</p> : null}
    </form>
  );
}
