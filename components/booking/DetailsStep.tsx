"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { StepHeading } from "./StepHeading";
import { detailsErrors, type DetailsField, type WizardAction, type WizardState } from "./types";

const MAX_PHOTOS = 3;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null;
  return (
    <p id={id} aria-live="polite" className="mt-1.5 text-xs text-wine-700">
      {message}
    </p>
  );
}

export function DetailsStep({
  state,
  dispatch,
  draftId,
  policyText,
}: {
  state: WizardState;
  dispatch: (action: WizardAction) => void;
  draftId: string;
  policyText: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Only flag a field once the client has left it, so they aren't told off mid-typing.
  const [touched, setTouched] = useState<Record<DetailsField, boolean>>({
    name: false,
    phone: false,
    email: false,
  });

  const errors = detailsErrors(state);
  const fieldsValid = Object.values(errors).every((e) => e === null);

  function field(name: DetailsField) {
    const error = touched[name] ? errors[name] : null;
    return {
      error,
      input: {
        id: name,
        required: true,
        value: state[name],
        onChange: (e: ChangeEvent<HTMLInputElement>) =>
          dispatch({ type: "SET_FIELD", field: name, value: e.target.value }),
        onBlur: () => setTouched((t) => ({ ...t, [name]: true })),
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? `${name}-error` : undefined,
        className: "form-field",
      },
    };
  }

  const nameField = field("name");
  const phoneField = field("phone");
  const emailField = field("email");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const remaining = MAX_PHOTOS - state.inspirationUploads.length;
    const toUpload = Array.from(files).slice(0, Math.max(remaining, 0));
    if (toUpload.length === 0) {
      setUploadError(`You can upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();

    for (const file of toUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError("Please upload JPG, PNG, WEBP or HEIC images only.");
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setUploadError("Each photo must be under 5MB.");
        continue;
      }

      const path = `${draftId}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage
        .from("inspiration-photos")
        .upload(path, file, { contentType: file.type });

      if (error) {
        setUploadError("Upload failed. Please try again.");
        continue;
      }

      dispatch({
        type: "ADD_INSPIRATION",
        upload: { path, previewUrl: URL.createObjectURL(file), fileName: file.name },
      });
    }

    setUploading(false);
  }

  return (
    <div>
      <StepHeading n={5} title="A little about" accent="you" sub="So we can confirm your appointment and send reminders." />

      <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700" htmlFor="name">
            Full name
          </label>
          <input type="text" autoComplete="name" {...nameField.input} />
          <FieldError id="name-error" message={nameField.error} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700" htmlFor="phone">
            Phone / WhatsApp
          </label>
          <input type="tel" autoComplete="tel" placeholder="08123456789" {...phoneField.input} />
          <FieldError id="phone-error" message={phoneField.error} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700" htmlFor="email">
            Email
          </label>
          <input type="email" autoComplete="email" placeholder="name@example.com" {...emailField.input} />
          <FieldError id="email-error" message={emailField.error} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700" htmlFor="instagram">
            Instagram <span className="normal-case tracking-normal font-normal text-ink-700/60">(optional)</span>
          </label>
          <input
            id="instagram"
            type="text"
            placeholder="@yourhandle"
            value={state.instagram}
            onChange={(e) => dispatch({ type: "SET_FIELD", field: "instagram", value: e.target.value })}
            className="form-field"
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700" htmlFor="notes">
          Anything else we should know? <span className="normal-case tracking-normal font-normal text-ink-700/60">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={2}
          value={state.notes}
          onChange={(e) => dispatch({ type: "SET_FIELD", field: "notes", value: e.target.value })}
          className="form-field"
        />
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700">
          Inspiration photo <span className="normal-case tracking-normal font-normal text-ink-700/60">(optional, up to {MAX_PHOTOS})</span>
        </p>
        <p className="mt-1 text-sm text-ink-700">Got a design in mind? Add a photo or screenshot.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {state.inspirationUploads.map((upload) => (
            <div key={upload.path} className="print relative h-24 w-24 overflow-hidden pb-2 odd:-rotate-2 even:rotate-2">
              <div className="relative h-full w-full"><Image src={upload.previewUrl} alt={upload.fileName} fill className="object-cover" unoptimized /></div>
              <button
                type="button"
                onClick={() => dispatch({ type: "REMOVE_INSPIRATION", path: upload.path })}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-wine-950/80 text-sm text-cream-50"
                aria-label="Remove photo"
              >
                &times;
              </button>
            </div>
          ))}
          {state.inspirationUploads.length < MAX_PHOTOS && (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-ink-950/25 bg-[#fffdf9] text-center text-xs font-medium text-ink-700 transition-colors hover:border-wine-700 hover:text-wine-900">
              <span aria-hidden="true" className="font-display text-2xl leading-none">+</span>
              {uploading ? "Uploading…" : "Add photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          )}
        </div>
        {uploadError ? <p className="mt-2 text-xs text-wine-700">{uploadError}</p> : null}
      </div>

      <div className="paper mt-8 rounded-2xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-wine-700">Booking policy</p>
        <p className="mt-2 max-h-32 overflow-y-auto text-xs leading-relaxed text-ink-700">{policyText}</p>
        <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-dashed border-ink-950/15 pt-4 text-sm">
          <input
            type="checkbox"
            checked={state.policyAccepted}
            onChange={(e) => dispatch({ type: "SET_POLICY_ACCEPTED", value: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-blush-300 text-wine-900 accent-wine-900"
          />
          <span className="text-ink-950">I have read and agree to the booking policy.</span>
        </label>
        {fieldsValid && !state.policyAccepted ? (
          <p className="mt-2 pl-7 text-xs text-wine-700">Tick the box above to continue.</p>
        ) : null}
      </div>
    </div>
  );
}
