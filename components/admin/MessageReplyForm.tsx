"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { replyToMessage } from "@/app/admin/messages/actions";

export function MessageReplyForm({ messageId, name, email }: { messageId: string; name: string; email: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-wine-900 px-3 py-1.5 text-xs font-medium text-cream-50 hover:bg-wine-700"
      >
        Reply
      </button>
    );
  }

  return (
    <ActionForm
      action={replyToMessage.bind(null, messageId)}
      successMessage={`Reply emailed to ${email}.`}
      resetOnSuccess
      onSuccess={() => setOpen(false)}
      className="w-full space-y-2"
    >
      <label htmlFor={`reply-${messageId}`} className="block text-xs font-medium text-ink-700">
        Reply to {name} &middot; sends an email to {email}
      </label>
      <textarea
        id={`reply-${messageId}`}
        name="reply"
        required
        rows={5}
        maxLength={5000}
        autoFocus
        placeholder={`Hi ${name.split(" ")[0]}, …`}
        className="w-full rounded-xl border border-ink-950/15 bg-cream-50 p-3 text-sm text-ink-950 focus:border-wine-700 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <SubmitButton
          pendingLabel="Sending…"
          className="rounded-full bg-wine-900 px-4 py-1.5 text-xs font-medium text-cream-50 hover:bg-wine-700"
        >
          Send reply
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-medium text-ink-700 hover:text-wine-900"
        >
          Cancel
        </button>
      </div>
    </ActionForm>
  );
}
