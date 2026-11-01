"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PersonView } from "@/lib/client/session";
import { KEYS, store } from "@/lib/client/storage";
import { t } from "@/lib/i18n";
import { MicOffIcon } from "./Icons";
import { TrackVideo } from "./TrackVideo";

type Corner = "tl" | "tr" | "bl" | "br";
type Who = "self" | "partner";
const GAP = 12;
const MARGIN = 16;

function cornerPos(c: Corner, slot: number, W: number, H: number, S: number, reserve: number) {
  const left = c[1] === "l";
  const top = c[0] === "t";
  const off = slot * (S + GAP);
  const x = left ? MARGIN : W - S - MARGIN;
  const y = top ? 64 + off : H - S - reserve - off;
  return { x, y };
}

function nearestCorner(cx: number, cy: number, W: number, H: number): Corner {
  return ((cy < H / 2 ? "t" : "b") + (cx < W / 2 ? "l" : "r")) as Corner;
}

/** Floating, circular, draggable faces. Positions snap to corners and are remembered per user. */
export function Bubbles({ self, partner, visible, bottomReserve = 96 }: { self: PersonView; partner: PersonView | null; visible: boolean; bottomReserve?: number }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ W: 1000, H: 700 });
  const [corners, setCorners] = useState<Record<Who, Corner>>({ self: "br", partner: "bl" });
  const [drag, setDrag] = useState<{ who: Who; x: number; y: number } | null>(null);

  useEffect(() => {
    setCorners({ self: store.get<Corner>(KEYS.bubbleSelf, "br"), partner: store.get<Corner>(KEYS.bubblePartner, "bl") });
  }, []);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ W: el.clientWidth, H: el.clientHeight }));
    ro.observe(el);
    setSize({ W: el.clientWidth, H: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const { W, H } = size;
  const S = Math.round(Math.min(132, Math.max(84, W * 0.11)));

  const people: { who: Who; p: PersonView }[] = [];
  if (partner) people.push({ who: "partner", p: partner });
  people.push({ who: "self", p: self });

  // Bubbles sharing a corner stack instead of overlapping.
  const slotOf = (who: Who) => (corners[who] === corners[who === "self" ? "partner" : "self"] && who === "self" && partner ? 1 : 0);

  function onDown(e: React.PointerEvent<HTMLDivElement>, who: Who) {
    const pos = cornerPos(corners[who], slotOf(who), W, H, S, bottomReserve);
    const startX = e.clientX;
    const startY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    let moved = false;
    let last = pos;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      last = { x: Math.min(W - S, Math.max(0, pos.x + dx)), y: Math.min(H - S, Math.max(0, pos.y + dy)) };
      setDrag({ who, ...last });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (moved) {
        const c = nearestCorner(last.x + S / 2, last.y + S / 2, W, H);
        setCorners((prev) => ({ ...prev, [who]: c }));
        store.set(who === "self" ? KEYS.bubbleSelf : KEYS.bubblePartner, c);
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div ref={boxRef} className="pointer-events-none absolute inset-0 z-20" aria-hidden={!visible}>
      {visible &&
        people.map(({ who, p }) => {
          const pos = drag?.who === who ? drag : cornerPos(corners[who], slotOf(who), W, H, S, bottomReserve);
          return (
            <div
              key={who}
              onPointerDown={(e) => onDown(e, who)}
              title={who === "self" ? t("bubble.you") : p.name}
              className={`group pointer-events-auto absolute left-0 top-0 touch-none select-none rounded-full shadow-cozy ${
                drag?.who === who ? "cursor-grabbing" : "cursor-grab transition-transform duration-300 ease-out"
              } ${p.speaking ? "ring-4 ring-glow-300" : "ring-2 ring-white/30"}`}
              style={{ width: S, height: S, transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-full bg-walnut-700">
                {p.camOn && p.camTrack ? (
                  <TrackVideo track={p.camTrack} mirrored={who === "self"} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-br from-glow-300 to-clay-400 text-3xl font-extrabold text-white">
                    {(p.name || "?").trim().charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {!p.micOn && (
                <span className="absolute -bottom-1 -end-1 grid h-7 w-7 place-items-center rounded-full bg-clay-500 text-white ring-2 ring-cream-50" aria-label={t("bubble.muted")}>
                  <MicOffIcon width={14} height={14} />
                </span>
              )}
              <span className="absolute -top-2 start-1/2 max-w-[9rem] -translate-x-1/2 truncate rounded-full bg-walnut-900/85 px-2 py-0.5 text-[11px] font-bold text-cream-50 opacity-0 transition group-hover:opacity-100">
                {who === "self" ? t("bubble.you") : p.name}
              </span>
            </div>
          );
        })}
    </div>
  );
}
