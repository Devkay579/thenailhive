import { useId } from "react";

export type NailFinish =
  | "wine"
  | "blush"
  | "pearl"
  | "olive"
  | "french"
  | "rose"
  | "cocoa"
  | "milk";

const FINISHES: Record<NailFinish, { from: string; to: string; tip?: string }> = {
  wine: { from: "#8a3344", to: "#4a1620" },
  blush: { from: "#f7e3e0", to: "#d9a39b" },
  pearl: { from: "#ffffff", to: "#e8dccb" },
  olive: { from: "#b5b57a", to: "#6b6b3a" },
  french: { from: "#f7e3e0", to: "#eec1ba", tip: "#fdf9f3" },
  rose: { from: "#c9687c", to: "#6d2231" },
  cocoa: { from: "#6b5a4e", to: "#1a1512" },
  milk: { from: "#fdf9f3", to: "#f0d2cd" },
};

const ALMOND =
  "M30 2C47 2 55 24 55 46v40c0 7-5 12-12 12H17C10 98 5 93 5 86V46C5 24 13 2 30 2Z";

/**
 * A glossy almond nail rendered as layered SVG gradients: base colour, a
 * horizontal curvature shade (dark edges, lit middle) that makes it read as a
 * curved surface, and a long specular highlight.
 */
export function Nail3D({
  finish = "wine",
  className = "",
}: {
  finish?: NailFinish;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const f = FINISHES[finish];

  return (
    <svg viewBox="0 0 60 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={f.from} />
          <stop offset="1" stopColor={f.to} />
        </linearGradient>
        <linearGradient id={`${id}-curve`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2e0e15" stopOpacity="0.35" />
          <stop offset="0.28" stopColor="#2e0e15" stopOpacity="0" />
          <stop offset="0.7" stopColor="#2e0e15" stopOpacity="0" />
          <stop offset="1" stopColor="#2e0e15" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={`${id}-spec`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={ALMOND} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        <rect width="60" height="100" fill={`url(#${id}-base)`} />
        {f.tip ? <path d="M0 0h60v30C44 22 16 22 0 30Z" fill={f.tip} /> : null}
        <rect width="60" height="100" fill={`url(#${id}-curve)`} />
        <path d="M17 14c3-6 7-8 9-8-3 6-5 20-5 44 0 10 0 20 1 30-3 0-6-2-6-6-1-24-1-46 1-60Z" fill={`url(#${id}-spec)`} opacity="0.85" />
        <ellipse cx="40" cy="22" rx="3" ry="6" fill="#fff" opacity="0.5" />
      </g>
      <path d={ALMOND} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.8" />
    </svg>
  );
}
