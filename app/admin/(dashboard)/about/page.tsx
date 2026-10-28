import Link from "next/link";
import { getAboutContentAdmin } from "@/lib/data/about";
import { updateAboutText, updateAboutPhoto, removeAboutPhoto } from "@/app/admin/about/actions";
import { AdminCard, inputClass, labelClass, primaryButtonClass } from "@/components/admin/ui";
import { ActionForm } from "@/components/ui/ActionForm";
import { ImageFileInput } from "@/components/admin/ImageFileInput";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { AboutValuesEditor } from "@/components/admin/AboutValuesEditor";

const PHOTO_SLOTS = ["Back left print", "Right print", "Front print"];

export default async function AdminAboutPage() {
  const about = await getAboutContentAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">About Page</h1>
          <p className="text-sm text-ink-700">Everything on the public About page: the story, the photos and your values.</p>
        </div>
        <Link href="/about" target="_blank" className="text-sm font-medium text-wine-900 hover:underline">
          View live page &nearr;
        </Link>
      </div>

      <AdminCard title="Photos">
        <p className="-mt-2 mb-4 text-sm text-ink-700">
          The three overlapping prints beside your story. Each is saved on its own. Without a photo, a print shows the
          illustrated nail placeholder.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {about.photos.map((photo, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-ink-950/10 bg-cream-100 p-3">
              <p className={labelClass}>{PHOTO_SLOTS[i]}</p>
              <ActionForm action={updateAboutPhoto.bind(null, i)} successMessage="Photo saved." className="space-y-3">
                <ImageFileInput
                  name="image"
                  currentUrl={photo.url}
                  alt={photo.caption || PHOTO_SLOTS[i]}
                  className="aspect-square w-full"
                  emptyLabel="No photo yet. Click to add one"
                />
                <div>
                  <label className={labelClass} htmlFor={`about-caption-${i}`}>
                    Caption
                  </label>
                  <input
                    id={`about-caption-${i}`}
                    name="caption"
                    defaultValue={photo.caption}
                    placeholder="e.g. the details"
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <SubmitButton className={`${primaryButtonClass} h-9 w-full`}>Save photo</SubmitButton>
              </ActionForm>
              {photo.url ? (
                <ActionForm action={removeAboutPhoto.bind(null, i)} successMessage="Photo removed.">
                  <button type="submit" className="w-full text-xs font-medium text-wine-700 hover:underline">
                    Remove photo
                  </button>
                </ActionForm>
              ) : null}
            </div>
          ))}
        </div>
      </AdminCard>

      <ActionForm action={updateAboutText} successMessage="About page updated." className="space-y-6">
        <AdminCard title="Our Story">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass} htmlFor="about-kicker">
                  Small label above headline
                </label>
                <input id="about-kicker" name="kicker" defaultValue={about.kicker} className={`${inputClass} mt-1`} />
              </div>
              <div>
                <label className={labelClass} htmlFor="about-heading">
                  Headline
                </label>
                <input
                  id="about-heading"
                  name="headingMain"
                  required
                  defaultValue={about.headingMain}
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="about-accent">
                  Headline accent (italic, wine)
                </label>
                <input
                  id="about-accent"
                  name="headingAccent"
                  defaultValue={about.headingAccent}
                  className={`${inputClass} mt-1`}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="about-p1">
                  First paragraph (starts with a large letter)
                </label>
                <textarea
                  id="about-p1"
                  name="paragraphOne"
                  rows={6}
                  defaultValue={about.paragraphOne}
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="about-p2">
                  Second paragraph
                </label>
                <textarea
                  id="about-p2"
                  name="paragraphTwo"
                  rows={6}
                  defaultValue={about.paragraphTwo}
                  className={`${inputClass} mt-1`}
                />
                <p className="mt-1 text-xs text-ink-700">Leave empty to show just one paragraph.</p>
              </div>
            </div>

            <div className="sm:w-1/3">
              <label className={labelClass} htmlFor="about-button">
                Booking button text
              </label>
              <input id="about-button" name="buttonLabel" defaultValue={about.buttonLabel} className={`${inputClass} mt-1`} />
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Values">
          <p className="-mt-2 mb-4 text-sm text-ink-700">
            The wine-coloured &ldquo;What We Stand For&rdquo; section. These values also appear on the home page under
            &ldquo;Why THENAILHIVE?&rdquo;.
          </p>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="about-v-eyebrow">
                Small label
              </label>
              <input
                id="about-v-eyebrow"
                name="valuesEyebrow"
                defaultValue={about.valuesEyebrow}
                className={`${inputClass} mt-1`}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="about-v-title">
                Heading
              </label>
              <input id="about-v-title" name="valuesTitle" defaultValue={about.valuesTitle} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className={labelClass} htmlFor="about-v-accent">
                Heading accent (italic)
              </label>
              <input
                id="about-v-accent"
                name="valuesAccent"
                defaultValue={about.valuesAccent}
                className={`${inputClass} mt-1`}
              />
            </div>
          </div>
          <AboutValuesEditor initial={about.values} />
        </AdminCard>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <SubmitButton className={`${primaryButtonClass} h-11 px-6`}>Save wording</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
