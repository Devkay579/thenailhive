import { Button, Section, Text } from "@react-email/components";
import { formatNaira } from "@/lib/mock-data";
import { DetailRow, EmailLayout, emailMutedStyle, emailTextStyle } from "./EmailLayout";
import type { BookingAdminNotificationProps } from "./types";

/** Sent to the business inbox when a client books online, and again when a
 * booking is confirmed -- the client gets their own separate email. */
export function BookingAdminNotificationEmail(props: BookingAdminNotificationProps) {
  const isNew = props.event === "new";

  return (
    <EmailLayout
      previewText={
        isNew
          ? `New booking from ${props.clientName} for ${props.dateLabel} at ${props.timeLabel}`
          : `Booking confirmed: ${props.clientName}, ${props.dateLabel} at ${props.timeLabel}`
      }
      heading={isNew ? "New booking received" : "Booking confirmed"}
    >
      <Text style={emailTextStyle}>
        {isNew
          ? `${props.clientName} just booked online. The slot is held until their ${formatNaira(props.depositNgn)} deposit comes in.`
          : `${props.clientName}'s booking is now confirmed and they've been emailed.`}
      </Text>

      <Section style={{ margin: "16px 0" }}>
        <DetailRow label="Client" value={props.clientName} />
        <DetailRow label="Phone" value={props.clientPhone || "—"} />
        <DetailRow label="Email" value={props.clientEmail || "—"} />
        <DetailRow label="Service" value={`${props.serviceName}${props.lengthLabel ? ` · ${props.lengthLabel}` : ""}`} />
        {props.addonNames.length > 0 && <DetailRow label="Extras" value={props.addonNames.join(", ")} />}
        <DetailRow label="Date & time" value={`${props.dateLabel} at ${props.timeLabel}`} />
        <DetailRow label="Total" value={formatNaira(props.subtotalNgn)} />
        <DetailRow label="Deposit" value={formatNaira(props.depositNgn)} accent />
        <DetailRow label="Balance on the day" value={formatNaira(props.balanceNgn)} />
      </Section>

      <Section style={{ textAlign: "center" as const, margin: "20px 0 8px" }}>
        <Button
          href={props.adminUrl}
          style={{
            backgroundColor: "#4a1620",
            color: "#fdf9f3",
            padding: "12px 24px",
            borderRadius: "999px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Open in Studio Desk
        </Button>
      </Section>

      <Text style={emailMutedStyle}>Booking reference: {props.bookingRef}</Text>
    </EmailLayout>
  );
}

export default BookingAdminNotificationEmail;
