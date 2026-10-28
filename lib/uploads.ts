/** Public Supabase Storage bucket holding gallery and service photos/videos. */
export const GALLERY_BUCKET = "gallery-photos";

export const MAX_IMAGE_MB = 5;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const IMAGE_TOO_LARGE_MESSAGE = `That photo is too large. Please choose one under ${MAX_IMAGE_MB} MB.`;

/** Returns a user-facing error for an unacceptable image, or null if it's fine. */
export function validateImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG or WebP photo.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `That photo is ${mb} MB. Please choose one under ${MAX_IMAGE_MB} MB.`;
  }
  return null;
}

// Gallery videos go from the browser straight to storage (they're far over
// the server-action body limit), capped at the bucket's 50 MB file limit.
export const MAX_VIDEO_MB = 50;
export const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Returns a user-facing error for an unacceptable video, or null if it's fine. */
export function validateVideo(file: { type: string; size: number }): string | null {
  if (!VIDEO_TYPES.includes(file.type)) {
    return "Please choose an MP4, WebM or MOV video.";
  }
  if (file.size > MAX_VIDEO_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `That video is ${mb} MB. Please trim or compress it to under ${MAX_VIDEO_MB} MB.`;
  }
  return null;
}
