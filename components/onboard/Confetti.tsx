"use client";

import { useEffect, useState } from "react";

const CONFETTI_COLORS = [
  "#f5a623",
  "#e0951f",
  "#34d399",
  "#f87171",
  "#8b8bff",
  "#f4f4f3",
];

interface ConfettiPiece {
  id: number;
  left: number;
  drift: string;
  delay: string;
  duration: string;
  color: string;
  rotate: number;
}

interface ConfettiProps {
  pieces?: number;
}

/**
 * Lightweight, dependency-free confetti burst for the "You're Live" moment.
 * Pieces are seeded once on mount (client-only) so the randomised positions
 * never cause an SSR hydration mismatch; the CSS keyframe (globals.css) handles
 * the fall and is disabled under prefers-reduced-motion.
 */
export function Confetti({ pieces = 40 }: ConfettiProps) {
  const [items, setItems] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- randomised pieces must seed client-side only (SSR hydration safety)
    setItems(
      Array.from({ length: pieces }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        drift: `${(Math.random() - 0.5) * 160}px`,
        delay: `${Math.random() * 0.8}s`,
        duration: `${2.2 + Math.random() * 1.4}s`,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
      }))
    );
  }, [pieces]);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden"
      aria-hidden="true"
    >
      {items.map((piece) => (
        <span
          key={piece.id}
          className="zt-confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotate}deg)`,
              "--zt-confetti-x": piece.drift,
              "--zt-confetti-delay": piece.delay,
              "--zt-confetti-duration": piece.duration,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
