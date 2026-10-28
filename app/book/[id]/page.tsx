import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Kicker } from "@/components/ui/SectionHeading";
import { CopyButton } from "@/components/ui/CopyButton";
import { WhatsAppIcon } from "@/components/icons";
import { getBookingById } from "@/lib/data/booking";
import { getBusinessInfo } from "@/lib/data/settings";
import { formatNaira } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Booking Confirmation | THENAILHIVE",
  // Private to whoever holds the link.
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting deposit",
  deposit_paid: "Deposit received",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [booking, businessInfo] = await Promise.all([getBookingById(id), getBusinessInfo()]);

  if (!booking) notFound();

  const dateLabel = new Date(`${booking.bookingDate}T00:00:00`).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = booking.startTime.slice(0, 5);

  const message = encodeURIComponent(
    `Hi THENAILHIVE! I just booked an appointment.\n` +
      `Booking ref: ${booking.id.slice(0, 8)}\n` +
      `Service: ${booking.serviceName}${booking.lengthLabel ? ` (${booking.lengthLabel})` : ""}\n` +
      `Date: ${dateLabel} at ${timeLabel}\n` +
      `Deposit due: ${formatNaira(booking.depositNgn)}\n` +
      `I'm sending my deposit payment proof now.`,
  );

  const isAwaitingPayment = booking.status === "pending_payment";
  const { bank } = businessInfo;
  const hasBankDetails = Boolean(bank.accountNumber);

  const lines: Array<[string, string]> = [
    ["Service", `${booking.serviceName}${booking.lengthLabel ? ` · ${booking.lengthLabel}` : ""}`],
    ...(booking.addonNames.length > 0 ? [["Extras", booking.addonNames.join(", ")] as [string, string]] : []),
    ["Date", dateLabel],
    ["Time", timeLabel],
  ];

  return (
    <section className="py-12 sm:py-20">
      <Container className="max-w-2xl">
        <div className="text-center">
          <Kicker className="justify-center">{STATUS_LABELS[booking.status] ?? booking.status}</Kicker>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
            {isAwaitingPayment ? (
              <>
                Almost <span className="font-script font-medium italic text-wine-900">there!</span>
              </>
            ) : (
              <>
                You&apos;re <span className="font-script font-medium italic text-wine-900">booked.</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-ink-700">
            {isAwaitingPayment
              ? "Your slot is held. Send your deposit on WhatsApp to secure it."
              : "We can't wait to see you."}
          </p>
        </div>

        {/* The completed appointment card */}
        <div className="mt-10 flex flex-col overflow-hidden rounded-2xl bg-[#fffdf9] shadow-[0_2px_3px_rgb(26_21_18/0.08),24px_30px_50px_-20px_rgb(46_14_21/0.4)] ring-1 ring-ink-950/10 sm:flex-row">
          <div className="flex-1 p-6 sm:p-8">
            <Kicker>Appointment Card</Kicker>
            <dl className="mt-6 space-y-4">
              {lines.map(([label, value]) => (
                <div key={label} className="flex items-end gap-3">
                  <dt className="w-16 shrink-0 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-700">
                    {label}
                  </dt>
                  <dd className="min-w-0 flex-1 border-b border-ink-950/20 pb-0.5 font-script text-lg italic leading-tight text-wine-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-7 space-y-2 border-t border-dashed border-ink-950/15 pt-5 text-sm">
              {(
                [
                  ["Total", booking.subtotalNgn, "text-ink-950"],
                  ["Deposit (non-refundable)", booking.depositNgn, "text-wine-900"],
                  ["Balance on the day", booking.balanceNgn, "text-ink-950"],
                ] as const
              ).map(([label, amount, tone]) => (
                <div key={label} className="flex items-end">
                  <span className="text-ink-700">{label}</span>
                  <span className="leader" aria-hidden="true" />
                  <span className={`font-display text-base font-semibold ${tone}`}>{formatNaira(amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center border-t-2 border-dashed border-ink-950/20 bg-wine-900 px-6 py-5 text-cream-50 sm:w-32 sm:border-l-2 sm:border-t-0 sm:py-0">
            <span aria-hidden="true" className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-cream-50" />
            <span aria-hidden="true" className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-cream-50 sm:-bottom-3 sm:-left-3 sm:right-auto sm:top-auto" />
            <div className="flex items-center gap-3 sm:rotate-90 sm:whitespace-nowrap">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blush-300">Ref</span>
              <span className="font-mono text-sm tracking-wider">{booking.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {isAwaitingPayment && (
          <div className="grain grain-light mt-10 rounded-2xl bg-wine-900 p-7 text-cream-50 shadow-[10px_10px_0_var(--color-blush-300)] sm:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blush-300">Next step</p>
            <p className="mt-3 font-display text-2xl font-semibold leading-snug">
              Send {formatNaira(booking.depositNgn)} via bank transfer, then{" "}
              <span className="font-script font-medium italic text-blush-300">message us the proof.</span>
            </p>
            <p className="mt-2 text-sm text-cream-100/75">
              We&apos;ll confirm your appointment as soon as we verify your deposit.
            </p>

            {hasBankDetails ? (
              <div className="mt-6 rounded-xl border border-cream-50/20 bg-cream-50/5 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blush-300">Pay into</p>
                <dl className="mt-3 space-y-3 text-sm">
                  {bank.bankName ? (
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-cream-100/70">Bank</dt>
                      <dd className="text-right font-medium">{bank.bankName}</dd>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-cream-100/70">Account number</dt>
                    <dd className="flex items-center gap-3">
                      <span className="font-mono text-lg font-semibold tracking-wider">{bank.accountNumber}</span>
                      <CopyButton
                        value={bank.accountNumber}
                        className="border-cream-50/30 text-cream-50 hover:border-blush-300 hover:text-blush-300"
                      />
                    </dd>
                  </div>
                  {bank.accountName ? (
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-cream-100/70">Account name</dt>
                      <dd className="text-right font-medium">{bank.accountName}</dd>
                    </div>
                  ) : null}
                  <div className="flex items-baseline justify-between gap-4 border-t border-cream-50/15 pt-3">
                    <dt className="text-cream-100/70">Amount</dt>
                    <dd className="font-display text-lg font-semibold text-blush-300">{formatNaira(booking.depositNgn)}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-cream-100/60">
                  Use <span className="font-mono">{booking.id.slice(0, 8).toUpperCase()}</span> as the transfer narration
                  if you can.
                </p>
              </div>
            ) : (
              <p className="mt-6 text-sm text-cream-100/75">
                Message us on WhatsApp and we&apos;ll send you our account details.
              </p>
            )}

            <Button
              href={`https://wa.me/${businessInfo.whatsappNumber}?text=${message}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              size="lg"
              className="mt-7"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Send Payment Proof
            </Button>
          </div>
        )}

        {booking.clientEmail ? (
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-dashed border-wine-700/30 bg-blush-100/40 px-5 py-4 text-center text-sm text-ink-700">
            <p className="font-medium text-ink-950">
              We&apos;ve emailed a copy of this booking to {booking.clientEmail}.
            </p>
            <p className="mt-1">
              Can&apos;t find it? Check your <span className="font-semibold text-wine-900">spam or junk folder</span>, mark it
              as &ldquo;Not spam&rdquo; and add us to your contacts so our confirmation and reminder emails reach your inbox.
            </p>
          </div>
        ) : null}

        <p className="mt-8 text-center text-xs text-ink-700">
          Full booking reference: <span className="font-mono">{booking.id}</span>
        </p>
      </Container>
    </section>
  );
}
