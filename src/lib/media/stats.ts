export interface StatsSample {
  width: number;
  height: number;
  fps: number;
  kbps: number;
  lossPct: number;
  rttMs: number | null;
  /** Sender-side reason the encoder is holding quality back ("bandwidth", "cpu", "none"). */
  limited: string;
}

interface Prev {
  bytes: number;
  ts: number;
  lost: number;
  packets: number;
}

/** Turns successive RTCStatsReports into a human-friendly sample. */
export class StatsReader {
  private prev: Prev | null = null;

  reset() {
    this.prev = null;
  }

  async read(target: RTCRtpSender | RTCRtpReceiver | undefined, direction: "send" | "recv"): Promise<StatsSample | null> {
    if (!target) return null;
    const report = await target.getStats();
    let width = 0,
      height = 0,
      fps = 0,
      bytes = 0,
      ts = 0,
      lost = 0,
      packets = 0,
      rtt: number | null = null,
      limited = "none";

    report.forEach((s) => {
      if (direction === "send" && s.type === "outbound-rtp" && s.kind === "video") {
        width = s.frameWidth ?? 0;
        height = s.frameHeight ?? 0;
        fps = s.framesPerSecond ?? 0;
        bytes = s.bytesSent ?? 0;
        packets = s.packetsSent ?? 0;
        ts = s.timestamp;
        limited = s.qualityLimitationReason ?? "none";
      } else if (direction === "send" && s.type === "remote-inbound-rtp" && s.kind === "video") {
        lost = s.packetsLost ?? 0;
        if (typeof s.roundTripTime === "number") rtt = s.roundTripTime * 1000;
      } else if (direction === "recv" && s.type === "inbound-rtp" && s.kind === "video") {
        width = s.frameWidth ?? 0;
        height = s.frameHeight ?? 0;
        fps = s.framesPerSecond ?? 0;
        bytes = s.bytesReceived ?? 0;
        packets = s.packetsReceived ?? 0;
        lost = s.packetsLost ?? 0;
        ts = s.timestamp;
      } else if (direction === "recv" && s.type === "candidate-pair" && s.nominated && typeof s.currentRoundTripTime === "number") {
        rtt = s.currentRoundTripTime * 1000;
      }
    });
    if (!ts) return null;

    let kbps = 0;
    let lossPct = 0;
    if (this.prev && ts > this.prev.ts) {
      kbps = ((bytes - this.prev.bytes) * 8) / (ts - this.prev.ts); // bits/ms == kbit/s
      const dLost = Math.max(0, lost - this.prev.lost);
      const dPk = Math.max(0, packets - this.prev.packets);
      lossPct = dLost + dPk > 0 ? (dLost / (dLost + dPk)) * 100 : 0;
    }
    this.prev = { bytes, ts, lost, packets };
    return { width, height, fps: Math.round(fps), kbps: Math.max(0, Math.round(kbps)), lossPct, rttMs: rtt, limited };
  }
}
