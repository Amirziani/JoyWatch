import { NextResponse } from "next/server";
import { ConfigError } from "./env";
import { HttpError } from "./roomLogic";

export function fail(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
  if (e instanceof ConfigError) {
    console.error("[joywatch] config error:", e.message);
    return NextResponse.json({ error: "server_misconfigured", message: "The server isn't configured yet." }, { status: 500 });
  }
  console.error("[joywatch] unexpected:", e);
  return NextResponse.json({ error: "internal", message: "Something went wrong." }, { status: 500 });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function clientKey(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}
