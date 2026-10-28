import { getSettingsAdmin } from "@/lib/data/admin/settings";
import { updateSettings } from "@/app/admin/settings/actions";
import { AdminCard, inputClass, labelClass } from "@/components/admin/ui";
import { ActionForm } from "@/components/ui/ActionForm";

export default async function AdminSettingsPage() {
  const settings = await getSettingsAdmin();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">Settings</h1>

      <AdminCard>
        <ActionForm action={updateSettings} successMessage="Settings saved." className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Deposit percentage</label>
              <input
                type="number"
                name="deposit_percent"
                min={0}
                max={100}
                defaultValue={settings.deposit_percent}
                className={`${inputClass} mt-1`}
              />
            </div>
            <div>
              <label className={labelClass}>Late fee (₦)</label>
              <input
                type="number"
                name="late_fee_ngn"
                min={0}
                defaultValue={settings.late_fee_ngn}
                className={`${inputClass} mt-1`}
              />
            </div>
            <div>
              <label className={labelClass}>WhatsApp number (with country code)</label>
              <input name="whatsapp_number" defaultValue={settings.whatsapp_number} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className={labelClass}>Display phone number</label>
              <input name="phone_display" defaultValue={settings.phone_display} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className={labelClass}>Instagram handle</label>
              <input name="instagram_handle" defaultValue={settings.instagram_handle} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className={labelClass}>TikTok handle</label>
              <input name="tiktok_handle" defaultValue={settings.tiktok_handle} className={`${inputClass} mt-1`} />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink-950">Deposit bank account</p>
            <p className="text-xs text-ink-700">Shown to clients after they book, so they know where to send their deposit.</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Bank name</label>
                <input name="bank_name" defaultValue={settings.bank_name ?? ""} placeholder="e.g. GTBank" className={`${inputClass} mt-1`} />
              </div>
              <div>
                <label className={labelClass}>Account number</label>
                <input
                  name="bank_account_number"
                  inputMode="numeric"
                  defaultValue={settings.bank_account_number ?? ""}
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div>
                <label className={labelClass}>Account name</label>
                <input name="bank_account_name" defaultValue={settings.bank_account_name ?? ""} className={`${inputClass} mt-1`} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Booking policy text</label>
            <textarea name="policy_text" rows={5} defaultValue={settings.policy_text} className={`${inputClass} mt-1`} />
          </div>

          <button type="submit" className="rounded-full bg-wine-900 px-5 py-2 text-sm font-medium text-cream-50 hover:bg-wine-800 border border-wine-950 shadow-[3px_3px_0_var(--color-blush-300)] transition-[transform,box-shadow,background-color] hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none">
            Save Settings
          </button>
        </ActionForm>
      </AdminCard>
    </div>
  );
}
