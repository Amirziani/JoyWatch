"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { SessionController, type Creds, type Snapshot } from "./session";

const noop = () => () => {};

/** Creates the controller on the client, starts the connection, and exposes its state. */
export function useSession(roomId: string, creds: Creds) {
  const [ctl, setCtl] = useState<SessionController | null>(null);

  useEffect(() => {
    const c = new SessionController(roomId, creds);
    setCtl(c);
    // Deferred so React StrictMode's mount/unmount/mount never opens a throw-away connection.
    const timer = setTimeout(() => void c.connect(), 0);
    return () => {
      clearTimeout(timer);
      c.dispose();
      setCtl(null);
    };
    // creds are fixed for the lifetime of a joined room
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const snap = useSyncExternalStore<Snapshot | null>(
    ctl ? ctl.subscribe : noop,
    ctl ? ctl.getSnapshot : () => null,
    () => null,
  );
  return { ctl, snap };
}
