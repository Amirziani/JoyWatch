"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import { suggestPassword, parseRoomRef } from "@/lib/client/passwords";
import { KEYS, store } from "@/lib/client/storage";
import { t } from "@/lib/i18n";
import { CozyBackdrop, WallStrip } from "./Decor";
import { Logo } from "./Logo";
import { ShuffleIcon } from "./Icons";

export function Landing() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    setName(store.get(KEYS.name, ""));
    setPassword(suggestPassword());
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(t("landing.nameRequired"));
    if (password.length < 4) return setError(t("landing.passwordShort"));
    setBusy(true);
    try {
      const { roomId, hostSecret } = await api.createRoom(password);
      store.set(KEYS.name, name.trim());
      store.set(KEYS.host(roomId), { hostSecret, password });
      router.push(`/r/${roomId}`);
    } catch (err) {
      setError(err instanceof ApiError && err.code === "network" ? t("error.network") : t("landing.createFailed"));
      setBusy(false);
    }
  }

  function join(e: React.FormEvent) {
    e.preventDefault();
    const id = parseRoomRef(link);
    if (!id) return setLinkError(t("landing.badLink"));
    router.push(`/r/${id}`);
  }

  return (
    <>
    <CozyBackdrop />
    <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-5 pb-12 pt-10">
      <header className="flex items-center justify-between">
        <Logo />
      </header>

      <section className="mx-auto mt-10 max-w-2xl text-center sm:mt-16">
        <p className="mb-3 inline-block animate-floaty rounded-full bg-glow-100 px-4 py-1.5 text-sm font-bold text-walnut-700">{t("landing.badge")}</p>
        <h1 className="text-4xl font-extrabold leading-tight text-walnut-800 sm:text-6xl">{t("landing.title")}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-walnut-500">{t("landing.subtitle")}</p>
      </section>

      <WallStrip className="mt-8" />

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <form onSubmit={create} className="card" aria-labelledby="create-h">
          <h2 id="create-h" className="text-2xl font-extrabold">{t("landing.createTitle")}</h2>
          <p className="mt-1 text-sm text-walnut-500">{t("landing.createHint")}</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="host-name">{t("common.yourName")}</label>
              <input id="host-name" className="input" value={name} maxLength={30} autoComplete="nickname" onChange={(e) => setName(e.target.value)} placeholder={t("landing.namePlaceholder")} />
            </div>
            <div>
              <label className="label" htmlFor="room-pw">{t("common.roomPassword")}</label>
              <div className="flex gap-2">
                <input id="room-pw" className="input font-mono" value={password} maxLength={72} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="btn-soft shrink-0 !px-3" aria-label={t("landing.shuffle")} title={t("landing.shuffle")} onClick={() => setPassword(suggestPassword())}>
                  <ShuffleIcon />
                </button>
              </div>
              <p className="mt-1.5 text-xs text-walnut-500">{t("landing.passwordHint")}</p>
            </div>
            {error && <p role="alert" className="rounded-2xl bg-clay-400/15 px-4 py-2 text-sm font-semibold text-clay-500">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? t("landing.creating") : t("landing.createCta")}</button>
          </div>
        </form>

        <form onSubmit={join} className="card" aria-labelledby="join-h">
          <h2 id="join-h" className="text-2xl font-extrabold">{t("landing.joinTitle")}</h2>
          <p className="mt-1 text-sm text-walnut-500">{t("landing.joinHint")}</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="room-link">{t("landing.linkLabel")}</label>
              <input id="room-link" className="input" value={link} onChange={(e) => { setLink(e.target.value); setLinkError(null); }} placeholder="https://…/r/abcd1234ef" inputMode="url" />
            </div>
            {linkError && <p role="alert" className="rounded-2xl bg-clay-400/15 px-4 py-2 text-sm font-semibold text-clay-500">{linkError}</p>}
            <button className="btn-soft w-full">{t("landing.joinCta")}</button>
          </div>
          <ul className="mt-6 space-y-2 text-sm text-walnut-500">
            <li>🪴 {t("landing.feature1")}</li>
            <li>🕯️ {t("landing.feature2")}</li>
            <li>🎧 {t("landing.feature3")}</li>
          </ul>
        </form>
      </section>

      <footer className="mt-auto pt-10 text-center">
        <p className="font-serif text-base italic text-walnut-500">“{t("decor.quote")}”</p>
        <p className="mt-2 text-xs text-walnut-400">{t("landing.footer")}</p>
      </footer>
    </main>
    </>
  );
}
