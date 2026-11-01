"use client";
import type { Notice } from "@/lib/client/session";
import { t } from "@/lib/i18n";

const tone = {
  info: "bg-plum-900/95 text-cream-50 ring-white/10",
  warn: "bg-peach-300 text-plum-900 ring-peach-400",
  error: "bg-rose-500 text-white ring-rose-400",
} as const;

export function Toasts({ notices, onDismiss }: { notices: Notice[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-40 flex flex-col items-center gap-2 px-4" aria-live="polite">
      {notices.map((n) => (
        <div key={n.id} role={n.kind === "error" ? "alert" : "status"} className={`pointer-events-auto flex max-w-lg animate-popin items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-cozy ring-1 ${tone[n.kind]}`}>
          <span className="flex-1">{n.text}</span>
          {n.action && (
            <button className="rounded-full bg-white/25 px-3 py-1 text-xs font-bold hover:bg-white/40" onClick={() => { n.action!.run(); onDismiss(n.id); }}>
              {n.action.label}
            </button>
          )}
          <button aria-label={t("common.dismiss")} className="opacity-70 hover:opacity-100" onClick={() => onDismiss(n.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
