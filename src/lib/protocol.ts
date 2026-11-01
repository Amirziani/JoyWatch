/** Messages exchanged over the LiveKit data channel (topic "jw"). */
export const DATA_TOPIC = "jw";

export type SourceKind = "none" | "file" | "screen";
export type PlayAction = "play" | "pause" | "seek" | "load";

export type Msg =
  /** Guest -> host: "I just arrived, send me the current state". */
  | { t: "hello" }
  /** Either person -> host: please do this to the video. */
  | { t: "cmd"; a: "play" | "pause" | "seek"; time?: number; by: string; byId: string }
  /** Host -> everyone: authoritative playback state. */
  | {
      t: "state";
      playing: boolean;
      time: number;
      duration: number;
      by: string;
      action: PlayAction;
      fileName: string;
    }
  | { t: "heart" }
  /** Guest -> host: my connection is struggling. */
  | { t: "weak" };

const enc = new TextEncoder();
const dec = new TextDecoder();

export const encodeMsg = (m: Msg) => enc.encode(JSON.stringify(m));

export function decodeMsg(b: Uint8Array): Msg | null {
  try {
    const m = JSON.parse(dec.decode(b));
    return m && typeof m.t === "string" ? (m as Msg) : null;
  } catch {
    return null;
  }
}

/** Track names used when publishing, so the receiver knows what it is looking at. */
export const TRACK_NAME_FILE = "movie:file";
export const TRACK_NAME_SCREEN = "movie:screen";
