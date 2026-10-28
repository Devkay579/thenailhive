import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeAvailableSlots, nowInLagos, todayInLagos, type TimeInterval } from "@/lib/availability";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  servicePriceId: z.string().uuid(),
  // Removal bookings: the set done straight after removal, in the same slot.
  nextServicePriceId: z.string().uuid().optional(),
});

// Minimum lead time for a same-day booking.
const SAME_DAY_LEAD_MINUTES = 60;

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    date: request.nextUrl.searchParams.get("date"),
    servicePriceId: request.nextUrl.searchParams.get("servicePriceId"),
    nextServicePriceId: request.nextUrl.searchParams.get("nextServicePriceId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date or servicePriceId" }, { status: 400 });
  }

  const { date, servicePriceId, nextServicePriceId } = parsed.data;

  if (date < todayInLagos()) {
    return NextResponse.json({ slots: [] });
  }

  const supabase = createAdminClient();

  const priceIds = nextServicePriceId ? [servicePriceId, nextServicePriceId] : [servicePriceId];
  const { data: servicePrices, error: servicePriceError } = await supabase
    .from("service_prices")
    .select("duration_minutes")
    .in("id", priceIds)
    .eq("active", true);

  if (servicePriceError || !servicePrices || servicePrices.length !== new Set(priceIds).size) {
    return NextResponse.json({ error: "Unknown service option" }, { status: 404 });
  }

  const durationMinutes = servicePrices.reduce((sum, p) => sum + p.duration_minutes, 0);

  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();

  const [{ data: hours }, { data: blocked }, { data: bookings }] = await Promise.all([
    supabase
      .from("business_hours")
      .select("open_time, close_time, is_closed")
      .eq("weekday", weekday)
      .single(),
    supabase.from("blocked_slots").select("start_time, end_time").eq("date", date),
    supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("booking_date", date)
      .not("status", "in", "(cancelled,no_show)"),
  ]);

  if (!hours) {
    return NextResponse.json({ slots: [] });
  }

  const wholeDayBlocked = (blocked ?? []).some((b) => !b.start_time || !b.end_time);
  const blockedIntervals: TimeInterval[] = wholeDayBlocked
    ? []
    : (blocked ?? []).map((b) => ({ start: b.start_time!, end: b.end_time! }));

  const bookedIntervals: TimeInterval[] = (bookings ?? []).map((b) => ({
    start: b.start_time,
    end: b.end_time,
  }));

  const isToday = date === todayInLagos();
  const minStartMinutes = isToday
    ? (() => {
        const now = nowInLagos();
        return now.getUTCHours() * 60 + now.getUTCMinutes() + SAME_DAY_LEAD_MINUTES;
      })()
    : undefined;

  const slots = computeAvailableSlots({
    businessHours: {
      open_time: hours.open_time,
      close_time: hours.close_time,
      is_closed: hours.is_closed || wholeDayBlocked,
    },
    blockedIntervals,
    bookedIntervals,
    durationMinutes,
    minStartMinutes,
  });

  return NextResponse.json({ slots });
}
