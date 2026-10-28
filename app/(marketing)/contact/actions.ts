"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendContactMessageEmails } from "@/lib/email/send";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().default(""),
  message: z.string().trim().min(10).max(1000),
});

export type SubmitContactState =
  | { ok: true }
  | { ok: false; message: string }
  | null;

export async function submitContactMessage(
  _prevState: SubmitContactState,
  formData: FormData,
): Promise<SubmitContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Please fill in your name, a valid email, and a message (at least 10 characters)." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    message: parsed.data.message,
  });

  if (error) {
    return { ok: false, message: "Something went wrong sending your message. Please try again." };
  }

  // Best-effort -- the message is already saved, so a failed send here
  // doesn't lose it (it'll just need a manual follow-up).
  await sendContactMessageEmails(parsed.data);

  return { ok: true };
}
