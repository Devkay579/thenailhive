"use client";

import type { ReactNode } from "react";
import { useActionFormPending } from "@/components/ui/ActionForm";

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "",
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const isPending = useActionFormPending();

  return (
    <button type="submit" disabled={isPending} className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}>
      {isPending ? (
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
