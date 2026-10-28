"use client";

import { formatNaira } from "@/lib/mock-data";
import { StepHeading, optionClass } from "./StepHeading";
import { findNextService, findService, type BookableService, type WizardAction, type WizardState } from "./types";

/** A fingertip with a nail whose free edge grows with the chosen length. */
function LengthGlyph({ level, selected }: { level: number; selected: boolean }) {
  const extension = 8 + level * 11; // px of nail past the fingertip
  const top = 58 - extension;
  return (
    <svg viewBox="0 0 40 96" className="h-24 w-10" aria-hidden="true">
      {/* finger */}
      <path d="M6 96V62c0-9 6-14 14-14s14 5 14 14v34Z" fill="#f0d2cd" stroke="#1a1512" strokeOpacity="0.14" />
      {/* nail */}
      <path
        d={`M10 70V${top + 10}C10 ${top} 30 ${top} 30 ${top + 10}V70c0 3-3 5-10 5s-10-2-10-5Z`}
        fill={selected ? "#6d2231" : "#c9687c"}
        className="transition-colors"
      />
      <path
        d={`M14 66V${top + 12}c0-3 1-5 3-6`}
        stroke="#fff"
        strokeOpacity="0.7"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function LengthGrid({
  service,
  selectedId,
  onSelect,
}: {
  service: BookableService;
  selectedId: string | null;
  onSelect: (priceId: string) => void;
}) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {service.prices.map((price, i) => {
        const selected = selectedId === price.id;
        return (
          <button
            key={price.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(price.id)}
            className={`flex flex-col items-center px-3 pb-4 pt-5 text-center ${optionClass(selected)}`}
          >
            <LengthGlyph level={service.prices.length === 1 ? 1 : i} selected={selected} />
            <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700">
              {price.lengthLabel}
            </span>
            <span className="mt-1 font-display text-lg font-semibold text-wine-900">
              {formatNaira(price.priceNgn)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function LengthStep({
  services,
  state,
  dispatch,
}: {
  services: BookableService[];
  state: WizardState;
  dispatch: (action: WizardAction) => void;
}) {
  const service = findService(services, state.serviceId);
  const nextService = findNextService(services, state);

  if (!service) return null;

  // Removal has a single tier that's picked automatically, so when a new set
  // follows it, only the new set's length needs choosing here.
  const showPrimary = !nextService || service.prices.length > 1;

  return (
    <div>
      <StepHeading
        n={2}
        title="Choose your"
        accent="length"
        sub={nextService ? `${service.name}, then ${nextService.name}` : service.name}
      />
      {showPrimary ? (
        <LengthGrid
          service={service}
          selectedId={state.servicePriceId}
          onSelect={(id) => dispatch({ type: "SET_LENGTH", servicePriceId: id })}
        />
      ) : null}
      {nextService ? (
        <div className={showPrimary ? "mt-10" : undefined}>
          {showPrimary ? (
            <p className="font-display text-lg font-semibold text-ink-950">After removal: {nextService.name}</p>
          ) : null}
          <LengthGrid
            service={nextService}
            selectedId={state.nextServicePriceId}
            onSelect={(id) => dispatch({ type: "SET_NEXT_LENGTH", nextServicePriceId: id })}
          />
        </div>
      ) : null}
    </div>
  );
}
