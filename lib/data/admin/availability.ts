import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BlockedSlotRow, BusinessHoursRow } from "@/lib/supabase/types";

export async function getBusinessHours(): Promise<BusinessHoursRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("business_hours").select("*").order("weekday");
  if (error) throw error;
  return data ?? [];
}

export const BLOCKED_SLOTS_PAGE_SIZE = 20;

export type BlockedSlotsPage = {
  rows: BlockedSlotRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getUpcomingBlockedSlots(page = 1): Promise<BlockedSlotsPage> {
  const supabase = createAdminClient();
  const pageSize = BLOCKED_SLOTS_PAGE_SIZE;
  const safePage = Math.max(1, page);
  const today = new Date().toISOString().slice(0, 10);

  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("blocked_slots")
    .select("*", { count: "exact" })
    .gte("date", today)
    .order("date")
    .range(from, to);
  if (error) throw error;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { rows: data ?? [], total, page: safePage, pageSize, totalPages };
}
