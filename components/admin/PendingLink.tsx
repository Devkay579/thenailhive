"use client";

import { useLinkStatus } from "next/link";
import { cn } from "@/lib/cn";

/** Drop inside any <Link>: a small spinner that fades in while that link's
 * navigation is in flight. Always rendered (opacity only) so it never shifts
 * layout, but only spins while pending -- an idle rotating box still counts
 * toward its scroll container's overflow and makes scrollbars flicker. */
export function LinkPendingSpinner({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-3 w-3 shrink-0 rounded-full border-[1.5px] border-current border-r-transparent transition-opacity",
        pending ? "animate-spin opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}

/** Drop inside a <Link> to fill it with a soft pulsing wash while pending --
 * used on pagination numbers where a spinner would crowd the digit. */
export function LinkPendingWash({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] bg-blush-300/60 transition-opacity",
        pending ? "animate-pulse opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
