"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useActionFormPending } from "@/components/ui/ActionForm";
import { IMAGE_TYPES, validateImage } from "@/lib/uploads";

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-cream-50" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function ImageFileInput({
  name,
  currentUrl,
  alt,
  className = "h-20 w-20",
  emptyLabel = "No photo",
}: {
  name: string;
  currentUrl: string | null;
  alt: string;
  className?: string;
  emptyLabel?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const isPending = useActionFormPending();

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const problem = file ? validateImage(file) : null;
    if (problem) {
      toast.error(problem);
      // Clear the rejected file so it isn't sent with the form.
      e.target.value = "";
    }
    if (!file || problem) {
      objectUrlRef.current = null;
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);
  }

  const displaySrc = previewUrl ?? currentUrl;

  return (
    <label
      className={`group relative block shrink-0 cursor-pointer overflow-hidden rounded-xl border border-ink-950/10 bg-blush-100 ${className}`}
    >
      {displaySrc ? (
        <Image src={displaySrc} alt={alt} fill sizes="200px" className="object-cover" unoptimized />
      ) : (
        <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-ink-700">
          {emptyLabel}
        </span>
      )}

      {isPending ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink-950/60">
          <Spinner />
          <span className="text-[10px] font-medium text-cream-50">Uploading…</span>
        </span>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-ink-950/0 text-[10px] font-medium text-cream-50 opacity-0 transition-opacity group-hover:bg-ink-950/50 group-hover:opacity-100">
          {previewUrl ? "Change again" : "Change"}
        </span>
      )}

      {previewUrl && !isPending ? (
        <span className="absolute bottom-1 left-1 right-1 rounded bg-emerald-600/90 px-1 py-0.5 text-center text-[9px] font-medium text-cream-50">
          New photo selected
        </span>
      ) : null}

      <input
        type="file"
        name={name}
        accept={IMAGE_TYPES.join(",")}
        disabled={isPending}
        onChange={handleChange}
        className="hidden"
      />
    </label>
  );
}
