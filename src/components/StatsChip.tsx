import type { StatsSample } from "@/lib/client/session-types";
import { fmtMbps } from "@/lib/client/format";
import { t } from "@/lib/i18n";

export function StatsChip({ stats }: { stats: StatsSample | null }) {
  return (
    <div className="pointer-events-none rounded-full bg-plum-900/80 px-3.5 py-1.5 font-mono text-xs font-bold text-cream-50 shadow-cozy ring-1 ring-white/10" role="status" aria-label={t("stats.label")}>
      {stats && stats.width ? (
        <>
          {stats.width}×{stats.height} · {stats.fps} {t("stats.fps")} · {fmtMbps(stats.kbps)} {t("stats.mbps")} ·{" "}
          <span className={stats.lossPct > 2 ? "text-amber-300" : ""}>{stats.lossPct.toFixed(1)}% {t("stats.loss")}</span>
          {stats.rttMs !== null && <> · {Math.round(stats.rttMs)} {t("stats.ms")}</>}
        </>
      ) : (
        t("stats.waiting")
      )}
    </div>
  );
}
