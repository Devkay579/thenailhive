import { Section, Text } from "@react-email/components";
import { DetailRow, EmailLayout, emailTextStyle } from "./EmailLayout";
import type { ContactMessageProps } from "./types";

export function ContactNotificationEmail(props: ContactMessageProps) {
  return (
    <EmailLayout
      previewText={`New contact form message from ${props.name}`}
      heading="New message from the Contact page"
    >
      <Section style={{ margin: "0 0 16px" }}>
        <DetailRow label="Name" value={props.name} />
        <DetailRow label="Email" value={props.email} />
        {props.phone ? <DetailRow label="Phone" value={props.phone} /> : null}
      </Section>

      <Text style={{ ...emailTextStyle, whiteSpace: "pre-wrap" as const }}>{props.message}</Text>
    </EmailLayout>
  );
}

export default ContactNotificationEmail;
