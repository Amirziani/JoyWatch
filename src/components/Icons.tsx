import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const MicIcon = (p: P) => (
  <svg {...base(p)}><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
);
export const MicOffIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 3l18 18M9 9v2a3 3 0 0 0 5 2.2M15 9.3V6a3 3 0 0 0-5.7-1.3M5 11a7 7 0 0 0 11.2 5.6M19 11a7 7 0 0 1-.6 2.8M12 18v3" /></svg>
);
export const CamIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="6" width="12" height="12" rx="3" /><path d="m15 10 6-3v10l-6-3" /></svg>
);
export const CamOffIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 3l18 18M9 6h3a3 3 0 0 1 3 3v3M15 15v0a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 1.500-2.600M15 10l6-3v10l-4-2" /></svg>
);
export const PlayIcon = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M8 5.500v13a1 1 0 0 0 1.500.9l10.500-6.500a1 1 0 0 0 0-1.700L9.500 4.600A1 1 0 0 0 8 5.500Z" /></svg>
);
export const PauseIcon = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><rect x="6" y="4.500" width="4" height="15" rx="1.500" /><rect x="14" y="4.500" width="4" height="15" rx="1.500" /></svg>
);
export const BubbleIcon = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="12" r="5" /><circle cx="17" cy="9" r="3.500" /></svg>
);
export const BubbleOffIcon = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="12" r="5" /><circle cx="17" cy="9" r="3.500" /><path d="M3 3l18 18" /></svg>
);
export const ShareIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="12" rx="3" /><path d="M8 20h8M12 16v4M9 11l3-3 3 3M12 8v6" /></svg>
);
export const FileIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3z" fill="currentColor" /></svg>
);
export const VolumeIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 9v6h4l5 4V5L8 9H4ZM16.500 8.500a5 5 0 0 1 0 7M19 6a8.500 8.500 0 0 1 0 12" /></svg>
);
export const QualityIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 18V9M10 18V5M16 18v-6M22 18H2" /></svg>
);
export const SettingsIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.1a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3h0a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.1a1.700 1.700 0 0 0-.3 1.800v0a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1Z" /></svg>
);
export const FullscreenIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
);
export const ExitFullscreenIcon = (p: P) => (
  <svg {...base(p)}><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
);
export const HeartIcon = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 21 4.200 13.600C.9 10.400 3.200 5 7.700 5c1.900 0 3.300 1 4.300 2.500C13 6 14.400 5 16.300 5c4.500 0 6.800 5.400 3.500 8.600Z" /></svg>
);
export const InviteIcon = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.500" /><path d="M2.500 20a6.500 6.500 0 0 1 13 0M19 8v6M16 11h6" /></svg>
);
export const StatsIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>
);
export const LeaveIcon = (p: P) => (
  <svg {...base(p)}><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 8l4 4-4 4M20 12H9" /></svg>
);
export const CopyIcon = (p: P) => (
  <svg {...base(p)}><rect x="9" y="9" width="11" height="11" rx="3" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>
);
export const InfoIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
);
export const ShuffleIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 7h3c5 0 5 10 10 10h5M3 17h3c1.500 0 2.600-.8 3.500-2M21 7h-5c-1.500 0-2.600.8-3.500 2M18 4l3 3-3 3M18 14l3 3-3 3" /></svg>
);
