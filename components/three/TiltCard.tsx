"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/cn";

const SPRING = { stiffness: 220, damping: 20, mass: 0.6 };

/**
 * A card that tilts toward the pointer in 3D and catches a moving glare.
 * Children can pop forward with `translateZ` (e.g. `[transform:translateZ(40px)]`)
 * because the card preserves 3D for its subtree. Touch pointers are ignored so
 * scrolling on phones never fights the tilt.
 */
export function TiltCard({
  children,
  className = "",
  max = 12,
  glare = true,
  glareClassName = "",
}: {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees. */
  max?: number;
  glare?: boolean;
  glareClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, SPRING);
  const sy = useSpring(py, SPRING);

  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const glareX = useTransform(sx, [0, 1], [0, 100]);
  const glareY = useTransform(sy, [0, 1], [0, 100]);
  const glareOpacity = useMotionValue(0);
  const glareOpacitySpring = useSpring(glareOpacity, SPRING);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgb(255 255 255 / 0.55), rgb(255 255 255 / 0) 55%)`;

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType === "touch" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
    glareOpacity.set(1);
  }

  function handleLeave() {
    px.set(0.5);
    py.set(0.5);
    glareOpacity.set(0);
  }

  return (
    <div className="h-full [perspective:1000px]">
      <motion.div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={cn("relative h-full will-change-transform", className)}
      >
        {children}
        {glare ? (
          <motion.div
            aria-hidden="true"
            style={{ background: glareBg, opacity: glareOpacitySpring }}
            className={cn(
              "pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light",
              glareClassName,
            )}
          />
        ) : null}
      </motion.div>
    </div>
  );
}
