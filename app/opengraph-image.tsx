import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The preview card shown when the site is shared on WhatsApp, Instagram,
// X, iMessage etc. Every page inherits it.
export const alt = "THENAILHIVE — Gel X, acrylic, BIAB and nail art. Book online.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const WINE = "#4a1620";
const WINE_DEEP = "#2e0e15";
const BLUSH = "#eec1ba";
const CREAM = "#fdf9f3";

export default async function Image() {
  const hero = await readFile(join(process.cwd(), "public", "hero.jpg"), "base64");

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: WINE }}>
        <div style={{ display: "flex", width: 520, height: "100%", position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> only */}
          <img
            src={`data:image/jpeg;base64,${hero}`}
            alt=""
            width={520}
            height={630}
            style={{ width: 520, height: 630, objectFit: "cover" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "64px 64px 56px",
            background: `linear-gradient(160deg, ${WINE} 0%, ${WINE_DEEP} 100%)`,
            color: CREAM,
          }}
        >
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: BLUSH, textTransform: "uppercase" }}>
            Nails · Beauty · Confidence
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 84, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>
              THENAILHIVE
            </div>
            <div style={{ display: "flex", marginTop: 24, fontSize: 34, lineHeight: 1.3, color: CREAM, opacity: 0.85 }}>
              Gel X, acrylic, BIAB, toes &amp; nail art.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                padding: "16px 32px",
                borderRadius: 999,
                background: CREAM,
                color: WINE,
                fontSize: 28,
                fontWeight: 700,
                boxShadow: `6px 6px 0 ${BLUSH}`,
              }}
            >
              Book online
            </div>
            <div style={{ display: "flex", fontSize: 24, color: BLUSH }}>@the.nail_hive</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
