// Slot computation for the booking calendar. Pure functions -- no I/O -- so
// the route handler (app/api/availability/route.ts) stays a thin wrapper
// that fetches rows and hands them here.
//
// Nigeria (Africa/Lagos, WAT) does not observe daylight saving time and is a
// fixed UTC+1 offset year-round, so we treat "now in Lagos" as a simple
// +60 minute shift off UTC rather than pulling in a timezone database.

export type BusinessHoursInput = {
  open_time: string | null; // "HH:MM:SS"
  close_time: string | null;
  is_closed: boolean;
};

export type TimeInterval = { start: string; end: string };

export type Slot = { start: string; end: string };

const LAGOS_OFFSET_MINUTES = 60;

export function nowInLagos(): Date {
  return new Date(Date.now() + LAGOS_OFFSET_MINUTES * 60 * 1000);
}

export function todayInLagos(): string {
  return nowInLagos().toISOString().slice(0, 10);
}

export function tomorrowInLagos(): string {
  return new Date(nowInLagos().getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export function computeAvailableSlots({
  businessHours,
  blockedIntervals,
  bookedIntervals,
  durationMinutes,
  slotIntervalMinutes = 30,
  minStartMinutes,
}: {
  businessHours: BusinessHoursInput;
  blockedIntervals: TimeInterval[];
  bookedIntervals: TimeInterval[];
  durationMinutes: number;
  slotIntervalMinutes?: number;
  /** If set (e.g. "now" for a same-day request), no slot starts before this. */
  minStartMinutes?: number;
}): Slot[] {
  if (businessHours.is_closed || !businessHours.open_time || !businessHours.close_time) {
    return [];
  }

  const openMinutes = toMinutes(businessHours.open_time);
  const closeMinutes = toMinutes(businessHours.close_time);
  const busy = [...blockedIntervals, ...bookedIntervals].map((b) => ({
    start: toMinutes(b.start),
    end: toMinutes(b.end),
  }));

  const slots: Slot[] = [];
  const earliestStart = Math.max(openMinutes, minStartMinutes ?? openMinutes);

  // Keep same-day slots on the same clean grid as every other day (open_time,
  // open_time + 30, ...). Without this, a "now + lead time" cutoff like
  // 16:18 becomes the loop's start value directly, producing odd slot times
  // (4:18, 4:48, ...) instead of the usual :00/:30 grid -- and can even waste
  // enough of the last slot's room that a service that would otherwise fit
  // before closing time doesn't.
  const offsetFromOpen = earliestStart - openMinutes;
  const alignedOffset = Math.ceil(offsetFromOpen / slotIntervalMinutes) * slotIntervalMinutes;
  const gridStart = openMinutes + alignedOffset;

  for (
    let start = gridStart;
    start + durationMinutes <= closeMinutes;
    start += slotIntervalMinutes
  ) {
    const end = start + durationMinutes;
    const clash = busy.some((b) => overlaps(start, end, b.start, b.end));
    if (!clash) {
      slots.push({ start: toTimeString(start), end: toTimeString(end) });
    }
  }

  return slots;
}
