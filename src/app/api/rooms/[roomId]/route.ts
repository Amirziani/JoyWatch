import { NextResponse } from "next/server";
import { endRoom, roomExists } from "@/lib/server/roomLogic";
import { closeLiveKitRoom } from "@/lib/server/livekit";
import { fail, readJson } from "@/lib/server/http";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ roomId: string }> };

/** GET: does this room exist? (no secrets) */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { roomId } = await params;
    return NextResponse.json({ exists: await roomExists(roomId) });
  } catch (e) {
    return fail(e);
  }
}

/** DELETE { hostSecret }: host ends the room for everyone. */
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const { roomId } = await params;
    const body = await readJson(req);
    await endRoom(roomId, body.hostSecret);
    await closeLiveKitRoom(roomId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
