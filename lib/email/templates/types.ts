export type BookingEmailProps = {
  clientName: string;
  bookingRef: string;
  serviceName: string;
  lengthLabel: string;
  addonNames: string[];
  dateLabel: string;
  timeLabel: string;
  subtotalNgn: number;
  depositNgn: number;
  balanceNgn: number;
  whatsappUrl: string;
  /** The client's booking page, which shows the deposit account details. Bank
   * details stay out of the email itself -- account numbers plus a payment
   * request from a young Gmail sender read as phishing to spam filters. */
  bookingUrl: string;
};

export type BookingAdminNotificationProps = BookingEmailProps & {
  event: "new" | "confirmed";
  clientEmail: string | null;
  clientPhone: string;
  adminUrl: string;
};

export type ContactMessageProps = {
  name: string;
  email: string;
  phone: string;
  message: string;
};
