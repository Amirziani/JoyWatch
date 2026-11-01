import type { Quality } from "@/lib/client/session";
import { t, type MessageKey } from "@/lib/i18n";

const color: Record<Quality, string> = {
  excellent: "bg-emerald-400",
  good: "bg-lime-300",
  poor: "bg-amber-400",
  lost: "bg-rose-500",
  unknown: "bg-plum-300",
};
const label: Record<Quality, MessageKey> = {
  excellent: "conn.excellent",
  good: "conn.good",
  poor: "conn.poor",
  lost: "conn.lost",
  unknown: "conn.unknown",
};

export function ConnDot({ name, quality }: { name: string; quality: Quality }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-bold" title={`${name}: ${t(label[quality])}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${color[quality]} ${quality === "poor" || quality === "lost" ? "animate-pulse" : ""}`} />
      <span className="max-w-[8rem] truncate">{name}</span>
      <span className="sr-only">{t(label[quality])}</span>
    </span>
  );
}
