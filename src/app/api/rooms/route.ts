import { NextResponse } from "next/server";
import { createRoom } from "@/lib/server/roomLogic";
import { fail, readJson } from "@/lib/server/http";

export const runtime = "nodejs";

/** POST /api/rooms { password } -> { roomId, hostSecret } */
export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const { id, hostSecret } = await createRoom(body.password);
    return NextResponse.json({ roomId: id, hostSecret }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
