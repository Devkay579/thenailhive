import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LengthPrice, ServiceCategory, ToeService, AddonPrice } from "@/lib/mock-data";

const FEATURED_LABELS: Record<string, string> = {
  "plain-gel": "Gel / Stick Set",
  "plain-acrylic": "Acrylic Set",
  biab: "BIAB / Builder Gel",
  toes: "Toes",
  removal: "Removal",
};

export async function getServices(): Promise<ServiceCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "slug, name, description, image_url, sort_order, service_prices(length_label, price_ngn, active, sort_order)",
    )
    .eq("active", true)
    .neq("slug", "toes")
    .order("sort_order");

  if (error) throw error;

  return (data ?? []).map((service) => {
    const prices: LengthPrice[] = (service.service_prices ?? [])
      .filter((p) => p.active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({ length: p.length_label as LengthPrice["length"], price: p.price_ngn }));

    // Single-price services (BIAB, Removal) render as "starting from" instead
    // of a length grid.
    if (prices.length === 1) {
      return {
        slug: service.slug,
        name: service.name,
        blurb: service.description,
        prices: [],
        startingFrom: prices[0].price,
        imageUrl: service.image_url,
      };
    }

    return {
      slug: service.slug,
      name: service.name,
      blurb: service.description,
      prices,
      imageUrl: service.image_url,
    };
  });
}

export async function getToeServices(): Promise<ToeService[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("service_prices(length_label, price_ngn, active, sort_order)")
    .eq("slug", "toes")
    .single();

  if (error) throw error;

  return (data?.service_prices ?? [])
    .filter((p) => p.active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => ({ name: p.length_label, price: p.price_ngn }));
}

export async function getAddons(): Promise<AddonPrice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addons")
    .select("name, price_ngn, suffix")
    .eq("active", true)
    .order("sort_order");

  if (error) throw error;

  return (data ?? []).map((a) => ({
    name: a.name,
    price: a.price_ngn,
    suffix: a.suffix ?? undefined,
  }));
}

export type BookableServicePrice = {
  id: string;
  lengthLabel: string;
  priceNgn: number;
  durationMinutes: number;
};

export type BookableService = {
  id: string;
  slug: string;
  name: string;
  prices: BookableServicePrice[];
};

/** Full raw service + price-tier list for the booking wizard (includes Toes,
 * unlike getServices(), and never collapses single-price services). */
export async function getBookableServices(): Promise<BookableService[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, slug, name, sort_order, service_prices(id, length_label, price_ngn, duration_minutes, active, sort_order)",
    )
    .eq("active", true)
    .order("sort_order");

  if (error) throw error;

  return (data ?? [])
    .map((service) => ({
      id: service.id,
      slug: service.slug,
      name: service.name,
      prices: (service.service_prices ?? [])
        .filter((p) => p.active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p) => ({
          id: p.id,
          lengthLabel: p.length_label,
          priceNgn: p.price_ngn,
          durationMinutes: p.duration_minutes,
        })),
    }))
    .filter((s) => s.prices.length > 0);
}

export type BookableAddon = { id: string; name: string; priceNgn: number; suffix: string | null };

export async function getBookableAddons(): Promise<BookableAddon[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addons")
    .select("id, name, price_ngn, suffix")
    .eq("active", true)
    .order("sort_order");

  if (error) throw error;

  return (data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    priceNgn: a.price_ngn,
    suffix: a.suffix,
  }));
}

export async function getFeaturedServiceTiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("slug, sort_order, image_url, service_prices(price_ngn, active)")
    .eq("active", true)
    .order("sort_order");

  if (error) throw error;

  const tiles = (data ?? []).map((service) => {
    const activePrices = (service.service_prices ?? []).filter((p) => p.active);
    const from = activePrices.length
      ? Math.min(...activePrices.map((p) => p.price_ngn))
      : 0;
    return {
      slug: service.slug,
      label: FEATURED_LABELS[service.slug] ?? service.slug,
      from,
      imageUrl: service.image_url as string | null,
    };
  });

  // Insert a "Nail Art" tile (addons don't live under a service) priced from
  // the cheapest active addon, positioned after BIAB to match the design.
  // Its photo is set from admin Services and stored in settings.
  const [supabaseAddons, { data: settings }] = await Promise.all([
    supabase
      .from("addons")
      .select("price_ngn")
      .eq("active", true)
      .order("price_ngn", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const nailArtTile = {
    slug: "nail-art",
    label: "Nail Art",
    from: supabaseAddons.data?.price_ngn ?? 500,
    imageUrl: (settings?.nail_art_image_url ?? null) as string | null,
  };

  const biabIndex = tiles.findIndex((t) => t.slug === "biab");
  const withNailArt = [...tiles];
  withNailArt.splice(biabIndex + 1, 0, nailArtTile);

  return withNailArt;
}
