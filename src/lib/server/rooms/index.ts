import { kvConfig } from "../env";
import { MemoryRoomService } from "./memory";
import { UpstashRoomService } from "./upstash";
import type { RoomService } from "./types";

export type { RoomRecord, RoomService } from "./types";

let instance: RoomService | undefined;

/** The one place that decides which storage backend is used. */
export function getRoomService(): RoomService {
  if (instance) return instance;
  const kv = kvConfig();
  if (kv) {
    instance = new UpstashRoomService(kv.url, kv.token);
  } else if (process.env.NODE_ENV === "production" && process.env.JOYWATCH_ALLOW_MEMORY_STORE !== "1") {
    throw new Error("KV_REST_API_URL / KV_REST_API_TOKEN are required in production.");
  } else {
    console.warn("[joywatch] No KV credentials set; using in-memory room store (dev only).");
    instance = new MemoryRoomService();
  }
  return instance;
}
