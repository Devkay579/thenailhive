import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_ABOUT, normalizeAbout, type AboutContent } from "@/lib/about";

/** Public read for the About page (and the home page's values strip).
 * Falls back to the defaults if the row/column isn't there yet. */
export const getAboutContent = cache(async function getAboutContent(): Promise<AboutContent> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  if (error) {
    console.error("Failed to load About content", error);
    return DEFAULT_ABOUT;
  }
  return normalizeAbout(data?.about_content);
});

export async function getAboutContentAdmin(): Promise<AboutContent> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return normalizeAbout(data?.about_content);
}
