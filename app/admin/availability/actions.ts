"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateBusinessHours(formData: FormData) {
  const supabase = createAdminClient();

  const rows = [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const isClosed = formData.get(`closed-${weekday}`) === "on";
    const open = String(formData.get(`open-${weekday}`) ?? "");
    const close = String(formData.get(`close-${weekday}`) ?? "");
    return {
      weekday,
      is_closed: isClosed,
      open_time: isClosed ? null : open || null,
      close_time: isClosed ? null : close || null,
    };
  });

  const { error } = await supabase.from("business_hours").upsert(rows, { onConflict: "weekday" });
  if (error) throw error;

  revalidatePath("/admin/availability");
}

export async function addBlockedSlot(formData: FormData) {
  const supabase = createAdminClient();
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const reason = String(formData.get("reason") ?? "");

  if (!date) return;

  const { error } = await supabase.from("blocked_slots").insert({
    date,
    start_time: startTime || null,
    end_time: endTime || null,
    reason: reason || null,
  });
  if (error) throw error;

  revalidatePath("/admin/availability");
}

export async function deleteBlockedSlot(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/availability");
}
