"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/admin/login/actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<SignInState, FormData>(signIn, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1.5 w-full rounded-xl border border-ink-950/15 bg-[#fffdf9] px-3 py-2 text-sm text-ink-950 shadow-[inset_0_1px_2px_rgb(26_21_18/0.05)] transition-[border-color,box-shadow] placeholder:text-ink-700/45 focus:border-wine-700 focus:outline-none focus:ring-4 focus:ring-blush-200/70"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-xl border border-ink-950/15 bg-[#fffdf9] px-3 py-2 text-sm text-ink-950 shadow-[inset_0_1px_2px_rgb(26_21_18/0.05)] transition-[border-color,box-shadow] placeholder:text-ink-700/45 focus:border-wine-700 focus:outline-none focus:ring-4 focus:ring-blush-200/70"
        />
      </div>

      {state?.error ? <p className="text-sm text-wine-700">{state.error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-wine-900 text-sm font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
