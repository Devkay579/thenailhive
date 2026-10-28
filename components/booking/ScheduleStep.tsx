"use client";

import { useEffect, useState } from "react";
import { StepHeading } from "./StepHeading";
import { formatTimeLabel, type WizardAction, type WizardState } from "./types";

type Slot = { start: string; end: string };

type FetchResult = {
  key: string;
  slots: Slot[] | null;
  error: string | null;
};

const STRIP_DAYS = 14;

function todayIso() {
  // Africa/Lagos is fixed UTC+1, no DST.
  return new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayParts(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return {
    weekday: d.toLocaleDateString("en-NG", { weekday: "short", timeZone: "UTC" }),
    day: d.getUTCDate(),
    month: d.toLocaleDateString("en-NG", { month: "short", timeZone: "UTC" }),
  };
}

function hourOf(time: string) {
  return Number(time.split(":")[0]);
}

export function ScheduleStep({
  state,
  dispatch,
}: {
  state: WizardState;
  dispatch: (action: WizardAction) => void;
}) {
  const today = todayIso();
  const [date, setDate] = useState(state.date ?? today);
  // A follow-up set after removal lengthens the appointment, so it changes which slots fit.
  const nextServicePriceId = state.nextServicePriceId;
  const requestKey = `${date}:${state.servicePriceId ?? ""}:${nextServicePriceId ?? ""}`;
  const [result, setResult] = useState<FetchResult>({ key: "", slots: null, error: null });
  const loading = state.servicePriceId != null && result.key !== requestKey;

  useEffect(() => {
    if (!state.servicePriceId) return;
    let cancelled = false;

    const nextParam = nextServicePriceId ? `&nextServicePriceId=${nextServicePriceId}` : "";
    fetch(`/api/availability?date=${date}&servicePriceId=${state.servicePriceId}${nextParam}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load availability");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, slots: data.slots ?? [], error: null });
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ key: requestKey, slots: null, error: "Couldn't load available times. Please try again." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey, date, state.servicePriceId, nextServicePriceId]);

  const { slots, error } = result.key === requestKey ? result : { slots: null, error: null };

  const stripDays = Array.from({ length: STRIP_DAYS }, (_, i) => addDays(today, i));
  const dateInStrip = stripDays.includes(date);

  const groups = [
    { label: "Morning", slots: slots?.filter((s) => hourOf(s.start) < 12) ?? [] },
    { label: "Afternoon", slots: slots?.filter((s) => hourOf(s.start) >= 12 && hourOf(s.start) < 17) ?? [] },
    { label: "Evening", slots: slots?.filter((s) => hourOf(s.start) >= 17) ?? [] },
  ].filter((g) => g.slots.length > 0);

  return (
    <div>
      <StepHeading n={4} title="Pick a" accent="date & time" />

      <div className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-700">Date</p>
          <label className="flex items-center gap-2 text-xs font-medium text-wine-900">
            <span className="border-b border-wine-900/30">Later date?</span>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="rounded-lg border border-ink-950/15 bg-[#fffdf9] px-2 py-1 text-xs text-ink-950 focus:border-wine-900 focus:outline-none"
              aria-label="Choose any date"
            />
          </label>
        </div>

        <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-3 [scrollbar-width:thin] sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2.5">
            {stripDays.map((iso) => {
              const { weekday, day, month } = dayParts(iso);
              const active = iso === date;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setDate(iso)}
                  aria-pressed={active}
                  className={`flex w-16 flex-col items-center rounded-2xl border py-3 transition-[transform,box-shadow,background-color] duration-150 ${
                    active
                      ? "-translate-y-0.5 border-wine-950 bg-wine-900 text-cream-50 shadow-[3px_3px_0_var(--color-blush-300)]"
                      : "border-ink-950/12 bg-[#fffdf9] text-ink-950 hover:border-wine-700/60"
                  }`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${active ? "text-blush-300" : "text-ink-700"}`}>
                    {iso === today ? "Today" : weekday}
                  </span>
                  <span className="mt-0.5 font-display text-2xl font-semibold leading-none">{day}</span>
                  <span className={`mt-1 text-[10px] ${active ? "text-cream-100/80" : "text-ink-700"}`}>{month}</span>
                </button>
              );
            })}
          </div>
        </div>
        {!dateInStrip ? (
          <p className="mt-1 text-sm text-ink-700">
            Showing times for <span className="font-semibold text-wine-900">{dayParts(date).weekday} {dayParts(date).day} {dayParts(date).month}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-700">Available times</p>

        {loading ? (
          <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4" aria-label="Loading availability">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-full bg-blush-100" />
            ))}
          </div>
        ) : error ? (
          <p className="mt-4 text-sm text-wine-700">{error}</p>
        ) : slots && slots.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-ink-950/20 px-5 py-8 text-center">
            <p className="font-script text-2xl italic text-wine-900">Fully booked</p>
            <p className="mt-1 text-sm text-ink-700">No open slots this day &mdash; try another date.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="font-display text-sm italic text-wine-700">{group.label}</p>
                <div className="mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {group.slots.map((slot) => {
                    const selected = state.date === date && state.startTime === slot.start;
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => dispatch({ type: "SET_SCHEDULE", date, startTime: slot.start })}
                        className={`h-11 rounded-full border text-sm font-medium transition-[transform,box-shadow,background-color] duration-150 ${
                          selected
                            ? "-translate-x-0.5 -translate-y-0.5 border-wine-950 bg-wine-900 text-cream-50 shadow-[3px_3px_0_var(--color-blush-300)]"
                            : "border-ink-950/15 bg-[#fffdf9] text-ink-950 hover:border-wine-700/60"
                        }`}
                      >
                        {formatTimeLabel(slot.start)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
