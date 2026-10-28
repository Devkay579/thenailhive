// One-off seed script for the BRD pricing table + default availability/settings.
// Run with: npm run seed
// (uses SUPABASE_SERVICE_ROLE_KEY, so it bypasses RLS — never run this client-side)

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Run this via `npm run seed` so .env.local is loaded.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const services = [
  {
    slug: "plain-gel",
    name: "Plain Gel X",
    description: "Sleek, natural-looking gel extensions built to last.",
    sort_order: 1,
    prices: [
      { length_label: "Short", price_ngn: 8000, duration_minutes: 60 },
      { length_label: "Medium", price_ngn: 10000, duration_minutes: 75 },
      { length_label: "Long", price_ngn: 12000, duration_minutes: 90 },
      { length_label: "XL", price_ngn: 14000, duration_minutes: 105 },
    ],
  },
  {
    slug: "plain-acrylic",
    name: "Plain Acrylic Set",
    description: "Classic acrylic sets, sculpted to your preferred shape.",
    sort_order: 2,
    prices: [
      { length_label: "Short", price_ngn: 10000, duration_minutes: 75 },
      { length_label: "Medium", price_ngn: 12000, duration_minutes: 90 },
      { length_label: "Long", price_ngn: 15000, duration_minutes: 105 },
      { length_label: "XL", price_ngn: 20000, duration_minutes: 120 },
    ],
  },
  {
    slug: "biab",
    name: "BIAB (Builder Gel) Set",
    description: "Builder-in-a-bottle for strong, low-damage natural nails.",
    sort_order: 3,
    prices: [{ length_label: "Standard", price_ngn: 12000, duration_minutes: 90 }],
  },
  {
    slug: "removal",
    name: "Removal Service",
    description: "Gentle soak-off removal of your existing set.",
    sort_order: 4,
    prices: [{ length_label: "Soak Off", price_ngn: 4000, duration_minutes: 30 }],
  },
  {
    slug: "toes",
    name: "Toes",
    description: "Toe treatments to complete your set.",
    sort_order: 5,
    prices: [
      { length_label: "Plain Toes", price_ngn: 2000, duration_minutes: 30 },
      { length_label: "Plain Acrylic Toes", price_ngn: 6000, duration_minutes: 60 },
      { length_label: "Fixing on Big Toes", price_ngn: 3000, duration_minutes: 20 },
      { length_label: "Fixing on All Toes", price_ngn: 4000, duration_minutes: 30 },
    ],
  },
];

const addons = [
  { name: "French Tips / Chrome / Marble", price_ngn: 1000, category: "nail-art", sort_order: 1 },
  { name: "Cat Eye / Airbrush / 3D Flower / Ombre", price_ngn: 2000, category: "nail-art", sort_order: 2 },
  { name: "3D Swirls / Nail Drawing / Blooming Effect", price_ngn: 1500, category: "nail-art", sort_order: 3 },
  { name: "Charms", price_ngn: 1000, suffix: "each", category: "nail-art", sort_order: 4 },
  { name: "Caviar Beads", price_ngn: 500, category: "nail-art", sort_order: 5 },
];

const galleryCategories = ["Acrylic", "Gel", "BIAB", "Nail Art", "Toes"];
const galleryItems = Array.from({ length: 12 }).map((_, i) => {
  const category = galleryCategories[i % galleryCategories.length];
  return {
    category,
    title: `${category} Set`,
    image_url: null,
    sort_order: i,
  };
});

// Mon-Sat 9am-6pm, closed Sunday (adjust later from the admin dashboard).
const businessHours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  open_time: weekday === 0 ? null : "09:00:00",
  close_time: weekday === 0 ? null : "18:00:00",
  is_closed: weekday === 0,
}));

const settings = {
  id: 1,
  deposit_percent: 20,
  late_fee_ngn: 3000,
  policy_text:
    "A 20% non-refundable deposit is required to secure your appointment. " +
    "Prices are non-negotiable. Clients arriving 20 minutes or more late incur a ₦3,000 late fee. " +
    "Free nail repairs are available within one week of your appointment, subject to our conditions.",
  whatsapp_number: "2348187148822",
  phone_display: "08187148822",
  instagram_handle: "the.nail_hive",
  tiktok_handle: "thenail.hive",
};

async function main() {
  for (const { slug, name, description, sort_order, prices } of services) {
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .upsert({ slug, name, description, sort_order, active: true }, { onConflict: "slug" })
      .select()
      .single();

    if (serviceError) throw serviceError;

    await supabase.from("service_prices").delete().eq("service_id", service.id);
    const { error: priceError } = await supabase.from("service_prices").insert(
      prices.map((p, i) => ({ ...p, service_id: service.id, sort_order: i, active: true })),
    );
    if (priceError) throw priceError;

    console.log(`Seeded service: ${name} (${prices.length} price rows)`);
  }

  const { count: addonCount } = await supabase
    .from("addons")
    .select("*", { count: "exact", head: true });
  if (!addonCount) {
    const { error } = await supabase.from("addons").insert(addons.map((a) => ({ ...a, active: true })));
    if (error) throw error;
    console.log(`Seeded ${addons.length} addons`);
  } else {
    console.log("Addons already has rows, skipping.");
  }

  const { count: galleryCount } = await supabase
    .from("gallery_items")
    .select("*", { count: "exact", head: true });
  if (!galleryCount) {
    const { error } = await supabase.from("gallery_items").insert(galleryItems);
    if (error) throw error;
    console.log(`Seeded ${galleryItems.length} gallery placeholders`);
  } else {
    console.log("Gallery already has rows, skipping.");
  }

  const { error: hoursError } = await supabase
    .from("business_hours")
    .upsert(businessHours, { onConflict: "weekday" });
  if (hoursError) throw hoursError;
  console.log("Seeded business hours (Mon-Sat 9am-6pm, closed Sunday)");

  const { error: settingsError } = await supabase
    .from("settings")
    .upsert(settings, { onConflict: "id" });
  if (settingsError) throw settingsError;
  console.log("Seeded settings row");

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
