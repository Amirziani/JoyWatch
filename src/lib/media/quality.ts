export type PresetId = "720p30" | "1080p30" | "1080p60" | "4k30";

export interface QualityPreset {
  id: PresetId;
  width: number;
  height: number;
  fps: number;
  /** Max video bitrate in bits per second (explicit; we prefer bitrate over simulcast). */
  bitrate: number;
}

export const PRESETS: Record<PresetId, QualityPreset> = {
  "720p30": { id: "720p30", width: 1280, height: 720, fps: 30, bitrate: 3_500_000 },
  "1080p30": { id: "1080p30", width: 1920, height: 1080, fps: 30, bitrate: 8_000_000 },
  "1080p60": { id: "1080p60", width: 1920, height: 1080, fps: 60, bitrate: 12_000_000 },
  "4k30": { id: "4k30", width: 3840, height: 2160, fps: 30, bitrate: 25_000_000 },
};

export const PRESET_ORDER: PresetId[] = ["720p30", "1080p30", "1080p60", "4k30"];
export const DEFAULT_PRESET: PresetId = "1080p30";

/** A source can only deliver 4K if its pixels really are ~4K. */
export function isPresetAvailable(id: PresetId, sourceWidth: number | null): boolean {
  if (id !== "4k30") return true;
  return sourceWidth !== null && sourceWidth >= 3200;
}

export type ContentHint = "motion" | "detail";

/** Camera bubbles are deliberately tiny to leave bandwidth for the content. */
export const CAMERA_CAPTURE = { width: 480, height: 360, frameRate: 24 } as const;
export const CAMERA_ENCODING = { maxBitrate: 350_000, maxFramerate: 24 } as const;

/**
 * Applies a preset to an already-publishing video sender. Works live, with no
 * re-prompt for screen capture: we cap bitrate/fps and downscale if the source is larger.
 */
export async function applyPresetToSender(
  sender: RTCRtpSender | undefined,
  preset: QualityPreset,
  sourceWidth: number | null,
): Promise<void> {
  if (!sender) return;
  const params = sender.getParameters();
  if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
  const enc = params.encodings[0];
  enc.maxBitrate = preset.bitrate;
  enc.maxFramerate = preset.fps;
  enc.scaleResolutionDownBy = sourceWidth && sourceWidth > preset.width ? sourceWidth / preset.width : 1;
  enc.priority = "high";
  enc.networkPriority = "high";
  await sender.setParameters(params);
}
