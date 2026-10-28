import { listAdminUsers } from "@/lib/data/admin/team";
import { AdminCard } from "@/components/admin/ui";
import { CreateAdminForm } from "@/components/admin/CreateAdminForm";
import { RemoveAdminButton } from "@/components/admin/RemoveAdminButton";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default async function AdminTeamPage() {
  const admins = await listAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">Team</h1>
        <p className="text-sm text-ink-700">
          Anyone with an account here has full admin access &mdash; there&apos;s no separate customer login.
        </p>
      </div>

      <AdminCard title="Change Your Password">
        <ChangePasswordForm />
      </AdminCard>

      <AdminCard title="Add an Admin">
        <CreateAdminForm />
      </AdminCard>

      <AdminCard title={`Admin Accounts (${admins.length})`}>
        {/* Mobile: stacked cards */}
        <div className="space-y-3 sm:hidden">
          {admins.map((a) => (
            <div key={a.id} className="rounded-xl border border-ink-950/10 bg-cream-100 p-3">
              <p className="break-all font-medium text-ink-950">{a.email}</p>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-ink-700">
                <div>
                  <dt className="uppercase tracking-wide">Created</dt>
                  <dd>{new Date(a.createdAt).toLocaleDateString("en-NG")}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide">Last sign in</dt>
                  <dd>{a.lastSignInAt ? new Date(a.lastSignInAt).toLocaleDateString("en-NG") : "Never"}</dd>
                </div>
              </dl>
              <div className="mt-2 text-right">
                <RemoveAdminButton userId={a.id} />
              </div>
            </div>
          ))}
        </div>

        {/* Tablet/desktop: table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-950/10 text-left text-xs uppercase tracking-[0.16em] text-ink-700">
                <th className="pb-2 pr-3">Email</th>
                <th className="pb-2 pr-3">Created</th>
                <th className="pb-2 pr-3">Last Sign In</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/[0.07]">
              {admins.map((a) => (
                <tr key={a.id}>
                  <td className="py-2 pr-3 font-medium text-ink-950">{a.email}</td>
                  <td className="py-2 pr-3 text-ink-700">{new Date(a.createdAt).toLocaleDateString("en-NG")}</td>
                  <td className="py-2 pr-3 text-ink-700">
                    {a.lastSignInAt ? new Date(a.lastSignInAt).toLocaleDateString("en-NG") : "Never"}
                  </td>
                  <td className="py-2 text-right">
                    <RemoveAdminButton userId={a.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
