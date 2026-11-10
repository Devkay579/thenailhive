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
  replies: ContactMessageReply[];
};

export type ContactMessageReply = {
  id: string;
  body: string;
  sentBy: string | null;
  createdAt: string;
};

/** Replies for the given messages, grouped by message id. Fetched separately
 * (not embedded) so a missing replies table -- migration not applied yet --
 * only hides history instead of breaking the inbox. */
async function getRepliesByMessage(messageIds: string[]): Promise<Map<string, ContactMessageReply[]>> {
  const byMessage = new Map<string, ContactMessageReply[]>();
  if (messageIds.length === 0) return byMessage;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_message_replies")
    .select("id, message_id, body, sent_by, created_at")
    .in("message_id", messageIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load contact message replies", error);
    return byMessage;
  }

  for (const r of data ?? []) {
    const list = byMessage.get(r.message_id) ?? [];
    list.push({ id: r.id, body: r.body, sentBy: r.sent_by, createdAt: r.created_at });
    byMessage.set(r.message_id, list);
  }
  return byMessage;
}

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
  const replies = await getRepliesByMessage((data ?? []).map((m) => m.id));
  return {
    rows: (data ?? []).map((m) => ({
      replies: replies.get(m.id) ?? [],
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
