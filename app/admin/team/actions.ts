"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; message: string };
export type CreateAdminResult = (ActionResult & { password?: string }) | null;

function generatePassword() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export async function createAdminUser(
  _prevState: CreateAdminResult,
  formData: FormData,
): Promise<CreateAdminResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, message: "Enter an email address." };

  const password = generatePassword();
  const supabase = createAdminClient();

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/team");
  return { ok: true, password };
}

export async function changePassword(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (newPassword.length < 8) {
    return { ok: false, message: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, message: "New passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, message: "You're not signed in." };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) return { ok: false, message: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, message: error.message };

  return { ok: true };
}

export async function deleteAdminUser(userId: string): Promise<ActionResult> {
  const sessionClient = await createClient();
  const {
    data: { user: currentUser },
  } = await sessionClient.auth.getUser();

  if (currentUser?.id === userId) {
    return { ok: false, message: "You can't remove your own account while logged in." };
  }

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 100 });
  if ((data?.users.length ?? 0) <= 1) {
    return { ok: false, message: "Can't remove the last remaining admin." };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/team");
  return { ok: true };
}
