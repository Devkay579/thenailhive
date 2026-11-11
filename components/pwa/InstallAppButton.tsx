"use client";

import { useEffect, useState } from "react";
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

/**
 * "Install app" for the Studio Desk. On Android/desktop Chrome it triggers the
 * browser's install prompt; iOS has no such API, so it shows the Share ->
 * Add to Home Screen steps instead. Hidden once the app is installed.
 */
export function InstallAppButton({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    // Browser API state, only knowable after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isIos()) setMode("ios");

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("prompt");
    }
    function onInstalled() {
      setDeferred(null);
      setMode("hidden");
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  async function handleClick() {
    if (mode === "ios") {
      setShowIosHelp((v) => !v);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // The event can only be used once either way.
    setDeferred(null);
    if (outcome === "accepted") setMode("hidden");
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={mode === "ios" ? showIosHelp : undefined}
        className={cn(
          "flex w-full items-center justify-between rounded-xl bg-blush-300 px-3 py-2 text-left text-sm font-semibold text-wine-950 transition-colors hover:bg-cream-50",
        )}
      >
        Install app
        <span aria-hidden="true">&darr;</span>
      </button>
      {mode === "ios" && showIosHelp ? (
        <p className="mt-2 px-1 text-xs leading-relaxed text-cream-100/75">
          In Safari, tap <span className="font-semibold text-cream-50">Share</span>, then{" "}
          <span className="font-semibold text-cream-50">Add to Home Screen</span>.
        </p>
      ) : null}
    </div>
  );
}
