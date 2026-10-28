import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type DayBookings = {
  date: string;
  total: number;
  pending: number;
  confirmed: number;
};

export async function getMonthBookings(monthStart: string, monthEnd: string): Promise<Map<string, DayBookings>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("booking_date, status")
    .gte("booking_date", monthStart)
    .lte("booking_date", monthEnd);

  if (error) throw error;

  const map = new Map<string, DayBookings>();
  for (const b of data ?? []) {
    const entry = map.get(b.booking_date) ?? { date: b.booking_date, total: 0, pending: 0, confirmed: 0 };
    entry.total += 1;
    if (b.status === "pending_payment") entry.pending += 1;
    if (b.status === "confirmed" || b.status === "deposit_paid" || b.status === "completed") entry.confirmed += 1;
    map.set(b.booking_date, entry);
  }
  return map;
}

export type CalendarBooking = {
  id: string;
  date: string;
  startTime: string; // "HH:MM"
  endTime: string;
  clientName: string;
  serviceName: string;
  status: string;
  depositPaid: boolean;
};

export type CalendarBlock = {
  id: string;
  date: string;
  startTime: string | null; // null = whole day blocked
  endTime: string | null;
  reason: string | null;
};

/** Bookings and blocked time between two dates (inclusive), for the
 * calendar's day and week views. Cancelled bookings and no-shows are left
 * out -- they no longer hold the chair. */
export async function getCalendarEntries(
  start: string,
  end: string,
): Promise<{ bookings: CalendarBooking[]; blocks: CalendarBlock[] }> {
  const supabase = createAdminClient();

  const [{ data: bookings, error: bErr }, { data: blocks, error: blErr }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, booking_date, start_time, end_time, status, deposit_paid_at, client_id, service_id, followup_service_price_id",
      )
      .gte("booking_date", start)
      .lte("booking_date", end)
      .not("status", "in", "(cancelled,no_show)")
      .order("booking_date")
      .order("start_time"),
    supabase
      .from("blocked_slots")
      .select("id, date, start_time, end_time, reason")
      .gte("date", start)
      .lte("date", end)
      .order("date")
      .order("start_time"),
  ]);
  if (bErr) throw bErr;
  if (blErr) throw blErr;

  const rows = bookings ?? [];
  const clientIds = Array.from(new Set(rows.map((b) => b.client_id)));
  const serviceIds = Array.from(new Set(rows.map((b) => b.service_id)));
  const followupIds = rows.map((b) => b.followup_service_price_id).filter(Boolean) as string[];

  const [{ data: clients }, { data: services }, { data: followups }] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("id, name").in("id", clientIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    serviceIds.length
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    followupIds.length
      ? supabase.from("service_prices").select("id, services(name)").in("id", followupIds)
      : Promise.resolve({ data: [] as { id: string; services: unknown }[] }),
  ]);

  const clientMap = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s.name]));
  // Many-to-one embed: PostgREST returns an object, not the array the untyped client assumes.
  const followupMap = new Map(
    (followups ?? []).map((f) => [f.id, (f.services as unknown as { name: string } | null)?.name ?? ""]),
  );

  return {
    bookings: rows.map((b) => {
      const serviceName = serviceMap.get(b.service_id) ?? "—";
      const followupName = b.followup_service_price_id ? followupMap.get(b.followup_service_price_id) : "";
      return {
        id: b.id,
        date: b.booking_date,
        startTime: b.start_time.slice(0, 5),
        endTime: b.end_time.slice(0, 5),
        clientName: clientMap.get(b.client_id) ?? "—",
        serviceName: followupName ? `${serviceName} + ${followupName}` : serviceName,
        status: b.status,
        depositPaid: Boolean(b.deposit_paid_at),
      };
    }),
    blocks: (blocks ?? []).map((b) => ({
      id: b.id,
      date: b.date,
      startTime: b.start_time?.slice(0, 5) ?? null,
      endTime: b.end_time?.slice(0, 5) ?? null,
      reason: b.reason,
    })),
  };
}
