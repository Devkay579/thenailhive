"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingAdminNotification, sendBookingConfirmedEmail, sendBookingReceivedEmail } from "@/lib/email/send";
import type { BookingStatus } from "@/lib/supabase/types";

export type ActionResult = { ok: true } | { ok: false; message: string };

type AdminClient = ReturnType<typeof createAdminClient>;

function revalidateBooking(bookingId?: string) {
  revalidatePath("/admin/bookings");
  if (bookingId) revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
  if (error) return { ok: false, message: "Could not update the booking." };

  // Confirming means the deposit came in -- stamp it if it wasn't recorded
  // separately, so payment history isn't left blank.
  if (status === "confirmed" || status === "deposit_paid") {
    await supabase
      .from("bookings")
      .update({ deposit_paid_at: new Date().toISOString() })
      .eq("id", bookingId)
      .is("deposit_paid_at", null);
  }

  if (status === "confirmed") {
    const [clientEmail, adminEmail] = await Promise.allSettled([
      sendBookingConfirmedEmail(bookingId),
      sendBookingAdminNotification(bookingId, "confirmed"),
    ]);
    if (clientEmail.status === "rejected") console.error("Failed to send booking-confirmed email", clientEmail.reason);
    if (adminEmail.status === "rejected") console.error("Failed to send booking-confirmed admin email", adminEmail.reason);
  }

  revalidateBooking(bookingId);
  return { ok: true };
}

/** Permanently removes a booking (and its inspiration photos). The client
 * record is kept -- it may have other bookings. No email is sent; cancel
 * first if the client should be told. */
export async function deleteBooking(bookingId: string): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("inspiration_image_urls")
    .eq("id", bookingId)
    .single();

  const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
  if (error) {
    console.error("Booking delete failed:", error);
    return { ok: false, message: "Could not delete the booking." };
  }

  const photoPaths: string[] = booking?.inspiration_image_urls ?? [];
  if (photoPaths.length > 0) {
    const { error: storageError } = await supabase.storage.from("inspiration-photos").remove(photoPaths);
    if (storageError) console.error("Failed to remove inspiration photos for deleted booking", storageError);
  }

  revalidateBooking(bookingId);
  revalidatePath("/admin/clients", "layout");
  return { ok: true };
}

function addMinutesToTime(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60).toString().padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:00`;
}

function toTimeWithSeconds(time: string) {
  return time.length === 5 ? `${time}:00` : time;
}

export async function rescheduleBooking(
  bookingId: string,
  date: string,
  startTime: string,
): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("service_price_id, followup_service_price_id")
    .eq("id", bookingId)
    .single();
  if (fetchError || !booking) return { ok: false, message: "Booking not found." };

  let durationMinutes = 60;
  const priceIds = [booking.service_price_id, booking.followup_service_price_id].filter(Boolean) as string[];
  if (priceIds.length) {
    const { data: prices } = await supabase
      .from("service_prices")
      .select("duration_minutes")
      .in("id", priceIds);
    if (prices?.length) durationMinutes = prices.reduce((sum, p) => sum + p.duration_minutes, 0);
  }

  const start = toTimeWithSeconds(startTime);
  const end = addMinutesToTime(start, durationMinutes);

  const { error } = await supabase
    .from("bookings")
    .update({ booking_date: date, start_time: start, end_time: end })
    .eq("id", bookingId);

  if (error) {
    if (error.code === "23P01") {
      return { ok: false, message: "That time slot is already booked." };
    }
    return { ok: false, message: "Could not reschedule the booking." };
  }

  revalidateBooking(bookingId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Admin-created and edited bookings (walk-ins, DM/WhatsApp bookings, changes
// agreed with the client). Unlike the public flow these may be placed
// outside business hours -- only the DB overlap constraint is enforced.
// ---------------------------------------------------------------------------

const appointmentSchema = z.object({
  servicePriceId: z.string().uuid(),
  followupServicePriceId: z.string().uuid().nullable().optional(),
  addonIds: z.array(z.string().uuid()).default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const createSchema = appointmentSchema.extend({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().optional().or(z.literal("")),
  instagram: z.string().trim().max(60).optional().or(z.literal("")),
  status: z.enum(["pending_payment", "confirmed"]),
  notifyClient: z.boolean().default(false),
});

export type AdminAppointmentInput = z.input<typeof appointmentSchema>;
export type AdminCreateBookingInput = z.input<typeof createSchema>;

type Priced = {
  serviceId: string;
  subtotal: number;
  durationMinutes: number;
};

/** Prices an appointment from the DB (never trusts client-side totals).
 * `allowIds` lets an edit keep a price tier or extra that has since been
 * deactivated, so old bookings can still be saved. */
async function priceAppointment(
  supabase: AdminClient,
  input: z.output<typeof appointmentSchema>,
  allowIds: Set<string> = new Set(),
): Promise<{ ok: true; priced: Priced } | { ok: false; message: string }> {
  const priceIds = [input.servicePriceId, input.followupServicePriceId].filter(Boolean) as string[];
  const { data: prices } = await supabase
    .from("service_prices")
    .select("id, service_id, price_ngn, duration_minutes, active, services(slug)")
    .in("id", priceIds);

  const main = prices?.find((p) => p.id === input.servicePriceId);
  const followup = input.followupServicePriceId
    ? prices?.find((p) => p.id === input.followupServicePriceId)
    : null;
  const usable = (p: { id: string; active: boolean }) => p.active || allowIds.has(p.id);

  if (!main || !usable(main)) return { ok: false, message: "That service option is no longer available." };
  if (input.followupServicePriceId) {
    // Many-to-one embed: PostgREST returns an object, not the array the untyped client assumes.
    const mainSlug = (main.services as unknown as { slug: string } | null)?.slug;
    if (!followup || !usable(followup) || mainSlug !== "removal" || followup.service_id === main.service_id) {
      return { ok: false, message: "A follow-up set can only be added after a removal." };
    }
  }

  let addonTotal = 0;
  if (input.addonIds.length) {
    const { data: addons } = await supabase.from("addons").select("id, price_ngn, active").in("id", input.addonIds);
    if (!addons || addons.length !== input.addonIds.length || addons.some((a) => !usable(a))) {
      return { ok: false, message: "One of the selected extras is no longer available." };
    }
    addonTotal = addons.reduce((sum, a) => sum + a.price_ngn, 0);
  }

  return {
    ok: true,
    priced: {
      serviceId: main.service_id,
      subtotal: main.price_ngn + (followup?.price_ngn ?? 0) + addonTotal,
      durationMinutes: main.duration_minutes + (followup?.duration_minutes ?? 0),
    },
  };
}

async function getDepositPercent(supabase: AdminClient) {
  const { data } = await supabase.from("settings").select("deposit_percent").eq("id", 1).single();
  return data?.deposit_percent ?? 20;
}

export async function createAdminBooking(
  input: AdminCreateBookingInput,
): Promise<{ ok: true; bookingId: string } | { ok: false; message: string }> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the form and try again." };
  const data = parsed.data;
  const supabase = createAdminClient();

  const pricing = await priceAppointment(supabase, data);
  if (!pricing.ok) return pricing;
  const { priced } = pricing;

  // Match an existing client by phone, but never blank out details they
  // gave before just because this form left them empty.
  const { data: existing } = await supabase.from("clients").select("id").eq("phone", data.phone).maybeSingle();
  let clientId = existing?.id as string | undefined;
  if (clientId) {
    await supabase
      .from("clients")
      .update({
        name: data.name,
        ...(data.email ? { email: data.email } : {}),
        ...(data.instagram ? { instagram: data.instagram } : {}),
      })
      .eq("id", clientId);
  } else {
    const { data: created, error } = await supabase
      .from("clients")
      .insert({
        name: data.name,
        phone: data.phone,
        whatsapp: data.phone,
        email: data.email || null,
        instagram: data.instagram || null,
      })
      .select("id")
      .single();
    if (error || !created) return { ok: false, message: "Could not save the client's details." };
    clientId = created.id;
  }

  const depositPercent = await getDepositPercent(supabase);
  const deposit = Math.round((priced.subtotal * depositPercent) / 100);
  const startTime = toTimeWithSeconds(data.startTime);

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      client_id: clientId,
      service_id: priced.serviceId,
      service_price_id: data.servicePriceId,
      followup_service_price_id: data.followupServicePriceId ?? null,
      addon_ids: data.addonIds,
      booking_date: data.date,
      start_time: startTime,
      end_time: addMinutesToTime(startTime, priced.durationMinutes),
      subtotal_ngn: priced.subtotal,
      deposit_ngn: deposit,
      balance_ngn: priced.subtotal - deposit,
      status: data.status,
      deposit_paid_at: data.status === "confirmed" ? new Date().toISOString() : null,
      notes: data.notes || null,
    })
    .select("id")
    .single();

  if (error || !booking) {
    if (error?.code === "23P01") return { ok: false, message: "That time overlaps another booking." };
    return { ok: false, message: "Could not create the booking." };
  }

  if (data.notifyClient && data.email) {
    try {
      if (data.status === "confirmed") await sendBookingConfirmedEmail(booking.id);
      else await sendBookingReceivedEmail(booking.id);
    } catch (err) {
      console.error("Failed to send admin-booking email", err);
    }
  }

  revalidateBooking();
  revalidatePath("/admin/clients");
  return { ok: true, bookingId: booking.id };
}

export async function updateAdminBooking(
  bookingId: string,
  input: AdminAppointmentInput,
): Promise<ActionResult> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the form and try again." };
  const data = parsed.data;
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("bookings")
    .select("service_price_id, followup_service_price_id, addon_ids, deposit_ngn, deposit_paid_at")
    .eq("id", bookingId)
    .single();
  if (!current) return { ok: false, message: "Booking not found." };

  const keep = new Set<string>(
    [current.service_price_id, current.followup_service_price_id, ...(current.addon_ids ?? [])].filter(Boolean),
  );
  const pricing = await priceAppointment(supabase, data, keep);
  if (!pricing.ok) return pricing;
  const { priced } = pricing;

  // A deposit that's already been paid stays what was paid; only the
  // balance moves with the new total.
  const deposit = current.deposit_paid_at
    ? current.deposit_ngn
    : Math.round((priced.subtotal * (await getDepositPercent(supabase))) / 100);
  const startTime = toTimeWithSeconds(data.startTime);

  const { error } = await supabase
    .from("bookings")
    .update({
      service_id: priced.serviceId,
      service_price_id: data.servicePriceId,
      followup_service_price_id: data.followupServicePriceId ?? null,
      addon_ids: data.addonIds,
      booking_date: data.date,
      start_time: startTime,
      end_time: addMinutesToTime(startTime, priced.durationMinutes),
      subtotal_ngn: priced.subtotal,
      deposit_ngn: deposit,
      balance_ngn: Math.max(0, priced.subtotal - deposit),
      notes: data.notes || null,
    })
    .eq("id", bookingId);

  if (error) {
    if (error.code === "23P01") return { ok: false, message: "That time overlaps another booking." };
    return { ok: false, message: "Could not save the booking." };
  }

  revalidateBooking(bookingId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Deposit payment record
// ---------------------------------------------------------------------------

const depositSchema = z.object({
  method: z.enum(["bank_transfer", "cash", "pos", "other"]),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  // <input type="datetime-local"> value, entered in Lagos time (UTC+1, no DST).
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
});

export async function recordDeposit(bookingId: string, formData: FormData): Promise<ActionResult> {
  const parsed = depositSchema.safeParse({
    method: formData.get("method"),
    reference: formData.get("reference") ?? "",
    paidAt: formData.get("paidAt"),
  });
  if (!parsed.success) return { ok: false, message: "Please choose a payment method and date." };

  const supabase = createAdminClient();
  const { data: booking } = await supabase.from("bookings").select("status").eq("id", bookingId).single();
  if (!booking) return { ok: false, message: "Booking not found." };

  const { error } = await supabase
    .from("bookings")
    .update({
      deposit_paid_at: new Date(`${parsed.data.paidAt}:00+01:00`).toISOString(),
      payment_method: parsed.data.method,
      payment_reference: parsed.data.reference || null,
      // Recording the money moves a waiting booking along; anything further
      // along (confirmed, completed...) keeps its status.
      ...(booking.status === "pending_payment" ? { status: "deposit_paid" } : {}),
    })
    .eq("id", bookingId);
  if (error) return { ok: false, message: "Could not save the payment." };

  revalidateBooking(bookingId);
  return { ok: true };
}

export async function clearDeposit(bookingId: string): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({ deposit_paid_at: null, payment_method: null, payment_reference: null })
    .eq("id", bookingId);
  if (error) return { ok: false, message: "Could not clear the payment." };

  revalidateBooking(bookingId);
  return { ok: true };
}
