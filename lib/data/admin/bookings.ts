import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingStatus, PaymentMethod } from "@/lib/supabase/types";

export const BOOKINGS_PAGE_SIZE = 20;

export type BookingListRow = {
  id: string;
  bookingRef: string;
  bookingDate: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  lengthLabel: string;
  subtotalNgn: number;
  depositNgn: number;
  balanceNgn: number;
  depositPaid: boolean;
  status: BookingStatus;
};

export type BookingsPage = {
  rows: BookingListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type BookingFilters = { status?: string; date?: string; search?: string };

/** The PostgREST `or` clause for a search term: booking reference, or any
 * client whose name/phone matches. Resolved once and reused across queries. */
async function searchClause(supabase: ReturnType<typeof createAdminClient>, search?: string) {
  const term = search?.trim();
  if (!term) return null;
  const { data: matchedClients } = await supabase
    .from("clients")
    .select("id")
    .or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
  const clientIds = (matchedClients ?? []).map((c) => c.id);

  const orParts = [`booking_ref.ilike.%${term}%`];
  if (clientIds.length) orParts.push(`client_id.in.(${clientIds.join(",")})`);
  return orParts.join(",");
}

export const BOOKING_STATUSES: BookingStatus[] = [
  "pending_payment",
  "deposit_paid",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

/** Count per status (plus "all") under the date/search filters, for the
 * status tabs on the bookings list. */
export async function getBookingStatusCounts(filters?: BookingFilters): Promise<Record<string, number>> {
  const supabase = createAdminClient();
  const search = await searchClause(supabase, filters?.search);

  const countFor = async (status?: BookingStatus) => {
    let q = supabase.from("bookings").select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    if (filters?.date) q = q.eq("booking_date", filters.date);
    if (search) q = q.or(search);
    const { count } = await q;
    return count ?? 0;
  };

  const counts = await Promise.all([countFor(), ...BOOKING_STATUSES.map((s) => countFor(s))]);
  return Object.fromEntries([["all", counts[0]], ...BOOKING_STATUSES.map((s, i) => [s, counts[i + 1]])]);
}

export async function getBookings(
  filters?: BookingFilters,
  page = 1,
  pageSize = BOOKINGS_PAGE_SIZE,
): Promise<BookingsPage> {
  const supabase = createAdminClient();
  const safePage = Math.max(1, page);

  let query = supabase
    .from("bookings")
    .select(
      "id, booking_ref, booking_date, start_time, subtotal_ngn, deposit_ngn, balance_ngn, deposit_paid_at, status, client_id, service_id, service_price_id, followup_service_price_id",
      { count: "exact" },
    )
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.date) query = query.eq("booking_date", filters.date);

  const search = await searchClause(supabase, filters?.search);
  if (search) query = query.or(search);

  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: bookings, error, count } = await query.range(from, to);

  // PGRST103 = asked for a page past the end (stale ?page= after filtering).
  // Return the real total so the page can send the user to the last page.
  if (error?.code === "PGRST103") {
    const counts = await getBookingStatusCounts(filters);
    const total = filters?.status ? (counts[filters.status] ?? 0) : counts.all;
    return { rows: [], total, page: safePage, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }
  if (error) throw error;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (!bookings || bookings.length === 0) {
    return { rows: [], total, page: safePage, pageSize, totalPages };
  }

  const clientIds = Array.from(new Set(bookings.map((b) => b.client_id)));
  const serviceIds = Array.from(new Set(bookings.map((b) => b.service_id)));
  const priceIds = Array.from(
    new Set(bookings.flatMap((b) => [b.service_price_id, b.followup_service_price_id]).filter(Boolean)),
  ) as string[];

  const [{ data: clients }, { data: services }, { data: prices }] = await Promise.all([
    supabase.from("clients").select("id, name, phone").in("id", clientIds),
    supabase.from("services").select("id, name").in("id", serviceIds),
    priceIds.length
      ? supabase.from("service_prices").select("id, length_label, services(name)").in("id", priceIds)
      : Promise.resolve({ data: [] as { id: string; length_label: string; services: unknown }[] }),
  ]);

  const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s.name]));
  const priceMap = new Map(
    (prices ?? []).map((p) => [
      p.id,
      { lengthLabel: p.length_label, serviceName: (p.services as { name: string } | null)?.name ?? "" },
    ]),
  );

  const rows: BookingListRow[] = bookings.map((b) => {
    const client = clientMap.get(b.client_id);
    const serviceName = serviceMap.get(b.service_id) ?? "—";
    const followup = b.followup_service_price_id ? priceMap.get(b.followup_service_price_id) : undefined;
    return {
      id: b.id,
      bookingRef: b.booking_ref,
      bookingDate: b.booking_date,
      startTime: b.start_time.slice(0, 5),
      clientName: client?.name ?? "—",
      clientPhone: client?.phone ?? "",
      serviceName: followup ? `${serviceName} + ${followup.serviceName}` : serviceName,
      lengthLabel: followup
        ? followup.lengthLabel
        : b.service_price_id
          ? (priceMap.get(b.service_price_id)?.lengthLabel ?? "")
          : "",
      subtotalNgn: b.subtotal_ngn,
      depositNgn: b.deposit_ngn,
      balanceNgn: b.balance_ngn,
      depositPaid: Boolean(b.deposit_paid_at),
      status: b.status as BookingStatus,
    };
  });

  return { rows, total, page: safePage, pageSize, totalPages };
}

export type BookingDetail = BookingListRow & {
  clientEmail: string | null;
  clientInstagram: string | null;
  addonNames: string[];
  notes: string | null;
  inspirationUrls: string[];
  createdAt: string;
  endTime: string;
  servicePriceId: string | null;
  followupServicePriceId: string | null;
  addonIds: string[];
  depositPaidAt: string | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
};

export async function getBookingDetail(id: string): Promise<BookingDetail | null> {
  const supabase = createAdminClient();

  const { data: booking, error } = await supabase.from("bookings").select("*").eq("id", id).single();
  if (error || !booking) return null;

  const [{ data: client }, { data: service }, { data: price }, { data: followup }, { data: addons }] = await Promise.all([
    supabase.from("clients").select("name, phone, email, instagram").eq("id", booking.client_id).single(),
    supabase.from("services").select("name").eq("id", booking.service_id).single(),
    booking.service_price_id
      ? supabase.from("service_prices").select("length_label").eq("id", booking.service_price_id).single()
      : Promise.resolve({ data: null }),
    booking.followup_service_price_id
      ? supabase
          .from("service_prices")
          .select("length_label, services(name)")
          .eq("id", booking.followup_service_price_id)
          .single()
      : Promise.resolve({ data: null }),
    booking.addon_ids?.length
      ? supabase.from("addons").select("name").in("id", booking.addon_ids)
      : Promise.resolve({ data: [] as { name: string }[] }),
  ]);

  let inspirationUrls: string[] = [];
  if (booking.inspiration_image_urls?.length) {
    const { data: signed } = await supabase.storage
      .from("inspiration-photos")
      .createSignedUrls(booking.inspiration_image_urls, 60 * 60);
    inspirationUrls = (signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[];
  }

  const serviceName = service?.name ?? "—";
  // Many-to-one embed: PostgREST returns an object, not the array the untyped client assumes.
  const followupName = (followup?.services as unknown as { name: string } | null)?.name;

  return {
    id: booking.id,
    bookingRef: booking.booking_ref,
    bookingDate: booking.booking_date,
    startTime: booking.start_time.slice(0, 5),
    clientName: client?.name ?? "—",
    clientPhone: client?.phone ?? "",
    clientEmail: client?.email ?? null,
    clientInstagram: client?.instagram ?? null,
    serviceName: followupName ? `${serviceName} + ${followupName}` : serviceName,
    lengthLabel: (followupName ? followup?.length_label : price?.length_label) ?? "",
    subtotalNgn: booking.subtotal_ngn,
    depositNgn: booking.deposit_ngn,
    balanceNgn: booking.balance_ngn,
    depositPaid: Boolean(booking.deposit_paid_at),
    status: booking.status as BookingStatus,
    addonNames: (addons ?? []).map((a) => a.name),
    notes: booking.notes,
    inspirationUrls,
    createdAt: booking.created_at,
    endTime: booking.end_time.slice(0, 5),
    servicePriceId: booking.service_price_id,
    followupServicePriceId: booking.followup_service_price_id,
    addonIds: booking.addon_ids ?? [],
    depositPaidAt: booking.deposit_paid_at ?? null,
    paymentMethod: booking.payment_method ?? null,
    paymentReference: booking.payment_reference ?? null,
  };
}

export type BookingFormService = {
  id: string;
  slug: string;
  name: string;
  prices: { id: string; lengthLabel: string; priceNgn: number; durationMinutes: number }[];
};

export type BookingFormAddon = { id: string; name: string; priceNgn: number; suffix: string | null };

/** Services, price tiers and extras for the admin create/edit booking form.
 * Inactive options are left out unless listed in `keepIds` (an edited
 * booking's current choices), so old bookings still show what was booked. */
export async function getBookingFormOptions(keepIds: string[] = []): Promise<{
  services: BookingFormService[];
  addons: BookingFormAddon[];
  depositPercent: number;
}> {
  const supabase = createAdminClient();
  const keep = new Set(keepIds);

  const [{ data: services, error: sErr }, { data: prices, error: pErr }, { data: addons, error: aErr }, { data: settings }] =
    await Promise.all([
      supabase.from("services").select("id, slug, name, active").order("sort_order"),
      supabase
        .from("service_prices")
        .select("id, service_id, length_label, price_ngn, duration_minutes, active")
        .order("sort_order"),
      supabase.from("addons").select("id, name, price_ngn, suffix, active").order("sort_order"),
      supabase.from("settings").select("deposit_percent").eq("id", 1).single(),
    ]);
  if (sErr) throw sErr;
  if (pErr) throw pErr;
  if (aErr) throw aErr;

  const visiblePrices = (prices ?? []).filter((p) => p.active || keep.has(p.id));

  return {
    services: (services ?? [])
      .map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        prices: visiblePrices
          .filter((p) => p.service_id === s.id)
          .map((p) => ({
            id: p.id,
            lengthLabel: p.length_label,
            priceNgn: p.price_ngn,
            durationMinutes: p.duration_minutes,
          })),
      }))
      .filter((s) => {
        const active = services?.find((row) => row.id === s.id)?.active;
        return s.prices.length > 0 && (active || s.prices.some((p) => keep.has(p.id)));
      }),
    addons: (addons ?? [])
      .filter((a) => a.active || keep.has(a.id))
      .map((a) => ({ id: a.id, name: a.name, priceNgn: a.price_ngn, suffix: a.suffix })),
    depositPercent: settings?.deposit_percent ?? 20,
  };
}
