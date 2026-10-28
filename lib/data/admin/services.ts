import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AddonRow, ServicePriceRow, ServiceRow } from "@/lib/supabase/types";

export type ServiceWithPrices = ServiceRow & { prices: ServicePriceRow[] };

export async function getServicesAdmin(): Promise<ServiceWithPrices[]> {
  const supabase = createAdminClient();
  const [{ data: services, error: sErr }, { data: prices, error: pErr }] = await Promise.all([
    supabase.from("services").select("*").order("sort_order"),
    supabase.from("service_prices").select("*").order("sort_order"),
  ]);
  if (sErr) throw sErr;
  if (pErr) throw pErr;

  return (services ?? []).map((s) => ({
    ...s,
    prices: (prices ?? []).filter((p) => p.service_id === s.id),
  }));
}

export async function getAddonsAdmin(): Promise<AddonRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("addons").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}
