"use client";

import { createContext, useContext, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IMAGE_TOO_LARGE_MESSAGE } from "@/lib/uploads";

type ActionResult = { ok: boolean; message?: string } | void | undefined;

const ActionFormPendingContext = createContext(false);

/** Lets a descendant (e.g. an image preview) know its enclosing ActionForm
 * is currently submitting -- useFormStatus() doesn't work here since this
 * form submits via a manual onSubmit handler, not the native action prop. */
export function useActionFormPending() {
  return useContext(ActionFormPendingContext);
}

/**
 * Wraps a server action in a plain <form> and reports the outcome as a toast.
 * Works with actions that return {ok, message} (uses that to decide
 * success/error) or actions that just mutate + throw on failure (any thrown
 * error becomes an error toast, anything else resolving is a success toast).
 */
export function ActionForm({
  action,
  successMessage = "Saved.",
  errorMessage = "Something went wrong. Please try again.",
  resetOnSuccess = false,
  onSuccess,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  successMessage?: string;
  errorMessage?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result && typeof result === "object" && "ok" in result && !result.ok) {
          toast.error(result.message || errorMessage);
          return;
        }
        toast.success(successMessage);
        if (resetOnSuccess) form.reset();
        onSuccess?.();
        // Server actions called via a native form action trigger this
        // automatically; calling the action directly (to intercept the
        // result for the toast) bypasses that, so we do it ourselves.
        router.refresh();
      } catch (error) {
        // Next rejects oversized requests before the action runs, so this
        // never reaches the action's own validation.
        const tooLarge = error instanceof Error && /body exceeded/i.test(error.message);
        toast.error(tooLarge ? IMAGE_TOO_LARGE_MESSAGE : errorMessage);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className={className} aria-busy={isPending} data-pending={isPending || undefined}>
      <ActionFormPendingContext.Provider value={isPending}>{children}</ActionFormPendingContext.Provider>
    </form>
  );
}
