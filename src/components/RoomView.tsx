"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/client/useSession";
import type { Creds } from "@/lib/client/session";
import type { BrowserSupport } from "@/lib/client/browser";
import { KEYS, store } from "@/lib/client/storage";
import { t } from "@/lib/i18n";
import { Bubbles } from "./Bubbles";
import { ConnDot } from "./ConnDot";
import { CozyBackdrop } from "./Decor";
import { ControlBar } from "./ControlBar";
import { HeartBurst } from "./HeartBurst";
import { Logo } from "./Logo";
import { Stage } from "./Stage";
import { StatsChip } from "./StatsChip";
import { Toasts } from "./Toasts";

export interface ExitInfo {
  text: string;
  forgetHost?: boolean;
  missing?: boolean;
}

interface Props {
  roomId: string;
  creds: Creds;
  hostPassword?: string;
  support: BrowserSupport;
  onExit: (info?: ExitInfo) => void;
}

/** Errors that mean "go back and fix what you typed" rather than "retry the connection". */
const GATE_ERRORS = new Set(["wrong_password", "too_many_attempts", "bad_host_secret", "room_not_found"]);
const IDLE_MS = 3200;

export function RoomView({ roomId, creds, hostPassword, support, onExit }: Props) {
  const { ctl, snap } = useSession(roomId, creds);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [idle, setIdle] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [bubbles, setBubbles] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [tip, setTip] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const [barH, setBarH] = useState(96);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setBubbles(store.get(KEYS.bubblesVisible, true));
    setShowStats(store.get(KEYS.stats, false));
    setTip(!store.get(KEYS.headphoneTipSeen, false));
  }, []);

  // One-time headphone tip: never blocks anything, closes itself, and never comes back.
  const dismissTip = useCallback(() => {
    setTip(false);
    store.set(KEYS.headphoneTipSeen, true);
  }, []);
  useEffect(() => {
    if (!tip) return;
    const id = setTimeout(dismissTip, 7000);
    return () => clearTimeout(id);
  }, [tip, dismissTip]);

  // ---- send the user back to the gate for credential problems ----
  const fatal = snap?.fatal;
  useEffect(() => {
    if (!fatal || !GATE_ERRORS.has(fatal.code)) return;
    onExit({ text: fatal.message, forgetHost: fatal.code === "bad_host_secret" || (fatal.code === "room_not_found" && !!creds.hostSecret), missing: fatal.code === "room_not_found" });
  }, [fatal, onExit, creds.hostSecret]);

  // ---- auto-hiding controls ----
  const poke = useCallback(() => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  }, []);
  useEffect(() => {
    poke();
    return () => clearTimeout(idleTimer.current);
  }, [poke]);

  const hasContent = snap?.movie.kind !== undefined && snap.movie.kind !== "none";
  const playing = snap?.movie.kind === "screen" || !!snap?.playback?.playing;
  const controlsVisible = !hasContent || !playing || !idle || menuOpen;

  // ---- fullscreen ----
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.().catch(() => undefined);
  }, []);
  useEffect(() => {
    const on = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const toggleBubbles = useCallback(() => {
    setBubbles((v) => {
      store.set(KEYS.bubblesVisible, !v);
      return !v;
    });
  }, []);
  const toggleStats = useCallback(() => {
    setShowStats((v) => {
      store.set(KEYS.stats, !v);
      return !v;
    });
  }, []);

  // ---- keyboard shortcuts ----
  useEffect(() => {
    if (!ctl) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) && !(el instanceof HTMLInputElement && el.type === "range")) return;
      const file = ctl.getSnapshot().movie.kind === "file";
      switch (e.key) {
        case " ":
          if (el instanceof HTMLButtonElement) return; // let focused buttons activate normally
          if (file) { e.preventDefault(); ctl.togglePlay(); }
          break;
        case "m": case "M": ctl.toggleMic(); break;
        case "v": case "V": ctl.toggleCam(); break;
        case "b": case "B": toggleBubbles(); break;
        case "f": case "F": toggleFullscreen(); break;
        case "ArrowLeft": if (file && !(el instanceof HTMLInputElement)) { e.preventDefault(); ctl.seekBy(-10); } break;
        case "ArrowRight": if (file && !(el instanceof HTMLInputElement)) { e.preventDefault(); ctl.seekBy(10); } break;
        default: return;
      }
      poke();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ctl, toggleBubbles, toggleFullscreen, poke]);

  const live = !!ctl && !!snap && snap.phase !== "connecting" && snap.phase !== "ended" && snap.phase !== "disconnected";
  useEffect(() => {
    const el = barRef.current;
    if (!live || !el) return;
    const ro = new ResizeObserver(() => setBarH(el.offsetHeight));
    ro.observe(el);
    setBarH(el.offsetHeight);
    return () => ro.disconnect();
  }, [live]);

  const pickFile = () => fileInput.current?.click();

  // ---- states before / outside the live room ----
  if (!ctl || !snap || snap.phase === "connecting") {
    return (
      <div className="grid min-h-screen place-items-center bg-cream-100 text-walnut-800" role="status">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-glow-300 border-t-transparent" />
          <p className="font-bold">{t("room.joining")}</p>
        </div>
      </div>
    );
  }

  if (snap.phase === "ended") {
    return (
      <><CozyBackdrop /><Overlay>
        <div className="text-5xl" aria-hidden>🌙</div>
        <h1 className="mt-3 text-2xl font-extrabold">{t("room.endedTitle")}</h1>
        <p className="mt-1 text-walnut-500">{snap.role === "host" ? t("room.endedHost") : t("room.endedGuest")}</p>
        <Link href="/" className="btn-primary mt-6">{t("room.home")}</Link>
      </Overlay></>
    );
  }

  if (snap.phase === "disconnected") {
    return (
      <><CozyBackdrop /><Overlay>
        <div className="text-5xl" aria-hidden>📡</div>
        <h1 className="mt-3 text-2xl font-extrabold">{t("room.disconnectedTitle")}</h1>
        <p className="mt-1 text-walnut-500">{snap.fatal?.message ?? t("error.dropped")}</p>
        <div className="mt-6 flex justify-center gap-3">
          {snap.fatal?.code !== "room_not_found" && <button className="btn-primary" onClick={() => void ctl.rejoin()}>{t("room.rejoin")}</button>}
          <Link href="/" className="btn-soft">{t("room.home")}</Link>
        </div>
      </Overlay></>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 overflow-hidden bg-cream-100 text-walnut-800 ${hasContent && playing && idle && !menuOpen ? "idle-hide-cursor" : ""}`}
      onPointerMove={poke}
      onPointerDown={poke}
      onTouchStart={poke}
    >
      <Stage ctl={ctl} snap={snap} support={support} roomId={roomId} hostPassword={hostPassword} onPickFile={pickFile} />

      <Bubbles self={snap.self} partner={snap.partner} visible={bubbles} bottomReserve={barH + 12} />
      <HeartBurst tick={snap.heartTick} />

      <input
        ref={fileInput}
        type="file"
        accept="video/*,.mkv,.mov,.mp4,.m4v,.webm"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void ctl.loadFile(f);
          e.target.value = "";
        }}
      />

      {/* top bar */}
      <div className={`absolute inset-x-0 top-0 z-30 flex flex-wrap items-start justify-between gap-3 px-4 pt-3 transition-opacity duration-500 sm:px-6 ${controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block"><Logo /></span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-full bg-cream-50/90 px-4 py-1.5 shadow-cozy backdrop-blur-md">
            <ConnDot name={`${snap.self.name} ${t("common.youSuffix")}`} quality={snap.self.quality} />
            {snap.partner ? <ConnDot name={snap.partner.name} quality={snap.partner.quality} /> : <span className="text-sm font-semibold text-walnut-500">{t("room.waitingPartner")}</span>}
          </div>
        </div>
        {showStats && <StatsChip stats={snap.stats} />}
      </div>

      {snap.phase === "reconnecting" && (
        <div className="absolute inset-x-0 top-16 z-40 flex justify-center px-4" role="status">
          <div className="flex items-center gap-3 rounded-full bg-glow-300 px-5 py-2.5 text-sm font-extrabold text-walnut-900 shadow-cozy">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-walnut-900 border-t-transparent" />
            {t("room.reconnecting")}
          </div>
        </div>
      )}

      {snap.audioBlocked && (
        <div className="absolute inset-x-0 top-28 z-40 flex justify-center px-4">
          <button className="animate-popin rounded-full bg-glow-300 px-5 py-2.5 text-sm font-extrabold text-walnut-900 shadow-cozy" onClick={() => void ctl.mixer.resume()}>
            🔈 {t("room.enableSound")}
          </button>
        </div>
      )}

      {tip && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-md animate-popin items-center gap-3 rounded-2xl bg-cream-50/95 px-4 py-3 text-sm font-semibold text-walnut-700 shadow-cozy ring-1 ring-walnut-800/10">
            <span className="text-xl" aria-hidden>🎧</span>
            <span className="flex-1">{t("tip.headphones")}</span>
            <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-walnut-800/10 text-walnut-700 hover:bg-walnut-800/15" aria-label={t("common.close")} onClick={dismissTip}>✕</button>
          </div>
        </div>
      )}

      <Toasts notices={snap.notices} onDismiss={ctl.dismiss} />

      <div ref={barRef} className={`absolute inset-x-0 bottom-0 z-30 transition-opacity duration-500 ${controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <ControlBar
          ctl={ctl}
          snap={snap}
          support={support}
          roomId={roomId}
          hostPassword={hostPassword}
          bubbles={bubbles}
          onToggleBubbles={toggleBubbles}
          stats={showStats}
          onToggleStats={toggleStats}
          fullscreen={fullscreen}
          onToggleFullscreen={toggleFullscreen}
          onPickFile={pickFile}
          onMenuChange={setMenuOpen}
          onLeave={() => { void ctl.leave(); window.location.assign("/"); }}
          onEnd={() => void ctl.endRoomForEveryone()}
        />
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative z-10 grid min-h-screen place-items-center px-5">
      <div className="card max-w-md text-center">{children}</div>
    </main>
  );
}
