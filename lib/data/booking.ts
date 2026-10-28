import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type BookingDetails = {
  id: string;
  status: string;
  bookingDate: string;
  startTime: string;
  subtotalNgn: number;
  depositNgn: number;
  balanceNgn: number;
  serviceName: string;
  lengthLabel: string;
  addonNames: string[];
  clientName: string;
  clientEmail: string | null;
  clientPhone: string;
};

/** Fetches a single booking for the /book/[id] confirmation page.
 * There is no customer login, so the booking's UUID itself acts as the
 * access token -- anyone with the link (effectively just the customer who
 * just created it) can view this one booking's summary. Uses the
 * service-role client since `bookings` has no anon read policy. */
export async function getBookingById(id: string): Promise<BookingDetails | null> {
  const supabase = createAdminClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, status, booking_date, start_time, subtotal_ngn, deposit_ngn, balance_ngn, addon_ids, service_id, service_price_id, followup_service_price_id, client_id",
    )
    .eq("id", id)
    .single();

  if (error || !booking) return null;

  const [{ data: service }, { data: servicePrice }, { data: followup }, { data: client }, { data: addons }] =
    await Promise.all([
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
      supabase.from("clients").select("name, email, phone").eq("id", booking.client_id).single(),
      booking.addon_ids?.length
        ? supabase.from("addons").select("name").in("id", booking.addon_ids)
        : Promise.resolve({ data: [] as { name: string }[] }),
    ]);

  const serviceName = service?.name ?? "Service";
  // Many-to-one embed: PostgREST returns an object, not the array the untyped client assumes.
  const followupName = (followup?.services as unknown as { name: string } | null)?.name;

  return {
    id: booking.id,
    status: booking.status,
    bookingDate: booking.booking_date,
    startTime: booking.start_time,
    subtotalNgn: booking.subtotal_ngn,
    depositNgn: booking.deposit_ngn,
    balanceNgn: booking.balance_ngn,
    // Removal + new set reads as "Removal Service + Plain Gel X · Medium".
    serviceName: followupName ? `${serviceName} + ${followupName}` : serviceName,
    lengthLabel: (followupName ? followup?.length_label : servicePrice?.length_label) ?? "",
    addonNames: (addons ?? []).map((a) => a.name),
    clientName: client?.name ?? "",
    clientEmail: client?.email ?? null,
    clientPhone: client?.phone ?? "",
  };
}
