import type { RoomRecord, RoomService } from "./types";

interface Store {
  rooms: Map<string, RoomRecord>;
  hits: Map<string, { n: number; resetAt: number }>;
}

// Survive Next.js dev hot reloads.
const g = globalThis as unknown as { __joywatchMem?: Store };
const store: Store = (g.__joywatchMem ??= { rooms: new Map(), hits: new Map() });

/** Dev/test only. Data is lost on restart and is not shared across serverless instances. */
export class MemoryRoomService implements RoomService {
  async create(room: RoomRecord) {
    store.rooms.set(room.id, room);
  }
  async get(id: string) {
    return store.rooms.get(id) ?? null;
  }
  async delete(id: string) {
    store.rooms.delete(id);
  }
  async hit(key: string, windowSeconds: number) {
    const now = Date.now();
    const cur = store.hits.get(key);
    if (!cur || cur.resetAt < now) {
      store.hits.set(key, { n: 1, resetAt: now + windowSeconds * 1000 });
      return 1;
    }
    cur.n += 1;
    return cur.n;
  }
  async clearHits(key: string) {
    store.hits.delete(key);
  }
}
