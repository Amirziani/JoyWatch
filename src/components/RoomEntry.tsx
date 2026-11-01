"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { checkBrowser, type BrowserSupport } from "@/lib/client/browser";
import type { Creds } from "@/lib/client/session";
import { KEYS, store, type HostCreds } from "@/lib/client/storage";
import { t } from "@/lib/i18n";
import { CozyBackdrop, WallStrip } from "./Decor";
import { Logo } from "./Logo";
import { RoomView } from "./RoomView";

type Stage = "loading" | "missing" | "unsupported" | "gate" | "joined";

function readSessionPw(roomId: string) {
  try {
    return window.sessionStorage.getItem(KEYS.guestPw(roomId)) ?? "";
  } catch {
    return "";
  }
}
function writeSessionPw(roomId: string, pw: string) {
  try {
    window.sessionStorage.setItem(KEYS.guestPw(roomId), pw);
  } catch {
    /* ignore */
  }
}

export function RoomEntry({ roomId }: { roomId: string }) {
  const [stage, setStage] = useState<Stage>("loading");
  const [support, setSupport] = useState<BrowserSupport | null>(null);
  const [host, setHost] = useState<HostCreds | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<Creds | null>(null);

  useEffect(() => {
    const s = checkBrowser();
    setSupport(s);
    setName(store.get(KEYS.name, ""));
    setPassword(readSessionPw(roomId));
    setHost(store.get<HostCreds | null>(KEYS.host(roomId), null));
    if (!s.ok) return setStage("unsupported");
    api
      .roomExists(roomId)
      .then((r) => setStage(r.exists ? "gate" : "missing"))
      .catch(() => {
        setError(t("error.network"));
        setStage("gate");
      });
  }, [roomId]);

  function enter(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setError(t("gate.nameRequired"));
    if (!host && !password) return setError(t("gate.passwordRequired"));
    setError(null);
    store.set(KEYS.name, n);
    if (!host) writeSessionPw(roomId, password);
    setCreds(host ? { name: n, hostSecret: host.hostSecret } : { name: n, password });
    setStage("joined");
  }

  if (stage === "joined" && creds) {
    return (
      <RoomView
        roomId={roomId}
        creds={creds}
        hostPassword={host?.password}
        support={support!}
        onExit={(msg) => {
          if (msg?.forgetHost) {
            store.remove(KEYS.host(roomId));
            setHost(null);
          }
          setError(msg?.text ?? null);
          setStage(msg?.missing ? "missing" : "gate");
        }}
      />
    );
  }

  return (
    <>
    <CozyBackdrop />
    <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-6 flex justify-center">
        <Link href="/" aria-label={t("app.name")}><Logo /></Link>
      </div>
      <WallStrip className="mb-6" />

      {stage === "loading" && <div className="card text-center font-bold text-walnut-500" role="status">{t("gate.checking")}</div>}

      {stage === "unsupported" && (
        <div className="card text-center">
          <h1 className="text-2xl font-extrabold">{t("gate.unsupportedTitle")}</h1>
          <p className="mt-2 text-walnut-500">{t("gate.unsupportedBody")}</p>
        </div>
      )}

      {stage === "missing" && (
        <div className="card text-center">
          <div className="text-5xl" aria-hidden>🫥</div>
          <h1 className="mt-3 text-2xl font-extrabold">{t("gate.missingTitle")}</h1>
          <p className="mt-2 text-walnut-500">{error ?? t("gate.missingBody")}</p>
          <Link href="/" className="btn-primary mt-6">{t("gate.makeNew")}</Link>
        </div>
      )}

      {stage === "gate" && (
        <form onSubmit={enter} className="card">
          <h1 className="text-2xl font-extrabold">{host ? t("gate.hostTitle") : t("gate.guestTitle")}</h1>
          <p className="mt-1 text-sm text-walnut-500">{host ? t("gate.hostHint") : t("gate.guestHint")}</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="g-name">{t("common.yourName")}</label>
              <input id="g-name" className="input" value={name} maxLength={30} autoFocus={!name} autoComplete="nickname" onChange={(e) => setName(e.target.value)} />
            </div>
            {!host && (
              <div>
                <label className="label" htmlFor="g-pw">{t("common.roomPassword")}</label>
                <input id="g-pw" type="password" className="input" value={password} autoFocus={!!name} autoComplete="off" onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            {error && <p role="alert" className="rounded-2xl bg-clay-400/15 px-4 py-2 text-sm font-semibold text-clay-500">{error}</p>}
            <button className="btn-primary w-full">{host ? t("gate.enterHost") : t("gate.enterGuest")}</button>
            <p className="text-center text-xs text-walnut-500">{t("gate.permissionNote")}</p>
          </div>
        </form>
      )}
    </main>
    </>
  );
}
