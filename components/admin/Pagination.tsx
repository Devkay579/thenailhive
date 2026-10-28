import Link from "next/link";
import { cn } from "@/lib/cn";
import { LinkPendingWash } from "@/components/admin/PendingLink";
import { PageSizeSelect } from "@/components/admin/PageSizeSelect";

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/** Reads ?perPage= and clamps it to the allowed options. */
export function parsePageSize(value: string | undefined, fallback: number) {
  const n = Number(value);
  return PAGE_SIZE_OPTIONS.includes(n) ? n : fallback;
}

/** Page numbers to show: always first and last, a window round the current
 * page, and "gap" where a run is skipped (a single skipped page is shown
 * instead of a pointless "…"). */
export function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const keep = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 4) [2, 3, 4, 5].forEach((p) => keep.add(p));
  if (page >= totalPages - 3) [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => keep.add(p));

  const sorted = [...keep].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev === 2) out.push(prev + 1);
    else if (prev !== undefined && p - prev > 2) out.push("gap");
    out.push(p);
  });
  return out;
}

const stepClass =
  "relative inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-[transform,box-shadow]";
const stepEnabled =
  "border-wine-900 bg-[#fffdf9] text-wine-900 shadow-[2px_2px_0_var(--color-wine-900)] hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";
const stepDisabled = "pointer-events-none border-ink-950/10 text-ink-700/40";

export function Pagination({
  page,
  totalPages,
  total,
  basePath,
  searchParams,
  pageSize,
  pageSizeOptions,
  noun = "result",
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  /** Enables the "Showing 21–40 of 134" range. */
  pageSize?: number;
  /** Shows the per-page picker (the page must read ?perPage=). */
  pageSizeOptions?: number[];
  noun?: string;
}) {
  if (total === 0) return null;

  function hrefForPage(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const plural = total === 1 ? noun : `${noun}s`;
  const summary = pageSize ? (
    <>
      Showing{" "}
      <span className="font-medium text-ink-950">
        {(page - 1) * pageSize + 1}&ndash;{Math.min(page * pageSize, total)}
      </span>{" "}
      of <span className="font-medium text-ink-950">{total}</span> {plural}
    </>
  ) : (
    <>
      Page {page} of {totalPages} &middot; {total} {plural}
    </>
  );

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-col gap-3 border-t border-ink-950/10 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-ink-700">{summary}</p>
        {pageSizeOptions && pageSize ? (
          <PageSizeSelect pageSize={pageSize} options={pageSizeOptions} basePath={basePath} searchParams={searchParams} />
        ) : null}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center gap-1.5">
          <Link
            href={hrefForPage(page - 1)}
            aria-disabled={!hasPrev}
            tabIndex={hasPrev ? undefined : -1}
            className={cn(stepClass, hasPrev ? stepEnabled : stepDisabled)}
          >
            <LinkPendingWash />
            <span aria-hidden="true" className="relative">&larr;</span>
            <span className="relative hidden sm:inline">Prev</span>
          </Link>

          {/* Numbered pages (desktop); a compact "3 / 12" on phones. */}
          <span className="px-2 text-xs font-medium text-ink-700 sm:hidden">
            {page} / {totalPages}
          </span>
          <ol className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, totalPages).map((p, i) =>
              p === "gap" ? (
                <li key={`gap-${i}`} aria-hidden="true" className="w-6 text-center text-ink-700/60">
                  &hellip;
                </li>
              ) : (
                <li key={p}>
                  <Link
                    href={hrefForPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-medium tabular-nums transition-colors",
                      p === page
                        ? "pointer-events-none bg-wine-900 text-cream-50 shadow-[2px_2px_0_var(--color-blush-300)]"
                        : "text-ink-700 hover:bg-blush-100 hover:text-wine-900",
                    )}
                  >
                    <LinkPendingWash />
                    <span className="relative">{p}</span>
                  </Link>
                </li>
              ),
            )}
          </ol>

          <Link
            href={hrefForPage(page + 1)}
            aria-disabled={!hasNext}
            tabIndex={hasNext ? undefined : -1}
            className={cn(stepClass, hasNext ? stepEnabled : stepDisabled)}
          >
            <LinkPendingWash />
            <span className="relative hidden sm:inline">Next</span>
            <span aria-hidden="true" className="relative">&rarr;</span>
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
