"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

export function ZoomableImage({
  src,
  alt,
  className,
  sizes,
  kind = "image",
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  /** "video" shows the clip's first frame with a play badge, and plays it
   * with controls in the lightbox. */
  kind?: "image" | "video";
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={kind === "video" ? `Play video: ${alt}` : `View ${alt} full screen`}
        className={`relative block cursor-zoom-in overflow-hidden ${className ?? ""}`}
      >
        {kind === "video" ? (
          <>
            {/* #t=0.1 makes browsers paint the first frame as a poster; only
                metadata loads until the visitor opens it. */}
            <video
              src={`${src}#t=0.1`}
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-950/55 text-cream-50 backdrop-blur-sm">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6 4.5v11l9-5.5-9-5.5Z" />
                </svg>
              </span>
            </span>
          </>
        ) : (
          <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" unoptimized />
        )}
      </button>

      {/* Portaled to <body>: this thumbnail often sits inside 3D-transformed
          cards, which would otherwise trap the `fixed` overlay inside them. */}
      {open ? createPortal(
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/90 p-4 sm:p-8"
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] flex h-10 w-10 items-center justify-center rounded-full bg-cream-50/10 text-cream-50 hover:bg-cream-50/20"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              {kind === "video" ? (
                <video
                  src={src}
                  controls
                  autoPlay
                  playsInline
                  aria-label={alt}
                  className="h-auto max-h-[85vh] w-auto max-w-[90vw] rounded-lg bg-ink-950"
                />
              ) : (
                <Image
                  src={src}
                  alt={alt}
                  width={1400}
                  height={1400}
                  sizes="90vw"
                  unoptimized
                  className="h-auto max-h-[85vh] w-auto max-w-[90vw] rounded-lg object-contain"
                />
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
      ) : null}
    </>
  );
}
