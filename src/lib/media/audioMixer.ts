/**
 * Per-listener audio mixer built on Web Audio.
 *
 *   partner voice track ──► voiceGain ─┐
 *                                      ├─► ctx.destination (chosen speakers)
 *   movie audio track   ──► movieGain ─┘
 *   (remote movie audio, or the host's own tab audio / local file)
 *
 * Sliders only change gain nodes on THIS device, so they never affect what the
 * other person hears. For a local file we additionally tap the element's audio
 * *before* the movie gain into a MediaStreamDestination, which is what gets
 * published: the host's slider therefore doesn't change the partner's level.
 */
export const MAX_GAIN = 1.5;

type AnyAudioContext = AudioContext & { setSinkId?: (id: string) => Promise<void> };

export class AudioMixer {
  readonly ctx: AnyAudioContext;
  private movieGain: GainNode;
  private voiceGain: GainNode;
  private voiceSrc: MediaStreamAudioSourceNode | null = null;
  private movieSrc: MediaStreamAudioSourceNode | null = null;
  private voiceId: string | null = null;
  private movieId: string | null = null;
  /** Chrome only feeds remote WebRTC audio into Web Audio if the stream is also attached to a media element. */
  private keepAlive = new Map<string, HTMLAudioElement>();
  private elementSource: MediaElementAudioSourceNode | null = null;
  private publishDest: MediaStreamAudioDestinationNode | null = null;
  private disposed = false;

  constructor(initial: { movie: number; voice: number }) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor({ latencyHint: "interactive" }) as AnyAudioContext;
    this.movieGain = this.ctx.createGain();
    this.voiceGain = this.ctx.createGain();
    this.movieGain.connect(this.ctx.destination);
    this.voiceGain.connect(this.ctx.destination);
    this.setMovieVolume(initial.movie);
    this.setVoiceVolume(initial.voice);
  }

  async resume() {
    if (this.ctx.state !== "running" && !this.disposed) {
      try {
        await this.ctx.resume();
      } catch {
        /* needs a user gesture; we retry on the next one */
      }
    }
  }

  get isRunning() {
    return this.ctx.state === "running";
  }

  setMovieVolume(v: number) {
    this.movieGain.gain.setTargetAtTime(clamp(v), this.ctx.currentTime, 0.015);
  }
  setVoiceVolume(v: number) {
    this.voiceGain.gain.setTargetAtTime(clamp(v), this.ctx.currentTime, 0.015);
  }

  setVoiceTrack(track: MediaStreamTrack | null) {
    if (track?.id === this.voiceId) return;
    this.voiceSrc?.disconnect();
    this.dropKeepAlive("voice");
    this.voiceSrc = null;
    this.voiceId = track?.id ?? null;
    if (track) this.voiceSrc = this.connect(track, this.voiceGain, "voice");
  }

  /** Audio of the shared content as heard on THIS device (remote movie audio, or a local copy of the tab audio). */
  setMovieTrack(track: MediaStreamTrack | null) {
    if (track?.id === this.movieId) return;
    this.movieSrc?.disconnect();
    this.dropKeepAlive("movie");
    this.movieSrc = null;
    this.movieId = track?.id ?? null;
    if (track) this.movieSrc = this.connect(track, this.movieGain, "movie");
  }

  /**
   * Routes a local <video> through the mixer. Returns the audio track to publish
   * to the partner (unaffected by the local movie slider).
   */
  attachFileElement(el: HTMLVideoElement): MediaStreamTrack {
    if (!this.elementSource) {
      this.elementSource = this.ctx.createMediaElementSource(el);
      this.publishDest = this.ctx.createMediaStreamDestination();
      this.elementSource.connect(this.movieGain); // what the host hears
      this.elementSource.connect(this.publishDest); // what the partner hears
    }
    return this.publishDest!.stream.getAudioTracks()[0];
  }

  async setSinkId(deviceId: string) {
    if (typeof this.ctx.setSinkId === "function") await this.ctx.setSinkId(deviceId);
  }

  get canChooseSpeakers() {
    return typeof (AudioContext.prototype as AnyAudioContext).setSinkId === "function";
  }

  dispose() {
    this.disposed = true;
    this.voiceSrc?.disconnect();
    this.movieSrc?.disconnect();
    this.dropKeepAlive("voice");
    this.dropKeepAlive("movie");
    void this.ctx.close().catch(() => undefined);
  }

  private connect(track: MediaStreamTrack, dest: GainNode, slot: string) {
    const stream = new MediaStream([track]);
    const a = new Audio();
    a.muted = true;
    a.srcObject = stream;
    void a.play().catch(() => undefined);
    this.keepAlive.set(slot, a);
    const src = this.ctx.createMediaStreamSource(stream);
    src.connect(dest);
    return src;
  }

  private dropKeepAlive(slot: string) {
    const a = this.keepAlive.get(slot);
    if (a) {
      a.pause();
      a.srcObject = null;
      this.keepAlive.delete(slot);
    }
  }
}

const clamp = (v: number) => Math.min(MAX_GAIN, Math.max(0, Number.isFinite(v) ? v : 1));
