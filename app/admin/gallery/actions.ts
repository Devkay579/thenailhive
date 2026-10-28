"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { GALLERY_BUCKET, pathFromPublicUrl, uploadPhoto } from "@/lib/storage";
import { validateVideo } from "@/lib/uploads";

const CATEGORIES = ["Acrylic", "Gel", "BIAB", "Nail Art", "Toes"];

const VIDEO_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/** Step 1 of a video upload: hands the browser a one-time signed URL so the
 * file goes straight to storage instead of through this server. */
export async function createGalleryVideoUpload(file: { type: string; size: number }) {
  const problem = validateVideo(file);
  if (problem) return { ok: false as const, message: problem };

  const supabase = createAdminClient();
  const path = `videos/${crypto.randomUUID()}.${VIDEO_EXTENSIONS[file.type]}`;
  const { data, error } = await supabase.storage.from(GALLERY_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("Signed upload URL failed:", error);
    return { ok: false as const, message: "We couldn't start the upload. Please try again." };
  }
  return { ok: true as const, path: data.path, token: data.token };
}

/** Step 2: once the browser has uploaded the file, add it to the gallery. */
export async function addGalleryVideo(path: string, category: string, title: string) {
  if (!/^videos\/[0-9a-f-]{36}\.(mp4|webm|mov)$/.test(path)) {
    return { ok: false, message: "That upload couldn't be found. Please try again." };
  }
  if (!CATEGORIES.includes(category)) {
    return { ok: false, message: "Please choose a category." };
  }

  const supabase = createAdminClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path);

  const { count } = await supabase.from("gallery_items").select("*", { count: "exact", head: true });
  const { error } = await supabase.from("gallery_items").insert({
    category,
    title: title.trim() || `${category} Set`,
    image_url: publicUrl,
    media_type: "video",
    sort_order: count ?? 0,
    active: true,
  });
  if (error) {
    console.error("Gallery video insert failed:", error);
    await supabase.storage.from(GALLERY_BUCKET).remove([path]);
    return { ok: false, message: "The video uploaded but couldn't be added to the gallery. Please try again." };
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  return { ok: true };
}

export async function uploadGalleryImage(formData: FormData) {
  const supabase = createAdminClient();
  const file = formData.get("file");
  const category = String(formData.get("category") ?? "");
  const title = String(formData.get("title") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Please choose a photo to upload." };
  }
  if (!CATEGORIES.includes(category)) {
    return { ok: false, message: "Please choose a category." };
  }

  const upload = await uploadPhoto(supabase, file);
  if (!upload.ok) return upload;

  const { count } = await supabase.from("gallery_items").select("*", { count: "exact", head: true });

  const { error } = await supabase.from("gallery_items").insert({
    category,
    title: title || `${category} Set`,
    image_url: upload.publicUrl,
    sort_order: count ?? 0,
    active: true,
  });
  if (error) {
    console.error("Gallery insert failed:", error);
    return { ok: false, message: "The photo uploaded but couldn't be added to the gallery. Please try again." };
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return { ok: true };
}

export async function updateGalleryItem(id: string, formData: FormData) {
  const supabase = createAdminClient();

  const update: Record<string, unknown> = {
    category: String(formData.get("category") ?? ""),
    title: String(formData.get("title") ?? ""),
    active: formData.get("active") === "on",
  };

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const { data: existing } = await supabase
      .from("gallery_items")
      .select("image_url")
      .eq("id", id)
      .single();

    const upload = await uploadPhoto(supabase, file);
    if (!upload.ok) return upload;
    update.image_url = upload.publicUrl;
    update.media_type = "image";

    if (existing?.image_url) {
      const oldPath = pathFromPublicUrl(existing.image_url);
      if (oldPath) await supabase.storage.from(GALLERY_BUCKET).remove([oldPath]);
    }
  }

  const { error } = await supabase.from("gallery_items").update(update).eq("id", id);
  if (error) {
    console.error("Gallery update failed:", error);
    return { ok: false, message: "We couldn't save this photo's changes. Please try again." };
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return { ok: true };
}

export async function deleteGalleryItem(id: string, imageUrl: string | null) {
  const supabase = createAdminClient();

  if (imageUrl) {
    const path = pathFromPublicUrl(imageUrl);
    if (path) await supabase.storage.from(GALLERY_BUCKET).remove([path]);
  }

  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}
