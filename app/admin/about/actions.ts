"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { GALLERY_BUCKET, pathFromPublicUrl, uploadPhoto } from "@/lib/storage";
import { ABOUT_PHOTO_COUNT, MAX_ABOUT_VALUES, normalizeAbout, type AboutContent } from "@/lib/about";

type Result = { ok: true } | { ok: false; message: string };

async function readAbout(supabase: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return normalizeAbout(data?.about_content);
}

async function writeAbout(supabase: ReturnType<typeof createAdminClient>, content: AboutContent): Promise<Result> {
  const { error } = await supabase.from("settings").update({ about_content: content }).eq("id", 1);
  if (error) {
    console.error("About content update failed:", error);
    return { ok: false, message: "We couldn't save the About page. Please try again." };
  }
  revalidatePath("/about");
  revalidatePath("/"); // home page shares the values list
  revalidatePath("/admin/about");
  return { ok: true };
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Saves all the wording (intro + values). Photos are saved separately. */
export async function updateAboutText(formData: FormData): Promise<Result> {
  const supabase = createAdminClient();
  const current = await readAbout(supabase);

  const titles = formData.getAll("value_title").map((v) => String(v).trim());
  const descriptions = formData.getAll("value_description").map((v) => String(v).trim());
  const values = titles
    .map((title, i) => ({ title, description: descriptions[i] ?? "" }))
    .filter((v) => v.title)
    .slice(0, MAX_ABOUT_VALUES);

  if (!text(formData, "headingMain")) return { ok: false, message: "The headline can't be empty." };

  return writeAbout(supabase, {
    ...current,
    kicker: text(formData, "kicker"),
    headingMain: text(formData, "headingMain"),
    headingAccent: text(formData, "headingAccent"),
    paragraphOne: text(formData, "paragraphOne"),
    paragraphTwo: text(formData, "paragraphTwo"),
    buttonLabel: text(formData, "buttonLabel") || "Book an Appointment",
    valuesEyebrow: text(formData, "valuesEyebrow"),
    valuesTitle: text(formData, "valuesTitle"),
    valuesAccent: text(formData, "valuesAccent"),
    values,
  });
}

/** Caption and (optionally) a new photo for one of the three prints. */
export async function updateAboutPhoto(index: number, formData: FormData): Promise<Result> {
  if (index < 0 || index >= ABOUT_PHOTO_COUNT) return { ok: false, message: "Unknown photo." };

  const supabase = createAdminClient();
  const current = await readAbout(supabase);
  const photos = [...current.photos] as AboutContent["photos"];
  const oldUrl = photos[index].url;
  let newUrl = oldUrl;

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const upload = await uploadPhoto(supabase, file, "about/");
    if (!upload.ok) return upload;
    newUrl = upload.publicUrl;
  }

  photos[index] = { url: newUrl, caption: text(formData, "caption") };
  const result = await writeAbout(supabase, { ...current, photos });

  // Only drop the old file once the new one is safely saved.
  if (result.ok && oldUrl && newUrl !== oldUrl) {
    const oldPath = pathFromPublicUrl(oldUrl);
    if (oldPath) await supabase.storage.from(GALLERY_BUCKET).remove([oldPath]);
  }
  return result;
}

/** Back to the illustrated placeholder for that print. */
export async function removeAboutPhoto(index: number): Promise<Result> {
  if (index < 0 || index >= ABOUT_PHOTO_COUNT) return { ok: false, message: "Unknown photo." };

  const supabase = createAdminClient();
  const current = await readAbout(supabase);
  const photos = [...current.photos] as AboutContent["photos"];
  const oldUrl = photos[index].url;
  if (!oldUrl) return { ok: true };

  photos[index] = { ...photos[index], url: null };
  const result = await writeAbout(supabase, { ...current, photos });

  if (result.ok) {
    const oldPath = pathFromPublicUrl(oldUrl);
    if (oldPath) await supabase.storage.from(GALLERY_BUCKET).remove([oldPath]);
  }
  return result;
}
