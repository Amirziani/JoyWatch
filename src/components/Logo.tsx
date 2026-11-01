import { t } from "@/lib/i18n";

export function Logo({ dark }: { dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xl font-extrabold tracking-tight ${dark ? "text-cream-50" : "text-plum-800"}`}>
      <span className="inline-grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-peach-300 to-rose-400 text-lg shadow-cozy" aria-hidden>
        ♥
      </span>
      {t("app.name")}
    </span>
  );
}
