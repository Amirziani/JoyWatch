import { Redis } from "@upstash/redis";
import type { RoomRecord, RoomService } from "./types";

const ROOM_TTL_SECONDS = 60 * 60 * 24 * 30; // rooms expire after 30 days
const key = (id: string) => `joywatch:room:${id}`;
const hitKey = (k: string) => `joywatch:hit:${k}`;

export class UpstashRoomService implements RoomService {
  private redis: Redis;
  constructor(url: string, token: string) {
    this.redis = new Redis({ url, token });
  }
  async create(room: RoomRecord) {
    await this.redis.set(key(room.id), JSON.stringify(room), { ex: ROOM_TTL_SECONDS, nx: true });
  }
  async get(id: string) {
    const raw = await this.redis.get<RoomRecord | string>(key(id));
    if (!raw) return null;
    return typeof raw === "string" ? (JSON.parse(raw) as RoomRecord) : raw;
  }
  async delete(id: string) {
    await this.redis.del(key(id));
  }
  async hit(k: string, windowSeconds: number) {
    const n = await this.redis.incr(hitKey(k));
    if (n === 1) await this.redis.expire(hitKey(k), windowSeconds);
    return n;
  }
  async clearHits(k: string) {
    await this.redis.del(hitKey(k));
  }
}
