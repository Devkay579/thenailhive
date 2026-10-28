import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SettingsRow } from "@/lib/supabase/types";

export async function getSettingsAdmin(): Promise<SettingsRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}
