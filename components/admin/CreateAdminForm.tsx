"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createAdminUser, type CreateAdminResult } from "@/app/admin/team/actions";
import { inputClass, labelClass } from "@/components/admin/ui";

export function CreateAdminForm() {
  const [state, formAction, isPending] = useActionState<CreateAdminResult, FormData>(
    createAdminUser,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Admin account created.");
    else toast.error(state.message);
  }, [state]);

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className={labelClass}>New admin email</label>
          <input type="email" name="email" required className={`${inputClass} mt-1 w-64`} />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="h-[38px] rounded-full bg-wine-900 px-4 text-sm font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create Admin"}
        </button>
      </form>

      {state && !state.ok && <p className="mt-2 text-sm text-wine-700">{state.message}</p>}

      {state?.ok && state.password ? (
        <div className="mt-3 rounded-lg border border-blush-300 bg-blush-100 p-3 text-sm">
          <p className="font-medium text-ink-950">Admin created. Share these credentials securely:</p>
          <p className="mt-1 font-mono text-ink-950">Password: {state.password}</p>
          <p className="mt-1 text-xs text-ink-700">
            This is shown once and can&apos;t be retrieved again &mdash; they should change it after logging in.
          </p>
        </div>
      ) : null}
    </div>
  );
}
