import Link from "next/link";
import { getBookingFormOptions } from "@/lib/data/admin/bookings";
import { AdminPageHeader } from "@/components/admin/ui";
import { BookingForm } from "@/components/admin/BookingForm";

export default async function AdminNewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const { services, addons, depositPercent } = await getBookingFormOptions();
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : "";

  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="text-sm text-ink-700 hover:text-wine-900">
        &larr; Back to bookings
      </Link>
      <AdminPageHeader title="New booking" sub="For walk-ins and bookings made over WhatsApp or Instagram." />
      <BookingForm
        mode="create"
        services={services}
        addons={addons}
        depositPercent={depositPercent}
        initial={{ date }}
      />
    </div>
  );
}
