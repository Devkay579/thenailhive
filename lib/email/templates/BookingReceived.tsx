import { Button, Section, Text } from "@react-email/components";
import { formatNaira } from "@/lib/mock-data";
import { DetailRow, EmailLayout, emailMutedStyle, emailTextStyle } from "./EmailLayout";
import type { BookingEmailProps } from "./types";

export function BookingReceivedEmail(props: BookingEmailProps) {
  return (
    <EmailLayout
      previewText={`We've received your booking — send your ${formatNaira(props.depositNgn)} deposit to secure it.`}
      heading="We've got your booking!"
    >
      <Text style={emailTextStyle}>Hi {props.clientName},</Text>
      <Text style={emailTextStyle}>
        Thanks for booking with THENAILHIVE. Your slot is held, but not yet confirmed &mdash; send
        your deposit on WhatsApp and we&apos;ll lock it in.
      </Text>

      <Section style={{ margin: "16px 0" }}>
        <DetailRow label="Service" value={`${props.serviceName}${props.lengthLabel ? ` · ${props.lengthLabel}` : ""}`} />
        {props.addonNames.length > 0 && (
          <DetailRow label="Extras" value={props.addonNames.join(", ")} />
        )}
        <DetailRow label="Date & time" value={`${props.dateLabel} at ${props.timeLabel}`} />
        <DetailRow label="Total" value={formatNaira(props.subtotalNgn)} />
        <DetailRow label="Deposit (non-refundable)" value={formatNaira(props.depositNgn)} accent />
        <DetailRow label="Balance due at appointment" value={formatNaira(props.balanceNgn)} />
      </Section>

      <Text style={emailTextStyle}>
        You&apos;ll find the account to pay your deposit into on your booking page.
      </Text>

      <Section style={{ textAlign: "center" as const, margin: "20px 0 8px" }}>
        <Button
          href={props.bookingUrl}
          style={{
            backgroundColor: "#4a1620",
            color: "#fdf9f3",
            padding: "12px 24px",
            borderRadius: "999px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          View Booking &amp; Payment Details
        </Button>
      </Section>

      <Section style={{ textAlign: "center" as const, margin: "8px 0" }}>
        <Button
          href={props.whatsappUrl}
          style={{
            backgroundColor: "#fdf9f3",
            color: "#4a1620",
            border: "1.5px solid #4a1620",
            padding: "10.5px 22.5px",
            borderRadius: "999px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Send Payment Proof on WhatsApp
        </Button>
      </Section>

      <Text style={emailMutedStyle}>
        Booking reference: {props.bookingRef}. Arriving 20+ minutes late adds a ₦3,000 late fee.
      </Text>
    </EmailLayout>
  );
}

export default BookingReceivedEmail;
