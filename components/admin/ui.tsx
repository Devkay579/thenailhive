import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  sub,
  tone = "paper",
}: {
  label: string;
  value: string;
  sub?: string;
  /** "wine" = the one figure on a row that should jump out. */
  tone?: "paper" | "wine";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 sm:p-5",
        tone === "wine"
          ? "grain grain-light bg-wine-900 text-cream-50 shadow-[5px_5px_0_var(--color-blush-300)]"
          : "border border-ink-950/10 bg-[#fffdf9] shadow-[0_1px_0_rgb(26_21_18/0.03)]",
      )}
    >
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.2em]",
          tone === "wine" ? "text-blush-300" : "text-ink-700",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-2 truncate font-display text-2xl font-semibold tracking-tight sm:text-3xl",
          tone === "wine" ? "text-cream-50" : "text-ink-950",
        )}
      >
        {value}
      </p>
      {sub ? (
        <p className={cn("mt-0.5 text-xs", tone === "wine" ? "text-cream-100/70" : "text-ink-700")}>{sub}</p>
      ) : null}
    </div>
  );
}

export function AdminCard({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-950/10 bg-[#fffdf9] p-4 shadow-[0_1px_0_rgb(26_21_18/0.03),10px_14px_30px_-22px_rgb(74_22_32/0.35)] sm:p-6",
        className,
      )}
    >
      {title ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-ink-950/10 pb-4">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** Page title block used at the top of every admin page. */
export function AdminPageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-950/10 pb-5">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">{title}</h1>
        {sub ? <p className="mt-1.5 text-sm text-ink-700">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "border-amber-300/70 bg-amber-50 text-amber-800 [--dot:#d97706]",
  deposit_paid: "border-blush-300 bg-blush-100 text-wine-900 [--dot:var(--color-wine-700)]",
  confirmed: "border-emerald-300/70 bg-emerald-50 text-emerald-800 [--dot:#059669]",
  completed: "border-ink-950/15 bg-cream-100 text-ink-950 [--dot:var(--color-ink-700)]",
  cancelled: "border-red-300/70 bg-red-50 text-red-700 [--dot:#dc2626]",
  no_show: "border-red-300/70 bg-red-50 text-red-700 [--dot:#dc2626]",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  deposit_paid: "Deposit paid",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        STATUS_STYLES[status] ?? "border-ink-950/15 bg-cream-100 text-ink-950 [--dot:var(--color-ink-700)]",
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--dot)]" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export const inputClass =
  "w-full rounded-xl border border-ink-950/15 bg-[#fffdf9] px-3 py-2 text-sm text-ink-950 shadow-[inset_0_1px_2px_rgb(26_21_18/0.05)] transition-[border-color,box-shadow] placeholder:text-ink-700/45 focus:border-wine-700 focus:outline-none focus:ring-4 focus:ring-blush-200/70";
export const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700";

/** Letterpress action button classes, for admin <button>s and links. */
export const primaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-wine-950 bg-wine-900 px-4 text-sm font-medium text-cream-50 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] duration-150 hover:-translate-x-px hover:-translate-y-px hover:bg-wine-800 hover:shadow-[4px_4px_0_var(--color-blush-300)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60";
export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-wine-900 bg-[#fffdf9] px-4 text-sm font-medium text-wine-900 shadow-[3px_3px_0_var(--color-wine-900)] transition-[transform,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_var(--color-wine-900)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60";

export function DownloadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4.5 19.5h15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EyeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
