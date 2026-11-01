import { NextResponse } from "next/server";
import { authorizeJoin, validateName } from "@/lib/server/roomLogic";
import { ensureRoomWithCapacity, identityFor, mintToken } from "@/lib/server/livekit";
import { clientKey, fail, readJson } from "@/lib/server/http";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ roomId: string }> };

/**
 * POST { name, clientId, password } (guest) or { name, clientId, hostSecret } (host)
 * -> { token, url, role, identity }
 * The password is checked against a bcrypt hash server-side; it is never returned.
 */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { roomId } = await params;
    const body = await readJson(req);
    const name = validateName(body.name);
    const role = await authorizeJoin(
      roomId,
      {
        password: typeof body.password === "string" ? body.password : undefined,
        hostSecret: typeof body.hostSecret === "string" ? body.hostSecret : undefined,
      },
      clientKey(req),
    );
    const identity = identityFor(role, body.clientId);
    await ensureRoomWithCapacity(roomId, identity);
    const { token, url } = await mintToken(roomId, name, identity, role);
    return NextResponse.json({ token, url, role, identity });
  } catch (e) {
    return fail(e);
  }
}
