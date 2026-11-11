"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

// Chrome/Edge/Android fire this before showing their own install prompt; it
// isn't in the TS DOM lib yet.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "hidden" | "prompt" | "ios";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag for home-screen apps.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac with touch.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/* The browser fires `beforeinstallprompt` once, often right after load --
   before a button inside a closed menu has even mounted. So the event is
   caught here, at module load, and shared with every button via a tiny store. */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getMode(): Mode {
  if (installed || isStandalone()) return "hidden";
  if (deferredPrompt) return "prompt";
  if (isIos()) return "ios";
  return "hidden";
}

export function useInstallMode() {
  // Browser-only state: render nothing on the server and during hydration.
  return useSyncExternalStore(subscribe, getMode, () => "hidden" as Mode);
}

export async function promptInstall() {
  const event = deferredPrompt;
  if (!event) return;
  await event.prompt();
  const { outcome } = await event.userChoice;
  // The event can only be used once either way.
  deferredPrompt = null;
  if (outcome === "accepted") installed = true;
  notify();
}

const VARIANTS = {
  // Admin sidebar (dark wine panel).
  admin: {
    button:
      "flex w-full items-center justify-between rounded-xl bg-blush-300 px-3 py-2 text-left text-sm font-semibold text-wine-950 transition-colors hover:bg-cream-50",
    help: "text-cream-100/75",
    strong: "text-cream-50",
  },
  // Public mobile menu (full-screen wine sheet).
  menu: {
    button:
      "flex w-full items-center justify-center gap-2 rounded-full border border-cream-50/30 px-5 py-3 text-sm font-semibold text-cream-50 transition-colors hover:bg-cream-50/10",
    help: "text-center text-cream-100/75",
    strong: "text-cream-50",
  },
  // Public footer (dark wine), sits under the "Book an appointment" link.
  footer: {
    button:
      "inline-flex items-center gap-2 rounded-full border border-cream-50/30 px-4 py-2 text-sm font-semibold text-cream-50 transition-colors hover:border-blush-300 hover:text-blush-300",
    help: "max-w-xs text-cream-100/75",
    strong: "text-cream-50",
  },
  // Public mobile bottom bar, beside "Book Appointment".
  bar: {
    button:
      "flex h-full items-center gap-1 rounded-full border-2 border-wine-900 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-wine-900",
    help: "absolute bottom-full right-0 mb-3 w-56 rounded-xl border border-ink-950/10 bg-[#fffdf9] p-3 text-ink-700 shadow-lg",
    strong: "text-wine-900",
  },
  // Public desktop header (cream bar).
  nav: {
    button:
      "flex items-center gap-1.5 rounded-full border border-wine-900/30 px-3.5 py-1.5 text-xs font-semibold text-wine-900 transition-colors hover:border-wine-900 hover:bg-wine-900/5",
    help: "absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-ink-950/10 bg-[#fffdf9] p-3 text-ink-700 shadow-lg",
    strong: "text-wine-900",
  },
} as const;

/**
 * "Install app" button. On Android/desktop Chrome it triggers the browser's
 * install prompt; iOS has no such API, so it shows the Share -> Add to Home
 * Screen steps instead. Hidden once installed or when the browser can't
 * install the site.
 */
export function InstallAppButton({
  className,
  variant = "admin",
  label = "Install app",
}: {
  className?: string;
  variant?: keyof typeof VARIANTS;
  label?: string;
}) {
  const mode = useInstallMode();
  const [showIosHelp, setShowIosHelp] = useState(false);
  const styles = VARIANTS[variant];

  // Close the iOS tip when tapping anywhere else (matters for the header popover).
  useEffect(() => {
    if (!showIosHelp || (variant !== "nav" && variant !== "bar")) return;
    const close = () => setShowIosHelp(false);
    const id = window.setTimeout(() => window.addEventListener("click", close, { once: true }));
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("click", close);
    };
  }, [showIosHelp, variant]);

  if (mode === "hidden") return null;

  function handleClick() {
    if (mode === "ios") setShowIosHelp((v) => !v);
    else void promptInstall();
  }

  return (
    <div className={cn((variant === "nav" || variant === "bar") && "relative", className)}>
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={mode === "ios" ? showIosHelp : undefined}
        className={styles.button}
      >
        {label}
        <span aria-hidden="true">&darr;</span>
      </button>
      {mode === "ios" && showIosHelp ? (
        <p className={cn("mt-2 px-1 text-xs leading-relaxed", styles.help)}>
          In Safari, tap <span className={cn("font-semibold", styles.strong)}>Share</span>, then{" "}
          <span className={cn("font-semibold", styles.strong)}>Add to Home Screen</span>.
        </p>
      ) : null}
    </div>
  );
}
