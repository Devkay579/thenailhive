import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getBusinessInfo = cache(async function getBusinessInfo() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();

  if (error) throw error;

  return {
    name: "THENAILHIVE",
    tagline: "Where your nails become the statement.",
    phone: data.phone_display,
    whatsappNumber: data.whatsapp_number,
    instagram: data.instagram_handle,
    tiktok: data.tiktok_handle,
    depositPercent: data.deposit_percent,
    lateFee: data.late_fee_ngn,
    policyText: data.policy_text as string,
    // Columns added after launch -- `?? ""` until the migration has run.
    bank: {
      bankName: (data.bank_name ?? "") as string,
      accountNumber: (data.bank_account_number ?? "") as string,
      accountName: (data.bank_account_name ?? "") as string,
    },
  };
});
