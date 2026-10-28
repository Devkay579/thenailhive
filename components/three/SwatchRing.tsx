"use client";

import { useRef, useState, type PointerEvent } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Nail3D, type NailFinish } from "@/components/three/Nail3D";

const SWATCHES: Array<{ finish: NailFinish; name: string }> = [
  { finish: "wine", name: "Merlot Gel" },
  { finish: "french", name: "Classic French" },
  { finish: "olive", name: "Olive Matte" },
  { finish: "milk", name: "Milk Bath" },
  { finish: "rose", name: "Rosé Cat-Eye" },
  { finish: "pearl", name: "Pearl Chrome" },
  { finish: "cocoa", name: "Cocoa Glaze" },
  { finish: "blush", name: "Ballet Blush" },
];

const N = SWATCHES.length;
const STEP = 360 / N;
const IDLE_SPEED = -0.008; // deg per ms
const DRAG_GAIN = 0.35; // deg per px

function Tip({ index, angle, finish }: { index: number; angle: MotionValue<number>; finish: NailFinish }) {
  // Dim tips as they swing round the back of the ring.
  const filter = useTransform(angle, (a) => {
    const facing = Math.cos(((a + index * STEP) * Math.PI) / 180); // 1 front, -1 back
    return `brightness(${0.6 + 0.4 * ((facing + 1) / 2)})`;
  });

  return (
    <motion.div
      className="absolute bottom-0 left-[calc(var(--tip)/-2)] aspect-[3/5] w-[var(--tip)] origin-bottom"
      style={{
        transform: `rotateY(${index * STEP}deg) translateZ(var(--r))`,
        filter,
      }}
    >
      <Nail3D finish={finish} className="h-full w-full" />
    </motion.div>
  );
}

/**
 * A salon swatch ring rendered in CSS 3D: eight painted tips standing round a
 * turntable. It idles slowly, and can be dragged (mouse or finger) to spin,
 * with a little inertia. The tip facing front is named below.
 */
export function SwatchRing() {
  const reduce = useReducedMotion();
  const angle = useMotionValue(0);
  const [front, setFront] = useState(0);
  const drag = useRef<{ x: number; a: number; lastX: number; lastT: number } | null>(null);
  const velocity = useRef(0);

  useMotionValueEvent(angle, "change", (a) => {
    setFront((((Math.round(-a / STEP) % N) + N) % N));
  });

  useAnimationFrame((_, delta) => {
    if (drag.current) return;
    if (Math.abs(velocity.current) > 0.005) {
      angle.set(angle.get() + velocity.current * delta);
      velocity.current *= 0.94;
      return;
    }
    if (!reduce) angle.set(angle.get() + IDLE_SPEED * delta);
  });

  function onDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, a: angle.get(), lastX: e.clientX, lastT: e.timeStamp };
    velocity.current = 0;
  }

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    angle.set(d.a + (e.clientX - d.x) * DRAG_GAIN);
    const dt = Math.max(1, e.timeStamp - d.lastT);
    velocity.current = ((e.clientX - d.lastX) * DRAG_GAIN) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
  }

  function onUp() {
    drag.current = null;
  }

  const current = SWATCHES[front];

  return (
    <div className="flex flex-col items-center">
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="img"
        aria-label="A spinning ring of painted nail swatches"
        className="relative h-[calc(var(--r)*1.5)] w-full cursor-grab touch-pan-y select-none [--r:clamp(104px,30vw,170px)] [--tip:clamp(54px,14vw,82px)] [perspective:900px] active:cursor-grabbing"
      >
        {/* Turntable: a flat disc drawn once. It's round, so it never needs to rotate. */}
        <div className="absolute bottom-[8%] left-1/2 h-[calc(var(--r)*0.36)] w-[calc(var(--r)*2+var(--tip)*1.4)] -translate-x-1/2 translate-y-1/2">
          <div className="absolute inset-0 translate-y-[18%] rounded-[50%] bg-wine-950/60 blur-md" />
          <div className="absolute inset-0 translate-y-[9%] rounded-[50%] bg-wine-800" />
          <div className="absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_40%_35%,#fdf9f3,#f0d2cd_55%,#eec1ba)]" />
          <div className="absolute inset-[22%] rounded-[50%] border border-wine-900/15" />
        </div>

        <div className="absolute bottom-[8%] left-1/2 [transform-style:preserve-3d] [transform:rotateX(-9deg)]">
          <motion.div style={{ rotateY: angle }} className="[transform-style:preserve-3d]">
            {SWATCHES.map((s, i) => (
              <Tip key={s.name} index={i} angle={angle} finish={s.finish} />
            ))}
          </motion.div>
        </div>
      </div>

      <div className="mt-6 flex w-full items-end justify-between gap-4 border-t border-cream-50/20 pt-4">
        <div aria-live="polite">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blush-300/80">
            N&ordm; {String(front + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
          </p>
          <p className="mt-1 font-script text-3xl font-medium italic text-cream-50 sm:text-4xl">
            {current.name}
          </p>
        </div>
        <p className="flex items-center gap-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cream-100/60">
          <span aria-hidden="true">&larr;</span> Drag to spin <span aria-hidden="true">&rarr;</span>
        </p>
      </div>
    </div>
  );
}
