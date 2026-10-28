"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createAdminBooking, updateAdminBooking } from "@/app/admin/bookings/actions";
import type { BookingFormAddon, BookingFormService } from "@/lib/data/admin/bookings";
import { AdminCard, inputClass, labelClass, primaryButtonClass } from "@/components/admin/ui";
import { formatNaira } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

export type BookingFormInitial = {
  servicePriceId: string | null;
  followupServicePriceId: string | null;
  addonIds: string[];
  date: string;
  startTime: string;
  notes: string;
};

type Slot = { start: string; end: string };

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ") || "0m";
}

export function BookingForm({
  mode,
  bookingId,
  services,
  addons,
  depositPercent,
  paidDepositNgn = null,
  initial,
}: {
  mode: "create" | "edit";
  bookingId?: string;
  services: BookingFormService[];
  addons: BookingFormAddon[];
  depositPercent: number;
  /** Edit only: a deposit already received stays fixed when the total changes. */
  paidDepositNgn?: number | null;
  initial?: Partial<BookingFormInitial>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const priceIndex = useMemo(() => {
    const map = new Map<string, { service: BookingFormService; price: BookingFormService["prices"][number] }>();
    for (const service of services) for (const price of service.prices) map.set(price.id, { service, price });
    return map;
  }, [services]);

  const initialService = initial?.servicePriceId ? priceIndex.get(initial.servicePriceId)?.service : undefined;

  const [serviceId, setServiceId] = useState(initialService?.id ?? "");
  const [priceId, setPriceId] = useState(initial?.servicePriceId ?? "");
  const [followupId, setFollowupId] = useState(initial?.followupServicePriceId ?? "");
  const [addonIds, setAddonIds] = useState<string[]>(initial?.addonIds ?? []);
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.startTime ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [status, setStatus] = useState<"pending_payment" | "confirmed">("pending_payment");
  const [notifyClient, setNotifyClient] = useState(true);

  const [slotResult, setSlotResult] = useState<{ query: string; slots: Slot[] } | null>(null);

  const service = services.find((s) => s.id === serviceId);
  const isRemoval = service?.slug === "removal";
  const main = priceId ? priceIndex.get(priceId) : undefined;
  const followup = isRemoval && followupId ? priceIndex.get(followupId) : undefined;
  const selectedAddons = addons.filter((a) => addonIds.includes(a.id));

  const subtotal =
    (main?.price.priceNgn ?? 0) +
    (followup?.price.priceNgn ?? 0) +
    selectedAddons.reduce((sum, a) => sum + a.priceNgn, 0);
  const duration = (main?.price.durationMinutes ?? 0) + (followup?.price.durationMinutes ?? 0);
  const deposit = paidDepositNgn ?? Math.round((subtotal * depositPercent) / 100);
  const balance = Math.max(0, subtotal - deposit);

  // Suggest the slots a customer would see that day -- a hint only, the
  // admin can still type any time (e.g. squeezing someone in after hours).
  // Results are keyed by query so stale ones are ignored, not cleared.
  const slotQuery =
    date && priceId
      ? new URLSearchParams({
          date,
          servicePriceId: priceId,
          ...(followup ? { nextServicePriceId: followup.price.id } : {}),
        }).toString()
      : null;
  const slots = slotResult && slotResult.query === slotQuery ? slotResult.slots : null;

  useEffect(() => {
    if (!slotQuery) return;
    let cancelled = false;
    fetch(`/api/availability?${slotQuery}`)
      .then((res) => (res.ok ? res.json() : { slots: [] }))
      .then((body: { slots?: Slot[] }) => {
        if (!cancelled) setSlotResult({ query: slotQuery, slots: body.slots ?? [] });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slotQuery]);

  function chooseService(id: string) {
    setServiceId(id);
    const next = services.find((s) => s.id === id);
    // Single-tier services (BIAB, Removal...) have nothing to choose.
    setPriceId(next?.prices.length === 1 ? next.prices[0].id : "");
    setFollowupId("");
  }

  function toggleAddon(id: string) {
    setAddonIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!priceId) {
      toast.error("Please choose a service and length.");
      return;
    }
    const appointment = {
      servicePriceId: priceId,
      followupServicePriceId: followup ? followup.price.id : null,
      addonIds,
      date,
      startTime: time,
      notes,
    };

    startTransition(async () => {
      if (mode === "create") {
        const result = await createAdminBooking({
          ...appointment,
          name,
          phone,
          email,
          instagram,
          status,
          notifyClient: notifyClient && Boolean(email),
        });
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Booking created.");
        router.push(`/admin/bookings/${result.bookingId}`);
      } else {
        const result = await updateAdminBooking(bookingId!, appointment);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Booking updated.");
        router.push(`/admin/bookings/${bookingId}`);
        router.refresh();
      }
    });
  }

  const otherServices = services.filter((s) => s.slug !== "removal");

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="space-y-6">
        {mode === "create" ? (
          <AdminCard title="Client">
            <p className="-mt-2 mb-4 text-xs text-ink-700">
              A returning client is matched by phone number, so their history stays in one place.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="bf-name">
                <input id="bf-name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Phone / WhatsApp" htmlFor="bf-phone">
                <input
                  id="bf-phone"
                  required
                  type="tel"
                  minLength={7}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Email (optional)" htmlFor="bf-email">
                <input id="bf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Instagram (optional)" htmlFor="bf-ig">
                <input
                  id="bf-ig"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                  placeholder="username"
                  className={inputClass}
                />
              </Field>
            </div>
          </AdminCard>
        ) : null}

        <AdminCard title="Service">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Service" htmlFor="bf-service">
              <select id="bf-service" required value={serviceId} onChange={(e) => chooseService(e.target.value)} className={inputClass}>
                <option value="" disabled>
                  Choose a service
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            {service && service.prices.length > 1 ? (
              <Field label="Length / option" htmlFor="bf-price">
                <select id="bf-price" required value={priceId} onChange={(e) => setPriceId(e.target.value)} className={inputClass}>
                  <option value="" disabled>
                    Choose one
                  </option>
                  {service.prices.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.lengthLabel} · {formatNaira(p.priceNgn)}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            {isRemoval ? (
              <Field label="New set after removal (optional)" htmlFor="bf-followup">
                <select id="bf-followup" value={followupId} onChange={(e) => setFollowupId(e.target.value)} className={inputClass}>
                  <option value="">Removal only</option>
                  {otherServices.map((s) => (
                    <optgroup key={s.id} label={s.name}>
                      {s.prices.map((p) => (
                        <option key={p.id} value={p.id}>
                          {s.name} · {p.lengthLabel} · {formatNaira(p.priceNgn)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
            ) : null}
          </div>

          {addons.length > 0 ? (
            <fieldset className="mt-6">
              <legend className={labelClass}>Extras</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {addons.map((a) => {
                  const checked = addonIds.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition-colors",
                        checked ? "border-wine-700 bg-blush-100/60" : "border-ink-950/10 hover:border-blush-300",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddon(a.id)}
                          className="h-4 w-4 accent-wine-900"
                        />
                        {a.name}
                      </span>
                      <span className="shrink-0 text-ink-700">
                        {formatNaira(a.priceNgn)}
                        {a.suffix ? ` ${a.suffix}` : ""}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
        </AdminCard>

        <AdminCard title="When">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="bf-date">
              <input id="bf-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Start time" htmlFor="bf-time">
              <input
                id="bf-time"
                type="time"
                required
                step={900}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          {slots ? (
            <div className="mt-4">
              <p className="text-xs text-ink-700">
                {slots.length
                  ? "Open slots that day (tap to use, or type any time above):"
                  : "No open slots inside business hours that day. You can still enter a time above."}
              </p>
              {slots.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {slots.map((slot) => {
                    const value = slot.start.slice(0, 5);
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => setTime(value)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          time === value
                            ? "border-wine-900 bg-wine-900 text-cream-50"
                            : "border-blush-300 text-ink-700 hover:border-wine-700",
                        )}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {mode === "edit" ? (
                <p className="mt-2 text-xs text-ink-700/70">This booking&apos;s current slot shows as taken.</p>
              ) : null}
            </div>
          ) : null}
        </AdminCard>

        <AdminCard title={mode === "create" ? "Status & notes" : "Notes"}>
          <div className="space-y-4">
            {mode === "create" ? (
              <fieldset>
                <legend className={labelClass}>Status</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      ["pending_payment", "Awaiting deposit"],
                      ["confirmed", "Confirmed (deposit received)"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className={cn(
                        "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        status === value ? "border-wine-900 bg-wine-900 text-cream-50" : "border-blush-300 text-ink-700",
                      )}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={value}
                        checked={status === value}
                        onChange={() => setStatus(value)}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            <Field label="Notes (optional)" htmlFor="bf-notes">
              <textarea
                id="bf-notes"
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
              />
            </Field>
            {mode === "create" ? (
              <label className={cn("flex items-center gap-2 text-sm", email ? "text-ink-950" : "text-ink-700/60")}>
                <input
                  type="checkbox"
                  checked={notifyClient && Boolean(email)}
                  disabled={!email}
                  onChange={(e) => setNotifyClient(e.target.checked)}
                  className="h-4 w-4 accent-wine-900"
                />
                Email the client their booking details{email ? "" : " (add an email first)"}
              </label>
            ) : null}
          </div>
        </AdminCard>
      </div>

      <div className="lg:sticky lg:top-6">
        <AdminCard title="Summary">
          <dl className="space-y-2 text-sm">
            <SummaryRow label="Service" value={main ? `${main.service.name} · ${main.price.lengthLabel}` : "—"} />
            {followup ? (
              <SummaryRow label="Then" value={`${followup.service.name} · ${followup.price.lengthLabel}`} />
            ) : null}
            {selectedAddons.length ? <SummaryRow label="Extras" value={selectedAddons.map((a) => a.name).join(", ")} /> : null}
            <SummaryRow
              label="Time"
              value={date && time && duration ? `${date} · ${time}–${addMinutes(time, duration)}` : "—"}
            />
            <SummaryRow label="Length of visit" value={duration ? formatDuration(duration) : "—"} />
            <div className="border-t border-ink-950/10 pt-2" />
            <SummaryRow label="Total" value={formatNaira(subtotal)} strong />
            <SummaryRow
              label={paidDepositNgn != null ? "Deposit (paid)" : `Deposit (${depositPercent}%)`}
              value={formatNaira(deposit)}
            />
            <SummaryRow label="Balance due" value={formatNaira(balance)} />
          </dl>
          <button type="submit" disabled={isPending} className={cn(primaryButtonClass, "mt-6 h-11 w-full")}>
            {isPending ? "Saving…" : mode === "create" ? "Create booking" : "Save changes"}
          </button>
        </AdminCard>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-700">{label}</dt>
      <dd className={cn("text-right", strong ? "font-display text-lg font-semibold text-wine-900" : "font-medium text-ink-950")}>
        {value}
      </dd>
    </div>
  );
}
