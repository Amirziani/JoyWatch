"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { t } from "@/lib/i18n";

/** Closes on outside click / Escape. Positioning is done by the `popover` class (opens upward). */
export function Popover({ open, onClose, children, className = "" }: { open: boolean; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("pointerdown", down);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", key);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} role="dialog" className={`popover ${className}`}>
      <button
        className="absolute end-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-walnut-800/10 text-walnut-700 hover:bg-walnut-800/15 sm:hidden"
        aria-label={t("common.close")}
        onClick={onClose}
      >
        ✕
      </button>
      <div className="max-sm:pt-8">{children}</div>
    </div>
  );
}
