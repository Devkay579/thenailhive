import { Section, Text } from "@react-email/components";
import { formatNaira } from "@/lib/mock-data";
import { DetailRow, EmailLayout, emailMutedStyle, emailTextStyle } from "./EmailLayout";
import type { BookingEmailProps } from "./types";

export function BookingConfirmedEmail(props: BookingEmailProps) {
  return (
    <EmailLayout
      previewText={`You're confirmed for ${props.dateLabel} at ${props.timeLabel}.`}
      heading="Your appointment is confirmed 🎉"
    >
      <Text style={emailTextStyle}>Hi {props.clientName},</Text>
      <Text style={emailTextStyle}>
        We&apos;ve received your deposit and your appointment is officially confirmed. We can&apos;t
        wait to see you!
      </Text>

      <Section style={{ margin: "16px 0" }}>
        <DetailRow label="Service" value={`${props.serviceName}${props.lengthLabel ? ` · ${props.lengthLabel}` : ""}`} />
        {props.addonNames.length > 0 && (
          <DetailRow label="Extras" value={props.addonNames.join(", ")} />
        )}
        <DetailRow label="Date & time" value={`${props.dateLabel} at ${props.timeLabel}`} accent />
        <DetailRow label="Deposit paid" value={formatNaira(props.depositNgn)} />
        <DetailRow label="Balance due at appointment" value={formatNaira(props.balanceNgn)} accent />
      </Section>

      <Text style={emailMutedStyle}>
        Booking reference: {props.bookingRef}. Please arrive on time &mdash; 20+ minutes late adds a
        ₦3,000 late fee. Free nail repairs are available within one week of your appointment.
      </Text>
    </EmailLayout>
  );
}

export default BookingConfirmedEmail;
