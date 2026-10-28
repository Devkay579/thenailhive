/* About page content: editable from admin (About Page), stored as JSON in
   settings.about_content. Anything missing falls back to DEFAULT_ABOUT, so
   the page reads exactly as it was designed until someone edits it. Shared
   by server data loaders and the admin editor (no server-only imports). */

export type AboutPhoto = { url: string | null; caption: string };
export type AboutValue = { title: string; description: string };

export type AboutContent = {
  kicker: string;
  headingMain: string;
  headingAccent: string;
  paragraphOne: string;
  paragraphTwo: string;
  buttonLabel: string;
  photos: [AboutPhoto, AboutPhoto, AboutPhoto];
  valuesEyebrow: string;
  valuesTitle: string;
  valuesAccent: string;
  values: AboutValue[];
};

export const ABOUT_PHOTO_COUNT = 3;
export const MAX_ABOUT_VALUES = 8;

export const DEFAULT_ABOUT: AboutContent = {
  kicker: "Our Story",
  headingMain: "Nails are our craft.",
  headingAccent: "Confidence is our purpose.",
  paragraphOne:
    "THENAILHIVE started with a simple belief: your nails should feel like an extension of your personality. What began as a passion for detail has grown into a full studio offering GelX, acrylic, BIAB and hand-painted nail art — every set finished with the same care as the first.",
  paragraphTwo:
    "We keep our tools sterile, our products premium, and our designs original, so every client leaves with nails that feel as good as they look.",
  buttonLabel: "Book an Appointment",
  photos: [
    { url: null, caption: "the details" },
    { url: null, caption: "the finish" },
    { url: null, caption: "the statement" },
  ],
  valuesEyebrow: "Our values",
  valuesTitle: "What We",
  valuesAccent: "Stand For",
  values: [
    { title: "Quality", description: "Top-notch products & techniques." },
    { title: "Hygiene", description: "Clean, safe & professional." },
    { title: "Attention to Detail", description: "Because every nail matters." },
    { title: "Customer Satisfaction", description: "Your happiness is our priority." },
  ],
};

function str(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

/** Merges whatever is stored over the defaults, tolerating missing/odd data. */
export function normalizeAbout(raw: unknown): AboutContent {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const d = DEFAULT_ABOUT;

  const storedPhotos = Array.isArray(data.photos) ? data.photos : [];
  const photos = d.photos.map((def, i) => {
    const p = storedPhotos[i] as Record<string, unknown> | undefined;
    return {
      url: typeof p?.url === "string" && p.url ? p.url : null,
      caption: str(p?.caption, def.caption),
    };
  }) as AboutContent["photos"];

  const values = Array.isArray(data.values)
    ? (data.values as Record<string, unknown>[])
        .map((v) => ({ title: str(v?.title, "").trim(), description: str(v?.description, "").trim() }))
        .filter((v) => v.title)
        .slice(0, MAX_ABOUT_VALUES)
    : d.values;

  return {
    kicker: str(data.kicker, d.kicker),
    headingMain: str(data.headingMain, d.headingMain),
    headingAccent: str(data.headingAccent, d.headingAccent),
    paragraphOne: str(data.paragraphOne, d.paragraphOne),
    paragraphTwo: str(data.paragraphTwo, d.paragraphTwo),
    buttonLabel: str(data.buttonLabel, d.buttonLabel),
    photos,
    valuesEyebrow: str(data.valuesEyebrow, d.valuesEyebrow),
    valuesTitle: str(data.valuesTitle, d.valuesTitle),
    valuesAccent: str(data.valuesAccent, d.valuesAccent),
    values,
  };
}
