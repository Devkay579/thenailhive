import Link from "next/link";
import {
  getCalendarEntries,
  getMonthBookings,
  type CalendarBlock,
  type CalendarBooking,
} from "@/lib/data/admin/calendar";
import { getBusinessHours } from "@/lib/data/admin/availability";
import { AdminCard, StatusBadge, primaryButtonClass } from "@/components/admin/ui";
import { todayInLagos } from "@/lib/availability";
import { cn } from "@/lib/cn";

type View = "day" | "week" | "month";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// All date maths is on "YYYY-MM-DD" strings read as UTC midnight, so the
// server's own timezone never shifts a day.
function parseDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, delta: number) {
  const d = parseDate(date);
  d.setUTCDate(d.getUTCDate() + delta);
  return toDateString(d);
}

function startOfWeek(date: string) {
  return addDays(date, -parseDate(date).getUTCDay());
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addMonths(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return parseDate(date).toLocaleDateString("en-NG", { ...options, timeZone: "UTC" });
}

function calendarHref(view: View, date: string) {
  return view === "month"
    ? `/admin/calendar?view=month&month=${date.slice(0, 7)}`
    : `/admin/calendar?view=${view}&date=${date}`;
}

const STATUS_ACCENT: Record<string, string> = {
  pending_payment: "border-l-amber-500 bg-amber-50/70",
  deposit_paid: "border-l-wine-700 bg-blush-100/60",
  confirmed: "border-l-emerald-600 bg-emerald-50/70",
  completed: "border-l-ink-700 bg-cream-100",
};

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; month?: string }>;
}) {
  const params = await searchParams;
  const today = todayInLagos();
  const view: View = params.view === "day" || params.view === "week" ? params.view : "month";
  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : params.month && /^\d{4}-\d{2}$/.test(params.month)
        ? `${params.month}-01`
        : today;

  let label: string;
  let prev: string;
  let next: string;
  if (view === "day") {
    label = formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    prev = calendarHref("day", addDays(date, -1));
    next = calendarHref("day", addDays(date, 1));
  } else if (view === "week") {
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    label = `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(end, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
    prev = calendarHref("week", addDays(start, -7));
    next = calendarHref("week", addDays(start, 7));
  } else {
    const month = date.slice(0, 7);
    label = formatDate(`${month}-01`, { month: "long", year: "numeric" });
    prev = calendarHref("month", `${addMonths(month, -1)}-01`);
    next = calendarHref("month", `${addMonths(month, 1)}-01`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">Calendar</h1>
        <Link
          href={`/admin/bookings/new${view === "day" ? `?date=${date}` : ""}`}
          className={`${primaryButtonClass} h-10`}
        >
          + New booking
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Calendar view"
          className="inline-flex rounded-full border border-ink-950/15 bg-[#fffdf9] p-1 text-sm"
        >
          {(["day", "week", "month"] as const).map((v) => (
            <Link
              key={v}
              role="tab"
              aria-selected={view === v}
              href={calendarHref(v, date)}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium capitalize transition-colors",
                view === v ? "bg-wine-900 text-cream-50" : "text-ink-700 hover:text-wine-900",
              )}
            >
              {v}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Link
            href={prev}
            aria-label="Previous"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-blush-100 hover:text-wine-900"
          >
            &larr;
          </Link>
          <span className="min-w-0 text-center font-medium text-ink-950">{label}</span>
          <Link
            href={next}
            aria-label="Next"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-blush-100 hover:text-wine-900"
          >
            &rarr;
          </Link>
          <Link
            href={calendarHref(view, today)}
            className="ml-1 rounded-full border border-blush-300 px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-wine-700"
          >
            Today
          </Link>
        </div>
      </div>

      {view === "day" ? (
        <DayView date={date} />
      ) : view === "week" ? (
        <WeekView start={startOfWeek(date)} today={today} />
      ) : (
        <MonthView month={date.slice(0, 7)} today={today} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day: an agenda of the day's appointments and blocked time, in order.
// ---------------------------------------------------------------------------

async function DayView({ date }: { date: string }) {
  const [{ bookings, blocks }, hours] = await Promise.all([getCalendarEntries(date, date), getBusinessHours()]);
  const dayHours = hours.find((h) => h.weekday === parseDate(date).getUTCDay());
  const isOpen = dayHours && !dayHours.is_closed && dayHours.open_time && dayHours.close_time;

  const items: ({ kind: "booking"; sortKey: string; booking: CalendarBooking } | { kind: "block"; sortKey: string; block: CalendarBlock })[] = [
    ...bookings.map((booking) => ({ kind: "booking" as const, sortKey: booking.startTime, booking })),
    ...blocks.map((block) => ({ kind: "block" as const, sortKey: block.startTime ?? "00:00", block })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const booked = bookings.length;

  return (
    <AdminCard
      title={`${booked} appointment${booked === 1 ? "" : "s"}`}
      action={
        <span className="text-sm text-ink-700">
          {isOpen
            ? `Open ${dayHours.open_time!.slice(0, 5)}–${dayHours.close_time!.slice(0, 5)}`
            : "Closed (business hours)"}
        </span>
      }
    >
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-ink-700">Nothing booked this day.</p>
          <Link href={`/admin/bookings/new?date=${date}`} className="mt-2 inline-block text-sm font-medium text-wine-900 hover:underline">
            Add a booking
          </Link>
        </div>
      ) : (
        <ol className="space-y-2">
          {items.map((item) =>
            item.kind === "booking" ? (
              <li key={item.booking.id}>
                <Link
                  href={`/admin/bookings/${item.booking.id}`}
                  className={cn(
                    "flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-l-4 border-ink-950/10 px-4 py-3 transition-colors hover:border-wine-700",
                    STATUS_ACCENT[item.booking.status],
                  )}
                >
                  <span className="w-28 shrink-0 font-mono text-sm font-medium text-ink-950">
                    {item.booking.startTime}–{item.booking.endTime}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink-950">{item.booking.clientName}</span>
                    <span className="block text-sm text-ink-700">{item.booking.serviceName}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {!item.booking.depositPaid ? (
                      <span className="text-[11px] font-semibold text-amber-700">Deposit unpaid</span>
                    ) : null}
                    <StatusBadge status={item.booking.status} />
                  </span>
                </Link>
              </li>
            ) : (
              <li
                key={item.block.id}
                className="flex flex-wrap items-center gap-x-4 rounded-xl border border-dashed border-ink-950/20 bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgb(26_21_18/0.03)_6px,rgb(26_21_18/0.03)_12px)] px-4 py-3 text-sm text-ink-700"
              >
                <span className="w-28 shrink-0 font-mono">
                  {item.block.startTime ? `${item.block.startTime}–${item.block.endTime}` : "All day"}
                </span>
                <span>Blocked{item.block.reason ? ` · ${item.block.reason}` : ""}</span>
              </li>
            ),
          )}
        </ol>
      )}
    </AdminCard>
  );
}

// ---------------------------------------------------------------------------
// Week: seven columns of appointment chips (stacked days on phones).
// ---------------------------------------------------------------------------

async function WeekView({ start, today }: { start: string; today: string }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const { bookings, blocks } = await getCalendarEntries(days[0], days[6]);

  return (
    <AdminCard>
      <div className="grid gap-3 sm:grid-cols-7 sm:gap-2">
        {days.map((day) => {
          const dayBookings = bookings.filter((b) => b.date === day);
          const dayBlocks = blocks.filter((b) => b.date === day);
          const isToday = day === today;
          return (
            <div
              key={day}
              className={cn(
                "flex min-w-0 flex-col rounded-xl border border-ink-950/10 bg-[#fffdf9] p-2 sm:min-h-64",
                isToday && "ring-2 ring-inset ring-wine-900",
              )}
            >
              <Link
                href={calendarHref("day", day)}
                className="mb-2 flex items-baseline justify-between gap-1 rounded-lg px-1 py-0.5 hover:bg-blush-100/60"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700">
                  {WEEKDAY_LABELS[parseDate(day).getUTCDay()]}
                </span>
                <span className={cn("font-display text-lg font-semibold", isToday ? "text-wine-900" : "text-ink-950")}>
                  {Number(day.slice(-2))}
                </span>
              </Link>
              <div className="space-y-1.5">
                {dayBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="rounded-lg border border-dashed border-ink-950/20 px-2 py-1 text-[11px] text-ink-700"
                  >
                    {block.startTime ? `${block.startTime}–${block.endTime}` : "All day"} · Blocked
                  </div>
                ))}
                {dayBookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/bookings/${b.id}`}
                    className={cn(
                      "block rounded-lg border border-l-4 border-ink-950/10 px-2 py-1.5 text-xs transition-colors hover:border-wine-700",
                      STATUS_ACCENT[b.status],
                    )}
                  >
                    <span className="block font-mono font-medium text-ink-950">{b.startTime}</span>
                    <span className="block truncate font-medium text-ink-950">{b.clientName}</span>
                    <span className="block truncate text-ink-700">{b.serviceName}</span>
                  </Link>
                ))}
                {dayBookings.length === 0 && dayBlocks.length === 0 ? (
                  <p className="px-1 text-xs text-ink-700/50">—</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <Legend />
    </AdminCard>
  );
}

// ---------------------------------------------------------------------------
// Month: counts per day; tap a day to open it.
// ---------------------------------------------------------------------------

async function MonthView({ month, today }: { month: string; today: string }) {
  const [year, monthNum] = month.split("-").map(Number);
  const monthIndex = monthNum - 1;

  const total = daysInMonth(year, monthIndex);
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${String(total).padStart(2, "0")}`;
  const bookingsByDate = await getMonthBookings(monthStart, monthEnd);

  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const cells: (string | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: total }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <AdminCard>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-ink-950/10 bg-ink-950/10 text-xs">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="bg-cream-100 p-2 text-center font-medium text-ink-700">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="min-h-20 bg-[#fffdf9] sm:min-h-24" />;
          const info = bookingsByDate.get(date);
          const isToday = date === today;
          return (
            <Link
              key={date}
              href={calendarHref("day", date)}
              className={`flex min-h-20 flex-col gap-1 bg-[#fffdf9] p-1.5 hover:bg-blush-100/40 sm:min-h-24 sm:p-2 ${
                isToday ? "ring-2 ring-inset ring-wine-900" : ""
              }`}
            >
              <span className={`text-xs font-medium ${isToday ? "text-wine-900" : "text-ink-700"}`}>
                {Number(date.slice(-2))}
              </span>
              {info ? (
                <span className="flex flex-wrap gap-1">
                  {info.confirmed > 0 && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                      {info.confirmed}
                    </span>
                  )}
                  {info.pending > 0 && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      {info.pending}
                    </span>
                  )}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-ink-700">
        <span className="mr-3">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Deposit paid / confirmed
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />
          Pending payment
        </span>
      </p>
    </AdminCard>
  );
}

function Legend() {
  return (
    <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-700">
      {(
        [
          ["bg-amber-500", "Pending payment"],
          ["bg-wine-700", "Deposit paid"],
          ["bg-emerald-600", "Confirmed"],
          ["bg-ink-700", "Completed"],
        ] as const
      ).map(([color, text]) => (
        <span key={text}>
          <span className={`mr-1 inline-block h-2 w-2 rounded-full ${color}`} />
          {text}
        </span>
      ))}
    </p>
  );
}
