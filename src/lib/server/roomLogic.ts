/** Room use-cases. Routes stay thin; this is where rules live. */
import { randomInt } from "node:crypto";
import { getRoomService } from "./rooms";
import { hashSecret, newHostSecret, PASSWORD_MAX, PASSWORD_MIN, safeEqual, verifySecret } from "./auth/password";

const ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes
export const ROOM_ID_RE = /^[a-z0-9]{8,16}$/;
export const MAX_PARTICIPANTS = 2;

function newRoomId(len = 10) {
  let s = "";
  for (let i = 0; i < len; i++) s += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
  return s;
}

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function validatePassword(pw: unknown): string {
  if (typeof pw !== "string" || pw.length < PASSWORD_MIN) {
    throw new HttpError(400, "password_too_short", `Password must be at least ${PASSWORD_MIN} characters.`);
  }
  if (new TextEncoder().encode(pw).length > PASSWORD_MAX) {
    throw new HttpError(400, "password_too_long", "Password is too long.");
  }
  return pw;
}

export function validateName(name: unknown): string {
  const n = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  if (n.length < 1 || n.length > 30) throw new HttpError(400, "bad_name", "Please enter a display name (max 30 characters).");
  return n;
}

export async function createRoom(password: unknown) {
  const pw = validatePassword(password);
  const svc = getRoomService();
  const hostSecret = newHostSecret();
  const [passwordHash, hostSecretHash] = await Promise.all([hashSecret(pw), hashSecret(hostSecret)]);
  const id = newRoomId();
  await svc.create({ id, passwordHash, hostSecretHash, createdAt: Date.now(), plan: "free" });
  return { id, hostSecret };
}

export async function roomExists(id: string) {
  if (!ROOM_ID_RE.test(id)) return false;
  return (await getRoomService().get(id)) !== null;
}

const MAX_ATTEMPTS = 8;
const WINDOW_S = 10 * 60;

export type JoinCredentials = { password?: string; hostSecret?: string };

/** Verifies that the caller may enter the room and says in which role. */
export async function authorizeJoin(roomId: string, creds: JoinCredentials, clientKey: string): Promise<"host" | "guest"> {
  const svc = getRoomService();
  if (!ROOM_ID_RE.test(roomId)) throw new HttpError(404, "room_not_found", "Room not found.");
  const room = await svc.get(roomId);
  if (!room) throw new HttpError(404, "room_not_found", "This room doesn't exist or has ended.");

  const rlKey = `${roomId}:${clientKey}`;
  if (creds.hostSecret) {
    if (await verifySecret(creds.hostSecret, room.hostSecretHash)) return "host";
    throw new HttpError(403, "bad_host_secret", "Host key is not valid for this room.");
  }
  // brute-force guard (checked before the expensive hash compare)
  const attempts = await svc.hit(rlKey, WINDOW_S);
  if (attempts > MAX_ATTEMPTS) {
    throw new HttpError(429, "too_many_attempts", "Too many wrong passwords. Try again in a few minutes.");
  }
  if (typeof creds.password !== "string" || !(await verifySecret(creds.password, room.passwordHash))) {
    throw new HttpError(401, "wrong_password", "That password doesn't match.");
  }
  await svc.clearHits(rlKey);
  return "guest";
}

export async function authorizeHost(roomId: string, hostSecret: unknown) {
  const room = ROOM_ID_RE.test(roomId) ? await getRoomService().get(roomId) : null;
  if (!room) throw new HttpError(404, "room_not_found", "Room not found.");
  if (typeof hostSecret !== "string" || !(await verifySecret(hostSecret, room.hostSecretHash))) {
    throw new HttpError(403, "not_host", "Only the host can do that.");
  }
}

export async function endRoom(roomId: string, hostSecret: unknown) {
  await authorizeHost(roomId, hostSecret);
  await getRoomService().delete(roomId);
}

export { safeEqual };
