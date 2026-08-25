"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

const SPRING = { damping: 25, stiffness: 90, mass: 0.5 };

export default function BackgroundGlow() {
  const prefersReducedMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);

  // Blob 1 already needs a static -50% centering transform (it's anchored
  // to left-1/2) — bake that into the same motion value rather than
  // stacking a Tailwind transform class, which framer-motion's inline
  // style would otherwise silently clobber.
  const blob1X = useTransform(x, (v) => `calc(-50% + ${v * 24}px)`);
  const blob1Y = useTransform(y, (v) => `${v * 24}px`);
  const blob2X = useTransform(x, (v) => `${v * -16}px`);
  const blob2Y = useTransform(y, (v) => `${v * -16}px`);

  useEffect(() => {
    if (prefersReducedMotion) return;

    function handleMouseMove(e: MouseEvent) {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [rawX, rawY, prefersReducedMotion]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <motion.div
        style={{ x: blob1X, y: blob1Y }}
        className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] rounded-full bg-accent/10 blur-[120px]"
      />
      <motion.div
        style={{ x: blob2X, y: blob2Y }}
        className="absolute bottom-[-10rem] right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-accent/[0.06] blur-[120px]"
      />
      <div className="absolute inset-0 bg-grid-fade" />
    </div>
  );
}
