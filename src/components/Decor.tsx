/** Soft, decorative scenery: fairy lights, trailing ivy and a basket plant. Purely visual. */

const bulbs = [6, 17, 28, 39, 50, 61, 72, 83, 94];

export function FairyLights({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 14" preserveAspectRatio="none" className={`pointer-events-none absolute inset-x-0 top-0 h-10 w-full sm:h-14 ${className}`} aria-hidden>
      <path d="M-2 1 Q 25 9 50 3 T 102 2" fill="none" stroke="#9a8068" strokeWidth=".25" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 1 }} />
    </svg>
  );
}

/** Bulbs are HTML (not stretched SVG) so they stay round at any width. */
export function Lights({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 h-16 overflow-hidden ${className}`} aria-hidden>
      <FairyLights />
      {bulbs.map((x, i) => (
        <span
          key={x}
          className="absolute h-3 w-3 animate-twinkle rounded-full bg-glow-300 shadow-[0_0_16px_6px_rgba(248,207,127,0.65)] sm:h-3.5 sm:w-3.5"
          style={{ left: `${x}%`, top: `${14 + Math.sin(i * 1.3) * 7 + (i % 2) * 5}px`, animationDelay: `${(i * 0.45) % 3}s` }}
        />
      ))}
    </div>
  );
}

function Leaf({ x, y, r, s, fill }: { x: number; y: number; r: number; s: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0 C 14 -10 30 -6 38 6 C 28 18 10 16 0 0Z" fill={fill} />
      <path d="M2 2 C 14 4 26 6 36 6" stroke="rgba(255,255,255,.35)" strokeWidth="1" fill="none" />
    </g>
  );
}

export function Ivy({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  const greens = ["#6f9360", "#93b07a", "#55774a", "#b6cca0"];
  const leaves = Array.from({ length: 11 }, (_, i) => ({
    x: 22 + Math.sin(i * 0.9) * 8,
    y: 18 + i * 24,
    r: i % 2 ? 160 + (i % 3) * 8 : 20 - (i % 3) * 8,
    s: 0.8 + (i % 3) * 0.15,
    fill: greens[i % greens.length],
  }));
  return (
    <svg viewBox="0 0 70 290" className={`pointer-events-none absolute w-14 animate-sway origin-top sm:w-20 ${flip ? "-scale-x-100" : ""} ${className}`} aria-hidden>
      <path d="M22 0 C 34 50 10 100 26 160 S 20 240 24 280" stroke="#62493a" strokeWidth="1.6" fill="none" opacity=".6" />
      {leaves.map((l, i) => (
        <Leaf key={i} {...l} />
      ))}
    </svg>
  );
}

export function BasketPlant({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 230" className={`pointer-events-none absolute ${className}`} aria-hidden>
      {/* big tropical leaves */}
      {[
        { r: -70, s: 1.05, f: "#55774a" },
        { r: -40, s: 1.2, f: "#6f9360" },
        { r: -10, s: 1.3, f: "#55774a" },
        { r: 20, s: 1.2, f: "#6f9360" },
        { r: 52, s: 1.05, f: "#93b07a" },
      ].map((l, i) => (
        <g key={i} transform={`translate(100 120) rotate(${l.r}) scale(${l.s})`}>
          <path d="M0 0 C -26 -34 -22 -78 0 -112 C 22 -78 26 -34 0 0Z" fill={l.f} />
          <path d="M0 0 L 0 -104" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" />
        </g>
      ))}
      {/* woven basket */}
      <path d="M52 124 H148 L138 214 Q100 224 62 214Z" fill="#c9a373" />
      <path d="M52 124 H148" stroke="#b08655" strokeWidth="6" strokeLinecap="round" />
      {[142, 158, 174, 190, 204].map((y) => (
        <path key={y} d={`M${58 + (y - 124) * 0.1} ${y} Q100 ${y + 8} ${142 - (y - 124) * 0.1} ${y}`} stroke="#b08655" strokeWidth="2" fill="none" />
      ))}
    </svg>
  );
}

/** A warm, lamp-lit backdrop for pages on the light theme. */
export function CozyBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden>
      <Lights />
      <Ivy className="left-2 top-0 sm:left-8" />
      <Ivy className="right-3 top-0 hidden sm:block" flip />
      <BasketPlant className="-bottom-6 -right-10 hidden w-52 opacity-95 2xl:block" />
      <BasketPlant className="-bottom-10 -left-12 hidden w-36 opacity-90 2xl:block" />
      <div className="absolute -bottom-24 left-1/2 h-64 w-[70vw] -translate-x-1/2 rounded-full bg-glow-200/40 blur-3xl" />
    </div>
  );
}
