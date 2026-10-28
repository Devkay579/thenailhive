import Link from "next/link";
import Form from "next/form";
import { redirect } from "next/navigation";
import {
  BOOKINGS_PAGE_SIZE,
  BOOKING_STATUSES,
  getBookingStatusCounts,
  getBookings,
} from "@/lib/data/admin/bookings";
import { AdminCard, StatusBadge, inputClass, EyeIcon, primaryButtonClass } from "@/components/admin/ui";
import { Pagination, PAGE_SIZE_OPTIONS, parsePageSize } from "@/components/admin/Pagination";
import { FilterSubmitButton } from "@/components/admin/FilterSubmitButton";
import { LinkPendingSpinner } from "@/components/admin/PendingLink";
import { formatNaira } from "@/lib/mock-data";
import { todayInLagos } from "@/lib/availability";
import { cn } from "@/lib/cn";

const STATUS_TAB_LABELS: Record<string, string> = {
  "": "All",
  pending_payment: "Pending",
  deposit_paid: "Deposit paid",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

type Params = { status?: string; date?: string; search?: string; page?: string; perPage?: string };

function bookingsHref(params: Params, overrides: Partial<Params>) {
  const merged = { ...params, ...overrides };
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `/admin/bookings?${s}` : "/admin/bookings";
}

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = parsePageSize(params.perPage, BOOKINGS_PAGE_SIZE);
  const status = BOOKING_STATUSES.includes(params.status as never) ? params.status : undefined;
  const filters = { status, date: params.date, search: params.search };

  const [{ rows: bookings, total, totalPages }, counts] = await Promise.all([
    getBookings(filters, page, pageSize),
    getBookingStatusCounts(filters),
  ]);

  // A stale ?page= past the end (e.g. after a filter narrowed the list).
  if (page > totalPages) redirect(bookingsHref(params, { page: totalPages > 1 ? String(totalPages) : undefined }));

  const today = todayInLagos();
  const hasFilters = Boolean(params.status || params.date || params.search);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">Bookings</h1>
          <p className="text-sm text-ink-700">
            {total} booking{total === 1 ? "" : "s"}
            {hasFilters ? " match these filters" : ""}
          </p>
        </div>
        <Link href="/admin/bookings/new" className={`${primaryButtonClass} h-10`}>
          + New booking
        </Link>
      </div>

      {/* Status tabs with live counts (respecting date/search) */}
      <div className="scroll-strip -mx-4 overflow-x-auto overflow-y-hidden px-4 pb-2 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label="Filter by status" className="flex w-max gap-1.5">
          {["", ...BOOKING_STATUSES].map((s) => {
            const active = (status ?? "") === s;
            const count = counts[s || "all"] ?? 0;
            return (
              <Link
                key={s || "all"}
                role="tab"
                aria-selected={active}
                href={bookingsHref(params, { status: s || undefined, page: undefined })}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-wine-950 bg-wine-900 text-cream-50 shadow-[2px_2px_0_var(--color-blush-300)]"
                    : "border-ink-950/10 bg-[#fffdf9] text-ink-700 hover:border-wine-700/40 hover:text-wine-900",
                )}
              >
                {STATUS_TAB_LABELS[s]}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                    active ? "bg-cream-50/15 text-cream-50" : "bg-cream-100 text-ink-700",
                  )}
                >
                  {count}
                </span>
                <LinkPendingSpinner className="-ml-1" />
              </Link>
            );
          })}
        </div>
      </div>

      <Form action="/admin/bookings" className="flex flex-wrap items-end gap-3">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        {params.perPage ? <input type="hidden" name="perPage" value={params.perPage} /> : null}
        <div>
          <label htmlFor="bookings-date" className="block text-xs font-medium text-ink-700">
            Date
          </label>
          <input id="bookings-date" type="date" name="date" defaultValue={params.date ?? ""} className={`${inputClass} mt-1`} />
        </div>
        <div className="min-w-0 flex-1 sm:flex-none">
          <label htmlFor="bookings-search" className="block text-xs font-medium text-ink-700">
            Search
          </label>
          <input
            id="bookings-search"
            type="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Name, phone or booking ref"
            className={`${inputClass} mt-1 sm:w-60`}
          />
        </div>
        <FilterSubmitButton>Filter</FilterSubmitButton>
        <Link
          href={bookingsHref(params, { date: params.date === today ? undefined : today, page: undefined })}
          className={cn(
            "inline-flex h-[38px] items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
            params.date === today
              ? "border-wine-900 bg-blush-100 text-wine-900"
              : "border-ink-950/15 text-ink-700 hover:border-wine-700 hover:text-wine-900",
          )}
        >
          Today
          <LinkPendingSpinner />
        </Link>
        {hasFilters ? (
          <Link href="/admin/bookings" className="inline-flex h-[38px] items-center gap-1.5 text-sm text-ink-700 hover:text-wine-900">
            Clear all
            <LinkPendingSpinner />
          </Link>
        ) : null}
      </Form>

      <AdminCard>
        {bookings.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-script text-2xl italic text-wine-900">Nothing on the books here.</p>
            <p className="mt-1 text-sm text-ink-700">
              {hasFilters ? "No bookings match these filters." : "New bookings will show up here."}
            </p>
            {hasFilters ? (
              <Link href="/admin/bookings" className="mt-4 inline-block text-sm font-medium text-wine-900 hover:underline">
                Clear filters
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards (a table here would force horizontal scroll) */}
            <div className="space-y-3 sm:hidden">
              {bookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/bookings/${b.id}`}
                  className="block rounded-xl border border-ink-950/10 bg-cream-100 p-3 active:bg-blush-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-2 font-medium text-ink-950">
                        {b.clientName}
                        <LinkPendingSpinner className="text-wine-700" />
                      </p>
                      <p className="text-xs text-ink-700">
                        {b.bookingDate === today ? <span className="font-semibold text-wine-900">Today</span> : b.bookingDate}{" "}
                        &middot; {b.startTime}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="mt-2 text-sm text-ink-700">
                    {b.serviceName}
                    {b.lengthLabel ? ` · ${b.lengthLabel}` : ""}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-mono text-xs text-ink-700">{b.bookingRef}</span>
                    <span className="text-ink-950">
                      {formatNaira(b.subtotalNgn)}{" "}
                      <span className={b.depositPaid ? "text-emerald-800" : "text-ink-700"}>
                        (dep. {formatNaira(b.depositNgn)}
                        {b.depositPaid ? " ✓" : ""})
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Tablet/desktop: full table */}
            <div className="scroll-strip hidden overflow-x-auto overflow-y-hidden pb-2 sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-950/10 text-left text-xs uppercase tracking-[0.16em] text-ink-700">
                    <th className="pb-2 pr-3">Ref</th>
                    <th className="pb-2 pr-3">Date</th>
                    <th className="pb-2 pr-3">Client</th>
                    <th className="pb-2 pr-3">Service</th>
                    <th className="pb-2 pr-3">Total</th>
                    <th className="pb-2 pr-3">Deposit</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-950/[0.07]">
                  {bookings.map((b) => (
                    <tr key={b.id} className={cn("hover:bg-blush-100/40", b.bookingDate === today && "bg-blush-100/25")}>
                      <td className="py-2 pr-3">
                        <Link href={`/admin/bookings/${b.id}`} className="font-mono text-xs text-ink-700">
                          {b.bookingRef}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">
                        <Link href={`/admin/bookings/${b.id}`} className="block">
                          {b.bookingDate === today ? (
                            <span className="font-semibold text-wine-900">Today</span>
                          ) : (
                            <span className="font-medium text-ink-950">{b.bookingDate}</span>
                          )}
                          <span className="ml-1 text-ink-700">{b.startTime}</span>
                        </Link>
                      </td>
                      <td className="py-2 pr-3">
                        <Link href={`/admin/bookings/${b.id}`} className="block text-ink-950">
                          {b.clientName}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-ink-700">
                        {b.serviceName}
                        {b.lengthLabel ? ` · ${b.lengthLabel}` : ""}
                      </td>
                      <td className="py-2 pr-3 text-ink-950">{formatNaira(b.subtotalNgn)}</td>
                      <td className="py-2 pr-3">
                        <span className="text-ink-700">{formatNaira(b.depositNgn)}</span>
                        <span
                          className={`ml-1.5 text-[11px] font-semibold ${b.depositPaid ? "text-emerald-700" : "text-amber-700"}`}
                        >
                          {b.depositPaid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-2 text-right">
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          aria-label={`View details for booking ${b.bookingRef}`}
                          title="View details"
                          className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-ink-700 hover:bg-blush-100 hover:text-wine-900"
                        >
                          <EyeIcon />
                          <LinkPendingSpinner className="absolute inset-1 h-auto w-auto text-wine-700" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          basePath="/admin/bookings"
          searchParams={params}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          noun="booking"
        />
      </AdminCard>
    </div>
  );
}
