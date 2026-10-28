import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const CLIENTS_PAGE_SIZE = 20;

export type ClientListRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  bookingCount: number;
  lastBookingDate: string | null;
};

export type ClientsPage = {
  rows: ClientListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getClientsAdmin(search?: string, page = 1, pageSize = CLIENTS_PAGE_SIZE): Promise<ClientsPage> {
  const supabase = createAdminClient();
  const safePage = Math.max(1, page);
  const term = search?.trim();

  let query = supabase
    .from("clients")
    .select("id, name, phone, email", { count: "exact" })
    .order("created_at", { ascending: false });
  if (term) {
    query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data: clients, error, count } = await query.range(from, to);

  // PGRST103 = page past the end (stale ?page= after searching); report the
  // real total so the page can redirect to the last page.
  if (error?.code === "PGRST103") {
    let countQuery = supabase.from("clients").select("id", { count: "exact", head: true });
    if (term) countQuery = countQuery.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
    const { count: realTotal } = await countQuery;
    const total = realTotal ?? 0;
    return { rows: [], total, page: safePage, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }
  if (error) throw error;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (!clients || clients.length === 0) {
    return { rows: [], total, page: safePage, pageSize, totalPages };
  }

  const clientIds = clients.map((c) => c.id);
  const { data: bookings } = await supabase
    .from("bookings")
    .select("client_id, booking_date")
    .in("client_id", clientIds);

  const stats = new Map<string, { count: number; last: string | null }>();
  for (const b of bookings ?? []) {
    const entry = stats.get(b.client_id) ?? { count: 0, last: null };
    entry.count += 1;
    if (!entry.last || b.booking_date > entry.last) entry.last = b.booking_date;
    stats.set(b.client_id, entry);
  }

  const rows = clients.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    bookingCount: stats.get(c.id)?.count ?? 0,
    lastBookingDate: stats.get(c.id)?.last ?? null,
  }));

  return { rows, total, page: safePage, pageSize, totalPages };
}

export type ClientDetail = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  instagram: string | null;
  createdAt: string;
  bookings: {
    id: string;
    bookingDate: string;
    startTime: string;
    serviceName: string;
    subtotalNgn: number;
    status: string;
  }[];
};

export async function getClientDetail(id: string): Promise<ClientDetail | null> {
  const supabase = createAdminClient();
  const { data: client, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error || !client) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, start_time, subtotal_ngn, status, service_id")
    .eq("client_id", id)
    .order("booking_date", { ascending: false });

  const serviceIds = Array.from(new Set((bookings ?? []).map((b) => b.service_id)));
  const { data: services } = serviceIds.length
    ? await supabase.from("services").select("id, name").in("id", serviceIds)
    : { data: [] as { id: string; name: string }[] };
  const serviceName = new Map((services ?? []).map((s) => [s.id, s.name]));

  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    instagram: client.instagram,
    createdAt: client.created_at,
    bookings: (bookings ?? []).map((b) => ({
      id: b.id,
      bookingDate: b.booking_date,
      startTime: b.start_time.slice(0, 5),
      serviceName: serviceName.get(b.service_id) ?? "—",
      subtotalNgn: b.subtotal_ngn,
      status: b.status,
    })),
  };
}
