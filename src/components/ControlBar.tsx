"use client";
import { useState } from "react";
import type { SessionController, Snapshot } from "@/lib/client/session";
import type { BrowserSupport } from "@/lib/client/browser";
import { t } from "@/lib/i18n";
import {
  BubbleIcon, BubbleOffIcon, CamIcon, CamOffIcon, ExitFullscreenIcon, FullscreenIcon, InviteIcon, LeaveIcon,
  MicIcon, MicOffIcon, QualityIcon, SettingsIcon, ShareIcon, StatsIcon, VolumeIcon,
} from "./Icons";
import { DevicePanel, InviteBody, QualityPanel, SharePanel, VolumePanel } from "./Menus";
import { PlaybackBar } from "./PlaybackBar";
import { Popover } from "./Popover";

type MenuId = "volume" | "share" | "quality" | "devices" | "invite" | null;

interface Props {
  ctl: SessionController;
  snap: Snapshot;
  support: BrowserSupport;
  roomId: string;
  hostPassword?: string;
  bubbles: boolean;
  onToggleBubbles: () => void;
  stats: boolean;
  onToggleStats: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onPickFile: () => void;
  onMenuChange: (open: boolean) => void;
  onLeave: () => void;
  onEnd: () => void;
}

export function ControlBar(p: Props) {
  const { ctl, snap } = p;
  const [menu, setMenuState] = useState<MenuId>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const isHost = snap.role === "host";
  const setMenu = (m: MenuId) => {
    setMenuState(m);
    p.onMenuChange(m !== null);
  };
  const toggle = (m: Exclude<MenuId, null>) => setMenu(menu === m ? null : m);
  const close = () => setMenu(null);

  return (
    <div className="mx-auto mb-3 flex w-[calc(100%-1.5rem)] max-w-4xl flex-col gap-3 rounded-4xl bg-cream-50/[.97] p-3 text-walnut-800 shadow-cozy ring-1 ring-walnut-800/10 backdrop-blur-md sm:p-4">
      {snap.movie.kind === "file" && <PlaybackBar ctl={ctl} snap={snap} />}

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <button className={`ctl ${snap.self.micOn ? "" : "ctl-off"}`} onClick={ctl.toggleMic} aria-pressed={!snap.self.micOn} aria-label={snap.self.micOn ? t("ctl.muteMic") : t("ctl.unmuteMic")} title={`${snap.self.micOn ? t("ctl.muteMic") : t("ctl.unmuteMic")} (M)`}>
          {snap.self.micOn ? <MicIcon /> : <MicOffIcon />}
        </button>
        <button className={`ctl ${snap.self.camOn ? "" : "ctl-off"}`} onClick={ctl.toggleCam} aria-pressed={!snap.self.camOn} aria-label={snap.self.camOn ? t("ctl.camOff") : t("ctl.camOn")} title={`${snap.self.camOn ? t("ctl.camOff") : t("ctl.camOn")} (V)`}>
          {snap.self.camOn ? <CamIcon /> : <CamOffIcon />}
        </button>
        <button className="ctl" onClick={p.onToggleBubbles} aria-pressed={p.bubbles} aria-label={p.bubbles ? t("ctl.hideBubbles") : t("ctl.showBubbles")} title={`${p.bubbles ? t("ctl.hideBubbles") : t("ctl.showBubbles")} (B)`}>
          {p.bubbles ? <BubbleIcon /> : <BubbleOffIcon />}
        </button>

        <span className="mx-1 hidden h-7 w-px bg-walnut-800/15 sm:block" />

        <div className="relative">
          <button className={`ctl ${menu === "volume" ? "ctl-on" : ""}`} onClick={() => toggle("volume")} aria-expanded={menu === "volume"} aria-label={t("ctl.volume")} title={t("ctl.volume")}>
            <VolumeIcon />
          </button>
          <Popover open={menu === "volume"} onClose={close} className="sm:start-1/2 sm:-translate-x-1/2"><VolumePanel ctl={ctl} snap={snap} /></Popover>
        </div>

        {isHost && (
          <div className="relative">
            <button className={`ctl ${menu === "share" ? "ctl-on" : ""}`} onClick={() => toggle("share")} aria-expanded={menu === "share"} aria-label={t("ctl.share")} title={t("ctl.share")}>
              <ShareIcon />
            </button>
            <Popover open={menu === "share"} onClose={close} className="w-80 sm:start-1/2 sm:-translate-x-1/2">
              <SharePanel ctl={ctl} snap={snap} support={p.support} onPickFile={p.onPickFile} onClose={close} />
            </Popover>
          </div>
        )}

        {isHost && (
          <div className="relative">
            <button className={`ctl ${menu === "quality" ? "ctl-on" : ""}`} onClick={() => toggle("quality")} aria-expanded={menu === "quality"} aria-label={t("ctl.quality")} title={t("ctl.quality")}>
              <QualityIcon />
            </button>
            <Popover open={menu === "quality"} onClose={close} className="sm:start-1/2 sm:-translate-x-1/2"><QualityPanel ctl={ctl} snap={snap} /></Popover>
          </div>
        )}

        <div className="relative">
          <button className={`ctl ${menu === "devices" ? "ctl-on" : ""}`} onClick={() => toggle("devices")} aria-expanded={menu === "devices"} aria-label={t("ctl.devices")} title={t("ctl.devices")}>
            <SettingsIcon />
          </button>
          <Popover open={menu === "devices"} onClose={close} className="sm:end-auto sm:start-1/2 sm:-translate-x-1/2"><DevicePanel ctl={ctl} /></Popover>
        </div>

        {isHost && (
          <div className="relative">
            <button className={`ctl ${menu === "invite" ? "ctl-on" : ""}`} onClick={() => toggle("invite")} aria-expanded={menu === "invite"} aria-label={t("ctl.invite")} title={t("ctl.invite")}>
              <InviteIcon />
            </button>
            <Popover open={menu === "invite"} onClose={close} className="w-80 sm:start-1/2 sm:-translate-x-1/2"><InviteBody roomId={p.roomId} password={p.hostPassword} /></Popover>
          </div>
        )}

        <button className={`ctl ${p.stats ? "ctl-on" : ""}`} onClick={p.onToggleStats} aria-pressed={p.stats} aria-label={t("ctl.stats")} title={t("ctl.stats")}>
          <StatsIcon />
        </button>
        <button className="ctl" onClick={p.onToggleFullscreen} aria-label={p.fullscreen ? t("ctl.exitFullscreen") : t("ctl.fullscreen")} title={`${p.fullscreen ? t("ctl.exitFullscreen") : t("ctl.fullscreen")} (F)`}>
          {p.fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        </button>

        <span className="mx-1 hidden h-7 w-px bg-walnut-800/15 sm:block" />

        {isHost ? (
          <div className="relative">
            <button className="ctl ctl-off" onClick={() => setConfirmEnd((v) => !v)} aria-label={t("ctl.endRoom")} title={t("ctl.endRoom")}>
              <LeaveIcon />
            </button>
            <Popover open={confirmEnd} onClose={() => setConfirmEnd(false)} className="sm:-end-4 sm:w-72">
              <p className="mb-3 text-sm font-bold">{t("end.confirm")}</p>
              <div className="flex gap-2">
                <button className="btn flex-1 bg-clay-500 text-white" onClick={p.onEnd}>{t("end.yes")}</button>
                <button className="btn-ghost-dark flex-1" onClick={p.onLeave}>{t("end.justLeave")}</button>
              </div>
            </Popover>
          </div>
        ) : (
          <button className="ctl ctl-off" onClick={p.onLeave} aria-label={t("ctl.leave")} title={t("ctl.leave")}>
            <LeaveIcon />
          </button>
        )}
      </div>
    </div>
  );
}
