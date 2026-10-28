import type { Metadata } from "next";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/AdminNav";
import { getUnreadContactMessageCount } from "@/lib/data/admin/contactMessages";

export const metadata: Metadata = {
  title: "Studio Desk | THENAILHIVE",
  robots: { index: false, follow: false },
};

// Every admin page reads live, frequently-changing data (bookings, settings,
// team list, ...) straight from Supabase with the service-role client, which
// Next's static analysis can't see as "dynamic" on its own -- without this it
// would prerender these pages once at build time and serve stale data.
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const unreadMessages = await getUnreadContactMessageCount();
  const badges = { "/admin/messages": unreadMessages };

  return (
    <div className="admin flex min-h-full flex-1 bg-cream-50">
      <AdminSidebar badges={badges} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav badges={badges} />
        <main className="grain min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
