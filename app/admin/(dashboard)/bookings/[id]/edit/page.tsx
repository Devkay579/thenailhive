import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingDetail, getBookingFormOptions } from "@/lib/data/admin/bookings";
import { AdminPageHeader } from "@/components/admin/ui";
import { BookingForm } from "@/components/admin/BookingForm";

export default async function AdminEditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBookingDetail(id);
  if (!booking) notFound();

  const keepIds = [booking.servicePriceId, booking.followupServicePriceId, ...booking.addonIds].filter(
    Boolean,
  ) as string[];
  const { services, addons, depositPercent } = await getBookingFormOptions(keepIds);

  return (
    <div className="space-y-6">
      <Link href={`/admin/bookings/${booking.id}`} className="text-sm text-ink-700 hover:text-wine-900">
        &larr; Back to booking
      </Link>
      <AdminPageHeader
        title="Edit booking"
        sub={
          <>
            {booking.clientName} &middot; Ref <span className="font-mono">{booking.bookingRef}</span>
          </>
        }
      />
      <BookingForm
        mode="edit"
        bookingId={booking.id}
        services={services}
        addons={addons}
        depositPercent={depositPercent}
        paidDepositNgn={booking.depositPaidAt ? booking.depositNgn : null}
        initial={{
          servicePriceId: booking.servicePriceId,
          followupServicePriceId: booking.followupServicePriceId,
          addonIds: booking.addonIds,
          date: booking.bookingDate,
          startTime: booking.startTime,
          notes: booking.notes ?? "",
        }}
      />
    </div>
  );
}
