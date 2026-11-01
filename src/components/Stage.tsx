"use client";
import { useEffect, useRef, useState } from "react";
import type { SessionController, Snapshot } from "@/lib/client/session";
import type { BrowserSupport } from "@/lib/client/browser";
import { isMac } from "@/lib/client/browser";
import { t } from "@/lib/i18n";
import { FileIcon, ShareIcon } from "./Icons";
import { Ivy, Lights, Nook, WallDecor } from "./Decor";
import { InviteCard } from "./Menus";
import { TrackVideo } from "./TrackVideo";

interface Props {
  ctl: SessionController;
  snap: Snapshot;
  support: BrowserSupport;
  roomId: string;
  hostPassword?: string;
  onPickFile: () => void;
}

export function Stage({ ctl, snap, support, roomId, hostPassword, onPickFile }: Props) {
  const isHost = snap.role === "host";
  const fileHost = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const { kind, track, owner } = snap.movie;
  const showFile = isHost && kind === "file";

  // The host's file player lives permanently in the DOM (hidden unless a file is on) so capture never stalls.
  useEffect(() => {
    const host = fileHost.current;
    if (!host) return;
    host.appendChild(ctl.fileVideo);
    return () => {
      ctl.fileVideo.remove();
    };
  }, [ctl]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!isHost) return;
    const f = e.dataTransfer.files?.[0];
    if (f) void ctl.loadFile(f);
  }

  return (
    <div
      className={`absolute inset-0 ${kind === "none" ? "bg-gradient-to-b from-cream-100 via-cream-50 to-sage-100" : "bg-walnut-950"}`}
      onDragOver={(e) => {
        if (!isHost) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={(e) => {
        if (kind === "file" && e.target instanceof HTMLVideoElement) ctl.togglePlay();
      }}
    >
      <div ref={fileHost} className={showFile ? "absolute inset-0" : "pointer-events-none absolute h-px w-px overflow-hidden opacity-0"} />

      {kind === "screen" && track && <TrackVideo track={track} className="absolute inset-0 h-full w-full bg-black object-contain" />}
      {kind === "file" && !isHost && track && <TrackVideo track={track} className="absolute inset-0 h-full w-full cursor-pointer bg-black object-contain" />}

      {kind === "screen" && owner === "self" && (
        <div className="pointer-events-none absolute inset-x-0 top-20 flex justify-center">
          <span className="rounded-full bg-cream-50/90 px-4 py-1.5 text-sm font-bold text-walnut-600 shadow-cozy">{t("stage.youAreSharing")}</span>
        </div>
      )}

      {kind === "none" && (
        <>
          <Lights />
          <Ivy className="left-2 top-0 sm:left-10" />
          <Ivy className="right-4 top-0 hidden sm:block" flip />
          <WallDecor top="top-24" />
          <Nook />

        </>
      )}

      {kind === "none" && (
        <div className="absolute inset-0 overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-6 px-5 pb-60 pt-24 text-center text-walnut-800">
            {!snap.partner && isHost && <InviteCard roomId={roomId} password={hostPassword} />}

            {isHost ? (
              <>
                <div>
                  {snap.partner && <div className="animate-floaty text-5xl" aria-hidden>🍿</div>}
                  <h2 className="mt-3 text-3xl font-extrabold">{t("stage.hostTitle")}</h2>
                  <p className="mt-1 text-walnut-500">{snap.partner ? t("stage.hostReady", { name: snap.partner.name }) : t("stage.hostAlone")}</p>
                </div>
                <div className="grid w-full gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => void ctl.startScreenShare()}
                    disabled={!support.canShareScreen}
                    className="group rounded-4xl bg-white/75 p-6 text-start shadow-cozy ring-1 ring-glow-200 transition hover:bg-white disabled:opacity-50"
                  >
                    <ShareIcon width={34} height={34} className="text-sage-600" />
                    <div className="mt-3 text-lg font-extrabold">{t("stage.shareTab")}</div>
                    <p className="mt-1 text-sm text-walnut-500">{support.canShareScreen ? t("stage.shareTabHint") : t("error.shareUnsupported")}</p>
                    {support.canShareScreen && isMac() && <p className="mt-2 text-xs text-walnut-400">{t("share.macNote")}</p>}
                  </button>
                  <button
                    onClick={onPickFile}
                    disabled={!support.canCaptureFile}
                    className="group rounded-4xl bg-white/75 p-6 text-start shadow-cozy ring-1 ring-glow-200 transition hover:bg-white disabled:opacity-50"
                  >
                    <FileIcon width={34} height={34} className="text-sage-600" />
                    <div className="mt-3 text-lg font-extrabold">{t("stage.playFile")}</div>
                    <p className="mt-1 text-sm text-walnut-500">{support.canCaptureFile ? t("stage.playFileHint") : t("error.captureUnsupported")}</p>
                  </button>
                </div>
                <p className="text-sm text-walnut-400">{t("stage.dropHint")}</p>
              </>
            ) : (
              <div>
                <div className="animate-floaty text-5xl" aria-hidden>🛋️</div>
                <h2 className="mt-3 text-3xl font-extrabold">{t("stage.guestTitle")}</h2>
                <p className="mt-1 text-walnut-500">{snap.partner ? t("stage.guestWaiting", { name: snap.partner.name }) : t("stage.guestNoHost")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {dragging && (
        <div className="pointer-events-none absolute inset-4 z-30 grid place-items-center rounded-4xl border-4 border-dashed border-glow-300 bg-cream-50/90 text-2xl font-extrabold text-walnut-600">
          {t("stage.dropNow")}
        </div>
      )}
    </div>
  );
}
