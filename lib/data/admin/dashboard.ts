import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInLagos } from "@/lib/availability";

const PAID_STATUSES = ["deposit_paid", "confirmed", "completed"];

export type ScheduleRow = {
  id: string;
  startTime: string;
  clientName: string;
  serviceName: string;
  status: string;
};

export type RecentBookingRow = {
  id: string;
  createdAt: string;
  clientName: string;
  serviceName: string;
  subtotalNgn: number;
  status: string;
};

export type PeriodStats = {
  appointments: number;
  revenueNgn: number;
  depositsNgn: number;
  mostBookedService: string;
  returningClients: number;
};

export type DashboardData = {
  today: {
    appointments: number;
    revenueNgn: number;
    depositsNgn: number;
    cancelled: number;
  };
  month: PeriodStats;
  year: PeriodStats;
  todaySchedule: ScheduleRow[];
  recentBookings: RecentBookingRow[];
};

type MinimalBooking = {
  service_id: string;
  client_id: string;
  status: string;
  subtotal_ngn: number;
  deposit_ngn: number;
};

/** Shared "month"/"year" aggregation: revenue, deposits, most-booked
 * service, and how many of this period's clients have booked before. */
async function summarizePeriod(
  supabase: ReturnType<typeof createAdminClient>,
  bookings: MinimalBooking[],
  serviceName: Map<string, string>,
): Promise<PeriodStats> {
  const serviceCounts = new Map<string, number>();
  for (const b of bookings) {
    serviceCounts.set(b.service_id, (serviceCounts.get(b.service_id) ?? 0) + 1);
  }
  let mostBookedServiceId: string | null = null;
  let mostBookedCount = 0;
  for (const [id, count] of serviceCounts) {
    if (count > mostBookedCount) {
      mostBookedCount = count;
      mostBookedServiceId = id;
    }
  }

  const periodClientIds = Array.from(new Set(bookings.map((b) => b.client_id)));
  let returningClients = 0;
  if (periodClientIds.length) {
    const { data: allClientBookings } = await supabase
      .from("bookings")
      .select("client_id")
      .in("client_id", periodClientIds);
    const counts = new Map<string, number>();
    for (const b of allClientBookings ?? []) {
      counts.set(b.client_id, (counts.get(b.client_id) ?? 0) + 1);
    }
    returningClients = Array.from(counts.values()).filter((c) => c > 1).length;
  }

  return {
    appointments: bookings.length,
    revenueNgn: bookings
      .filter((b) => ["confirmed", "completed"].includes(b.status))
      .reduce((sum, b) => sum + b.subtotal_ngn, 0),
    depositsNgn: bookings
      .filter((b) => PAID_STATUSES.includes(b.status))
      .reduce((sum, b) => sum + b.deposit_ngn, 0),
    mostBookedService: mostBookedServiceId ? (serviceName.get(mostBookedServiceId) ?? "—") : "—",
    returningClients,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createAdminClient();
  const today = todayInLagos();
  const [year, month] = today.slice(0, 7).split("-").map(Number);
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [todayBookingsRes, yearBookingsRes, recentRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, start_time, subtotal_ngn, deposit_ngn, status, client_id, service_id")
      .eq("booking_date", today),
    // The month's bookings are a subset of the year's -- fetch the whole
    // year once and slice it, rather than querying bookings twice.
    supabase
      .from("bookings")
      .select("id, booking_date, subtotal_ngn, deposit_ngn, status, client_id, service_id")
      .gte("booking_date", yearStart)
      .lte("booking_date", yearEnd),
    supabase
      .from("bookings")
      .select("id, created_at, subtotal_ngn, status, client_id, service_id")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const todayBookings = todayBookingsRes.data ?? [];
  const yearBookings = yearBookingsRes.data ?? [];
  const monthBookings = yearBookings.filter(
    (b) => b.booking_date >= monthStart && b.booking_date <= monthEnd,
  );
  const recent = recentRes.data ?? [];

  const clientIds = Array.from(
    new Set([...todayBookings, ...yearBookings, ...recent].map((b) => b.client_id)),
  );
  const serviceIds = Array.from(
    new Set([...todayBookings, ...yearBookings, ...recent].map((b) => b.service_id)),
  );

  const [clientsRes, servicesRes] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("id, name").in("id", clientIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    serviceIds.length
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const clientName = new Map((clientsRes.data ?? []).map((c) => [c.id, c.name]));
  const serviceName = new Map((servicesRes.data ?? []).map((s) => [s.id, s.name]));

  const [monthStats, yearStats] = await Promise.all([
    summarizePeriod(supabase, monthBookings, serviceName),
    summarizePeriod(supabase, yearBookings, serviceName),
  ]);

  return {
    today: {
      appointments: todayBookings.filter((b) => b.status !== "cancelled").length,
      revenueNgn: todayBookings.reduce((sum, b) => sum + b.subtotal_ngn, 0),
      depositsNgn: todayBookings
        .filter((b) => PAID_STATUSES.includes(b.status))
        .reduce((sum, b) => sum + b.deposit_ngn, 0),
      cancelled: todayBookings.filter((b) => b.status === "cancelled").length,
    },
    month: monthStats,
    year: yearStats,
    todaySchedule: todayBookings
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map((b) => ({
        id: b.id,
        startTime: b.start_time.slice(0, 5),
        clientName: clientName.get(b.client_id) ?? "—",
        serviceName: serviceName.get(b.service_id) ?? "—",
        status: b.status,
      })),
    recentBookings: recent.map((b) => ({
      id: b.id,
      createdAt: b.created_at,
      clientName: clientName.get(b.client_id) ?? "—",
      serviceName: serviceName.get(b.service_id) ?? "—",
      subtotalNgn: b.subtotal_ngn,
      status: b.status,
    })),
  };
}
