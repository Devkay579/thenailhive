"use client";

import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import Link from "next/link";
import { NailTile } from "@/components/ui/NailTile";
import { ZoomableImage } from "@/components/ZoomableImage";
import type { GalleryCategory } from "@/lib/mock-data";

const FILTERS: Array<GalleryCategory | "All"> = [
  "All",
  "Acrylic",
  "Gel",
  "BIAB",
  "Nail Art",
  "Toes",
];

// Each print sits at its own slight angle, cycling so neighbours differ.
const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-0", "-rotate-[1.5deg]"];

export type GalleryGridItem = {
  id: string;
  category: GalleryCategory;
  title: string;
  imageUrl: string | null;
  mediaType?: "image" | "video";
  serviceSlug?: string;
};

// Which service a gallery category is booked as. Nail Art can sit on any
// base set, so it opens the booking wizard without a preselection.
const CATEGORY_SERVICE: Partial<Record<GalleryCategory, string>> = {
  Acrylic: "plain-acrylic",
  Gel: "plain-gel",
  BIAB: "biab",
  Toes: "toes",
};

function bookHref(item: GalleryGridItem) {
  const slug = item.serviceSlug || CATEGORY_SERVICE[item.category];
  return slug ? `/book?service=${slug}` : "/book";
}

export function GalleryGrid({ items: allItems }: { items: GalleryGridItem[] }) {
  const [active, setActive] = useState<GalleryCategory | "All">("All");

  const items =
    active === "All"
      ? allItems
      : allItems.filter((item) => item.category === active);

  return (
    <div>
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <div className="flex w-max gap-7 border-b border-ink-950/15 sm:w-auto">
          {FILTERS.map((filter) => {
            const count =
              filter === "All" ? allItems.length : allItems.filter((i) => i.category === filter).length;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActive(filter)}
                className={`relative flex items-baseline gap-1.5 pb-3 text-sm font-semibold transition-colors ${
                  active === filter ? "text-wine-900" : "text-ink-700 hover:text-wine-900"
                }`}
              >
                {filter}
                <sup className="font-display text-[10px] font-normal italic text-ink-700/70">{count}</sup>
                {active === filter ? (
                  <motion.span
                    layoutId="gallery-filter"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-x-0 -bottom-px h-[2px] bg-wine-900"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <LayoutGroup>
        <motion.div
          layout
          className="mt-12 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 30, rotate: -6 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className={`print group block transition-transform duration-500 ease-out hover:z-10 hover:-translate-y-2 hover:rotate-0 ${TILTS[i % TILTS.length]}`}
                >
                  <div className="relative aspect-square overflow-hidden">
                    {item.imageUrl ? (
                      <ZoomableImage
                        src={item.imageUrl}
                        alt={item.title || item.category}
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="h-full w-full"
                        kind={item.mediaType ?? "image"}
                      />
                    ) : (
                      <NailTile variant={i} className="h-full" />
                    )}
                    <Link
                      href={bookHref(item)}
                      className="absolute inset-x-0 bottom-0 translate-y-full bg-wine-900 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-cream-50 transition-transform duration-300 focus:translate-y-0 group-hover:translate-y-0"
                    >
                      Book this look
                    </Link>
                  </div>
                  <Link href={bookHref(item)} className="flex items-baseline justify-between gap-2 px-1 py-2.5">
                    <span className="truncate font-script text-base italic text-wine-900">
                      {item.title || item.category}
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-700">
                      {item.category}
                    </span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
