"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** Small "Copy" pill that copies `value` to the clipboard and flips to
 * "Copied" for a moment. */
export function CopyButton({ value, label = "Copy", className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (old browser / insecure context) -- the number is
      // still on screen to copy by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
        className,
      )}
    >
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
