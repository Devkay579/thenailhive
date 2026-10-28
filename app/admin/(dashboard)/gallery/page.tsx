import { GALLERY_PAGE_SIZE, getGalleryAdmin } from "@/lib/data/admin/gallery";
import { uploadGalleryImage, updateGalleryItem, deleteGalleryItem } from "@/app/admin/gallery/actions";
import { AdminCard, inputClass, labelClass } from "@/components/admin/ui";
import { ActionForm } from "@/components/ui/ActionForm";
import { Pagination } from "@/components/admin/Pagination";
import { ImageFileInput } from "@/components/admin/ImageFileInput";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { GalleryVideoUpload } from "@/components/admin/GalleryVideoUpload";

const CATEGORIES = ["Acrylic", "Gel", "BIAB", "Nail Art", "Toes"];

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const { rows: items, total, totalPages } = await getGalleryAdmin(page);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">Gallery</h1>

      <AdminCard title="Upload New Photo">
        <ActionForm
          action={uploadGalleryImage}
          successMessage="Photo uploaded."
          resetOnSuccess
          className="flex flex-wrap items-end gap-3"
        >
          <ImageFileInput name="file" currentUrl={null} alt="New photo" className="h-24 w-24" />
          <div>
            <label className={labelClass}>Category</label>
            <select name="category" required className={`${inputClass} mt-1`}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Title (optional)</label>
            <input name="title" className={`${inputClass} mt-1`} />
          </div>
          <SubmitButton pendingLabel="Uploading…" className="h-[38px] rounded-full bg-wine-900 px-4 text-sm font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none">
            Upload
          </SubmitButton>
        </ActionForm>
      </AdminCard>

      <AdminCard title="Upload New Video">
        <GalleryVideoUpload categories={CATEGORIES} />
      </AdminCard>

      <AdminCard title={`Photos & videos (${total})`}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="space-y-2 rounded-xl border border-ink-950/10 p-2">
              <ActionForm action={updateGalleryItem.bind(null, item.id)} successMessage="Photo updated." className="space-y-1.5">
                {item.media_type === "video" && item.image_url ? (
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-ink-950/10 bg-ink-950">
                    <video
                      src={`${item.image_url}#t=0.1`}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                    <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-ink-950/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-cream-50">
                      Video
                    </span>
                  </div>
                ) : (
                  <ImageFileInput
                    name="file"
                    currentUrl={item.image_url}
                    alt={item.title}
                    className="aspect-square w-full"
                    emptyLabel="No image"
                  />
                )}
                <select name="category" defaultValue={item.category} className={`${inputClass} py-1 text-xs`}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input name="title" defaultValue={item.title} className={`${inputClass} py-1 text-xs`} />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1 text-xs text-ink-700">
                    <input type="checkbox" name="active" defaultChecked={item.active} className="h-3.5 w-3.5 accent-wine-900" />
                    Active
                  </label>
                  <SubmitButton className="text-xs font-medium text-wine-900 hover:underline">Save</SubmitButton>
                </div>
              </ActionForm>
              <ActionForm action={deleteGalleryItem.bind(null, item.id, item.image_url)} successMessage="Photo deleted.">
                <SubmitButton pendingLabel="Deleting…" className="w-full text-xs font-medium text-wine-700 hover:underline">
                  Delete
                </SubmitButton>
              </ActionForm>
            </div>
          ))}
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} basePath="/admin/gallery" searchParams={params} pageSize={GALLERY_PAGE_SIZE} noun="item" />
      </AdminCard>
    </div>
  );
}
