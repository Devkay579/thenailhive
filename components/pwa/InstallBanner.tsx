"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogoMark } from "@/components/ui/Logo";
import { promptInstall, useInstallMode } from "@/components/pwa/InstallAppButton";

const DISMISS_KEY = "nailhive-install-dismissed";
const SHOW_AFTER_MS = 6000;
// After "Not now", wait this long before asking again.
const SNOOZE_DAYS = 14;

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Private mode etc. -- it will just ask again next visit.
  }
}

/**
 * Phone-only card inviting visitors to add the site to their home screen.
 * Appears a few seconds after landing, sits above the bottom "Book" bar,
 * and stays away for two weeks once dismissed. Never shown if the site is
 * already installed or the browser can't install it.
 */
export function InstallBanner() {
  const mode = useInstallMode();
  const [due, setDue] = useState(false);
  const [closed, setClosed] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (recentlyDismissed()) return;
    const id = window.setTimeout(() => setDue(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(id);
  }, []);

  const visible = due && !closed && mode !== "hidden";

  function dismiss() {
    rememberDismissed();
    setClosed(true);
  }

  async function install() {
    if (mode === "ios") {
      setShowIosHelp(true);
      return;
    }
    await promptInstall();
    setClosed(true);
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="dialog"
          aria-label="Install the NailHive app"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] z-40 rounded-2xl border border-ink-950/10 bg-[#fffdf9] p-4 shadow-[0_18px_40px_-16px_rgb(46_14_21/0.45)] md:hidden"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wine-900 text-cream-50">
              <LogoMark className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold text-ink-950">Get the NailHive app</p>
              <p className="mt-0.5 text-sm leading-snug text-ink-700">
                Book in one tap from your home screen &mdash; faster every visit.
              </p>
            </div>
          </div>

          {showIosHelp ? (
            <p className="mt-3 rounded-xl bg-blush-100 px-3 py-2.5 text-sm leading-relaxed text-ink-950">
              In Safari, tap <span className="font-semibold text-wine-900">Share</span>{" "}
              <span aria-hidden="true">(the square with an arrow)</span>, then{" "}
              <span className="font-semibold text-wine-900">Add to Home Screen</span>.
            </p>
          ) : null}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="h-10 flex-1 rounded-full text-sm font-semibold text-ink-700"
            >
              {showIosHelp ? "Got it" : "Not now"}
            </button>
            {showIosHelp ? null : (
              <button
                type="button"
                onClick={install}
                className="h-10 flex-1 rounded-full bg-wine-900 text-sm font-semibold text-cream-50"
              >
                Install
              </button>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
