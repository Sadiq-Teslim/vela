"use client";

import { useEffect, useState } from "react";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface TypewriterProps {
  text: string;
  /** ms per character */
  speed?: number;
  /** Delay before typing starts (ms) */
  delay?: number;
  className?: string;
  /** Show blinking cursor at end */
  cursor?: boolean;
}

export function Typewriter({
  text,
  speed = 35,
  delay = 0,
  className = "",
  cursor = true,
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [inView, text, speed, delay]);

  return (
    <span ref={ref} className={className}>
      {displayed}
      {cursor && !done && (
        <span className="inline-block w-[2px] h-[1em] bg-vela-cyan ml-0.5 align-middle animate-blink" />
      )}
    </span>
  );
}
