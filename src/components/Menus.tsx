"use client";
import { useEffect, useState } from "react";
import type { SessionController, Snapshot } from "@/lib/client/session";
import { KEYS, store } from "@/lib/client/storage";
import { MAX_GAIN } from "@/lib/media/audioMixer";
import { isPresetAvailable, PRESET_ORDER, PRESETS } from "@/lib/media/quality";
import { isMac, type BrowserSupport } from "@/lib/client/browser";
import { t, type MessageKey } from "@/lib/i18n";
import { CopyIcon, FileIcon, InfoIcon, ShareIcon, VolumeIcon } from "./Icons";

/* ---------------- Volume ---------------- */
function VolumeRow({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (v: number) => void }) {
  const [prev, setPrev] = useState(1);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
        <span>{label}</span>
        <span className="font-mono text-xs tabular-nums text-peach-200">{Math.round(value * 100)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="shrink-0 rounded-full p-1 text-peach-200 hover:text-white"
          aria-label={value === 0 ? t("volume.unmute") : t("volume.mute")}
          onClick={() => {
            if (value > 0) { setPrev(value); onChange(0); } else onChange(prev || 1);
          }}
        >
          <VolumeIcon width={20} height={20} className={value === 0 ? "opacity-40" : ""} />
        </button>
        <input
          type="range"
          className="slider"
          style={{ ["--fill" as string]: `${(value / MAX_GAIN) * 100}%` }}
          min={0}
          max={MAX_GAIN}
          step={0.01}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <p className="mt-1 text-xs text-peach-300/80">{hint}</p>
    </div>
  );
}

export function VolumePanel({ ctl, snap }: { ctl: SessionController; snap: Snapshot }) {
  return (
    <div className="space-y-5">
      <VolumeRow label={t("volume.movie")} hint={t("volume.movieHint")} value={snap.movieVolume} onChange={ctl.setMovieVolume} />
      <VolumeRow label={t("volume.voice")} hint={t("volume.voiceHint")} value={snap.voiceVolume} onChange={ctl.setVoiceVolume} />
      <p className="flex items-start gap-2 rounded-2xl bg-white/10 p-3 text-xs text-peach-200">
        <InfoIcon width={16} height={16} className="mt-0.5 shrink-0" />
        {t("volume.onlyYou")}
      </p>
    </div>
  );
}

/* ---------------- Share ---------------- */
export function SharePanel({ ctl, snap, support, onPickFile, onClose }: { ctl: SessionController; snap: Snapshot; support: BrowserSupport; onPickFile: () => void; onClose: () => void }) {
  const sharing = snap.movie.kind !== "none";
  return (
    <div className="space-y-3">
      <button
        className="flex w-full items-start gap-3 rounded-2xl bg-white/10 p-3 text-start hover:bg-white/15 disabled:opacity-50"
        disabled={!support.canShareScreen}
        onClick={() => { onClose(); void ctl.startScreenShare(); }}
        title={t("share.tooltip")}
      >
        <ShareIcon className="mt-0.5 shrink-0 text-peach-300" />
        <span>
          <span className="block text-sm font-extrabold">{sharing && snap.movie.kind === "screen" ? t("share.switchSource") : t("share.tab")}</span>
          <span className="block text-xs text-peach-200">{t("share.tabHint")}</span>
        </span>
      </button>

      <fieldset className="rounded-2xl bg-white/5 p-3">
        <legend className="px-1 text-xs font-bold text-peach-200">{t("share.contentType")}</legend>
        {(["motion", "detail"] as const).map((h) => (
          <label key={h} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
            <input type="radio" name="hint" className="accent-peach-400" checked={snap.contentHint === h} onChange={() => ctl.setContentHint(h)} />
            {h === "motion" ? t("share.motion") : t("share.detail")}
          </label>
        ))}
      </fieldset>

      <button
        className="flex w-full items-start gap-3 rounded-2xl bg-white/10 p-3 text-start hover:bg-white/15 disabled:opacity-50"
        disabled={!support.canCaptureFile}
        onClick={() => { onClose(); onPickFile(); }}
      >
        <FileIcon className="mt-0.5 shrink-0 text-peach-300" />
        <span>
          <span className="block text-sm font-extrabold">{snap.movie.kind === "file" ? t("share.swapFile") : t("share.file")}</span>
          <span className="block text-xs text-peach-200">{t("share.fileHint")}</span>
        </span>
      </button>

      {support.canShareScreen && isMac() && (
        <p className="flex items-start gap-2 text-xs text-peach-300/90">
          <InfoIcon width={16} height={16} className="mt-0.5 shrink-0" />
          {t("share.macNote")}
        </p>
      )}

      {sharing && (
        <button className="btn w-full bg-rose-500/90 text-white hover:bg-rose-500" onClick={() => { onClose(); void ctl.stopShare(true); }}>
          {t("share.stop")}
        </button>
      )}
    </div>
  );
}

/* ---------------- Quality ---------------- */
export function QualityPanel({ ctl, snap }: { ctl: SessionController; snap: Snapshot }) {
  const labels: Record<string, MessageKey> = { "720p30": "quality.720p30", "1080p30": "quality.1080p30", "1080p60": "quality.1080p60", "4k30": "quality.4k30" };
  return (
    <div className="space-y-2">
      <p className="text-sm font-extrabold">{t("quality.title")}</p>
      {PRESET_ORDER.map((id) => {
        const ok = isPresetAvailable(id, snap.sourceWidth);
        const p = PRESETS[id];
        return (
          <button
            key={id}
            disabled={!ok}
            onClick={() => void ctl.setPreset(id)}
            className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-start text-sm font-bold transition disabled:opacity-40 ${
              snap.preset === id ? "bg-peach-400 text-plum-900" : "bg-white/10 hover:bg-white/15"
            }`}
            aria-pressed={snap.preset === id}
          >
            <span>
              {t(labels[id])}
              {!ok && <span className="block text-xs font-semibold opacity-80">{t("quality.needs4k")}</span>}
            </span>
            <span className="font-mono text-xs opacity-80">{(p.bitrate / 1_000_000).toFixed(1)} Mbps</span>
          </button>
        );
      })}
      <p className="text-xs text-peach-300/80">{snap.movie.kind === "none" ? t("quality.noSource") : t("quality.hint")}</p>
    </div>
  );
}

/* ---------------- Devices ---------------- */
export function DevicePanel({ ctl }: { ctl: SessionController }) {
  const [devs, setDevs] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => {
    let live = true;
    navigator.mediaDevices.enumerateDevices().then((d) => live && setDevs(d)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  const rows: { kind: "videoinput" | "audioinput" | "audiooutput"; label: MessageKey; key: string }[] = [
    { kind: "videoinput", label: "devices.camera", key: KEYS.camId },
    { kind: "audioinput", label: "devices.mic", key: KEYS.micId },
    { kind: "audiooutput", label: "devices.speakers", key: KEYS.spkId },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const list = devs.filter((d) => d.kind === r.kind);
        const unsupported = r.kind === "audiooutput" && !ctl.mixer.canChooseSpeakers;
        return (
          <div key={r.kind}>
            <label className="mb-1 block text-xs font-bold text-peach-200" htmlFor={`dev-${r.kind}`}>{t(r.label)}</label>
            <select
              id={`dev-${r.kind}`}
              disabled={unsupported || list.length === 0}
              defaultValue={store.get<string>(r.key, "")}
              onChange={(e) => void ctl.switchDevice(r.kind, e.target.value)}
              className="w-full rounded-xl border-0 bg-white/10 px-3 py-2 text-sm text-cream-50 focus:outline-none focus:ring-2 focus:ring-peach-300"
            >
              <option value="" className="text-plum-900">{unsupported ? t("devices.speakersUnsupported") : t("devices.default")}</option>
              {list.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId} className="text-plum-900">{d.label || `${t(r.label)} ${i + 1}`}</option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Invite ---------------- */
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  return {
    copied,
    copy: async (key: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 1800);
      } catch {
        /* clipboard blocked */
      }
    },
  };
}

export function InviteBody({ roomId, password }: { roomId: string; password?: string }) {
  const { copied, copy } = useCopy();
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/r/${roomId}`;
  const message = t("invite.message", { link, password: password ?? "" });
  return (
    <div className="space-y-3 text-start">
      <div>
        <p className="mb-1 text-xs font-bold text-peach-200">{t("invite.link")}</p>
        <div className="flex gap-2">
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm" aria-label={t("invite.link")} />
          <button className="btn-ghost-dark !px-3" onClick={() => copy("link", link)} aria-label={t("invite.copyLink")}>
            <CopyIcon width={18} height={18} /> {copied === "link" ? t("invite.copied") : ""}
          </button>
        </div>
      </div>
      {password && (
        <div>
          <p className="mb-1 text-xs font-bold text-peach-200">{t("common.roomPassword")}</p>
          <div className="flex gap-2">
            <input readOnly value={password} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 font-mono text-sm" aria-label={t("common.roomPassword")} />
            <button className="btn-ghost-dark !px-3" onClick={() => copy("pw", password)} aria-label={t("invite.copyPassword")}>
              <CopyIcon width={18} height={18} /> {copied === "pw" ? t("invite.copied") : ""}
            </button>
          </div>
        </div>
      )}
      <button className="btn-primary w-full" onClick={() => copy("all", message)}>{copied === "all" ? t("invite.copied") : t("invite.copyAll")}</button>
    </div>
  );
}

export function InviteCard({ roomId, password }: { roomId: string; password?: string }) {
  return (
    <div className="w-full max-w-md rounded-4xl bg-white/10 p-5 ring-1 ring-white/10">
      <h2 className="text-lg font-extrabold">{t("invite.title")}</h2>
      <p className="mb-3 text-sm text-peach-200">{t("invite.hint")}</p>
      <InviteBody roomId={roomId} password={password} />
    </div>
  );
}
