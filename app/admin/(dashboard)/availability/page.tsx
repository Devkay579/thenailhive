import { BLOCKED_SLOTS_PAGE_SIZE, getBusinessHours, getUpcomingBlockedSlots } from "@/lib/data/admin/availability";
import { updateBusinessHours, addBlockedSlot, deleteBlockedSlot } from "@/app/admin/availability/actions";
import { AdminCard, inputClass, labelClass } from "@/components/admin/ui";
import { ActionForm } from "@/components/ui/ActionForm";
import { Pagination } from "@/components/admin/Pagination";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AdminAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const [hours, blockedPage] = await Promise.all([getBusinessHours(), getUpcomingBlockedSlots(page)]);
  const { rows: blocked, total, totalPages } = blockedPage;
  const hoursByDay = new Map(hours.map((h) => [h.weekday, h]));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">Availability</h1>

      <AdminCard title="Weekly Hours">
        <ActionForm action={updateBusinessHours} successMessage="Hours updated." className="space-y-3">
          {WEEKDAYS.map((label, weekday) => {
            const h = hoursByDay.get(weekday);
            return (
              <div key={weekday} className="flex flex-wrap items-center gap-3 border-b border-ink-950/10 pb-3 last:border-0">
                <span className="w-24 text-sm font-medium text-ink-950">{label}</span>
                <label className="flex items-center gap-1.5 text-xs text-ink-700">
                  <input
                    type="checkbox"
                    name={`closed-${weekday}`}
                    defaultChecked={h?.is_closed ?? false}
                    className="h-4 w-4 accent-wine-900"
                  />
                  Closed
                </label>
                <input
                  type="time"
                  name={`open-${weekday}`}
                  defaultValue={h?.open_time?.slice(0, 5) ?? "09:00"}
                  className={`${inputClass} w-32`}
                />
                <span className="text-xs text-ink-700">to</span>
                <input
                  type="time"
                  name={`close-${weekday}`}
                  defaultValue={h?.close_time?.slice(0, 5) ?? "18:00"}
                  className={`${inputClass} w-32`}
                />
              </div>
            );
          })}
          <button
            type="submit"
            className="mt-2 rounded-full bg-wine-900 px-5 py-2 text-sm font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            Save Hours
          </button>
        </ActionForm>
      </AdminCard>

      <AdminCard title="Blocked Dates & Times">
        <ActionForm
          action={addBlockedSlot}
          successMessage="Blocked date added."
          resetOnSuccess
          className="flex flex-wrap items-end gap-3 border-b border-ink-950/10 pb-4"
        >
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" name="date" required className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className={labelClass}>From (optional)</label>
            <input type="time" name="start_time" className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className={labelClass}>To (optional)</label>
            <input type="time" name="end_time" className={`${inputClass} mt-1`} />
          </div>
          <div className="flex-1 min-w-40">
            <label className={labelClass}>Reason (optional)</label>
            <input type="text" name="reason" placeholder="e.g. Public holiday" className={`${inputClass} mt-1`} />
          </div>
          <button type="submit" className="h-[38px] rounded-full bg-wine-900 px-4 text-sm font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none">
            Add Block
          </button>
        </ActionForm>
        <p className="mt-2 text-xs text-ink-700">Leave times blank to block the whole day.</p>

        <div className="mt-4 space-y-2">
          {blocked.length === 0 ? (
            <p className="text-sm text-ink-700">No upcoming blocked dates.</p>
          ) : (
            blocked.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg bg-cream-100 px-3 py-2 text-sm">
                <span className="text-ink-950">
                  {b.date}
                  {b.start_time && b.end_time ? ` · ${b.start_time.slice(0, 5)}–${b.end_time.slice(0, 5)}` : " · All day"}
                  {b.reason ? ` · ${b.reason}` : ""}
                </span>
                <ActionForm action={deleteBlockedSlot.bind(null, b.id)} successMessage="Blocked date removed.">
                  <button type="submit" className="text-xs font-medium text-wine-700 hover:underline">
                    Remove
                  </button>
                </ActionForm>
              </div>
            ))
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} basePath="/admin/availability" searchParams={params} pageSize={BLOCKED_SLOTS_PAGE_SIZE} noun="blocked slot" />
      </AdminCard>
    </div>
  );
}
