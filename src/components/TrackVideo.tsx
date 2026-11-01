"use client";
import { useEffect, useRef } from "react";

/** Renders a MediaStreamTrack in a <video>. Always muted: audio goes through the Web Audio mixer. */
export function TrackVideo({ track, className, mirrored }: { track: MediaStreamTrack | null; className?: string; mirrored?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = track ? new MediaStream([track]) : null;
    if (track) void el.play().catch(() => undefined);
  }, [track]);
  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      className={`${className ?? ""} ${mirrored ? "-scale-x-100" : ""}`}
    />
  );
}
