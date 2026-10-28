import { Text } from "@react-email/components";
import { EmailLayout, emailMutedStyle, emailTextStyle } from "./EmailLayout";
import type { ContactMessageProps } from "./types";

export function ContactReceivedEmail(props: ContactMessageProps) {
  return (
    <EmailLayout
      previewText="Thanks for reaching out — we've got your message and will reply soon."
      heading="Thanks for reaching out!"
    >
      <Text style={emailTextStyle}>Hi {props.name},</Text>
      <Text style={emailTextStyle}>
        We&apos;ve received your message and will get back to you as soon as we can &mdash;
        usually within a day.
      </Text>
      <Text style={emailMutedStyle}>
        In a hurry? You can also reach us directly on WhatsApp or Instagram from the Contact page.
      </Text>
    </EmailLayout>
  );
}

export default ContactReceivedEmail;
