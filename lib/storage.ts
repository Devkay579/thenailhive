import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { GALLERY_BUCKET, validateImage } from "@/lib/uploads";

export { GALLERY_BUCKET };

export function pathFromPublicUrl(imageUrl: string) {
  return imageUrl.split(`${GALLERY_BUCKET}/`).pop();
}

type UploadResult = { ok: true; publicUrl: string } | { ok: false; message: string };

/** Validates and uploads a photo to the gallery bucket, under `folder` if given. */
export async function uploadPhoto(
  supabase: ReturnType<typeof createAdminClient>,
  file: File,
  folder = "",
): Promise<UploadResult> {
  const problem = validateImage(file);
  if (problem) return { ok: false, message: problem };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (error) {
    console.error("Photo upload failed:", error);
    return { ok: false, message: "We couldn't upload that photo. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path);
  return { ok: true, publicUrl };
}
