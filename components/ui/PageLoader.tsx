import { LogoMark } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

/**
 * Full-page loading state for the public site: the hive logo bouncing on its
 * shadow. Used by every loading.tsx outside the admin, so navigating between
 * pages shows this straight away instead of a frozen screen.
 */
export function PageLoader({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("flex min-h-[60vh] flex-col items-center justify-center px-4 py-20", className)}
    >
      <div aria-hidden="true" className="flex flex-col items-center">
        <div className="logo-bounce text-wine-900">
          <LogoMark className="h-14 w-14" />
        </div>
        <span className="logo-bounce-shadow mt-2 h-2 w-12 rounded-[50%] bg-wine-950" />
      </div>
      <p className="mt-6 font-script text-xl italic text-wine-900">{label}</p>
    </div>
  );
}
