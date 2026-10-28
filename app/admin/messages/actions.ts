"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

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
