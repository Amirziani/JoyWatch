import { describe, expect, it, vi } from "vitest";
import { applyPresetToSender, isPresetAvailable, PRESET_ORDER, PRESETS } from "../src/lib/media/quality";
import { decodeMsg, encodeMsg } from "../src/lib/protocol";
import { parseRoomRef } from "../src/lib/client/passwords";
import { t } from "../src/lib/i18n";
import { en } from "../src/lib/i18n/en";

describe("quality presets", () => {
  it("maps each preset to explicit resolution, fps and bitrate", () => {
    expect(PRESET_ORDER).toEqual(["720p30", "1080p30", "1080p60", "4k30"]);
    expect(PRESETS["1080p30"]).toMatchObject({ width: 1920, height: 1080, fps: 30 });
    expect(PRESETS["1080p60"].fps).toBe(60);
    expect(PRESETS["4k30"]).toMatchObject({ width: 3840, height: 2160 });
    const rates = PRESET_ORDER.map((i) => PRESETS[i].bitrate);
    expect([...rates].sort((a, b) => a - b)).toEqual(rates);
  });

  it("offers 4K only when the source really is ~4K", () => {
    expect(isPresetAvailable("4k30", null)).toBe(false);
    expect(isPresetAvailable("4k30", 1920)).toBe(false);
    expect(isPresetAvailable("4k30", 3840)).toBe(true);
    expect(isPresetAvailable("720p30", null)).toBe(true);
  });

  it("applies bitrate, fps and downscale to a live sender", async () => {
    const params = { encodings: [{}] } as RTCRtpSendParameters;
    const sender = { getParameters: () => params, setParameters: vi.fn().mockResolvedValue(undefined) } as unknown as RTCRtpSender;
    await applyPresetToSender(sender, PRESETS["720p30"], 1920);
    expect(params.encodings[0]).toMatchObject({ maxBitrate: 3_500_000, maxFramerate: 30, scaleResolutionDownBy: 1920 / 1280 });
    await applyPresetToSender(sender, PRESETS["1080p60"], 1280);
    expect(params.encodings[0]).toMatchObject({ maxBitrate: 12_000_000, maxFramerate: 60, scaleResolutionDownBy: 1 });
  });
});

describe("protocol", () => {
  it("round-trips messages and rejects garbage", () => {
    const m = { t: "cmd", a: "seek", time: 12.5, by: "Maya", byId: "g1" } as const;
    expect(decodeMsg(encodeMsg(m))).toEqual(m);
    expect(decodeMsg(new TextEncoder().encode("not json"))).toBeNull();
    expect(decodeMsg(new TextEncoder().encode("{}"))).toBeNull();
  });
});

describe("helpers", () => {
  it("parses room links and codes", () => {
    expect(parseRoomRef("https://joy.example.com/r/abcd2345ef")).toBe("abcd2345ef");
    expect(parseRoomRef("  ABCD2345EF ")).toBe("abcd2345ef");
    expect(parseRoomRef("hello")).toBeNull();
  });
  it("interpolates strings from the single i18n file", () => {
    expect(t("playback.paused", { name: "Amir" })).toBe("Amir paused");
    expect(Object.keys(en).length).toBeGreaterThan(100);
  });
});
