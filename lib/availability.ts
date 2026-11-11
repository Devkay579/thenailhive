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

/**
 * Start times offered on the booking calendar.
 *
 * The admin is in full control of the diary, so slots deliberately ignore how
 * long the service takes:
 * - every grid time from opening up to (not including) closing is offered,
 *   even if the appointment would run past closing;
 * - an existing booking hides every start time it covers -- a 60-min set at
 *   2:00 hides 2:00 and 2:30, leaving 3:00 open. Anything else the studio
 *   can't take, the admin blocks under Availability (blocked slots likewise
 *   hide every start time they cover).
 */
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
  /** Start/end times ("HH:MM:SS") of the day's active bookings. */
  bookedIntervals: TimeInterval[];
  /** Only used to label each slot's end time; it never removes a slot. */
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
  const blocked = blockedIntervals.map((b) => ({ start: toMinutes(b.start), end: toMinutes(b.end) }));
  const booked = bookedIntervals.map((b) => {
    const start = toMinutes(b.start);
    // Guard against a missing/zero-length end so the start cell is still taken.
    const end = Math.max(toMinutes(b.end), start + 1);
    return { start, end };
  });

  const slots: Slot[] = [];
  const earliestStart = Math.max(openMinutes, minStartMinutes ?? openMinutes);

  // Keep same-day slots on the same clean grid as every other day (open_time,
  // open_time + 30, ...). Without this, a "now + lead time" cutoff like
  // 16:18 becomes the loop's start value directly, producing odd slot times
  // (4:18, 4:48, ...) instead of the usual :00/:30 grid.
  const offsetFromOpen = earliestStart - openMinutes;
  const alignedOffset = Math.ceil(offsetFromOpen / slotIntervalMinutes) * slotIntervalMinutes;
  const gridStart = openMinutes + alignedOffset;

  for (let start = gridStart; start < closeMinutes; start += slotIntervalMinutes) {
    const cellEnd = start + slotIntervalMinutes;
    // Blocks and bookings hide every grid cell they touch (a 14:00-15:00 block
    // or booking hides 14:00 and 14:30). Using cell overlap also covers admin
    // bookings made at off-grid times like 14:15.
    const isBlocked = blocked.some((b) => overlaps(start, cellEnd, b.start, b.end));
    const isBooked = booked.some((b) => overlaps(start, cellEnd, b.start, b.end));
    if (!isBlocked && !isBooked) {
      slots.push({ start: toTimeString(start), end: toTimeString(start + durationMinutes) });
    }
  }

  return slots;
}

/** True if `time` ("HH:MM[:SS]") falls inside any of the given bookings. */
export function isTimeInsideBooking(time: string, bookings: TimeInterval[]) {
  const t = toMinutes(time);
  return bookings.some((b) => {
    const start = toMinutes(b.start);
    return t >= start && t < Math.max(toMinutes(b.end), start + 1);
  });
}

/** Postgres error codes meaning "that start time is already taken":
 * 23505 = unique_violation on bookings_unique_start (current rule);
 * 23P01 = exclusion_violation from the old bookings_no_overlap constraint,
 * still possible until the schema.sql migration has been run. */
export function isSlotTakenError(code: string | undefined | null) {
  return code === "23505" || code === "23P01";
}
