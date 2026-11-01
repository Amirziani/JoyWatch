import { beforeEach, describe, expect, it } from "vitest";
import { authorizeHost, authorizeJoin, createRoom, endRoom, HttpError, roomExists, validateName } from "../src/lib/server/roomLogic";
import { getRoomService } from "../src/lib/server/rooms";

beforeEach(() => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

async function expectHttp(p: Promise<unknown>, status: number, code: string) {
  await expect(p).rejects.toMatchObject({ status, code });
}

describe("rooms", () => {
  it("creates a room whose password and host secret are only stored hashed", async () => {
    const { id, hostSecret } = await createRoom("cozy-panda-42");
    const rec = await getRoomService().get(id);
    expect(rec).not.toBeNull();
    expect(JSON.stringify(rec)).not.toContain("cozy-panda-42");
    expect(JSON.stringify(rec)).not.toContain(hostSecret);
    expect(rec!.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(await roomExists(id)).toBe(true);
  });

  it("lets a guest in with the right password only", async () => {
    const { id } = await createRoom("sunny-sofa-11");
    expect(await authorizeJoin(id, { password: "sunny-sofa-11" }, "ip1")).toBe("guest");
    await expectHttp(authorizeJoin(id, { password: "nope" }, "ip1"), 401, "wrong_password");
    await expectHttp(authorizeJoin(id, {}, "ip1"), 401, "wrong_password");
  });

  it("recognises the host by the host secret, and rejects a guessed one", async () => {
    const { id, hostSecret } = await createRoom("abcd");
    expect(await authorizeJoin(id, { hostSecret }, "ip")).toBe("host");
    await expectHttp(authorizeJoin(id, { hostSecret: "guess" }, "ip"), 403, "bad_host_secret");
    // the room password must never grant host
    expect(await authorizeJoin(id, { password: "abcd" }, "ip")).toBe("guest");
  });

  it("rate-limits password guessing per room + client", async () => {
    const { id } = await createRoom("right-pass");
    for (let i = 0; i < 8; i++) await expectHttp(authorizeJoin(id, { password: "x" + i }, "attacker"), 401, "wrong_password");
    await expectHttp(authorizeJoin(id, { password: "right-pass" }, "attacker"), 429, "too_many_attempts");
    // someone else is unaffected
    expect(await authorizeJoin(id, { password: "right-pass" }, "partner")).toBe("guest");
  });

  it("404s for unknown / malformed ids", async () => {
    await expectHttp(authorizeJoin("zzzzzzzzzz", { password: "x" }, "ip"), 404, "room_not_found");
    await expectHttp(authorizeJoin("../etc", { password: "x" }, "ip"), 404, "room_not_found");
    expect(await roomExists("nope")).toBe(false);
  });

  it("only the host can end a room", async () => {
    const { id, hostSecret } = await createRoom("abcd");
    await expectHttp(endRoom(id, "wrong"), 403, "not_host");
    await expectHttp(authorizeHost(id, undefined), 403, "not_host");
    await endRoom(id, hostSecret);
    expect(await roomExists(id)).toBe(false);
  });

  it("validates input", async () => {
    await expectHttp(createRoom("abc"), 400, "password_too_short");
    await expectHttp(createRoom("x".repeat(80)), 400, "password_too_long");
    expect(() => validateName("  ")).toThrow(HttpError);
    expect(validateName("  Maya   Rose ")).toBe("Maya Rose");
  });
});
