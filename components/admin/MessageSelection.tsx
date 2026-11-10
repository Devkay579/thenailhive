"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteMessages } from "@/app/admin/messages/actions";

type SelectionContextValue = {
  allIds: string[];
  selected: Set<string>;
  toggle: (id: string) => void;
  setAll: (on: boolean) => void;
  clear: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used inside MessageSelectionProvider");
  return ctx;
}

/** Holds which messages (on the current page) are ticked for bulk delete. */
export function MessageSelectionProvider({ ids, children }: { ids: string[]; children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Drop ids that are no longer on the page (deleted, or page changed).
  const visibleSelected = new Set([...selected].filter((id) => ids.includes(id)));

  const value: SelectionContextValue = {
    allIds: ids,
    selected: visibleSelected,
    toggle: (id) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    setAll: (on) => setSelected(on ? new Set(ids) : new Set()),
    clear: () => setSelected(new Set()),
  };

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function MessageSelectCheckbox({ id, label }: { id: string; label: string }) {
  const { selected, toggle } = useSelection();
  return (
    <input
      type="checkbox"
      checked={selected.has(id)}
      onChange={() => toggle(id)}
      aria-label={`Select message from ${label}`}
      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-wine-900"
    />
  );
}

function useDelete(onDone?: () => void) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(ids: string[]) {
    startTransition(async () => {
      try {
        const result = await deleteMessages(ids);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(ids.length === 1 ? "Message deleted." : `${ids.length} messages deleted.`);
        onDone?.();
        router.refresh();
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  return { isPending, run };
}

/** Select-all toggle + "Delete selected" with an inline confirm step. */
export function MessagesBulkBar() {
  const { allIds, selected, setAll, clear } = useSelection();
  const [confirming, setConfirming] = useState(false);
  const { isPending, run } = useDelete(() => {
    clear();
    setConfirming(false);
  });

  const count = selected.size;
  const allChecked = allIds.length > 0 && count === allIds.length;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-ink-950/10 pb-3">
      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-700">
        <input
          type="checkbox"
          checked={allChecked}
          ref={(el) => {
            if (el) el.indeterminate = count > 0 && !allChecked;
          }}
          onChange={() => {
            setAll(!allChecked);
            setConfirming(false);
          }}
          className="h-4 w-4 cursor-pointer accent-wine-900"
        />
        {count > 0 ? `${count} selected` : "Select all on this page"}
      </label>

      {count > 0 && !confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full border border-wine-700/40 px-3 py-1.5 text-xs font-medium text-wine-700 hover:border-wine-700 hover:bg-wine-700/5"
        >
          Delete selected
        </button>
      ) : null}

      {count > 0 && confirming ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-wine-700/30 bg-wine-700/5 px-3 py-2">
          <span className="text-xs text-ink-950">
            Delete {count} message{count === 1 ? "" : "s"} permanently? This can&apos;t be undone.
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run([...selected])}
            className="rounded-full bg-wine-700 px-3 py-1 text-xs font-medium text-cream-50 hover:bg-wine-800 disabled:opacity-60"
          >
            {isPending ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming(false)}
            className="rounded-full border border-blush-300 px-3 py-1 text-xs font-medium text-ink-700 hover:border-wine-700 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Per-message delete with an inline confirm step. */
export function DeleteMessageButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const { isPending, run } = useDelete();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs font-medium text-ink-700 hover:text-wine-700 hover:underline"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-xs text-ink-950">Delete permanently?</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run([id])}
        className="rounded-full bg-wine-700 px-3 py-1 text-xs font-medium text-cream-50 hover:bg-wine-800 disabled:opacity-60"
      >
        {isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirming(false)}
        className="text-xs font-medium text-ink-700 hover:text-wine-900"
      >
        Cancel
      </button>
    </span>
  );
}
