"use client";
import { useEffect, useRef, useState } from "react";
import type { SessionController, Snapshot } from "@/lib/client/session";
import { fmtTime } from "@/lib/client/format";
import { t } from "@/lib/i18n";
import { HeartIcon, PauseIcon, PlayIcon } from "./Icons";

function whoText(p: NonNullable<Snapshot["playback"]>) {
  if (!p.by) return null;
  switch (p.action) {
    case "pause":
      return t("playback.paused", { name: p.by });
    case "play":
      return t("playback.played", { name: p.by });
    case "seek":
      return t("playback.seeked", { name: p.by });
    default:
      return t("playback.loaded", { name: p.by });
  }
}

export function PlaybackBar({ ctl, snap }: { ctl: SessionController; snap: Snapshot }) {
  const pb = snap.playback;
  const [now, setNow] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const scrubbing = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!scrubbing.current) setNow(ctl.getCurrentTime());
    }, 250);
    return () => clearInterval(id);
  }, [ctl]);

  const duration = pb?.duration ?? 0;
  const shown = scrub ?? now;
  const pct = duration ? Math.min(100, (shown / duration) * 100) : 0;
  const who = pb ? whoText(pb) : null;

  const commit = () => {
    if (scrub !== null) ctl.seek(scrub);
    scrubbing.current = false;
    setScrub(null);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5" dir="ltr">
      <div className="flex items-center gap-3">
        <button
          className={`ctl shrink-0 ${pb?.playing ? "" : "ctl-on"}`}
          onClick={ctl.togglePlay}
          aria-label={pb?.playing ? t("playback.pause") : t("playback.play")}
          title={`${pb?.playing ? t("playback.pause") : t("playback.play")} (Space)`}
        >
          {pb?.playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <span className="w-12 shrink-0 text-end font-mono text-xs font-bold tabular-nums">{fmtTime(shown)}</span>
        <input
          type="range"
          className="slider min-w-0 flex-1"
          style={{ ["--fill" as string]: `${pct}%` }}
          min={0}
          max={duration || 1}
          step={0.1}
          value={Math.min(shown, duration || 1)}
          disabled={!duration}
          aria-label={t("playback.seek")}
          aria-valuetext={`${fmtTime(shown)} / ${fmtTime(duration)}`}
          onChange={(e) => {
            scrubbing.current = true;
            setScrub(Number(e.target.value));
          }}
          onPointerUp={commit}
          onKeyUp={(e) => {
            if (e.key.startsWith("Arrow")) commit();
          }}
          onBlur={commit}
        />
        <span className="w-12 shrink-0 font-mono text-xs font-bold tabular-nums opacity-70">{fmtTime(duration)}</span>
        <button className="ctl shrink-0 text-clay-400" onClick={ctl.heart} aria-label={t("playback.heart")} title={t("playback.heart")}>
          <HeartIcon width={20} height={20} />
        </button>
      </div>
      <p className="min-h-4 truncate ps-1 text-xs font-semibold text-walnut-500" aria-live="polite">
        {pb?.fileName && <span className="opacity-70">{pb.fileName}</span>}
        {who && <span> · {who}</span>}
      </p>
    </div>
  );
}
