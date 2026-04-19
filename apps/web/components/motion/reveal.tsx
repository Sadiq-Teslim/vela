"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef, type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  /** Animation direction */
  direction?: Direction;
  /** Delay in seconds */
  delay?: number;
  /** Duration in seconds */
  duration?: number;
  /** Distance to travel in px */
  distance?: number;
  /** Only animate once, don't replay on re-entry */
  once?: boolean;
  /** Tailwind classes */
  className?: string;
  /** Render as a specific element */
  as?: "div" | "section" | "li" | "article";
}

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  distance = 24,
  once = true,
  className = "",
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once, margin: "-80px" });

  const offset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  }[direction];

  const variants: Variants = {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const commonProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ref: ref as any,
    variants,
    initial: "hidden" as const,
    animate: inView ? ("visible" as const) : ("hidden" as const),
    className,
  };

  if (as === "section") return <motion.section {...commonProps}>{children}</motion.section>;
  if (as === "li") return <motion.li {...commonProps}>{children}</motion.li>;
  if (as === "article") return <motion.article {...commonProps}>{children}</motion.article>;
  return <motion.div {...commonProps}>{children}</motion.div>;
}

interface StaggerProps {
  children: ReactNode;
  /** Delay between each child in seconds */
  stagger?: number;
  /** Initial delay before first child */
  delay?: number;
  className?: string;
  once?: boolean;
}

export function Stagger({
  children,
  stagger = 0.1,
  delay = 0,
  className = "",
  once = true,
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-80px" });

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
  distance = 24,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const variants: Variants = {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}
