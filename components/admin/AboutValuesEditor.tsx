"use client";

import { useState } from "react";
import { inputClass } from "@/components/admin/ui";
import { MAX_ABOUT_VALUES, type AboutValue } from "@/lib/about";

/** Editable list of values. Rows submit as parallel value_title[] /
 * value_description[] fields with the enclosing form. */
export function AboutValuesEditor({ initial }: { initial: AboutValue[] }) {
  // Stable keys so React doesn't reuse the wrong inputs when rows move.
  const [rows, setRows] = useState(() => initial.map((v, i) => ({ ...v, key: i })));
  const [nextKey, setNextKey] = useState(initial.length);

  function update(key: number, field: "title" | "description", value: string) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function move(index: number, delta: -1 | 1) {
    setRows((rs) => {
      const next = [...rs];
      const [row] = next.splice(index, 1);
      next.splice(index + delta, 0, row);
      return next;
    });
  }

  return (
    <div className="space-y-2.5">
      {rows.map((row, i) => (
        <div key={row.key} className="flex gap-3 rounded-xl border border-ink-950/10 bg-cream-100 p-3">
          <span className="pt-2 font-script text-2xl italic leading-none text-wine-900/70">0{i + 1}</span>
          <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_1.6fr]">
            <input
              name="value_title"
              value={row.title}
              onChange={(e) => update(row.key, "title", e.target.value)}
              placeholder="Title, e.g. Hygiene"
              aria-label={`Value ${i + 1} title`}
              className={inputClass}
            />
            <input
              name="value_description"
              value={row.description}
              onChange={(e) => update(row.key, "description", e.target.value)}
              placeholder="One short line about it"
              aria-label={`Value ${i + 1} description`}
              className={inputClass}
            />
          </div>
          <div className="flex shrink-0 flex-col items-center gap-0.5 sm:flex-row sm:items-start sm:pt-1">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="Move up"
              className="h-7 w-7 rounded-full text-ink-700 hover:bg-blush-100 disabled:opacity-30"
            >
              &uarr;
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === rows.length - 1}
              aria-label="Move down"
              className="h-7 w-7 rounded-full text-ink-700 hover:bg-blush-100 disabled:opacity-30"
            >
              &darr;
            </button>
            <button
              type="button"
              onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
              aria-label={`Remove value ${i + 1}`}
              className="h-7 w-7 rounded-full text-wine-700 hover:bg-wine-700/10"
            >
              &times;
            </button>
          </div>
        </div>
      ))}

      {rows.length < MAX_ABOUT_VALUES ? (
        <button
          type="button"
          onClick={() => {
            setRows((rs) => [...rs, { title: "", description: "", key: nextKey }]);
            setNextKey((k) => k + 1);
          }}
          className="w-full rounded-xl border border-dashed border-blush-300 py-2 text-sm font-medium text-wine-900 hover:border-wine-700"
        >
          + Add a value
        </button>
      ) : (
        <p className="text-xs text-ink-700">That&apos;s the maximum of {MAX_ABOUT_VALUES}.</p>
      )}
    </div>
  );
}
