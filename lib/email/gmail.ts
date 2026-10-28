import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

/**
 * Gmail SMTP transport -- used instead of Resend until the business has a
 * verified sending domain (Resend's free sandbox sender can only deliver to
 * the account owner's own email, which doesn't work for real customers).
 *
 * Needs a Gmail *App Password* (Google Account -> Security -> 2-Step
 * Verification -> App Passwords), not the account's normal login password.
 */
export function getGmailTransporter() {
  if (!transporter) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars.");
    }
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
}

export const FROM_EMAIL =
  process.env.GMAIL_FROM_EMAIL ?? `THENAILHIVE <${process.env.GMAIL_USER}>`;
