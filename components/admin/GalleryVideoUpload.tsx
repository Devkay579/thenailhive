"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addGalleryVideo, createGalleryVideoUpload } from "@/app/admin/gallery/actions";
import { createClient } from "@/lib/supabase/client";
import { GALLERY_BUCKET, MAX_VIDEO_MB, VIDEO_TYPES, validateVideo } from "@/lib/uploads";
import { inputClass, labelClass, primaryButtonClass } from "@/components/admin/ui";

export function GalleryVideoUpload({ categories }: { categories: string[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState(categories[0]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    const problem = chosen ? validateVideo(chosen) : null;
    if (problem) {
      toast.error(problem);
      e.target.value = "";
    }
    const ok = chosen && !problem ? chosen : null;
    setFile(ok);
    setPreviewUrl(ok ? URL.createObjectURL(ok) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please choose a video to upload.");
      return;
    }
    setBusy(true);
    try {
      const start = await createGalleryVideoUpload({ type: file.type, size: file.size });
      if (!start.ok) {
        toast.error(start.message);
        return;
      }

      const { error } = await createClient()
        .storage.from(GALLERY_BUCKET)
        .uploadToSignedUrl(start.path, start.token, file, { contentType: file.type });
      if (error) {
        console.error("Video upload failed:", error);
        toast.error("The video didn't upload. Check your connection and try again.");
        return;
      }

      const saved = await addGalleryVideo(start.path, category, title);
      if (!saved.ok) {
        toast.error(saved.message);
        return;
      }

      toast.success("Video added to the gallery.");
      setFile(null);
      setPreviewUrl(null);
      setTitle("");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={busy} className="flex flex-wrap items-end gap-3">
      <label className="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-ink-950/10 bg-blush-100 text-center text-[10px] text-ink-700">
        {previewUrl ? (
          <video src={previewUrl} muted playsInline className="h-full w-full object-cover" />
        ) : (
          <span className="px-1">Choose video</span>
        )}
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center bg-ink-950/60 text-[10px] font-medium text-cream-50">
            Uploading…
          </span>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={VIDEO_TYPES.join(",")}
          disabled={busy}
          onChange={handleFile}
          className="hidden"
        />
      </label>
      <div>
        <label htmlFor="video-category" className={labelClass}>
          Category
        </label>
        <select
          id="video-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${inputClass} mt-1`}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="video-title" className={labelClass}>
          Title (optional)
        </label>
        <input id="video-title" value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} mt-1`} />
      </div>
      <button type="submit" disabled={busy} className={`${primaryButtonClass} h-[38px]`}>
        {busy ? "Uploading…" : "Upload video"}
      </button>
      <p className="w-full text-xs text-ink-700">
        MP4, WebM or MOV, up to {MAX_VIDEO_MB} MB. Short clips (under 30 seconds) load fastest for visitors on mobile data.
      </p>
    </form>
  );
}
