import { ImageResponse } from "next/og";

// Home-screen icon for iPhone/iPad (Safari doesn't use the SVG favicon
// there). Same mark as app/icon.svg, full-bleed since iOS rounds the corners.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path d="M24 5.5 39.5 15v18L24 42.5 8.5 33V15Z" fill="none" stroke="#fdf9f3" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M24 16c-4 0-7 2.5-7 6.5S20 29 24 29s7-2.5 7-6.5S28 16 24 16Z" fill="#fdf9f3"/>
  <path d="M24 16v13M18.5 19.5h11M17.5 26h13" stroke="#4a1620" stroke-width="1.4"/>
</svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#4a1620",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> only */}
        <img
          src={`data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`}
          alt=""
          width={130}
          height={130}
        />
      </div>
    ),
    size,
  );
}
