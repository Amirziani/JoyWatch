/**
 * Auth primitives. Kept separate from room + media logic so real accounts can
 * replace "room password" later without touching RoomService or the token route.
 */
import bcrypt from "bcryptjs";
import { randomBytes, timingSafeEqual } from "node:crypto";

const COST = 10;

export const PASSWORD_MIN = 4;
export const PASSWORD_MAX = 72; // bcrypt truncates beyond 72 bytes

export function hashSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, COST);
}

export function verifySecret(secret: string, hash: string): Promise<boolean> {
  return bcrypt.compare(secret, hash);
}

/** Random capability token handed to the room creator; proves "I am the host". */
export function newHostSecret(): string {
  return randomBytes(24).toString("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
