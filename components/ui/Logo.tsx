import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 3 42 14v20L24 45 6 34V14Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24 16c-4 0-7 2.5-7 6.5S20 29 24 29s7-2.5 7-6.5S28 16 24 16Z"
        fill="currentColor"
      />
      <path
        d="M24 16v13M18.5 19.5h11M17.5 26h13"
        stroke="var(--color-cream-50)"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 text-wine-900", className)}
    >
      <LogoMark className="h-7 w-7 sm:h-8 sm:w-8" />
      <span className="font-display text-lg font-semibold tracking-wide sm:text-xl">
        THENAILHIVE
      </span>
    </Link>
  );
}
