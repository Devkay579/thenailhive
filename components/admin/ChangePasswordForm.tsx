"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { changePassword, type ActionResult } from "@/app/admin/team/actions";
import { inputClass, labelClass } from "@/components/admin/ui";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    changePassword,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Password updated.");
    else toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      <div>
        <label className={labelClass}>Current password</label>
        <input type="password" name="current_password" required autoComplete="current-password" className={`${inputClass} mt-1`} />
      </div>
      <div>
        <label className={labelClass}>New password</label>
        <input type="password" name="new_password" required minLength={8} autoComplete="new-password" className={`${inputClass} mt-1`} />
      </div>
      <div>
        <label className={labelClass}>Confirm new password</label>
        <input type="password" name="confirm_password" required minLength={8} autoComplete="new-password" className={`${inputClass} mt-1`} />
      </div>

      <div className="sm:col-span-3">
        {state?.ok === false && <p className="mb-2 text-sm text-wine-700">{state.message}</p>}
        {state?.ok === true && <p className="mb-2 text-sm text-emerald-700">Password updated.</p>}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-wine-900 px-5 py-2 text-sm font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60"
        >
          {isPending ? "Updating…" : "Update Password"}
        </button>
      </div>
    </form>
  );
}
