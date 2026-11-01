/** localStorage that never throws (private mode, blocked storage, SSR). */
export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const KEYS = {
  name: "joywatch:name",
  clientId: "joywatch:cid",
  movieVolume: "joywatch:vol:movie",
  voiceVolume: "joywatch:vol:voice",
  quality: "joywatch:quality",
  contentHint: "joywatch:contentHint",
  bubblesVisible: "joywatch:bubbles:visible",
  bubbleSelf: "joywatch:bubble:self",
  bubblePartner: "joywatch:bubble:partner",
  headphoneTipSeen: "joywatch:tip:headphones",
  stats: "joywatch:stats",
  camId: "joywatch:dev:cam",
  micId: "joywatch:dev:mic",
  spkId: "joywatch:dev:spk",
  host: (roomId: string) => `joywatch:host:${roomId}`,
  guestPw: (roomId: string) => `joywatch:pw:${roomId}`,
};

export interface HostCreds {
  hostSecret: string;
  password: string;
}

/** Random id that stays the same for this browser, used for stable participant identity. */
export function getClientId(): string {
  let id = store.get<string>(KEYS.clientId, "");
  if (!/^[a-z0-9]{6,24}$/i.test(id)) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    id = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
    store.set(KEYS.clientId, id);
  }
  return id;
}
