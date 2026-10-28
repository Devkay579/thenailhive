"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { primaryButtonClass } from "@/components/admin/ui";

/** Submit button for a GET filter <Form> (next/form): shows a spinner while
 * the filtered results are loading. */
export function FilterSubmitButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`${primaryButtonClass} h-[38px] ${className}`}>
      {pending ? (
        <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : null}
      {children}
    </button>
  );
}
