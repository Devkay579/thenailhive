import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const colors = {
  wine: "#4a1620",
  cream: "#fdf9f3",
  ink: "#1a1512",
  inkMuted: "#4a4038",
  blush: "#f0d2cd",
};

export function EmailLayout({
  previewText,
  heading,
  children,
}: {
  previewText: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: colors.cream, fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "0 16px" }}>
          <Section style={{ padding: "28px 0 12px", textAlign: "center" as const }}>
            <Text
              style={{
                color: colors.wine,
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                margin: 0,
              }}
            >
              THENAILHIVE
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: "#ffffff",
              border: `1px solid ${colors.blush}`,
              borderRadius: "16px",
              padding: "28px 24px",
            }}
          >
            <Heading
              as="h1"
              style={{ color: colors.ink, fontSize: "20px", margin: "0 0 12px", fontWeight: 700 }}
            >
              {heading}
            </Heading>
            {children}
          </Section>

          <Hr style={{ borderColor: colors.blush, margin: "24px 0 12px" }} />
          <Text style={{ color: colors.inkMuted, fontSize: "12px", textAlign: "center" as const }}>
            THENAILHIVE &middot; Where your nails become the statement.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const emailTextStyle = { color: colors.ink, fontSize: "14px", lineHeight: "22px" };
export const emailMutedStyle = { color: colors.inkMuted, fontSize: "13px", lineHeight: "20px" };
export const emailAccentStyle = { color: colors.wine, fontWeight: 700 as const };

/** Table-based (Outlook-safe) label/value row for price breakdowns. */
export function DetailRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Row style={{ borderBottom: `1px solid ${colors.blush}`, padding: "6px 0" }}>
      <Column style={{ fontSize: "13px", color: colors.inkMuted, padding: "6px 0" }}>{label}</Column>
      <Column
        align="right"
        style={{
          fontSize: "14px",
          textAlign: "right" as const,
          color: accent ? colors.wine : colors.ink,
          fontWeight: accent ? 700 : 400,
          padding: "6px 0",
        }}
      >
        {value}
      </Column>
    </Row>
  );
}
