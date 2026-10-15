'use client';

import { motion, useReducedMotion } from 'framer-motion';

/** Chorus logosu: farklı yükseklikte 5 yuvarlak uçlu çubuk, bir koro gibi birlikte yükselir. */
const BARS = [0.45, 0.8, 1, 0.65, 0.35];

export function Logo({ size = 28, animated = false }: { size?: number; animated?: boolean }) {
  const reduce = useReducedMotion();
  const animate = animated && !reduce;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="Chorus" className="text-accent">
      {BARS.map((h, i) => {
        const x = 4 + i * 7.2;
        const full = 32 * h;
        const y = 36 - full;
        return (
          <motion.rect
            key={i}
            x={x}
            width={4.8}
            rx={2.4}
            fill="currentColor"
            initial={animate ? { y: 36, height: 0 } : false}
            animate={{ y, height: full }}
            transition={{ duration: 0.9, delay: animate ? 0.1 * i : 0, ease: [0.22, 1, 0.36, 1] }}
            y={y}
            height={full}
          />
        );
      })}
    </svg>
  );
}
