"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearDeposit, recordDeposit } from "@/app/admin/bookings/actions";
import { ActionForm } from "@/components/ui/ActionForm";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/admin/ui";
import { formatNaira } from "@/lib/mock-data";
import { nowInLagos } from "@/lib/availability";
import type { PaymentMethod } from "@/lib/supabase/types";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
  pos: "POS / card",
  other: "Other",
};

function formatPaidAt(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

export function PaymentPanel({
  bookingId,
  subtotalNgn,
  depositNgn,
  balanceNgn,
  depositPaidAt,
  paymentMethod,
  paymentReference,
}: {
  bookingId: string;
  subtotalNgn: number;
  depositNgn: number;
  balanceNgn: number;
  depositPaidAt: string | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isClearing, startClearing] = useTransition();

  function handleClear() {
    if (!confirm("Mark this deposit as not received?")) return;
    startClearing(async () => {
      const result = await clearDeposit(bookingId);
      if (!result.ok) toast.error(result.message);
      else {
        toast.success("Deposit marked as not received.");
        router.refresh();
      }
    });
  }

  const paid = Boolean(depositPaidAt);

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <Figure label="Total" value={formatNaira(subtotalNgn)} />
        <Figure label="Deposit" value={formatNaira(depositNgn)} tone={paid ? "paid" : "due"} />
        <Figure label="Balance at visit" value={formatNaira(balanceNgn)} />
      </dl>

      {paid && !editing ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-emerald-900">Deposit received {formatPaidAt(depositPaidAt!)}</p>
            <p className="text-emerald-800">
              {paymentMethod ? PAYMENT_METHOD_LABELS[paymentMethod] : "Method not recorded"}
              {paymentReference ? (
                <>
                  {" "}
                  &middot; Ref <span className="font-mono">{paymentReference}</span>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex gap-3 text-xs font-medium">
            <button type="button" onClick={() => setEditing(true)} className="text-wine-900 hover:underline">
              Edit
            </button>
            <button type="button" onClick={handleClear} disabled={isClearing} className="text-wine-700 hover:underline">
              {isClearing ? "Clearing…" : "Mark not received"}
            </button>
          </div>
        </div>
      ) : (
        <ActionForm
          action={recordDeposit.bind(null, bookingId)}
          successMessage="Deposit recorded."
          onSuccess={() => setEditing(false)}
          className="space-y-3 rounded-xl border border-ink-950/10 bg-cream-100 p-4"
        >
          {!paid ? <p className="text-sm font-medium text-amber-800">Deposit not received yet.</p> : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="pay-method" className={labelClass}>
                Paid by
              </label>
              <select
                id="pay-method"
                name="method"
                defaultValue={paymentMethod ?? "bank_transfer"}
                className={`${inputClass} mt-1.5`}
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pay-ref" className={labelClass}>
                Reference (optional)
              </label>
              <input
                id="pay-ref"
                name="reference"
                defaultValue={paymentReference ?? ""}
                placeholder="Transfer ref / session ID"
                className={`${inputClass} mt-1.5`}
              />
            </div>
            <div>
              <label htmlFor="pay-at" className={labelClass}>
                Received
              </label>
              <input
                id="pay-at"
                name="paidAt"
                type="datetime-local"
                required
                defaultValue={(depositPaidAt ? new Date(new Date(depositPaidAt).getTime() + 3600_000) : nowInLagos())
                  .toISOString()
                  .slice(0, 16)}
                className={`${inputClass} mt-1.5`}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SubmitButton className={`${primaryButtonClass} h-[38px]`}>
              {paid ? "Save payment" : "Record deposit"}
            </SubmitButton>
            {editing ? (
              <button type="button" onClick={() => setEditing(false)} className={`${secondaryButtonClass} h-[38px]`}>
                Cancel
              </button>
            ) : null}
          </div>
        </ActionForm>
      )}
    </div>
  );
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: "paid" | "due" }) {
  return (
    <div className="rounded-xl border border-ink-950/10 px-3 py-2.5">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700">{label}</dt>
      <dd
        className={`mt-1 font-display text-lg font-semibold ${
          tone === "paid" ? "text-emerald-800" : tone === "due" ? "text-amber-800" : "text-ink-950"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
