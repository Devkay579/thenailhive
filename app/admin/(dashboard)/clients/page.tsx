import Link from "next/link";
import Form from "next/form";
import { redirect } from "next/navigation";
import { CLIENTS_PAGE_SIZE, getClientsAdmin } from "@/lib/data/admin/clients";
import { AdminCard, inputClass } from "@/components/admin/ui";
import { Pagination, PAGE_SIZE_OPTIONS, parsePageSize } from "@/components/admin/Pagination";
import { FilterSubmitButton } from "@/components/admin/FilterSubmitButton";
import { LinkPendingSpinner } from "@/components/admin/PendingLink";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; perPage?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = parsePageSize(params.perPage, CLIENTS_PAGE_SIZE);
  const { rows: clients, total, totalPages } = await getClientsAdmin(params.search, page, pageSize);

  if (page > totalPages) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.perPage) qs.set("perPage", params.perPage);
    if (totalPages > 1) qs.set("page", String(totalPages));
    redirect(qs.size ? `/admin/clients?${qs}` : "/admin/clients");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">Clients</h1>
        <p className="text-sm text-ink-700">
          {total} client{total === 1 ? "" : "s"}
          {params.search ? ` matching “${params.search}”` : ""}
        </p>
      </div>

      <Form action="/admin/clients" className="flex flex-wrap items-end gap-3">
        {params.perPage ? <input type="hidden" name="perPage" value={params.perPage} /> : null}
        <div className="min-w-0 flex-1 sm:flex-none">
          <label htmlFor="clients-search" className="block text-xs font-medium text-ink-700">
            Search
          </label>
          <input
            id="clients-search"
            type="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Name or phone"
            className={`${inputClass} mt-1 sm:w-64`}
          />
        </div>
        <FilterSubmitButton>Search</FilterSubmitButton>
        {params.search ? (
          <Link href="/admin/clients" className="inline-flex h-[38px] items-center gap-1.5 text-sm text-ink-700 hover:text-wine-900">
            Clear
            <LinkPendingSpinner />
          </Link>
        ) : null}
      </Form>

      <AdminCard>
        {clients.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-script text-2xl italic text-wine-900">No clients found.</p>
            <p className="mt-1 text-sm text-ink-700">
              {params.search ? "Try a different name or phone number." : "Clients are added automatically when they book."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-950/10 text-left text-xs uppercase tracking-[0.16em] text-ink-700">
                  <th className="pb-2 pr-3">Name</th>
                  <th className="pb-2 pr-3">Phone</th>
                  <th className="pb-2 pr-3">Bookings</th>
                  <th className="pb-2">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/[0.07]">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-blush-100/40">
                    <td className="py-2 pr-3">
                      <Link href={`/admin/clients/${c.id}`} className="inline-flex items-center gap-2 font-medium text-ink-950 hover:text-wine-900">
                        {c.name}
                        <LinkPendingSpinner className="text-wine-700" />
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-ink-700">{c.phone}</td>
                    <td className="py-2 pr-3 text-ink-700">{c.bookingCount}</td>
                    <td className="py-2 text-ink-700">{c.lastBookingDate ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          basePath="/admin/clients"
          searchParams={params}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          noun="client"
        />
      </AdminCard>
    </div>
  );
}
