/** Everything that talks to LiveKit (token minting + server API). Media logic only. */
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { randomUUID } from "node:crypto";
import { livekitConfig } from "./env";
import { HttpError, MAX_PARTICIPANTS } from "./roomLogic";

function httpUrl(wsUrl: string) {
  return wsUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
}

function client() {
  const c = livekitConfig();
  return { c, svc: new RoomServiceClient(httpUrl(c.url), c.apiKey, c.apiSecret) };
}

/** LiveKit's Twirp errors carry an HTTP status and a code such as "not_found" or "unauthenticated". */
function lkError(e: unknown): { status?: number; code?: string } {
  const x = e as { status?: number; code?: string };
  return { status: x?.status, code: x?.code };
}

/**
 * Throws room_full if two people are already connected, and a clear error if our LiveKit
 * credentials or URL are wrong (instead of letting the browser fail with a vague message).
 */
export async function ensureRoomWithCapacity(roomId: string, identity: string) {
  const { svc } = client();
  try {
    // The same person rejoining (refresh, Wi-Fi switch) replaces their old session, so don't count it.
    const others = (await svc.listParticipants(roomId)).filter((p) => p.identity !== identity);
    if (others.length >= MAX_PARTICIPANTS) {
      throw new HttpError(409, "room_full", "This room already has two people in it.");
    }
  } catch (e) {
    if (e instanceof HttpError) throw e;
    const { status, code } = lkError(e);
    if (status === 401 || status === 403 || code === "unauthenticated" || code === "permission_denied") {
      console.error("[joywatch] LiveKit rejected LIVEKIT_API_KEY / LIVEKIT_API_SECRET");
      throw new HttpError(502, "livekit_auth", "LiveKit rejected the API key or secret.");
    }
    if (code !== "not_found" && status !== 404) {
      console.error("[joywatch] cannot reach LiveKit at LIVEKIT_URL:", e instanceof Error ? e.message : e);
      throw new HttpError(502, "livekit_unreachable", "Can't reach LiveKit. Check LIVEKIT_URL.");
    }
    // Room doesn't exist yet (first joiner): created below with a hard server-side limit.
  }
  try {
    await svc.createRoom({ name: roomId, maxParticipants: MAX_PARTICIPANTS, emptyTimeout: 60 * 10 });
  } catch (e) {
    const { status, code } = lkError(e);
    if (status === 401 || status === 403 || code === "unauthenticated") {
      throw new HttpError(502, "livekit_auth", "LiveKit rejected the API key or secret.");
    }
    /* already exists: fine */
  }
}

/** Stable per browser + role, so reconnecting never looks like a third person. */
export function identityFor(role: "host" | "guest", clientId: unknown) {
  const id = typeof clientId === "string" && /^[a-z0-9]{6,24}$/i.test(clientId) ? clientId : randomUUID().slice(0, 12);
  return `${role}-${id}`;
}

export async function mintToken(roomId: string, name: string, identity: string, role: "host" | "guest") {
  const { c } = client();
  const at = new AccessToken(c.apiKey, c.apiSecret, {
    identity,
    name,
    metadata: JSON.stringify({ role }),
    ttl: "6h",
  });
  at.addGrant({
    room: roomId,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return { token: await at.toJwt(), url: c.url, identity };
}

export async function closeLiveKitRoom(roomId: string) {
  try {
    await client().svc.deleteRoom(roomId);
  } catch {
    /* room may not exist in LiveKit */
  }
}
