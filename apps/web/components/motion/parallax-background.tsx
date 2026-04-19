"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

/**
 * Three ambient glow orbs that drift continuously via CSS animation
 * and follow the mouse subtly via Framer Motion springs.
 * Uses CSS variables so it's theme-aware.
 */
export function ParallaxBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const x = useSpring(mouseX, { stiffness: 50, damping: 20, mass: 1 });
  const y = useSpring(mouseY, { stiffness: 50, damping: 20, mass: 1 });

  const orb1X = useTransform(x, (v) => v * -30);
  const orb1Y = useTransform(y, (v) => v * -30);
  const orb2X = useTransform(x, (v) => v * 40);
  const orb2Y = useTransform(y, (v) => v * -20);
  const orb3X = useTransform(x, (v) => v * -20);
  const orb3Y = useTransform(y, (v) => v * 40);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Base gradient (theme-aware via CSS vars) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--vela-surface) 40%, transparent), var(--vela-void), var(--vela-void))",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--vela-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--vela-grid-line) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse at center top, black 20%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center top, black 20%, transparent 70%)",
        }}
      />

      {/* Mouse-parallax orbs */}
      <motion.div
        style={{
          x: orb1X,
          y: orb1Y,
          backgroundColor: "var(--vela-orb-cyan)",
        }}
        className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full blur-[120px] pointer-events-none will-change-transform"
      />
      <motion.div
        style={{
          x: orb2X,
          y: orb2Y,
          backgroundColor: "var(--vela-orb-violet)",
        }}
        className="absolute top-[300px] right-[-100px] w-[360px] h-[360px] rounded-full blur-[100px] pointer-events-none will-change-transform"
      />
      <motion.div
        style={{
          x: orb3X,
          y: orb3Y,
          backgroundColor: "var(--vela-orb-mint)",
        }}
        className="absolute bottom-[-100px] left-[-100px] w-[360px] h-[360px] rounded-full blur-[100px] pointer-events-none will-change-transform"
      />
    </>
  );
}
