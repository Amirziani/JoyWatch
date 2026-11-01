export interface RoomRecord {
  id: string;
  /** bcrypt hash of the room password (never sent to clients). */
  passwordHash: string;
  /** bcrypt hash of the host capability secret. */
  hostSecretHash: string;
  createdAt: number;
  /** Reserved for future multi-room / account ownership. */
  ownerId?: string;
  /** Reserved for future paid plans. */
  plan?: "free";
}

/**
 * Persistence boundary for rooms. Swap the implementation (Postgres, Supabase, ...)
 * without touching routes: nothing outside src/lib/server/rooms knows about Redis.
 */
export interface RoomService {
  create(room: RoomRecord): Promise<void>;
  get(id: string): Promise<RoomRecord | null>;
  delete(id: string): Promise<void>;
  /** Increment a rate-limit counter; returns the new count within the window. */
  hit(key: string, windowSeconds: number): Promise<number>;
  clearHits(key: string): Promise<void>;
}
