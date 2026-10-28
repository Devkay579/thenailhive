import { CONTACT_MESSAGES_PAGE_SIZE, getContactMessages } from "@/lib/data/admin/contactMessages";
import { setMessageRead, markAllMessagesRead } from "@/app/admin/messages/actions";
import { AdminCard } from "@/components/admin/ui";
import { ActionForm } from "@/components/ui/ActionForm";
import { Pagination } from "@/components/admin/Pagination";
import { cn } from "@/lib/cn";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const { rows: messages, total, unread, totalPages } = await getContactMessages(page);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">Messages</h1>
          <p className="text-sm text-ink-700">
            {total} message{total === 1 ? "" : "s"} from the Contact page form
            {unread > 0 ? (
              <>
                {" "}&middot; <span className="font-medium text-wine-900">{unread} unread</span>
              </>
            ) : null}
            .
          </p>
        </div>
        {unread > 0 ? (
          <ActionForm action={markAllMessagesRead} successMessage="All messages marked as read.">
            <button
              type="submit"
              className="rounded-full border border-blush-300 px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-wine-700 hover:text-wine-900"
            >
              Mark all as read
            </button>
          </ActionForm>
        ) : null}
      </div>

      <AdminCard>
        {messages.length === 0 ? (
          <p className="text-sm text-ink-700">No messages yet.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const isUnread = m.readAt === null;
              return (
                <div
                  key={m.id}
                  className={cn(
                    "rounded-xl border p-4",
                    isUnread ? "border-wine-700/40 bg-cream-50 shadow-[3px_3px_0_var(--color-blush-300)]" : "border-ink-950/10 bg-cream-100",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-2 font-medium text-ink-950">
                        {isUnread ? <span aria-hidden="true" className="h-2 w-2 rounded-full bg-wine-900" /> : null}
                        {m.name}
                        {isUnread ? (
                          <span className="rounded-full bg-wine-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cream-50">
                            New
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-ink-700">
                        <a href={`mailto:${m.email}`} className="hover:text-wine-900">
                          {m.email}
                        </a>
                        {m.phone ? <> &middot; {m.phone}</> : null}
                      </p>
                    </div>
                    <p className="text-xs text-ink-700">
                      {new Date(m.createdAt).toLocaleString("en-NG", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink-950">{m.message}</p>
                  <div className="mt-3">
                    <ActionForm
                      action={setMessageRead.bind(null, m.id, isUnread)}
                      successMessage={isUnread ? "Marked as read." : "Marked as unread."}
                    >
                      <button type="submit" className="text-xs font-medium text-wine-900 hover:underline">
                        {isUnread ? "Mark as read" : "Mark as unread"}
                      </button>
                    </ActionForm>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={total} basePath="/admin/messages" searchParams={params} pageSize={CONTACT_MESSAGES_PAGE_SIZE} noun="message" />
      </AdminCard>
    </div>
  );
}
