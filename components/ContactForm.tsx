"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { submitContactMessage, type SubmitContactState } from "@/app/(marketing)/contact/actions";

const inputClass = "form-field";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState<SubmitContactState, FormData>(
    submitContactMessage,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Message sent — thank you!");
    else toast.error(state.message);
  }, [state]);

  if (state?.ok) {
    return (
      <div className="paper-stack mr-3 rounded-sm p-6 sm:p-9 text-center">
        <p className="font-display text-lg font-semibold text-ink-950">Thank you!</p>
        <p className="mt-1 text-sm text-ink-700">
          We&apos;ve got your message and sent a confirmation to your email. We&apos;ll reply soon.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 paper-stack mr-3 rounded-sm p-6 sm:p-9">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink-700">
            Your name
          </label>
          <input id="name" name="name" type="text" required minLength={2} className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-700">
            Email
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-ink-700">
          Phone <span className="text-ink-700/60">(optional)</span>
        </label>
        <input id="phone" name="phone" type="tel" className={inputClass} />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-ink-700">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          minLength={10}
          maxLength={1000}
          placeholder="What would you like to ask or tell us?"
          className={inputClass}
        />
      </div>

      {state?.ok === false ? <p className="text-sm text-wine-700">{state.message}</p> : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
