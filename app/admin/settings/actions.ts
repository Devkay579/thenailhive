"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateSettings(formData: FormData) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("settings")
    .update({
      deposit_percent: Number(formData.get("deposit_percent") ?? 20),
      late_fee_ngn: Number(formData.get("late_fee_ngn") ?? 3000),
      policy_text: String(formData.get("policy_text") ?? ""),
      whatsapp_number: String(formData.get("whatsapp_number") ?? ""),
      phone_display: String(formData.get("phone_display") ?? ""),
      instagram_handle: String(formData.get("instagram_handle") ?? ""),
      tiktok_handle: String(formData.get("tiktok_handle") ?? ""),
      bank_name: String(formData.get("bank_name") ?? "").trim(),
      bank_account_number: String(formData.get("bank_account_number") ?? "").replace(/\s+/g, ""),
      bank_account_name: String(formData.get("bank_account_name") ?? "").trim(),
    })
    .eq("id", 1);

  if (error) throw error;

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
