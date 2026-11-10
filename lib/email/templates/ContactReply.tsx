import { Text } from "@react-email/components";
import { EmailLayout, emailMutedStyle, emailTextStyle } from "./EmailLayout";
import type { ContactReplyProps } from "./types";

export function ContactReplyEmail(props: ContactReplyProps) {
  const preview = props.reply.length > 90 ? `${props.reply.slice(0, 90)}…` : props.reply;
  return (
    <EmailLayout previewText={preview} heading="A reply to your message">
      <Text style={emailTextStyle}>Hi {props.name},</Text>
      <Text style={{ ...emailTextStyle, whiteSpace: "pre-wrap" as const }}>{props.reply}</Text>
      <Text style={emailTextStyle}>&mdash; THENAILHIVE</Text>
      <Text
        style={{
          ...emailMutedStyle,
          whiteSpace: "pre-wrap" as const,
          borderLeft: "3px solid #f0d2cd",
          paddingLeft: "12px",
          marginTop: "20px",
        }}
      >
        <strong>Your message:</strong>
        {"\n"}
        {props.originalMessage}
      </Text>
      <Text style={emailMutedStyle}>You can reply to this email directly to continue the conversation.</Text>
    </EmailLayout>
  );
}

export default ContactReplyEmail;
