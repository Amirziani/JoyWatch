import { t } from "@/lib/i18n";

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
      <WallDecor />
      <Nook />
      <div className="absolute -bottom-24 left-1/2 h-64 w-[70vw] -translate-x-1/2 rounded-full bg-glow-200/40 blur-3xl" />
    </div>
  );
}

/** Framed red football shirt: "JOY.E" 22. */
export function JerseyFrame({ className = "", inline = false }: { className?: string; inline?: boolean }) {
  return (
    <svg viewBox="0 0 120 160" role="img" aria-label={t("decor.jerseyLabel")} className={`pointer-events-none ${inline ? "relative" : "absolute"} drop-shadow-[0_10px_14px_rgba(59,44,35,0.35)] ${className}`}>
      <rect x="2" y="2" width="116" height="156" rx="3" fill="#1f1a17" />
      <rect x="9" y="9" width="102" height="142" fill="#f6efe4" />
      {/* shirt */}
      <path d="M32 22 L50 16 Q60 26 70 16 L88 22 L108 44 L94 56 L88 48 V140 H32 V48 L26 56 L12 44Z" fill="#c8202b" />
      <path d="M50 16 Q60 28 70 16" fill="none" stroke="#7d1118" strokeWidth="2.5" />
      <text x="60" y="66" textAnchor="middle" fontFamily="Impact, 'Arial Narrow', sans-serif" fontWeight="700" fontSize="12" letterSpacing="1" fill="#f1d9a0">JOY.E</text>
      <text x="60" y="108" textAnchor="middle" fontFamily="Impact, 'Arial Narrow', sans-serif" fontWeight="700" fontSize="44" fill="#f1d9a0">22</text>
    </svg>
  );
}

/** Dusky-sky plaque with the favourite quote. */
export function QuotePlaque({ className = "", inline = false }: { className?: string; inline?: boolean }) {
  return (
    <div
      className={`pointer-events-none ${inline ? "relative" : "absolute"} flex w-32 items-center justify-center rounded-[3px] p-3 text-center shadow-[0_10px_14px_rgba(59,44,35,0.3)] ring-4 ring-walnut-700/80 ${className}`}
      style={{ aspectRatio: "3 / 4", background: "linear-gradient(170deg,#5d7488 0%,#8fa0a6 38%,#e8c98f 70%,#6d6a52 100%)" }}
    >
      <p className="font-serif text-[15px] font-bold italic leading-snug text-cream-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">{t("decor.quote")}</p>
    </div>
  );
}

/** Floor lamp: tan shade with a dark seam, white pole, round base, warm glow. */
export function Lamp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 280" className={`pointer-events-none absolute ${className}`} aria-hidden>
      <ellipse cx="60" cy="62" rx="58" ry="52" fill="#f8cf7f" opacity=".35" />
      <rect x="57" y="94" width="6" height="168" fill="#fbf7ef" stroke="#e6dccb" strokeWidth="1" />
      <ellipse cx="60" cy="266" rx="28" ry="7" fill="#fbf7ef" stroke="#e6dccb" strokeWidth="1" />
      <path d="M28 98 L38 34 H82 L92 98Z" fill="#e0a95a" />
      <path d="M72 34 L78 98" stroke="#4a3322" strokeWidth="2.5" />
    </svg>
  );
}

/** Big-leaf plant (taro / alocasia) in a ribbed cream pot. */
export function TaroPlant({ className = "" }: { className?: string }) {
  const leaves = [
    { x: 50, y: 70, r: -28, s: 1.0, f: "#3f6b3a" },
    { x: 78, y: 40, r: 10, s: 1.15, f: "#7fbf3f" },
    { x: 104, y: 78, r: 42, s: 1.0, f: "#55774a" },
    { x: 70, y: 90, r: -5, s: 1.2, f: "#2f5a35" },
    { x: 40, y: 112, r: -48, s: 0.9, f: "#3f6b3a" },
  ];
  return (
    <svg viewBox="0 0 150 230" className={`pointer-events-none absolute overflow-visible ${className}`} aria-hidden>
      {leaves.map((l, i) => (
        <g key={i}>
          <path d={`M75 170 Q ${(75 + l.x) / 2} ${(170 + l.y) / 2 + 10} ${l.x} ${l.y}`} stroke="#4b6b3e" strokeWidth="1.6" fill="none" />
          <g transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`}>
            <path d="M0 8 C -34 -4 -34 -48 0 -66 C 34 -48 34 -4 0 8Z" fill={l.f} />
            <path d="M0 6 L0 -56" stroke="rgba(255,255,255,.3)" strokeWidth="1.2" />
          </g>
        </g>
      ))}
      <path d="M40 168 H110 L102 224 H48Z" fill="#e4d6c2" />
      {[56, 66, 75, 84, 94].map((x) => (
        <path key={x} d={`M${x} 170 L${x < 75 ? x + 2 : x - 2} 222`} stroke="#cdbb9f" strokeWidth="2" />
      ))}
      <ellipse cx="75" cy="168" rx="35" ry="6" fill="#d9c8ae" />
    </svg>
  );
}

/** Football bean bag. */
export function BeanBag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 150" className={`pointer-events-none absolute ${className}`} aria-hidden>
      <defs>
        <clipPath id="bb"><path d="M8 112 Q0 62 50 40 Q100 14 160 44 Q206 70 190 114 Q170 146 100 146 Q30 146 8 112Z" /></clipPath>
      </defs>
      <path d="M8 112 Q0 62 50 40 Q100 14 160 44 Q206 70 190 114 Q170 146 100 146 Q30 146 8 112Z" fill="#f3e9d6" />
      <g clipPath="url(#bb)">
        <path d="M95 30 L135 42 L142 84 L104 96 L82 62Z" fill="#c8202b" />
        <path d="M-4 70 L40 58 L62 92 L40 130 L-6 120Z" fill="#241d1a" />
        <path d="M120 112 L160 98 L196 118 L184 152 L130 152Z" fill="#241d1a" />
        <path d="M150 40 L206 52 L206 80 L160 76Z" fill="#c8202b" />
      </g>
      <path d="M8 112 Q0 62 50 40 Q100 14 160 44 Q206 70 190 114 Q170 146 100 146 Q30 146 8 112Z" fill="none" stroke="#d8c9ae" strokeWidth="2" />
    </svg>
  );
}

/** Three little wall shelves: trophies, framed photos and hanging medals. */
export function TrophyShelf({ className = "" }: { className?: string }) {
  const Trophy = ({ x, y, k = 1 }: { x: number; y: number; k?: number }) => (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x="-5" y="-4" width="10" height="4" fill="#5a3d28" />
      <rect x="-1.2" y="-14" width="2.4" height="10" fill="#d9a93a" />
      <path d="M-6 -26 H6 Q6 -14 0 -14 Q-6 -14 -6 -26Z" fill="#f0c24a" />
    </g>
  );
  const Shelf = ({ y, w = 150 }: { y: number; w?: number }) => <rect x="6" y={y} width={w} height="6" rx="1.5" fill="#6b4630" />;
  return (
    <svg viewBox="0 0 170 160" className={`pointer-events-none absolute drop-shadow-[0_6px_8px_rgba(59,44,35,0.25)] ${className}`} aria-hidden>
      <Shelf y={38} w={110} />
      <Shelf y={90} w={140} />
      <Shelf y={142} w={150} />
      {/* top: plant + sign */}
      <rect x="60" y="20" width="22" height="18" rx="2" fill="#f3ede2" />
      <path d="M88 38 V30 L94 24 L100 30 V38Z" fill="#8fa0a6" />
      <path d="M26 38 Q22 22 30 18 Q34 28 30 38Z" fill="#6f9360" />
      {/* middle: trophies */}
      <Trophy x={26} y={90} k={1.1} />
      <Trophy x={48} y={90} />
      <g transform="translate(76 90)"><rect x="-6" y="-4" width="12" height="4" fill="#5a3d28" /><rect x="-1.5" y="-14" width="3" height="10" fill="#d9a93a" /><path d="M-9 -30 H9 Q9 -14 0 -14 Q-9 -14 -9 -30Z" fill="#f0c24a" /></g>
      <Trophy x={104} y={90} />
      <Trophy x={126} y={90} k={1.1} />
      {/* bottom: photos + medals */}
      <rect x="30" y="112" width="22" height="30" fill="#f6efe4" stroke="#5a3d28" strokeWidth="2.5" />
      <rect x="58" y="120" width="20" height="22" fill="#f6efe4" stroke="#5a3d28" strokeWidth="2.5" />
      <rect x="84" y="116" width="26" height="26" fill="#f6efe4" stroke="#5a3d28" strokeWidth="2.5" />
      <path d="M16 142 V120 M22 142 V122" stroke="#2f5fb0" strokeWidth="3" />
      <circle cx="19" cy="156" r="5" fill="#d9a93a" />
      <path d="M142 142 V122 M148 142 V120" stroke="#2f5fb0" strokeWidth="3" />
      <circle cx="145" cy="156" r="5" fill="#f0c24a" />
    </svg>
  );
}

/** The corner of the room: lamp, plant, bean bag and shelf. Grows with the screen. */
export function Nook() {
  return (
    <>
      <TaroPlant className="-bottom-6 left-0 hidden w-24 xl:block 2xl:left-8 2xl:w-44" />
      <Lamp className="bottom-0 left-56 hidden h-52 w-24 2xl:block" />
      <BasketPlant className="-bottom-8 -right-8 hidden w-32 xl:block 2xl:hidden" />
      <BeanBag className="bottom-2 right-6 hidden w-44 2xl:block" />
      <TrophyShelf className="right-[3%] top-[21rem] hidden w-40 2xl:block" />
    </>
  );
}
/** Pictures on the "wall". Only where there is room beside the content. */
export function WallDecor({ top = "top-28" }: { top?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 hidden xl:block" aria-hidden={false}>
      <QuotePlaque className={`left-[12%] ${top} -rotate-2`} />
      <JerseyFrame className={`right-[12%] ${top} w-28 rotate-1`} />
    </div>
  );
}

/** The same two pictures as a little row, for screens too narrow to hang them on the wall. */
export function WallStrip({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-end justify-center gap-6 xl:hidden ${className}`}>
      <QuotePlaque inline className="!w-28 -rotate-2" />
      <JerseyFrame inline className="w-24 rotate-1" />
    </div>
  );
}
