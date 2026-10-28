import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const CONTACT_MESSAGES_PAGE_SIZE = 20;

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: string;
  readAt: string | null;
};

export type ContactMessagesPage = {
  rows: ContactMessageRow[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getContactMessages(page = 1): Promise<ContactMessagesPage> {
  const supabase = createAdminClient();
  const pageSize = CONTACT_MESSAGES_PAGE_SIZE;
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const [{ data, count, error }, unread] = await Promise.all([
    supabase
      .from("contact_messages")
      .select("id, name, email, phone, message, created_at, read_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to),
    getUnreadContactMessageCount(),
  ]);

  if (error) throw error;

  const total = count ?? 0;
  return {
    rows: (data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      message: m.message,
      createdAt: m.created_at,
      readAt: m.read_at,
    })),
    total,
    unread,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Unread count for the sidebar badge and dashboard notice. Rendered in the
 * admin layout on every page, so a failure here (e.g. the read_at migration
 * not applied yet) falls back to 0 rather than breaking the whole admin. */
export async function getUnreadContactMessageCount(): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    console.error("Failed to count unread contact messages", error);
    return 0;
  }
  return count ?? 0;
}
