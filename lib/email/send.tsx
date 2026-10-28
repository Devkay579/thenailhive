import "server-only";
import { render, toPlainText } from "@react-email/render";
// Resend needs a verified sending domain to deliver to real customers --
// we don't have one yet (no budget for a custom domain), so its sandbox
// sender can only reach the Resend account's own email. Switched to Gmail
// SMTP below instead. Flip back to this once a domain is verified in Resend.
// import { getResendClient, FROM_EMAIL } from "./resend";
import { getGmailTransporter, FROM_EMAIL } from "./gmail";
import { getBookingById } from "@/lib/data/booking";
import { getBusinessInfo } from "@/lib/data/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { tomorrowInLagos } from "@/lib/availability";
import { SITE_URL } from "@/lib/site";
import { BookingReceivedEmail } from "./templates/BookingReceived";
import { BookingAdminNotificationEmail } from "./templates/BookingAdminNotification";
import { BookingConfirmedEmail } from "./templates/BookingConfirmed";
import { BookingReminderEmail } from "./templates/BookingReminder";
import { ContactNotificationEmail } from "./templates/ContactNotification";
import { ContactReceivedEmail } from "./templates/ContactReceived";
import type { BookingEmailProps, ContactMessageProps } from "./templates/types";

export type SendResult =
  | { skipped: true; reason: string }
  | { skipped: false; ok: true }
  | { skipped: false; ok: false; error: string };

function formatDateLabel(dateStr: string) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function formatTimeLabel(timeStr: string) {
  return timeStr.slice(0, 5);
}

/** Where business-facing notifications (new contact messages, bookings) go. */
function getBusinessInbox() {
  return process.env.CONTACT_NOTIFY_EMAIL ?? process.env.GMAIL_USER;
}

async function buildBookingProps(bookingId: string) {
  const booking = await getBookingById(bookingId);
  if (!booking) return null;

  const businessInfo = await getBusinessInfo();
  const whatsappMessage = encodeURIComponent(
    `Hi THENAILHIVE! Here's my deposit for booking ref ${booking.id.slice(0, 8)} ` +
      `(${formatDateLabel(booking.bookingDate)} at ${formatTimeLabel(booking.startTime)}).`,
  );

  return {
    booking,
    props: {
      clientName: booking.clientName,
      bookingRef: booking.id.slice(0, 8),
      serviceName: booking.serviceName,
      lengthLabel: booking.lengthLabel,
      addonNames: booking.addonNames,
      dateLabel: formatDateLabel(booking.bookingDate),
      timeLabel: formatTimeLabel(booking.startTime),
      subtotalNgn: booking.subtotalNgn,
      depositNgn: booking.depositNgn,
      balanceNgn: booking.balanceNgn,
      whatsappUrl: `https://wa.me/${businessInfo.whatsappNumber}?text=${whatsappMessage}`,
      bookingUrl: `${SITE_URL}/book/${booking.id}`,
    } satisfies BookingEmailProps,
  };
}

async function buildEmailProps(
  bookingId: string,
): Promise<{ email: string; props: BookingEmailProps } | null> {
  const built = await buildBookingProps(bookingId);
  if (!built || !built.booking.clientEmail) return null;
  return { email: built.booking.clientEmail, props: built.props };
}

// --- Resend version (kept for when a verified domain makes this viable again) ---
// async function send(to: string, subject: string, react: React.ReactElement): Promise<SendResult> {
//   try {
//     const resend = getResendClient();
//     const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, react });
//     if (error) return { skipped: false, ok: false, error: error.message };
//     return { skipped: false, ok: true };
//   } catch (err) {
//     return { skipped: false, ok: false, error: err instanceof Error ? err.message : "unknown error" };
//   }
// }

// --- Gmail SMTP version (active) ---
async function send(to: string, subject: string, react: React.ReactElement): Promise<SendResult> {
  try {
    const html = await render(react);
    const transporter = getGmailTransporter();
    // An HTML-only message (no text/plain part) is a classic spam signal, so
    // always send both. Replies go to the business inbox, not the sender.
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      replyTo: getBusinessInbox(),
      subject,
      html,
      text: toPlainText(html),
    });
    return { skipped: false, ok: true };
  } catch (err) {
    return { skipped: false, ok: false, error: err instanceof Error ? err.message : "unknown error" };
  }
}

export async function sendBookingReceivedEmail(bookingId: string): Promise<SendResult> {
  const built = await buildEmailProps(bookingId);
  if (!built) return { skipped: true, reason: "no_email_on_file" };
  return send(
    built.email,
    "We've received your booking — THENAILHIVE",
    <BookingReceivedEmail {...built.props} />,
  );
}

export async function sendBookingConfirmedEmail(bookingId: string): Promise<SendResult> {
  const built = await buildEmailProps(bookingId);
  if (!built) return { skipped: true, reason: "no_email_on_file" };
  return send(
    built.email,
    "You're confirmed! — THENAILHIVE",
    <BookingConfirmedEmail {...built.props} />,
  );
}

/** Tells the business inbox about a new online booking or a confirmation.
 * Sent regardless of whether the client left an email address. */
export async function sendBookingAdminNotification(
  bookingId: string,
  event: "new" | "confirmed",
): Promise<SendResult> {
  const inbox = getBusinessInbox();
  if (!inbox) return { skipped: true, reason: "no_business_inbox_configured" };

  const built = await buildBookingProps(bookingId);
  if (!built) return { skipped: true, reason: "booking_not_found" };

  const { booking, props } = built;
  const subject =
    event === "new"
      ? `New booking: ${booking.clientName}, ${props.dateLabel} at ${props.timeLabel}`
      : `Booking confirmed: ${booking.clientName}, ${props.dateLabel} at ${props.timeLabel}`;

  return send(
    inbox,
    subject,
    <BookingAdminNotificationEmail
      {...props}
      event={event}
      clientEmail={booking.clientEmail}
      clientPhone={booking.clientPhone}
      adminUrl={`${SITE_URL}/admin/bookings/${booking.id}`}
    />,
  );
}

export async function sendBookingReminderEmail(bookingId: string): Promise<SendResult> {
  const built = await buildEmailProps(bookingId);
  if (!built) return { skipped: true, reason: "no_email_on_file" };
  return send(
    built.email,
    "See you tomorrow! — THENAILHIVE",
    <BookingReminderEmail {...built.props} />,
  );
}

/** Notifies the business of a new Contact page message, and sends the
 * submitter an auto-reply confirming it was received. Both are best-effort --
 * the message is already saved to the DB before this is called, so a failed
 * send here doesn't lose it. */
export async function sendContactMessageEmails(
  props: ContactMessageProps,
): Promise<{ notify: SendResult; autoReply: SendResult }> {
  const businessInbox = getBusinessInbox();
  if (!businessInbox) {
    return {
      notify: { skipped: true, reason: "no_business_inbox_configured" },
      autoReply: await send(props.email, "We've received your message — THENAILHIVE", <ContactReceivedEmail {...props} />),
    };
  }

  const [notify, autoReply] = await Promise.all([
    send(businessInbox, `New message from ${props.name} — Contact page`, <ContactNotificationEmail {...props} />),
    send(props.email, "We've received your message — THENAILHIVE", <ContactReceivedEmail {...props} />),
  ]);
  return { notify, autoReply };
}

/** Sends reminder emails for every confirmed/deposit-paid booking tomorrow.
 * Called by the daily cron route. */
export async function sendTomorrowReminders() {
  const supabase = createAdminClient();
  const date = tomorrowInLagos();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("booking_date", date)
    .in("status", ["deposit_paid", "confirmed"]);

  if (error) throw error;

  const results = await Promise.all(
    (bookings ?? []).map(async (b) => ({ bookingId: b.id, result: await sendBookingReminderEmail(b.id) })),
  );

  return { date, total: bookings?.length ?? 0, results };
}
