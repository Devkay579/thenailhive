"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { GalleryLook } from "@/lib/data/gallery";

/** The gallery design the client tapped "Book this look" on, pinned above the
 * wizard so it stays in view on every step. They can drop it if they change
 * their mind and the booking just goes ahead without one. */
export function ChosenLook({ look, onRemove }: { look: GalleryLook; onRemove: () => void }) {
  const label = look.title || look.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 flex items-center gap-4 border border-ink-950/10 bg-blush-100/50 p-3 pr-4"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-cream-100">
        {look.imageUrl ? (
          look.mediaType === "video" ? (
            <video src={look.imageUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          ) : (
            <Image src={look.imageUrl} alt={label} fill sizes="64px" className="object-cover" />
          )
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-700">Booking this look</p>
        <p className="truncate font-script text-lg italic leading-tight text-wine-900">{label}</p>
        <p className="text-xs text-ink-700">{look.category}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-xs font-semibold text-ink-700 underline-offset-4 transition-colors hover:text-wine-900 hover:underline"
      >
        Remove
      </button>
    </motion.div>
  );
}
