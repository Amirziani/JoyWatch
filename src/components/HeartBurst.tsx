"use client";
import { useEffect, useRef, useState } from "react";

/** A little shower of hearts every time `tick` changes. */
export function HeartBurst({ tick }: { tick: number }) {
  const [hearts, setHearts] = useState<{ id: number; left: number; delay: number; size: number }[]>([]);
  const last = useRef(tick);
  useEffect(() => {
    if (tick === last.current) return;
    last.current = tick;
    const batch = Array.from({ length: 9 }, (_, i) => ({
      id: tick * 100 + i,
      left: 30 + Math.random() * 40,
      delay: Math.random() * 0.5,
      size: 22 + Math.random() * 26,
    }));
    setHearts((h) => [...h, ...batch]);
    const timer = setTimeout(() => setHearts((h) => h.filter((x) => !batch.includes(x))), 3000);
    return () => clearTimeout(timer);
  }, [tick]);
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
      {hearts.map((h) => (
        <span key={h.id} className="absolute bottom-24 animate-heart opacity-0" style={{ left: `${h.left}%`, animationDelay: `${h.delay}s`, fontSize: h.size }}>
          💗
        </span>
      ))}
    </div>
  );
}
