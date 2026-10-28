"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatNaira } from "@/lib/mock-data";
import { Nail3D, type NailFinish } from "@/components/three/Nail3D";
import { StepHeading, Tick, optionClass } from "./StepHeading";
import { REMOVAL_ONLY, isRemoval, selectServiceAction, type BookableService, type WizardAction, type WizardState } from "./types";

const FINISHES: NailFinish[] = ["wine", "french", "olive", "milk", "rose", "pearl", "cocoa", "blush"];

export function ServiceStep({
  services,
  state,
  dispatch,
}: {
  services: BookableService[];
  state: WizardState;
  dispatch: (action: WizardAction) => void;
}) {
  const removalSelected = isRemoval(services, state.serviceId);
  const nextOptions = services.filter((s) => s.id !== state.serviceId);

  return (
    <div>
      <StepHeading n={1} title="Choose a" accent="service" sub="What are we doing today?" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {services.map((service, i) => {
          const cheapest = Math.min(...service.prices.map((p) => p.priceNgn));
          const selected = state.serviceId === service.id;
          return (
            <button
              key={service.id}
              type="button"
              aria-pressed={selected}
              onClick={() => dispatch(selectServiceAction(service))}
              className={`flex items-center gap-4 p-4 ${optionClass(selected)}`}
            >
              <span className="flex h-16 w-12 shrink-0 items-end justify-center rounded-xl bg-blush-100 pb-1.5">
                <Nail3D finish={FINISHES[i % FINISHES.length]} className="h-11 w-auto" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-semibold leading-tight text-ink-950">
                  {service.name}
                </span>
                <span className="mt-1 block text-sm text-ink-700">
                  from <span className="font-display font-semibold text-wine-900">{formatNaira(cheapest)}</span>
                </span>
              </span>
              <Tick on={selected} />
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {removalSelected ? (
          <motion.div
            key="next-service"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-10 border-t border-ink-950/10 pt-8">
              <p className="font-display text-xl font-semibold text-ink-950">
                What&apos;s <span className="font-script font-medium italic text-wine-900">next</span> after removal?
              </p>
              <p className="mt-1 text-sm text-ink-700">
                Getting a new set done straight after? Pick it here and we&apos;ll book both together.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { id: REMOVAL_ONLY, name: "Just removal", detail: "Nothing else this visit" },
                  ...nextOptions.map((s) => ({
                    id: s.id,
                    name: s.name,
                    detail: `from ${formatNaira(Math.min(...s.prices.map((p) => p.priceNgn)))}`,
                  })),
                ].map((option) => {
                  const selected = state.nextServiceId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => dispatch({ type: "SET_NEXT_SERVICE", nextServiceId: option.id })}
                      className={`flex items-center gap-3 px-4 py-3 ${optionClass(selected)}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-base font-semibold leading-tight text-ink-950">
                          {option.name}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-700">{option.detail}</span>
                      </span>
                      <Tick on={selected} />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
