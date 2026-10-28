"use client";

import { useEffect, useReducer, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/lib/mock-data";
import { ServiceStep } from "./ServiceStep";
import { LengthStep } from "./LengthStep";
import { ExtrasStep } from "./ExtrasStep";
import { ScheduleStep } from "./ScheduleStep";
import { DetailsStep } from "./DetailsStep";
import { ReviewStep } from "./ReviewStep";
import { BookingSummary, computeTotals } from "./BookingSummary";
import {
  STEPS,
  STEP_LABELS,
  canAdvance,
  initialStateForService,
  startStepForService,
  wizardReducer,
  type BookableAddon,
  type BookableService,
  type Step,
} from "./types";

export function BookingWizard({
  services,
  addons,
  depositPercent,
  policyText,
}: {
  services: BookableService[];
  addons: BookableAddon[];
  depositPercent: number;
  policyText: string;
}) {
  const searchParams = useSearchParams();
  // "Book" links on the services/gallery pages pass ?service=<slug>, so start
  // with that service already chosen.
  const [state, dispatch] = useReducer(wizardReducer, searchParams.get("service"), (slug) =>
    initialStateForService(services, slug),
  );
  const [startStep] = useState(() => startStepForService(services, state));
  const [draftId] = useState(() => crypto.randomUUID());

  // Swap ?service=… for the step URL so browser Back from here returns to the
  // page the client came from rather than re-applying the preselection.
  useEffect(() => {
    if (searchParams.get("service") !== null) {
      window.history.replaceState(null, "", `/book?step=${startStep}`);
    }
  }, [searchParams, startStep]);

  const stepParam = searchParams.get("step");
  const stepIndex = stepParam && (STEPS as readonly string[]).includes(stepParam)
    ? STEPS.indexOf(stepParam as Step)
    : STEPS.indexOf(startStep);
  const step: Step = STEPS[stepIndex];

  // Steps only change client state, so update the URL with the native History
  // API (which Next syncs into useSearchParams) instead of router.push, which
  // would re-render the page on the server and lag every step change.
  function goToStep(index: number) {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, index));
    window.history.pushState(null, "", `/book?step=${STEPS[clamped]}`);
  }

  const isLast = stepIndex === STEPS.length - 1;
  const canGoNext = canAdvance(step, state, services);
  const { subtotal } = computeTotals(services, addons, state, depositPercent);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
      <div className="min-w-0">
        <StepIndicator steps={STEPS.map((s) => STEP_LABELS[s])} activeIndex={stepIndex} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10"
          >
            {step === "service" && <ServiceStep services={services} state={state} dispatch={dispatch} />}
            {step === "length" && <LengthStep services={services} state={state} dispatch={dispatch} />}
            {step === "extras" && <ExtrasStep addons={addons} state={state} dispatch={dispatch} />}
            {step === "schedule" && <ScheduleStep state={state} dispatch={dispatch} />}
            {step === "details" && (
              <DetailsStep state={state} dispatch={dispatch} draftId={draftId} policyText={policyText} />
            )}
            {step === "review" && (
              <ReviewStep
                services={services}
                addons={addons}
                state={state}
                depositPercent={depositPercent}
                onSlotTaken={() => goToStep(STEPS.indexOf("schedule"))}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Step controls: a sticky bar on phones, inline on larger screens. */}
        <div className="sticky bottom-0 z-20 -mx-4 mt-10 border-t border-ink-950/10 bg-cream-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-6">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => goToStep(stepIndex - 1)}
              disabled={stepIndex === 0}
              className="group flex items-center gap-2 text-sm font-semibold text-ink-700 transition-colors hover:text-wine-900 disabled:invisible"
            >
              <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">&larr;</span>
              Back
            </button>

            {subtotal > 0 ? (
              <p className="text-center text-xs text-ink-700 lg:hidden">
                Total
                <span className="block font-display text-base font-semibold text-wine-900">{formatNaira(subtotal)}</span>
              </p>
            ) : null}

            {!isLast ? (
              <Button type="button" onClick={() => goToStep(stepIndex + 1)} disabled={!canGoNext}>
                {step === "extras" && state.addonIds.length === 0 ? "Skip" : "Continue"}
                <span aria-hidden="true">&rarr;</span>
              </Button>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <BookingSummary services={services} addons={addons} state={state} depositPercent={depositPercent} />
          <p className="mt-5 text-center font-script text-lg italic text-ink-700">
            Where your nails become the statement.
          </p>
        </div>
      </aside>
    </div>
  );
}
