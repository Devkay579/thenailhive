"use client";

import { formatNaira } from "@/lib/mock-data";
import { StepHeading } from "./StepHeading";
import type { BookableAddon, WizardAction, WizardState } from "./types";

export function ExtrasStep({
  addons,
  state,
  dispatch,
}: {
  addons: BookableAddon[];
  state: WizardState;
  dispatch: (action: WizardAction) => void;
}) {
  return (
    <div>
      <StepHeading n={3} title="Add a little" accent="extra" sub="Optional nail art, charged on top of your set. Skip if you're keeping it clean." />
      <ul className="paper-stack mr-3 mt-8 rounded-sm px-5 py-3 sm:px-7">
        {addons.map((addon) => {
          const checked = state.addonIds.includes(addon.id);
          return (
            <li key={addon.id} className="border-b border-dashed border-ink-950/10 last:border-0">
              <label className="flex cursor-pointer items-center gap-4 py-4 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => dispatch({ type: "TOGGLE_ADDON", addonId: addon.id })}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-ink-950/30 text-transparent transition-colors peer-checked:border-wine-900 peer-checked:bg-wine-900 peer-checked:text-cream-50 peer-focus-visible:ring-2 peer-focus-visible:ring-blush-300"
                >
                  <svg viewBox="0 0 12 12" className="h-3 w-3">
                    <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="flex min-w-0 flex-1 items-end">
                  <span className={checked ? "font-medium text-wine-900" : "text-ink-950"}>{addon.name}</span>
                  <span className="leader" aria-hidden="true" />
                  <span className="shrink-0 font-display text-base font-semibold text-wine-900">
                    +{formatNaira(addon.priceNgn)}
                    {addon.suffix ? (
                      <span className="ml-1 font-sans text-xs font-normal text-ink-700">{addon.suffix}</span>
                    ) : null}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
