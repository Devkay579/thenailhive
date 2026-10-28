import { notFound } from "next/navigation";
import Link from "next/link";
import { getClientDetail } from "@/lib/data/admin/clients";
import { AdminCard, StatusBadge } from "@/components/admin/ui";
import { formatNaira } from "@/lib/mock-data";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientDetail(id);
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/clients" className="text-sm text-ink-700 hover:text-wine-900">
          &larr; Back to clients
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">{client.name}</h1>
        <p className="text-sm text-ink-700">
          {client.phone}
          {client.email ? ` · ${client.email}` : ""}
          {client.instagram ? ` · @${client.instagram}` : ""}
        </p>
      </div>

      <AdminCard title="Booking History">
        {client.bookings.length === 0 ? (
          <p className="text-sm text-ink-700">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-950/10 text-left text-xs uppercase tracking-[0.16em] text-ink-700">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Service</th>
                  <th className="pb-2 pr-3">Total</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/[0.07]">
                {client.bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-blush-100/40">
                    <td className="py-2 pr-3">
                      <Link href={`/admin/bookings/${b.id}`} className="text-ink-950">
                        {b.bookingDate} {b.startTime}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-ink-700">{b.serviceName}</td>
                    <td className="py-2 pr-3 text-ink-950">{formatNaira(b.subtotalNgn)}</td>
                    <td className="py-2">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
