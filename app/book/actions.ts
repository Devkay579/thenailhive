"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingAdminNotification, sendBookingReceivedEmail } from "@/lib/email/send";

const createBookingSchema = z.object({
  servicePriceId: z.string().uuid(),
  // Removal bookings only: the set done straight after removal.
  nextServicePriceId: z.string().uuid().nullable().optional(),
  addonIds: z.array(z.string().uuid()).default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email(),
  instagram: z.string().trim().max(60).optional().or(z.literal("")),
  inspirationPaths: z.array(z.string()).max(3).default([]),
  policyAccepted: z.literal(true),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateBookingInput = z.input<typeof createBookingSchema>;

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: "validation" | "slot_taken" | "unknown"; message: string };

function toTimeWithSeconds(time: string) {
  return time.length === 5 ? `${time}:00` : time;
}

function addMinutesToTime(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:00`;
}

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation", message: "Please check the form and try again." };
  }
  const data = parsed.data;
  const supabase = createAdminClient();

  const { data: servicePrice, error: servicePriceError } = await supabase
    .from("service_prices")
    .select("id, service_id, price_ngn, duration_minutes, active")
    .eq("id", data.servicePriceId)
    .single();

  if (servicePriceError || !servicePrice || !servicePrice.active) {
    return { ok: false, error: "validation", message: "That service option is no longer available." };
  }

  let nextServicePrice: { id: string; price_ngn: number; duration_minutes: number } | null = null;
  if (data.nextServicePriceId) {
    const [{ data: service }, { data: nextPrice }] = await Promise.all([
      supabase.from("services").select("slug").eq("id", servicePrice.service_id).single(),
      supabase
        .from("service_prices")
        .select("id, service_id, price_ngn, duration_minutes, active")
        .eq("id", data.nextServicePriceId)
        .single(),
    ]);

    if (
      service?.slug !== "removal" ||
      !nextPrice ||
      !nextPrice.active ||
      nextPrice.service_id === servicePrice.service_id
    ) {
      return { ok: false, error: "validation", message: "That service option is no longer available." };
    }
    nextServicePrice = nextPrice;
  }

  let addonTotal = 0;
  if (data.addonIds.length > 0) {
    const { data: addonRows, error: addonError } = await supabase
      .from("addons")
      .select("id, price_ngn, active")
      .in("id", data.addonIds);

    if (addonError || !addonRows || addonRows.some((a) => !a.active)) {
      return { ok: false, error: "validation", message: "One of the selected extras is no longer available." };
    }
    addonTotal = addonRows.reduce((sum, a) => sum + a.price_ngn, 0);
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("deposit_percent")
    .eq("id", 1)
    .single();
  const depositPercent = settings?.deposit_percent ?? 20;

  const subtotal = servicePrice.price_ngn + (nextServicePrice?.price_ngn ?? 0) + addonTotal;
  const deposit = Math.round((subtotal * depositPercent) / 100);
  const balance = subtotal - deposit;

  const startTime = toTimeWithSeconds(data.startTime);
  const endTime = addMinutesToTime(
    startTime,
    servicePrice.duration_minutes + (nextServicePrice?.duration_minutes ?? 0),
  );

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .upsert(
      {
        name: data.name,
        phone: data.phone,
        whatsapp: data.phone,
        email: data.email,
        instagram: data.instagram || null,
      },
      { onConflict: "phone" },
    )
    .select("id")
    .single();

  if (clientError || !client) {
    return { ok: false, error: "unknown", message: "Could not save your details. Please try again." };
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      client_id: client.id,
      service_id: servicePrice.service_id,
      service_price_id: servicePrice.id,
      followup_service_price_id: nextServicePrice?.id ?? null,
      addon_ids: data.addonIds,
      booking_date: data.date,
      start_time: startTime,
      end_time: endTime,
      subtotal_ngn: subtotal,
      deposit_ngn: deposit,
      balance_ngn: balance,
      status: "pending_payment",
      inspiration_image_urls: data.inspirationPaths,
      policy_accepted_at: new Date().toISOString(),
      notes: data.notes || null,
    })
    .select("id")
    .single();

  if (bookingError) {
    // 23P01 = exclusion_violation -> the time_range overlap constraint fired.
    if (bookingError.code === "23P01") {
      return {
        ok: false,
        error: "slot_taken",
        message: "That time was just booked by someone else. Please pick another slot.",
      };
    }
    return { ok: false, error: "unknown", message: "Something went wrong creating your booking." };
  }

  // Best-effort -- a failed email should never block a successful booking.
  const [clientEmail, adminEmail] = await Promise.allSettled([
    sendBookingReceivedEmail(booking.id),
    sendBookingAdminNotification(booking.id, "new"),
  ]);
  if (clientEmail.status === "rejected") console.error("Failed to send booking-received email", clientEmail.reason);
  if (adminEmail.status === "rejected") console.error("Failed to send new-booking admin email", adminEmail.reason);

  return { ok: true, bookingId: booking.id };
}
