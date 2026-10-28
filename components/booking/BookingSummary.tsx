"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatNaira } from "@/lib/mock-data";
import { LogoMark } from "@/components/ui/Logo";
import {
  findNextService,
  findService,
  findServicePrice,
  formatDateLabel,
  formatTimeLabel,
  type BookableAddon,
  type BookableService,
  type WizardState,
} from "./types";

export function computeTotals(
  services: BookableService[],
  addons: BookableAddon[],
  state: WizardState,
  depositPercent: number,
) {
  const match = findServicePrice(services, state.servicePriceId);
  const nextMatch = findNextService(services, state) ? findServicePrice(services, state.nextServicePriceId) : null;
  const selectedAddons = addons.filter((a) => state.addonIds.includes(a.id));
  if (!match) return { match: null, nextMatch, selectedAddons, subtotal: 0, deposit: 0, balance: 0 };
  const subtotal =
    match.price.priceNgn +
    (nextMatch?.price.priceNgn ?? 0) +
    selectedAddons.reduce((sum, a) => sum + a.priceNgn, 0);
  const deposit = Math.round((subtotal * depositPercent) / 100);
  return { match, nextMatch, selectedAddons, subtotal, deposit, balance: subtotal - deposit };
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-end gap-3">
      <dt className="w-16 shrink-0 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-700">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 border-b border-ink-950/20 pb-0.5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={value ?? "empty"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={`block truncate font-script text-lg italic leading-tight ${value ? "text-wine-900" : "text-ink-700/30"}`}
          >
            {value ?? "—"}
          </motion.span>
        </AnimatePresence>
      </dd>
    </div>
  );
}

/**
 * The appointment card that fills itself in as the client moves through the
 * wizard: service, length, extras and slot are "handwritten" onto its lines,
 * and the tear-off section below the perforation carries the money.
 */
export function BookingSummary({
  services,
  addons,
  state,
  depositPercent,
}: {
  services: BookableService[];
  addons: BookableAddon[];
  state: WizardState;
  depositPercent: number;
}) {
  const service = findService(services, state.serviceId);
  const nextService = findNextService(services, state);
  const { match, nextMatch, selectedAddons, subtotal, deposit, balance } = computeTotals(
    services,
    addons,
    state,
    depositPercent,
  );

  return (
    <div className="overflow-hidden rounded-2xl bg-[#fffdf9] shadow-[0_2px_3px_rgb(26_21_18/0.08),18px_24px_40px_-20px_rgb(46_14_21/0.4)] ring-1 ring-ink-950/10">
      <div className="grain grain-light flex items-center justify-between bg-wine-900 px-6 py-4 text-cream-50">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em]">Appointment Card</p>
        <LogoMark className="h-5 w-5 text-blush-300" />
      </div>

      <dl className="space-y-4 px-6 py-6">
        <Field
          label="Service"
          value={service ? (nextService ? `${service.name} + ${nextService.name}` : service.name) : null}
        />
        <Field
          label="Length"
          value={nextService ? (nextMatch?.price.lengthLabel ?? null) : (match?.price.lengthLabel ?? null)}
        />
        <Field
          label="Extras"
          value={selectedAddons.length ? selectedAddons.map((a) => a.name.split(" / ")[0]).join(", ") : null}
        />
        <Field label="Date" value={state.date ? formatDateLabel(state.date) : null} />
        <Field label="Time" value={state.startTime ? formatTimeLabel(state.startTime) : null} />
      </dl>

      {/* Perforation */}
      <div className="relative">
        <span aria-hidden="true" className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-cream-50 ring-1 ring-ink-950/10" />
        <span aria-hidden="true" className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-cream-50 ring-1 ring-ink-950/10" />
        <div className="mx-5 border-t-2 border-dashed border-ink-950/15" />
      </div>

      <div className="space-y-2 px-6 pb-6 pt-5 text-sm">
        {match ? (
          <>
            <div className="flex items-end">
              <span className="text-ink-700">Total</span>
              <span className="leader" aria-hidden="true" />
              <span className="font-display text-lg font-semibold text-ink-950">{formatNaira(subtotal)}</span>
            </div>
            <div className="flex items-end">
              <span className="text-ink-700">Deposit today ({depositPercent}%)</span>
              <span className="leader" aria-hidden="true" />
              <span className="font-display text-lg font-semibold text-wine-900">{formatNaira(deposit)}</span>
            </div>
            <div className="flex items-end">
              <span className="text-ink-700">Balance on the day</span>
              <span className="leader" aria-hidden="true" />
              <span className="font-display text-base font-semibold text-ink-950">{formatNaira(balance)}</span>
            </div>
          </>
        ) : (
          <p className="py-1 text-center font-script text-lg italic text-ink-700/70">
            Your total appears here
          </p>
        )}
      </div>
    </div>
  );
}
