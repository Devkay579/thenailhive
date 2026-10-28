import { Section, Text } from "@react-email/components";
import { formatNaira } from "@/lib/mock-data";
import { DetailRow, EmailLayout, emailMutedStyle, emailTextStyle } from "./EmailLayout";
import type { BookingEmailProps } from "./types";

export function BookingReminderEmail(props: BookingEmailProps) {
  return (
    <EmailLayout
      previewText={`See you tomorrow at ${props.timeLabel}!`}
      heading="See you tomorrow!"
    >
      <Text style={emailTextStyle}>Hi {props.clientName},</Text>
      <Text style={emailTextStyle}>
        Just a friendly reminder about your appointment tomorrow.
      </Text>

      <Section style={{ margin: "16px 0" }}>
        <DetailRow label="Service" value={`${props.serviceName}${props.lengthLabel ? ` · ${props.lengthLabel}` : ""}`} />
        <DetailRow label="Date & time" value={`${props.dateLabel} at ${props.timeLabel}`} accent />
        <DetailRow label="Balance due at appointment" value={formatNaira(props.balanceNgn)} />
      </Section>

      <Text style={emailMutedStyle}>
        Please arrive on time &mdash; 20+ minutes late adds a ₦3,000 late fee. See you soon!
      </Text>
    </EmailLayout>
  );
}

export default BookingReminderEmail;
