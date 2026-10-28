"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { createBooking } from "@/app/book/actions";
import { BookingSummary } from "./BookingSummary";
import { StepHeading } from "./StepHeading";
import { findNextService, findServicePrice, type BookableAddon, type BookableService, type WizardState } from "./types";

export function ReviewStep({
  services,
  addons,
  state,
  depositPercent,
  onSlotTaken,
}: {
  services: BookableService[];
  addons: BookableAddon[];
  state: WizardState;
  depositPercent: number;
  onSlotTaken: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const match = findServicePrice(services, state.servicePriceId);

  if (!match) return null;

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createBooking({
        servicePriceId: state.servicePriceId!,
        nextServicePriceId: findNextService(services, state) ? state.nextServicePriceId : null,
        addonIds: state.addonIds,
        date: state.date!,
        startTime: state.startTime!,
        name: state.name,
        phone: state.phone,
        email: state.email,
        instagram: state.instagram,
        inspirationPaths: state.inspirationUploads.map((u) => u.path),
        policyAccepted: true,
        notes: state.notes,
      });

      if (result.ok) {
        toast.success("Booking received!");
        router.push(`/book/${result.bookingId}`);
        return;
      }

      if (result.error === "slot_taken") {
        onSlotTaken();
      }
      setError(result.message);
      toast.error(result.message);
    });
  }

  return (
    <div>
      <StepHeading n={6} title="Check &" accent="confirm" sub="Make sure everything looks right, then hold your slot." />

      {/* On large screens the card is already pinned beside the wizard. */}
      <div className="mt-8 lg:hidden">
        <BookingSummary services={services} addons={addons} state={state} depositPercent={depositPercent} />
      </div>

      <dl className="mt-8 grid gap-x-8 gap-y-4 border-y border-ink-950/10 py-6 text-sm sm:grid-cols-2">
        {[
          ["Name", state.name],
          ["Phone", state.phone],
          ["Email", state.email],
          ["Instagram", state.instagram || "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-700">{label}</dt>
            <dd className="mt-0.5 truncate font-medium text-ink-950">{value}</dd>
          </div>
        ))}
        {state.inspirationUploads.length > 0 ? (
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-700">Inspiration</dt>
            <dd className="mt-0.5 font-medium text-ink-950">
              {state.inspirationUploads.length} photo{state.inspirationUploads.length === 1 ? "" : "s"}
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-6 text-sm leading-relaxed text-ink-700">
        Your {depositPercent}% deposit is non-refundable and secures your slot. After confirming,
        you&apos;ll send it via bank transfer and share proof on WhatsApp.
      </p>

      {error ? <p className="mt-3 text-sm font-medium text-wine-700">{error}</p> : null}

      <Button type="button" onClick={handleSubmit} disabled={isPending} size="lg" className="mt-8 w-full">
        {isPending ? "Confirming…" : "Confirm Booking"}
      </Button>
    </div>
  );
}
