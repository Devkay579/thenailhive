import Image from "next/image";
import { getServicesAdmin, getAddonsAdmin } from "@/lib/data/admin/services";
import {
  createService,
  updateService,
  setServiceArchived,
  addServicePrice,
  updateServicePrice,
  createAddon,
  updateAddon,
  updateNailArtImage,
} from "@/app/admin/services/actions";
import { getSettingsAdmin } from "@/lib/data/admin/settings";
import { AdminCard, inputClass, labelClass } from "@/components/admin/ui";
import { ActionForm } from "@/components/ui/ActionForm";
import { ImageFileInput } from "@/components/admin/ImageFileInput";
import { SubmitButton } from "@/components/admin/SubmitButton";

const cellInput = `${inputClass} py-1.5 text-sm`;
const microLabel = "mb-0.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-ink-700 sm:hidden";

export default async function AdminServicesPage() {
  const [allServices, addons, settings] = await Promise.all([getServicesAdmin(), getAddonsAdmin(), getSettingsAdmin()]);
  // `active: false` is how a service is archived (see setServiceArchived).
  const services = allServices.filter((s) => s.active);
  const archivedServices = allServices.filter((s) => !s.active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">Services &amp; Pricing</h1>
        <p className="text-sm text-ink-700">
          Manage what customers see and book on the site &mdash; services, price tiers and nail-art extras.
        </p>
      </div>

      <div className="space-y-5">
        {services.map((service) => (
          <AdminCard key={service.id} className="space-y-5">
            {/* Service header: photo + name/description/active */}
            <ActionForm
              action={updateService.bind(null, service.id)}
              successMessage="Service updated."
              className="flex flex-col gap-4 sm:flex-row sm:items-start"
            >
              <ImageFileInput name="image" currentUrl={service.image_url} alt={service.name} className="h-20 w-20" />

              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Name</label>
                  <input name="name" defaultValue={service.name} className={`${inputClass} mt-1`} />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <input name="description" defaultValue={service.description} className={`${inputClass} mt-1`} />
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <SubmitButton className="rounded-full bg-wine-900 px-4 py-1.5 text-xs font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none">
                  Save
                </SubmitButton>
              </div>
            </ActionForm>

            {/* Price tiers table */}
            <div className="border-t border-ink-950/10 pt-4">
              <p className={labelClass}>Price tiers</p>

              <div className="mt-2">
                <div className="hidden grid-cols-[2fr_1.3fr_1fr_auto_auto] gap-3 px-1 pb-1 text-xs font-medium uppercase tracking-[0.16em] text-ink-700 sm:grid">
                  <span>Length</span>
                  <span>Price (₦)</span>
                  <span>Minutes</span>
                  <span>Active</span>
                  <span></span>
                </div>

                <div className="space-y-1.5">
                  {service.prices.map((price) => (
                    <ActionForm
                      key={price.id}
                      action={updateServicePrice.bind(null, price.id)}
                      successMessage="Price tier updated."
                      className="contents"
                    >
                      <div className="grid grid-cols-2 gap-2 rounded-lg bg-cream-100 p-2 sm:grid-cols-[2fr_1.3fr_1fr_auto_auto] sm:items-center sm:gap-3 sm:px-1 sm:py-1">
                        <div className="col-span-2 sm:col-span-1">
                          <span className={microLabel}>Length</span>
                          <input name="length_label" defaultValue={price.length_label} className={cellInput} />
                        </div>
                        <div>
                          <span className={microLabel}>Price (₦)</span>
                          <input name="price_ngn" type="number" defaultValue={price.price_ngn} className={cellInput} />
                        </div>
                        <div>
                          <span className={microLabel}>Minutes</span>
                          <input name="duration_minutes" type="number" defaultValue={price.duration_minutes} className={cellInput} />
                        </div>
                        <div className="col-span-2 flex items-center justify-between gap-2 sm:contents">
                          <label className="flex items-center gap-1.5 text-xs text-ink-700">
                            <input
                              type="checkbox"
                              name="active"
                              defaultChecked={price.active}
                              className="h-4 w-4 accent-wine-900"
                            />
                            Active
                          </label>
                          <SubmitButton className="rounded-full border border-blush-300 px-3 py-1 text-xs font-medium text-ink-700 hover:border-wine-700 hover:text-wine-900">
                            Save
                          </SubmitButton>
                        </div>
                      </div>
                    </ActionForm>
                  ))}
                </div>

                <ActionForm
                  action={addServicePrice.bind(null, service.id)}
                  successMessage="Price tier added."
                  resetOnSuccess
                  className="contents"
                >
                  <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-lg border border-dashed border-blush-300 p-2 sm:grid-cols-[2fr_1.3fr_1fr_auto_auto] sm:items-center sm:gap-3 sm:px-1 sm:py-1">
                    <div className="col-span-2 sm:col-span-1">
                      <span className={microLabel}>Length</span>
                      <input name="length_label" placeholder="e.g. Short" required className={cellInput} />
                    </div>
                    <div>
                      <span className={microLabel}>Price (₦)</span>
                      <input name="price_ngn" type="number" placeholder="8000" required className={cellInput} />
                    </div>
                    <div>
                      <span className={microLabel}>Minutes</span>
                      <input name="duration_minutes" type="number" placeholder="60" defaultValue={60} className={cellInput} />
                    </div>
                    <span className="hidden sm:block" />
                    <SubmitButton
                      pendingLabel="Adding…"
                      className="col-span-2 rounded-full bg-wine-900 px-3 py-1.5 text-xs font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:col-span-1 sm:py-1"
                    >
                      + Add
                    </SubmitButton>
                  </div>
                </ActionForm>
              </div>
            </div>

            <ActionForm
              action={setServiceArchived.bind(null, service.id, true)}
              successMessage={`${service.name} archived. It's hidden from the site and booking.`}
              className="flex flex-col gap-2 border-t border-ink-950/10 pt-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-xs text-ink-700">
                Taking a break from this service? Archive it to hide it from the site and booking. You can restore it any time.
              </p>
              <SubmitButton
                pendingLabel="Archiving…"
                className="shrink-0 self-start rounded-full border border-blush-300 px-4 py-1.5 text-xs font-medium text-wine-700 hover:border-wine-700 hover:text-wine-900 sm:self-auto"
              >
                Archive service
              </SubmitButton>
            </ActionForm>
          </AdminCard>
        ))}
      </div>

      {archivedServices.length > 0 && (
        <AdminCard title={`Archived Services (${archivedServices.length})`}>
          <p className="text-xs text-ink-700">
            Hidden from the site and booking. Prices and photos are kept, and past bookings are unaffected.
          </p>
          <ul className="mt-3 divide-y divide-ink-950/10">
            {archivedServices.map((service) => (
              <li key={service.id} className="flex items-center gap-3 py-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-blush-100">
                  {service.image_url ? (
                    <Image src={service.image_url} alt="" fill sizes="48px" className="object-cover opacity-60 grayscale" unoptimized />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-950">{service.name}</p>
                  <p className="text-xs text-ink-700">
                    {service.prices.length} price tier{service.prices.length === 1 ? "" : "s"}
                  </p>
                </div>
                <ActionForm
                  action={setServiceArchived.bind(null, service.id, false)}
                  successMessage={`${service.name} restored. It's back on the site.`}
                >
                  <SubmitButton
                    pendingLabel="Restoring…"
                    className="rounded-full bg-wine-900 px-4 py-1.5 text-xs font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                  >
                    Restore
                  </SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      <AdminCard title="Add a New Service">
        <ActionForm action={createService} successMessage="Service added." resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className={labelClass}>Name</label>
            <input name="name" required className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <input name="description" className={`${inputClass} mt-1`} />
          </div>
          <SubmitButton pendingLabel="Adding…" className="h-[38px] rounded-full bg-wine-900 px-5 text-sm font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none">
            Add Service
          </SubmitButton>
        </ActionForm>
        <p className="mt-2 text-xs text-ink-700">
          Add price tiers and a photo from the service&apos;s card above once it&apos;s created.
        </p>
      </AdminCard>

      <AdminCard title="Extras / Nail Art Add-ons">
        <ActionForm
          action={updateNailArtImage}
          successMessage="Nail Art photo updated."
          className="mb-5 flex flex-col gap-4 border-b border-ink-950/10 pb-5 sm:flex-row sm:items-center"
        >
          <ImageFileInput name="image" currentUrl={settings.nail_art_image_url ?? null} alt="Nail Art" className="h-20 w-20" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-950">Nail Art photo</p>
            <p className="text-xs text-ink-700">
              Shown beside &ldquo;Nail Art&rdquo; in the menu on the home page. Its &ldquo;from&rdquo; price is the
              cheapest active add-on below.
            </p>
          </div>
          <SubmitButton className="self-start rounded-full bg-wine-900 px-4 py-1.5 text-xs font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:self-center">
            Save photo
          </SubmitButton>
        </ActionForm>

        <div className="hidden grid-cols-[2fr_1fr_1fr_auto_auto] gap-3 px-1 pb-1 text-xs font-medium uppercase tracking-[0.16em] text-ink-700 sm:grid">
          <span>Name</span>
          <span>Price (₦)</span>
          <span>Suffix</span>
          <span>Active</span>
          <span></span>
        </div>

        <div className="space-y-1.5">
          {addons.map((addon) => (
            <ActionForm
              key={addon.id}
              action={updateAddon.bind(null, addon.id)}
              successMessage="Add-on updated."
              className="contents"
            >
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-cream-100 p-2 sm:grid-cols-[2fr_1fr_1fr_auto_auto] sm:items-center sm:gap-3 sm:px-1 sm:py-1">
                <div className="col-span-2 sm:col-span-1">
                  <span className={microLabel}>Name</span>
                  <input name="name" defaultValue={addon.name} className={cellInput} />
                </div>
                <div>
                  <span className={microLabel}>Price (₦)</span>
                  <input name="price_ngn" type="number" defaultValue={addon.price_ngn} className={cellInput} />
                </div>
                <div>
                  <span className={microLabel}>Suffix</span>
                  <input name="suffix" defaultValue={addon.suffix ?? ""} placeholder="e.g. each" className={cellInput} />
                </div>
                <div className="col-span-2 flex items-center justify-between gap-2 sm:contents">
                  <label className="flex items-center gap-1.5 text-xs text-ink-700">
                    <input type="checkbox" name="active" defaultChecked={addon.active} className="h-4 w-4 accent-wine-900" />
                    Active
                  </label>
                  <SubmitButton className="rounded-full border border-blush-300 px-3 py-1 text-xs font-medium text-ink-700 hover:border-wine-700 hover:text-wine-900">
                    Save
                  </SubmitButton>
                </div>
              </div>
            </ActionForm>
          ))}
        </div>

        <ActionForm action={createAddon} successMessage="Add-on added." resetOnSuccess className="contents">
          <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-lg border border-dashed border-blush-300 p-2 sm:grid-cols-[2fr_1fr_1fr_auto_auto] sm:items-center sm:gap-3 sm:px-1 sm:py-1">
            <div className="col-span-2 sm:col-span-1">
              <span className={microLabel}>Name</span>
              <input name="name" placeholder="Name" required className={cellInput} />
            </div>
            <div>
              <span className={microLabel}>Price (₦)</span>
              <input name="price_ngn" type="number" placeholder="1000" required className={cellInput} />
            </div>
            <div>
              <span className={microLabel}>Suffix</span>
              <input name="suffix" placeholder="optional" className={cellInput} />
            </div>
            <span className="hidden sm:block" />
            <SubmitButton
              pendingLabel="Adding…"
              className="col-span-2 rounded-full bg-wine-900 px-3 py-1.5 text-xs font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:col-span-1 sm:py-1"
            >
              + Add
            </SubmitButton>
          </div>
        </ActionForm>
      </AdminCard>
    </div>
  );
}
