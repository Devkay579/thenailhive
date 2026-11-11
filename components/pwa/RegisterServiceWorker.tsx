"use client";

import { useEffect } from "react";

/** Registers public/sw.js (offline fallback page). Production only, so the
 * dev server's hot reloading is never served through a worker. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.error("Service worker registration failed", err);
    });
  }, []);

  return null;
}
