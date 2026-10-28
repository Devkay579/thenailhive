import { cn } from "@/lib/cn";

/* Loading UI for the admin: a branded "polish" loader plus skeleton blocks
   shaped like the real pages, so a slow Supabase round-trip shows the page's
   outline instead of a blank screen. */

// Nail heights read left to right like a hand: pinky, ring, middle, index, thumb.
const NAILS = [
  { h: "h-5", delay: "0s" },
  { h: "h-7", delay: "0.12s" },
  { h: "h-8", delay: "0.24s" },
  { h: "h-7", delay: "0.36s" },
  { h: "h-5", delay: "0.48s" },
];

/** Five nails being painted one after another. The studio's own spinner. */
export function PolishLoader({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex items-end gap-3", className)}>
      <div aria-hidden="true" className="flex items-end gap-1">
        {NAILS.map((n, i) => (
          <span
            key={i}
            className={cn(
              "relative w-3 overflow-hidden rounded-b-[3px] rounded-t-full border border-wine-900/30 bg-cream-50",
              n.h,
            )}
          >
            <span
              className="polish-fill absolute inset-0 bg-gradient-to-t from-wine-900 via-wine-700 to-blush-300"
              style={{ animationDelay: n.delay }}
            />
            {/* Glint on the wet polish */}
            <span className="absolute left-[3px] top-1 h-2 w-[2px] rounded-full bg-cream-50/70" />
          </span>
        ))}
      </div>
      <span className="pb-0.5 font-script text-lg italic leading-none text-wine-900">{label}</span>
    </div>
  );
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden="true" className={cn("skeleton h-4", className)} style={style} />;
}

/** Page title (real text, since it's known up front) with the loader beside it. */
export function LoadingHeader({ title, label, action = false }: { title: string; label: string; action?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">{title}</h1>
        <PolishLoader label={label} className="mt-2" />
      </div>
      {action ? <Skeleton className="h-10 w-36 rounded-full" /> : null}
    </div>
  );
}

function SkeletonCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-950/10 bg-[#fffdf9] p-4 shadow-[0_1px_0_rgb(26_21_18/0.03),10px_14px_30px_-22px_rgb(74_22_32/0.35)] sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Table on desktop, stacked cards on mobile -- mirrors the list pages. */
export function TableSkeleton({ columns = 6, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <SkeletonCard>
      <div className="space-y-3 sm:hidden">
        {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-ink-950/10 p-3">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      <div className="hidden sm:block">
        <div className="flex gap-4 border-b border-ink-950/10 pb-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        <div className="divide-y divide-ink-950/[0.07]">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 py-3">
              {Array.from({ length: columns }).map((_, c) => (
                <Skeleton
                  key={c}
                  // Vary widths so it reads as data, not a grid of bars.
                  className={cn("h-4 flex-1", c === columns - 1 && "h-5 max-w-24 rounded-full", (r + c) % 3 === 0 && "max-w-[60%]")}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <PaginationSkeleton />
    </SkeletonCard>
  );
}

export function PaginationSkeleton() {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-ink-950/10 pt-4">
      <Skeleton className="h-4 w-40" />
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-full" />
        ))}
      </div>
    </div>
  );
}

/** Stacked message/review style cards. */
export function CardListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <SkeletonCard>
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="space-y-2.5 rounded-xl border border-ink-950/10 p-4">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
      <PaginationSkeleton />
    </SkeletonCard>
  );
}

/** Key/value detail panels (booking + client detail pages). */
export function DetailSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <SkeletonCard>
      <Skeleton className="mb-5 h-6 w-40" />
      <div className="divide-y divide-ink-950/[0.07]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between gap-4 py-2.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className={cn("h-4", i % 2 ? "w-28" : "w-40")} />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

/** Generic form/settings card. */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <SkeletonCard>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-10 w-32 rounded-full" />
    </SkeletonCard>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-ink-950/10 bg-[#fffdf9] p-4 sm:p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
