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

/** Throws room_full if two people are already connected. */
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
    // Room not created yet (first joiner) or API hiccup: create it with a hard server-side limit.
  }
  try {
    await svc.createRoom({ name: roomId, maxParticipants: MAX_PARTICIPANTS, emptyTimeout: 60 * 10 });
  } catch {
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
