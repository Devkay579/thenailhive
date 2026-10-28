import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUserRow = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
};

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (error) throw error;

  return data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "—",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
