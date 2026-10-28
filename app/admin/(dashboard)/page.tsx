import Link from "next/link";
import { getDashboardData } from "@/lib/data/admin/dashboard";
import { getUnreadContactMessageCount } from "@/lib/data/admin/contactMessages";
import {
  AdminCard,
  AdminPageHeader,
  StatCard,
  StatusBadge,
  DownloadIcon,
  secondaryButtonClass,
} from "@/components/admin/ui";
import { formatNaira } from "@/lib/mock-data";
import { todayInLagos } from "@/lib/availability";

export default async function AdminDashboardPage() {
  const [data, unreadMessages] = await Promise.all([getDashboardData(), getUnreadContactMessageCount()]);
  const year = todayInLagos().slice(0, 4);

  const todayLabel = new Date(`${todayInLagos()}T00:00:00`).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        sub={
          <>
            <span className="font-script text-lg italic text-wine-900">{todayLabel}</span>
            <span className="mx-2 text-ink-700/40">&middot;</span>
            Today at a glance.
          </>
        }
        action={
          <Link href="/admin/bookings" className={`${secondaryButtonClass} h-10`}>
            All bookings
          </Link>
        }
      />

      {unreadMessages > 0 ? (
        <Link
          href="/admin/messages"
          className="flex items-center justify-between gap-3 rounded-2xl border border-wine-700/30 bg-blush-300/20 px-4 py-3 text-sm text-ink-950 transition-colors hover:border-wine-700"
        >
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-wine-900" />
            You have <span className="font-semibold text-wine-900">{unreadMessages} unread message{unreadMessages === 1 ? "" : "s"}</span> from
            the Contact page.
          </span>
          <span className="shrink-0 text-xs font-medium text-wine-900">View &rarr;</span>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Today's Appointments" value={String(data.today.appointments)} tone="wine" />
        <StatCard label="Today's Revenue" value={formatNaira(data.today.revenueNgn)} />
        <StatCard label="Deposits Received" value={formatNaira(data.today.depositsNgn)} />
        <StatCard label="Cancelled Today" value={String(data.today.cancelled)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Today's Schedule" action={<Link href="/admin/calendar" className="text-xs font-medium text-wine-900 hover:underline">View Calendar</Link>}>
          {data.todaySchedule.length === 0 ? (
            <p className="text-sm text-ink-700">No appointments today.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-ink-950/[0.07]">
                  {data.todaySchedule.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2 pr-3 font-medium text-ink-950">{row.startTime}</td>
                      <td className="py-2 pr-3 text-ink-700">{row.clientName}</td>
                      <td className="py-2 pr-3 text-ink-700">{row.serviceName}</td>
                      <td className="py-2 text-right">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <AdminCard title="Recent Bookings" action={<Link href="/admin/bookings" className="text-xs font-medium text-wine-900 hover:underline">View All</Link>}>
          {data.recentBookings.length === 0 ? (
            <p className="text-sm text-ink-700">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-ink-950/[0.07]">
                  {data.recentBookings.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2 pr-3 text-ink-700">
                        {new Date(row.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-2 pr-3 font-medium text-ink-950">{row.clientName}</td>
                      <td className="py-2 pr-3 text-ink-700">{row.serviceName}</td>
                      <td className="py-2 pr-3 text-right text-ink-950">{formatNaira(row.subtotalNgn)}</td>
                      <td className="py-2 text-right">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>

      <AdminCard title="This Month">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Appointments" value={String(data.month.appointments)} />
          <StatCard label="Revenue" value={formatNaira(data.month.revenueNgn)} />
          <StatCard label="Deposits" value={formatNaira(data.month.depositsNgn)} />
          <StatCard label="Most Booked" value={data.month.mostBookedService} />
          <StatCard label="Returning Clients" value={String(data.month.returningClients)} />
        </div>
      </AdminCard>

      <AdminCard
        title={`This Year (${year})`}
        action={
          <div className="flex items-center gap-2">
            <a
              href={`/admin/export/yearly-revenue?year=${year}&format=csv`}
              className="inline-flex items-center gap-1.5 rounded-full border border-blush-300 px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-wine-700 hover:text-wine-900"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              CSV
            </a>
            <a
              href={`/admin/export/yearly-revenue?year=${year}&format=pdf`}
              className="inline-flex items-center gap-1.5 rounded-full bg-wine-900 px-3 py-1.5 text-xs font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              PDF Report
            </a>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Appointments" value={String(data.year.appointments)} />
          <StatCard label="Revenue" value={formatNaira(data.year.revenueNgn)} />
          <StatCard label="Deposits" value={formatNaira(data.year.depositsNgn)} />
          <StatCard label="Most Booked" value={data.year.mostBookedService} />
          <StatCard label="Returning Clients" value={String(data.year.returningClients)} />
        </div>
      </AdminCard>
    </div>
  );
}
