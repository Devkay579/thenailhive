"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { GALLERY_BUCKET, pathFromPublicUrl, uploadPhoto } from "@/lib/storage";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createService(formData: FormData) {
  const supabase = createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { count } = await supabase.from("services").select("*", { count: "exact", head: true });

  const { error } = await supabase.from("services").insert({
    slug: `${slugify(name)}-${Date.now().toString(36)}`,
    name,
    description: String(formData.get("description") ?? ""),
    sort_order: count ?? 0,
    active: true,
  });
  if (error) throw error;
  revalidatePath("/admin/services");
}

export async function updateService(serviceId: string, formData: FormData) {
  const supabase = createAdminClient();

  const update: Record<string, unknown> = {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  };

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const { data: existing } = await supabase
      .from("services")
      .select("image_url")
      .eq("id", serviceId)
      .single();

    const upload = await uploadPhoto(supabase, file, "services/");
    if (!upload.ok) return upload;
    update.image_url = upload.publicUrl;

    if (existing?.image_url) {
      const oldPath = pathFromPublicUrl(existing.image_url);
      if (oldPath) await supabase.storage.from(GALLERY_BUCKET).remove([oldPath]);
    }
  }

  const { error } = await supabase.from("services").update(update).eq("id", serviceId);
  if (error) {
    console.error("Service update failed:", error);
    return { ok: false, message: "We couldn't save this service. Please try again." };
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
  return { ok: true };
}

/** Photo for the home page menu's "Nail Art" row (lives in settings, since
 * nail art is add-ons rather than a service). */
export async function updateNailArtImage(formData: FormData) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a photo first." };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("settings").select("*").eq("id", 1).single();

  const upload = await uploadPhoto(supabase, file, "services/");
  if (!upload.ok) return upload;

  const { error } = await supabase.from("settings").update({ nail_art_image_url: upload.publicUrl }).eq("id", 1);
  if (error) {
    console.error("Nail art image update failed:", error);
    return { ok: false, message: "We couldn't save this photo. Please try again." };
  }

  if (existing?.nail_art_image_url) {
    const oldPath = pathFromPublicUrl(existing.nail_art_image_url);
    if (oldPath) await supabase.storage.from(GALLERY_BUCKET).remove([oldPath]);
  }

  revalidatePath("/admin/services");
  revalidatePath("/");
  return { ok: true };
}

/** Archiving hides a service from the site and booking flow without deleting
 * it, so past bookings keep their service and it can be restored later. */
export async function setServiceArchived(serviceId: string, archived: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("services").update({ active: !archived }).eq("id", serviceId);
  if (error) {
    console.error("Service archive toggle failed:", error);
    return {
      ok: false,
      message: archived
        ? "We couldn't archive this service. Please try again."
        : "We couldn't restore this service. Please try again.",
    };
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/book");
  revalidatePath("/");
  return { ok: true };
}

export async function addServicePrice(serviceId: string, formData: FormData) {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("service_prices")
    .select("*", { count: "exact", head: true })
    .eq("service_id", serviceId);

  const { error } = await supabase.from("service_prices").insert({
    service_id: serviceId,
    length_label: String(formData.get("length_label") ?? ""),
    price_ngn: Number(formData.get("price_ngn") ?? 0),
    duration_minutes: Number(formData.get("duration_minutes") ?? 60),
    sort_order: count ?? 0,
    active: true,
  });
  if (error) throw error;
  revalidatePath("/admin/services");
}

export async function updateServicePrice(priceId: string, formData: FormData) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("service_prices")
    .update({
      length_label: String(formData.get("length_label") ?? ""),
      price_ngn: Number(formData.get("price_ngn") ?? 0),
      duration_minutes: Number(formData.get("duration_minutes") ?? 60),
      active: formData.get("active") === "on",
    })
    .eq("id", priceId);
  if (error) throw error;
  revalidatePath("/admin/services");
}

export async function createAddon(formData: FormData) {
  const supabase = createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { count } = await supabase.from("addons").select("*", { count: "exact", head: true });

  const { error } = await supabase.from("addons").insert({
    name,
    price_ngn: Number(formData.get("price_ngn") ?? 0),
    suffix: String(formData.get("suffix") ?? "") || null,
    category: "nail-art",
    sort_order: count ?? 0,
    active: true,
  });
  if (error) throw error;
  revalidatePath("/admin/services");
}

export async function updateAddon(addonId: string, formData: FormData) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("addons")
    .update({
      name: String(formData.get("name") ?? ""),
      price_ngn: Number(formData.get("price_ngn") ?? 0),
      suffix: String(formData.get("suffix") ?? "") || null,
      active: formData.get("active") === "on",
    })
    .eq("id", addonId);
  if (error) throw error;
  revalidatePath("/admin/services");
}
