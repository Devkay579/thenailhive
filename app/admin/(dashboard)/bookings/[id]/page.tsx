import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getBookingDetail } from "@/lib/data/admin/bookings";
import { AdminCard, StatusBadge, secondaryButtonClass } from "@/components/admin/ui";
import { BookingActions } from "@/components/admin/BookingActions";
import { PaymentPanel } from "@/components/admin/PaymentPanel";
import { DeleteBookingButton } from "@/components/admin/DeleteBookingButton";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBookingDetail(id);
  if (!booking) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/bookings" className="text-sm text-ink-700 hover:text-wine-900">
          &larr; Back to bookings
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">{booking.clientName}</h1>
          <StatusBadge status={booking.status} />
          <Link href={`/admin/bookings/${booking.id}/edit`} className={`${secondaryButtonClass} ml-auto h-9`}>
            Edit booking
          </Link>
        </div>
        <p className="text-sm text-ink-700">
          {booking.bookingDate} at {booking.startTime}–{booking.endTime} &middot; Ref:{" "}
          <span className="font-mono">{booking.bookingRef}</span>
        </p>
      </div>

      <AdminCard title="Actions">
        <BookingActions bookingId={booking.id} status={booking.status} />
      </AdminCard>

      <AdminCard title="Payment">
        <PaymentPanel
          bookingId={booking.id}
          subtotalNgn={booking.subtotalNgn}
          depositNgn={booking.depositNgn}
          balanceNgn={booking.balanceNgn}
          depositPaidAt={booking.depositPaidAt}
          paymentMethod={booking.paymentMethod}
          paymentReference={booking.paymentReference}
        />
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Booking Details">
          <dl className="divide-y divide-ink-950/[0.07] text-sm">
            <Row label="Appointment" value={`${booking.bookingDate} at ${booking.startTime}–${booking.endTime}`} accent />
            <Row label="Service" value={`${booking.serviceName}${booking.lengthLabel ? ` · ${booking.lengthLabel}` : ""}`} />
            {booking.addonNames.length > 0 && <Row label="Extras" value={booking.addonNames.join(", ")} />}
            {booking.notes && <Row label="Notes" value={booking.notes} />}
            <Row label="Booking submitted" value={new Date(booking.createdAt).toLocaleString("en-NG")} />
          </dl>
        </AdminCard>

        <AdminCard title="Client">
          <dl className="divide-y divide-ink-950/[0.07] text-sm">
            <Row label="Name" value={booking.clientName} />
            <Row label="Phone" value={booking.clientPhone} />
            {booking.clientEmail && <Row label="Email" value={booking.clientEmail} />}
            {booking.clientInstagram && <Row label="Instagram" value={`@${booking.clientInstagram}`} />}
          </dl>
        </AdminCard>
      </div>

      {booking.inspirationUrls.length > 0 && (
        <AdminCard title="Inspiration Photos">
          <div className="flex flex-wrap gap-3">
            {booking.inspirationUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative h-28 w-28 overflow-hidden rounded-lg border border-ink-950/10">
                <Image src={url} alt="Inspiration" fill className="object-cover" unoptimized />
              </a>
            ))}
          </div>
        </AdminCard>
      )}

      <AdminCard title="Delete Booking">
        <p className="mb-3 text-sm text-ink-700">
          For test or duplicate bookings. To call off a real appointment, use Cancel above so it stays on record.
        </p>
        <DeleteBookingButton bookingId={booking.id} />
      </AdminCard>
    </div>
  );
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-ink-700">{label}</dt>
      <dd className={`text-right font-medium ${accent ? "text-wine-900" : "text-ink-950"}`}>{value}</dd>
    </div>
  );
}
