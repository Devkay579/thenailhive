import { Nail3D, type NailFinish } from "@/components/three/Nail3D";

const BACKDROPS = ["bg-wine-900", "bg-blush-200", "bg-olive-500", "bg-blush-100"];

// Nail finish that contrasts with each backdrop.
const FINISHES: NailFinish[] = ["pearl", "wine", "french", "rose"];

/** Placeholder "product shot" for services/gallery items without a photo:
 *  one painted tip standing on a flat colour backdrop with a floor shadow. */
export function NailTile({
  label,
  variant = 0,
  className = "",
}: {
  label?: string;
  variant?: number;
  className?: string;
}) {
  const backdrop = BACKDROPS[variant % BACKDROPS.length];
  const finish = FINISHES[variant % FINISHES.length];
  const tilt = [-12, 8, -5, 14][variant % 4];

  return (
    <div
      className={`grain relative flex aspect-square items-center justify-center overflow-hidden ${backdrop} ${className}`}
    >
      {/* Horizon line where the backdrop sweep meets the table */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-b from-black/0 to-black/10" />
      <div
        aria-hidden="true"
        className="absolute bottom-[17%] h-[7%] w-[30%] rounded-[50%] bg-ink-950/35 blur-[6px]"
      />
      <div className="relative aspect-[3/5] h-[56%] origin-bottom" style={{ transform: `rotate(${tilt}deg)` }}>
        <Nail3D finish={finish} className="h-full w-full" />
      </div>

      {label ? (
        <span className="absolute bottom-3 left-3 bg-cream-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-wine-900">
          {label}
        </span>
      ) : null}
    </div>
  );
}
