import type { BookableAddon, BookableService } from "@/lib/data/services";

export type { BookableAddon, BookableService };

export const STEPS = ["service", "length", "extras", "schedule", "details", "review"] as const;
export type Step = (typeof STEPS)[number];

export const STEP_LABELS: Record<Step, string> = {
  service: "Service",
  length: "Length",
  extras: "Extras",
  schedule: "Date & Time",
  details: "Your Details",
  review: "Review & Pay",
};

export type InspirationUpload = {
  path: string;
  previewUrl: string;
  fileName: string;
};

/** Slug of the service that can be followed by a second service in the same
 * appointment (take the old set off, then put something new on). */
export const REMOVAL_SLUG = "removal";

/** `nextServiceId` value for a removal booking with nothing done after it. */
export const REMOVAL_ONLY = "removal-only";

export type WizardState = {
  serviceId: string | null;
  servicePriceId: string | null;
  /** Removal bookings only: the service done after removal, or REMOVAL_ONLY. */
  nextServiceId: string | null;
  nextServicePriceId: string | null;
  addonIds: string[];
  date: string | null;
  startTime: string | null;
  name: string;
  phone: string;
  email: string;
  instagram: string;
  notes: string;
  inspirationUploads: InspirationUpload[];
  policyAccepted: boolean;
};

export const initialWizardState: WizardState = {
  serviceId: null,
  servicePriceId: null,
  nextServiceId: null,
  nextServicePriceId: null,
  addonIds: [],
  date: null,
  startTime: null,
  name: "",
  phone: "",
  email: "",
  instagram: "",
  notes: "",
  inspirationUploads: [],
  policyAccepted: false,
};

export type WizardAction =
  | { type: "SET_SERVICE"; serviceId: string; defaultPriceId?: string }
  | { type: "SET_LENGTH"; servicePriceId: string }
  | { type: "SET_NEXT_SERVICE"; nextServiceId: string }
  | { type: "SET_NEXT_LENGTH"; nextServicePriceId: string }
  | { type: "TOGGLE_ADDON"; addonId: string }
  | { type: "SET_SCHEDULE"; date: string; startTime: string }
  | { type: "SET_FIELD"; field: "name" | "phone" | "email" | "instagram" | "notes"; value: string }
  | { type: "ADD_INSPIRATION"; upload: InspirationUpload }
  | { type: "REMOVE_INSPIRATION"; path: string }
  | { type: "SET_POLICY_ACCEPTED"; value: boolean };

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_SERVICE":
      if (state.serviceId === action.serviceId) return state;
      // Changing the service invalidates length/extras/schedule chosen for the old one.
      return {
        ...state,
        serviceId: action.serviceId,
        // Single-tier services (e.g. Removal's "Soak Off") need no length choice.
        servicePriceId: action.defaultPriceId ?? null,
        nextServiceId: null,
        nextServicePriceId: null,
        addonIds: [],
        date: null,
        startTime: null,
      };
    case "SET_LENGTH":
      if (state.servicePriceId === action.servicePriceId) return state;
      return { ...state, servicePriceId: action.servicePriceId, date: null, startTime: null };
    case "SET_NEXT_SERVICE":
      if (state.nextServiceId === action.nextServiceId) return state;
      return {
        ...state,
        nextServiceId: action.nextServiceId,
        nextServicePriceId: null,
        date: null,
        startTime: null,
      };
    case "SET_NEXT_LENGTH":
      if (state.nextServicePriceId === action.nextServicePriceId) return state;
      return { ...state, nextServicePriceId: action.nextServicePriceId, date: null, startTime: null };
    case "TOGGLE_ADDON": {
      const has = state.addonIds.includes(action.addonId);
      return {
        ...state,
        addonIds: has
          ? state.addonIds.filter((id) => id !== action.addonId)
          : [...state.addonIds, action.addonId],
      };
    }
    case "SET_SCHEDULE":
      return { ...state, date: action.date, startTime: action.startTime };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "ADD_INSPIRATION":
      return { ...state, inspirationUploads: [...state.inspirationUploads, action.upload] };
    case "REMOVE_INSPIRATION":
      return {
        ...state,
        inspirationUploads: state.inspirationUploads.filter((u) => u.path !== action.path),
      };
    case "SET_POLICY_ACCEPTED":
      return { ...state, policyAccepted: action.value };
    default:
      return state;
  }
}

export function formatTimeLabel(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatDateLabel(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function findService(services: BookableService[], id: string | null) {
  return services.find((s) => s.id === id) ?? null;
}

export function findServicePrice(services: BookableService[], id: string | null) {
  for (const service of services) {
    const price = service.prices.find((p) => p.id === id);
    if (price) return { service, price };
  }
  return null;
}

/** Picking a service; single-tier services (e.g. Removal's "Soak Off") get their only tier selected too. */
export function selectServiceAction(service: BookableService): WizardAction {
  return {
    type: "SET_SERVICE",
    serviceId: service.id,
    defaultPriceId: service.prices.length === 1 ? service.prices[0].id : undefined,
  };
}

/** Wizard state for arriving from a "Book" link that names a service
 * (/book?service=<slug>), so the client doesn't have to pick it again. */
export function initialStateForService(services: BookableService[], slug: string | null): WizardState {
  const service = services.find((s) => s.slug === slug);
  return service ? wizardReducer(initialWizardState, selectServiceAction(service)) : initialWizardState;
}

/** The first step still needing a choice once a service is preselected. */
export function startStepForService(services: BookableService[], state: WizardState): Step {
  const service = findService(services, state.serviceId);
  if (!service || service.slug === REMOVAL_SLUG) return "service"; // removal still needs "what's next?"
  return state.servicePriceId ? "extras" : "length";
}

export function isRemoval(services: BookableService[], serviceId: string | null) {
  return findService(services, serviceId)?.slug === REMOVAL_SLUG;
}

/** The service booked after removal, or null for "just removal" / non-removal bookings. */
export function findNextService(services: BookableService[], state: WizardState) {
  if (!isRemoval(services, state.serviceId) || state.nextServiceId === REMOVAL_ONLY) return null;
  return findService(services, state.nextServiceId);
}

export type DetailsField = "name" | "phone" | "email";

/** Why each required contact field is invalid (null when it's fine). Shared by
 * the inline messages on the details step and the Continue-button gate. */
export function detailsErrors(state: WizardState): Record<DetailsField, string | null> {
  const name = state.name.trim();
  const phone = state.phone.trim();
  const phoneDigits = phone.replace(/[\s\-().]/g, "");
  const email = state.email.trim();

  return {
    name: name.length === 0 ? "Please enter your name." : name.length < 2 ? "Name looks too short." : null,
    phone:
      phone.length === 0
        ? "Please enter your phone number."
        : !/^\+?\d+$/.test(phoneDigits)
          ? "Use digits only, e.g. 08123456789."
          : phoneDigits.replace("+", "").length < 7 || phoneDigits.replace("+", "").length > 15
            ? "That number doesn't look complete. Use e.g. 08123456789."
            : null,
    email:
      email.length === 0
        ? "Please enter your email."
        : !/^\S+@\S+\.\S+$/.test(email)
          ? "Enter a valid email, e.g. name@example.com."
          : null,
  };
}

export function canAdvance(step: Step, state: WizardState, services: BookableService[]): boolean {
  const removal = isRemoval(services, state.serviceId);
  switch (step) {
    case "service":
      return Boolean(state.serviceId) && (!removal || Boolean(state.nextServiceId));
    case "length":
      return (
        Boolean(state.servicePriceId) &&
        (!findNextService(services, state) || Boolean(state.nextServicePriceId))
      );
    case "extras":
      return true;
    case "schedule":
      return Boolean(state.date && state.startTime);
    case "details":
      return Object.values(detailsErrors(state)).every((e) => e === null) && state.policyAccepted;
    case "review":
      return true;
    default:
      return false;
  }
}
