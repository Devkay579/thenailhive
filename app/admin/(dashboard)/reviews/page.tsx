import { REVIEWS_PAGE_SIZE, getReviewsAdmin } from "@/lib/data/admin/reviews";
import { createReview, setReviewApproved, deleteReview } from "@/app/admin/reviews/actions";
import { AdminCard, inputClass, labelClass } from "@/components/admin/ui";
import { ActionForm } from "@/components/ui/ActionForm";
import { Pagination } from "@/components/admin/Pagination";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const { rows: reviews, total, totalPages } = await getReviewsAdmin(page);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">Reviews</h1>

      <AdminCard title="Add a Review">
        <ActionForm action={createReview} successMessage="Review added." resetOnSuccess className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Client name</label>
            <input name="author_name" required className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className={labelClass}>Rating</label>
            <select name="rating" defaultValue="5" className={`${inputClass} mt-1`}>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Review text</label>
            <textarea name="body" rows={2} required className={`${inputClass} mt-1`} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-sm text-ink-700">
              <input type="checkbox" name="approved" defaultChecked className="h-4 w-4 accent-wine-900" />
              Show on site immediately
            </label>
            <button type="submit" className="rounded-full bg-wine-900 px-4 py-2 text-xs font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none">
              Add Review
            </button>
          </div>
        </ActionForm>
      </AdminCard>

      <AdminCard title={`All Reviews (${total})`}>
        {reviews.length === 0 ? (
          <p className="text-sm text-ink-700">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-ink-950/10 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-950">
                    {r.author_name} &middot; {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {r.approved ? "Live" : "Pending"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-700">{r.body}</p>
                <div className="mt-2 flex gap-3">
                  <ActionForm
                    action={setReviewApproved.bind(null, r.id, !r.approved)}
                    successMessage={r.approved ? "Review unpublished." : "Review published."}
                  >
                    <button type="submit" className="text-xs font-medium text-wine-900 hover:underline">
                      {r.approved ? "Unpublish" : "Publish"}
                    </button>
                  </ActionForm>
                  <ActionForm action={deleteReview.bind(null, r.id)} successMessage="Review deleted.">
                    <button type="submit" className="text-xs font-medium text-wine-700 hover:underline">
                      Delete
                    </button>
                  </ActionForm>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={total} basePath="/admin/reviews" searchParams={params} pageSize={REVIEWS_PAGE_SIZE} noun="review" />
      </AdminCard>
    </div>
  );
}
