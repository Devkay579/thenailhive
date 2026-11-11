import { ImageResponse } from "next/og";

// PNG app icons for the web app manifests (public/site.webmanifest and
// public/admin.webmanifest). Android needs 192 + 512 PNGs to offer
// "Install app"; the maskable one keeps the mark inside the safe zone so
// launchers can crop it to a circle/squircle. Same mark as app/icon.svg.
// Generated once at build time via generateStaticParams.

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path d="M24 5.5 39.5 15v18L24 42.5 8.5 33V15Z" fill="none" stroke="#fdf9f3" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M24 16c-4 0-7 2.5-7 6.5S20 29 24 29s7-2.5 7-6.5S28 16 24 16Z" fill="#fdf9f3"/>
  <path d="M24 16v13M18.5 19.5h11M17.5 26h13" stroke="#4a1620" stroke-width="1.4"/>
</svg>`;

const ICONS: Record<string, { size: number; markRatio: number }> = {
  "icon-192.png": { size: 192, markRatio: 0.72 },
  "icon-512.png": { size: 512, markRatio: 0.72 },
  // Maskable: launchers may crop to the inner 80% circle, so shrink the mark.
  "icon-maskable-512.png": { size: 512, markRatio: 0.55 },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ICONS).map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: RouteContext<"/pwa/[file]">) {
  const { file } = await params;
  const icon = ICONS[file];
  if (!icon) return new Response("Not found", { status: 404 });

  const markSize = Math.round(icon.size * icon.markRatio);
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
          width={markSize}
          height={markSize}
        />
      </div>
    ),
    { width: icon.size, height: icon.size },
  );
}
