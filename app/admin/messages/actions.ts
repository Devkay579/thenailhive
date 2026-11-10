"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendContactReplyEmail } from "@/lib/email/send";

const MAX_REPLY_LENGTH = 5000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Permanently deletes one or more contact messages (their replies go with
 * them via ON DELETE CASCADE). Used by both the per-message and bulk delete. */
export async function deleteMessages(ids: string[]) {
  const validIds = [...new Set(ids)].filter((id) => UUID_RE.test(id));
  if (validIds.length === 0) return { ok: false, message: "Select at least one message." };

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) return { ok: false, message: "You're not signed in." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("contact_messages").delete().in("id", validIds);
  if (error) {
    console.error("Deleting contact messages failed:", error);
    return {
      ok: false,
      message: validIds.length === 1
        ? "We couldn't delete this message. Please try again."
        : "We couldn't delete those messages. Please try again.",
    };
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Emails a reply to the person who sent a Contact page message, records it
 * so the inbox shows the conversation, and marks the message read. */
export async function replyToMessage(messageId: string, formData: FormData) {
  const body = String(formData.get("reply") ?? "").trim();
  if (!body) return { ok: false, message: "Write a reply first." };
  if (body.length > MAX_REPLY_LENGTH) {
    return { ok: false, message: `Replies can be up to ${MAX_REPLY_LENGTH} characters.` };
  }

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) return { ok: false, message: "You're not signed in." };

  const supabase = createAdminClient();
  const { data: original, error: fetchError } = await supabase
    .from("contact_messages")
    .select("id, name, email, message")
    .eq("id", messageId)
    .single();
  if (fetchError || !original) {
    return { ok: false, message: "We couldn't find that message." };
  }

  const result = await sendContactReplyEmail(original.email, {
    name: original.name,
    reply: body,
    originalMessage: original.message,
  });
  if (result.skipped || !result.ok) {
    console.error("Contact reply email failed:", result);
    return { ok: false, message: "We couldn't send the email. Please try again." };
  }

  // The email is already out, so a failure saving the record shouldn't read
  // as "not sent" -- log it rather than asking the admin to resend.
  const [{ error: insertError }] = await Promise.all([
    supabase.from("contact_message_replies").insert({ message_id: messageId, body, sent_by: user.email ?? null }),
    supabase
      .from("contact_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId)
      .is("read_at", null),
  ]);
  if (insertError) console.error("Saving contact reply failed (email was sent):", insertError);

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setMessageRead(id: string, read: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin", "layout");
}

export async function markAllMessagesRead() {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) throw error;

  revalidatePath("/admin", "layout");
}
