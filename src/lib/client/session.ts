/**
 * SessionController: everything that happens after "Join".
 * Framework-free (React reads it through useSyncExternalStore), so the
 * auth / room / media concerns stay separate from the UI.
 */
import {
  AudioPresets,
  ConnectionQuality,
  ConnectionState,
  DisconnectReason,
  LocalTrackPublication,
  LocalVideoTrack,
  Participant,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
  type TrackPublishOptions,
} from "livekit-client";
import { api, ApiError } from "./api";
import { getClientId, KEYS, store } from "./storage";
import { AudioMixer } from "../media/audioMixer";
import {
  applyPresetToSender,
  CAMERA_CAPTURE,
  CAMERA_ENCODING,
  type ContentHint,
  DEFAULT_PRESET,
  isPresetAvailable,
  type PresetId,
  PRESETS,
} from "../media/quality";
import { StatsReader, type StatsSample } from "../media/stats";
import {
  DATA_TOPIC,
  decodeMsg,
  encodeMsg,
  type Msg,
  type PlayAction,
  type SourceKind,
  TRACK_NAME_FILE,
  TRACK_NAME_SCREEN,
} from "../protocol";
import { t } from "../i18n";

export type Phase = "connecting" | "connected" | "reconnecting" | "disconnected" | "ended";
export type Quality = "excellent" | "good" | "poor" | "lost" | "unknown";

export interface Notice {
  id: number;
  kind: "info" | "warn" | "error";
  text: string;
  action?: { label: string; run: () => void };
}

export interface PersonView {
  name: string;
  speaking: boolean;
  quality: Quality;
  micOn: boolean;
  camOn: boolean;
  camTrack: MediaStreamTrack | null;
}

export interface PlaybackView {
  playing: boolean;
  time: number;
  duration: number;
  by: string;
  action: PlayAction;
  fileName: string;
  /** performance.now() when `time` was valid, for extrapolation on the guest. */
  at: number;
}

export interface Snapshot {
  phase: Phase;
  fatal: { code: string; message: string } | null;
  role: "host" | "guest";
  self: PersonView;
  partner: PersonView | null;
  movie: { kind: SourceKind; track: MediaStreamTrack | null; owner: "self" | "partner" | null; hasAudio: boolean };
  playback: PlaybackView | null;
  movieVolume: number;
  voiceVolume: number;
  preset: PresetId;
  contentHint: ContentHint;
  sourceWidth: number | null;
  stats: StatsSample | null;
  notices: Notice[];
  heartTick: number;
  audioBlocked: boolean;
}

export type Creds = { name: string; password?: string; hostSecret?: string };

const EMPTY_PERSON: PersonView = { name: "", speaking: false, quality: "unknown", micOn: false, camOn: false, camTrack: null };

interface ShareState {
  kind: "file" | "screen";
  video: MediaStreamTrack;
  audio: MediaStreamTrack | null;
  /** Local copy of captured tab audio (so the host's movie slider works), or null. */
  localAudioCopy: MediaStreamTrack | null;
  pubs: LocalTrackPublication[];
  hint: ContentHint;
}

function qualityOf(q: ConnectionQuality): Quality {
  switch (q) {
    case ConnectionQuality.Excellent:
      return "excellent";
    case ConnectionQuality.Good:
      return "good";
    case ConnectionQuality.Poor:
      return "poor";
    case ConnectionQuality.Lost:
      return "lost";
    default:
      return "unknown";
  }
}

export class SessionController {
  private listeners = new Set<() => void>();
  private snap: Snapshot;
  private room: Room | null = null;
  readonly mixer: AudioMixer;
  /** The host's local file player. React mounts this element in the stage. */
  readonly fileVideo: HTMLVideoElement;
  private share: ShareState | null = null;
  private moviePub: LocalTrackPublication | RemoteTrackPublication | null = null;
  private disposed = false;
  private noticeSeq = 1;
  private identity = "";
  private statsTimer: ReturnType<typeof setInterval> | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private stats = new StatsReader();
  private badSamples = 0;
  private lastWarnAt = 0;
  private lastWeakSentAt = 0;
  private lastBy = "";
  private lastAction: PlayAction = "load";
  private fileName = "";
  private fileUrl: string | null = null;
  private playPresses = new Map<string, number>();
  private gestureHandler = () => void this.mixer.resume().then(() => this.checkAudio());

  constructor(
    private roomId: string,
    private creds: Creds,
  ) {
    const movie = store.get(KEYS.movieVolume, 1);
    const voice = store.get(KEYS.voiceVolume, 1);
    this.mixer = new AudioMixer({ movie, voice });

    this.fileVideo = document.createElement("video");
    this.fileVideo.playsInline = true;
    this.fileVideo.preload = "auto";
    this.fileVideo.className = "h-full w-full object-contain bg-black";
    this.bindFileEvents();

    this.snap = {
      phase: "connecting",
      fatal: null,
      role: creds.hostSecret ? "host" : "guest",
      self: { ...EMPTY_PERSON, name: creds.name },
      partner: null,
      movie: { kind: "none", track: null, owner: null, hasAudio: false },
      playback: null,
      movieVolume: movie,
      voiceVolume: voice,
      preset: store.get<PresetId>(KEYS.quality, DEFAULT_PRESET),
      contentHint: store.get<ContentHint>(KEYS.contentHint, "motion"),
      sourceWidth: null,
      stats: null,
      notices: [],
      heartTick: 0,
      audioBlocked: false,
    };
    window.addEventListener("pointerdown", this.gestureHandler);
    window.addEventListener("keydown", this.gestureHandler);
  }

  // ---------- external store plumbing ----------
  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  getSnapshot = () => this.snap;
  private set(patch: Partial<Snapshot>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((l) => l());
  }

  get isHost() {
    return this.snap.role === "host";
  }

  // ---------- notices ----------
  notify(kind: Notice["kind"], text: string, action?: Notice["action"], ttl = action ? 14000 : 6500) {
    const id = this.noticeSeq++;
    this.set({ notices: [...this.snap.notices.filter((n) => n.text !== text), { id, kind, text, action }] });
    setTimeout(() => this.dismiss(id), ttl);
  }
  dismiss = (id: number) => {
    if (this.snap.notices.some((n) => n.id === id)) this.set({ notices: this.snap.notices.filter((n) => n.id !== id) });
  };

  // ---------- connect / lifecycle ----------
  async connect() {
    this.set({ phase: "connecting", fatal: null });
    let grant;
    try {
      grant = await api.token(this.roomId, { ...this.creds, clientId: getClientId() });
    } catch (e) {
      if (this.disposed) return;
      const err = e instanceof ApiError ? e : new ApiError(0, "network", "");
      this.set({ phase: "disconnected", fatal: { code: err.code, message: this.errorText(err.code) } });
      return;
    }
    if (this.disposed) return;
    this.identity = grant.identity;
    this.set({ role: grant.role });

    const room = new Room({
      adaptiveStream: false, // never let the SDK downscale the shared content
      dynacast: false,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        deviceId: store.get<string | undefined>(KEYS.micId, undefined),
      },
      videoCaptureDefaults: {
        resolution: { ...CAMERA_CAPTURE },
        deviceId: store.get<string | undefined>(KEYS.camId, undefined),
      },
      publishDefaults: {
        simulcast: false,
        videoEncoding: { ...CAMERA_ENCODING },
        dtx: true,
        red: true,
      },
    });
    this.room = room;
    this.wire(room);

    try {
      await room.connect(grant.url, grant.token);
    } catch (e) {
      if (this.disposed) return;
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      const code = msg.includes("full") || msg.includes("max") ? "room_full" : "connect_failed";
      this.set({ phase: "disconnected", fatal: { code, message: this.errorText(code) } });
      return;
    }
    if (this.disposed) {
      void room.disconnect();
      return;
    }
    void this.mixer.resume().then(() => this.checkAudio());
    this.set({ phase: "connected" });
    this.startLoops();
    this.refresh();

    // Camera + mic always on at the start of a session (each can fail independently).
    await Promise.allSettled([this.enable("mic", true), this.enable("cam", true)]);
    if (!this.isHost) void this.send({ t: "hello" });
    // After a manual rejoin the host resumes whatever it was sharing.
    if (this.isHost && this.share) await this.publishShare().catch(() => undefined);
    this.refresh();
  }

  /** Called by "Rejoin" after a hard disconnect. */
  async rejoin() {
    this.teardownRoom();
    await this.connect();
  }

  async leave() {
    this.teardownRoom();
    this.set({ phase: "disconnected" });
  }

  async endRoomForEveryone() {
    if (!this.isHost || !this.creds.hostSecret) return;
    try {
      await api.endRoom(this.roomId, this.creds.hostSecret);
    } catch {
      this.notify("error", t("error.endFailed"));
      return;
    }
    this.teardownRoom();
    this.set({ phase: "ended" });
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener("pointerdown", this.gestureHandler);
    window.removeEventListener("keydown", this.gestureHandler);
    this.teardownRoom();
    this.stopTracks();
    if (this.fileUrl) URL.revokeObjectURL(this.fileUrl);
    this.fileVideo.removeAttribute("src");
    this.mixer.dispose();
    this.listeners.clear();
  }

  private teardownRoom() {
    if (this.statsTimer) clearInterval(this.statsTimer);
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.statsTimer = this.tickTimer = null;
    const room = this.room;
    this.room = null;
    this.moviePub = null;
    if (room) {
      room.removeAllListeners();
      void room.disconnect();
    }
    this.mixer.setVoiceTrack(null);
    if (!this.share || !this.share.video || this.share.video.readyState === "ended") this.share = null;
  }

  private stopTracks() {
    this.share?.video.stop();
    if (this.share?.kind === "screen") this.share.audio?.stop();
    this.share?.localAudioCopy?.stop();
    this.share = null;
  }

  private wire(room: Room) {
    const refresh = () => this.refresh();
    room
      .on(RoomEvent.ParticipantConnected, (p) => {
        refresh();
        if (this.isHost) {
          this.notify("info", t("toast.partnerJoined", { name: p.name || t("common.partner") }));
          void this.broadcastState();
        }
      })
      .on(RoomEvent.ParticipantDisconnected, (p) => {
        refresh();
        this.notify("info", t("toast.partnerLeft", { name: p.name || t("common.partner") }));
      })
      .on(RoomEvent.TrackSubscribed, refresh)
      .on(RoomEvent.TrackUnsubscribed, refresh)
      .on(RoomEvent.TrackMuted, refresh)
      .on(RoomEvent.TrackUnmuted, refresh)
      .on(RoomEvent.LocalTrackPublished, refresh)
      .on(RoomEvent.LocalTrackUnpublished, refresh)
      .on(RoomEvent.ActiveSpeakersChanged, refresh)
      .on(RoomEvent.ConnectionQualityChanged, refresh)
      .on(RoomEvent.ParticipantMetadataChanged, refresh)
      .on(RoomEvent.Reconnecting, () => this.set({ phase: "reconnecting" }))
      .on(RoomEvent.Reconnected, () => {
        this.set({ phase: "connected" });
        this.notify("info", t("toast.reconnected"));
        refresh();
        if (this.isHost) void this.broadcastState();
      })
      .on(RoomEvent.MediaDevicesError, (e) => this.notify("error", this.mediaErrorText(e)))
      .on(RoomEvent.DataReceived, (payload, participant) => this.onData(payload, participant))
      .on(RoomEvent.Disconnected, (reason) => {
        if (this.disposed || this.room !== room) return;
        if (reason === DisconnectReason.ROOM_DELETED) {
          this.set({ phase: "ended" });
        } else if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
          this.set({ phase: "ended" });
        } else if (reason !== DisconnectReason.CLIENT_INITIATED) {
          this.set({ phase: "disconnected", fatal: { code: "dropped", message: t("error.dropped") } });
        }
      });
  }

  private startLoops() {
    this.statsTimer = setInterval(() => void this.sampleStats(), 1000);
    // Lossy heartbeat so a partner's UI stays in sync even if an event was missed.
    this.tickTimer = setInterval(() => {
      if (this.isHost && this.share?.kind === "file") void this.send(this.stateMsg(), false);
    }, 1000);
  }

  // ---------- derive UI snapshot from the live room ----------
  private personFrom(p: Participant, fallback: string): PersonView {
    const cam = p.getTrackPublication(Track.Source.Camera);
    const mic = p.getTrackPublication(Track.Source.Microphone);
    return {
      name: p.name || fallback,
      speaking: p.isSpeaking,
      quality: qualityOf(p.connectionQuality),
      micOn: !!mic && !mic.isMuted,
      camOn: !!cam && !cam.isMuted && !!cam.track,
      camTrack: cam && !cam.isMuted ? (cam.track?.mediaStreamTrack ?? null) : null,
    };
  }

  private refresh() {
    const room = this.room;
    if (!room) return;
    const self = this.personFrom(room.localParticipant, this.creds.name);
    const remote: RemoteParticipant | undefined = [...room.remoteParticipants.values()][0];
    const partner = remote ? this.personFrom(remote, t("common.partner")) : null;

    // Partner voice -> mixer
    const voice = remote?.getTrackPublication(Track.Source.Microphone)?.track as RemoteTrack | undefined;
    this.mixer.setVoiceTrack(voice?.mediaStreamTrack ?? null);

    // Shared content
    let movie: Snapshot["movie"] = { kind: "none", track: null, owner: null, hasAudio: false };
    this.moviePub = null;
    if (this.isHost && this.share) {
      const s = this.share;
      movie = { kind: s.kind, track: s.kind === "screen" ? s.video : null, owner: "self", hasAudio: !!s.audio };
      this.moviePub = s.pubs.find((p) => p.source === Track.Source.ScreenShare) ?? null;
      this.mixer.setMovieTrack(s.localAudioCopy);
    } else if (remote) {
      const v = remote.getTrackPublication(Track.Source.ScreenShare);
      const a = remote.getTrackPublication(Track.Source.ScreenShareAudio);
      if (v?.track) {
        movie = {
          kind: v.trackName === TRACK_NAME_FILE ? "file" : "screen",
          track: v.track.mediaStreamTrack,
          owner: "partner",
          hasAudio: !!a?.track,
        };
        this.moviePub = v as RemoteTrackPublication;
      }
      this.mixer.setMovieTrack(a?.track?.mediaStreamTrack ?? null);
    }
    if (movie.kind === "none" && !this.isHost) this.set({ playback: null });
    this.set({ self, partner, movie });
  }

  // ---------- data channel ----------
  private async send(msg: Msg, reliable = true) {
    const lp = this.room?.localParticipant;
    if (!lp || this.snap.phase === "disconnected") return;
    try {
      await lp.publishData(encodeMsg(msg) as Uint8Array<ArrayBuffer>, { reliable, topic: DATA_TOPIC });
    } catch {
      /* transient; the next heartbeat repairs state */
    }
  }

  private onData(payload: Uint8Array, participant?: RemoteParticipant) {
    const m = decodeMsg(payload);
    if (!m) return;
    switch (m.t) {
      case "hello":
        if (this.isHost) void this.broadcastState();
        break;
      case "cmd":
        if (this.isHost) void this.applyCommand(m.a, m.time, m.by, participant?.identity ?? m.byId);
        break;
      case "state":
        if (!this.isHost) {
          this.set({
            playback: {
              playing: m.playing,
              time: m.time,
              duration: m.duration,
              by: m.by,
              action: m.action,
              fileName: m.fileName,
              at: performance.now(),
            },
          });
        }
        break;
      case "heart":
        this.set({ heartTick: this.snap.heartTick + 1 });
        break;
      case "weak":
        if (this.isHost) this.warnDegrade("partner");
        break;
    }
  }

  // ---------- playback (host-authoritative) ----------
  private stateMsg(): Extract<Msg, { t: "state" }> {
    const el = this.fileVideo;
    return {
      t: "state",
      playing: !el.paused && !el.ended,
      time: el.currentTime || 0,
      duration: Number.isFinite(el.duration) ? el.duration : 0,
      by: this.lastBy,
      action: this.lastAction,
      fileName: this.fileName,
    };
  }

  private publishLocalPlayback() {
    const m = this.stateMsg();
    this.set({ playback: { ...m, at: performance.now() } });
  }

  private async broadcastState() {
    if (!this.isHost || this.share?.kind !== "file") return;
    await this.send(this.stateMsg());
  }

  getCurrentTime(): number {
    if (this.isHost && this.share?.kind === "file") return this.fileVideo.currentTime || 0;
    const p = this.snap.playback;
    if (!p) return 0;
    const t0 = p.playing ? p.time + (performance.now() - p.at) / 1000 : p.time;
    return p.duration ? Math.min(t0, p.duration) : t0;
  }

  /** Either person calls these. The guest's go over the data channel; the host's apply directly. */
  play = () => this.command("play");
  pause = () => this.command("pause");
  seek = (time: number) => this.command("seek", time);
  seekBy = (delta: number) => {
    const d = this.snap.playback?.duration ?? (Number.isFinite(this.fileVideo.duration) ? this.fileVideo.duration : 0);
    this.command("seek", Math.max(0, Math.min(d || Infinity, this.getCurrentTime() + delta)));
  };
  togglePlay = () => (this.snap.playback?.playing ? this.pause() : this.play());

  private command(a: "play" | "pause" | "seek", time?: number) {
    if (this.snap.movie.kind !== "file") return;
    const me = this.snap.self.name;
    if (this.isHost) void this.applyCommand(a, time, me, this.identity);
    else void this.send({ t: "cmd", a, time, by: me, byId: this.identity });
  }

  private async applyCommand(a: "play" | "pause" | "seek", time: number | undefined, by: string, byId: string) {
    const el = this.fileVideo;
    if (this.share?.kind !== "file" || !el.src) return;
    this.lastBy = by;
    this.lastAction = a;

    if (a === "play") {
      // Playful: both of you pressing play within a few seconds earns a heart.
      const now = Date.now();
      for (const [id, ts] of this.playPresses) if (id !== byId && now - ts < 5000) this.heart();
      this.playPresses.set(byId, now);
      try {
        await this.mixer.resume();
        await el.play();
      } catch (e) {
        if (e instanceof DOMException && e.name === "NotAllowedError") this.notify("warn", t("error.autoplayBlocked"));
      }
    } else if (a === "pause") {
      el.pause();
    } else if (typeof time === "number" && Number.isFinite(time)) {
      el.currentTime = Math.max(0, Math.min(time, el.duration || time));
    }
    this.publishLocalPlayback();
    await this.broadcastState();
  }

  heart = () => {
    this.set({ heartTick: this.snap.heartTick + 1 });
    void this.send({ t: "heart" });
  };

  private bindFileEvents() {
    const el = this.fileVideo;
    const sync = () => {
      if (this.isHost && this.share?.kind === "file") this.publishLocalPlayback();
    };
    el.addEventListener("pause", sync);
    el.addEventListener("play", sync);
    el.addEventListener("seeked", sync);
    el.addEventListener("ended", () => {
      this.lastAction = "pause";
      sync();
      void this.broadcastState();
    });
  }

  // ---------- mic / camera ----------
  private async enable(kind: "mic" | "cam", on: boolean) {
    const lp = this.room?.localParticipant;
    if (!lp) return;
    try {
      if (kind === "mic") {
        await lp.setMicrophoneEnabled(on, on ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } : undefined);
      } else {
        await lp.setCameraEnabled(on, on ? { resolution: { ...CAMERA_CAPTURE } } : undefined, on ? { simulcast: false, videoEncoding: { ...CAMERA_ENCODING } } : undefined);
      }
    } catch (e) {
      this.notify("error", this.mediaErrorText(e));
    }
    this.refresh();
  }
  toggleMic = () => this.enable("mic", !this.room?.localParticipant.isMicrophoneEnabled);
  toggleCam = () => this.enable("cam", !this.room?.localParticipant.isCameraEnabled);

  async switchDevice(kind: "audioinput" | "videoinput" | "audiooutput", deviceId: string) {
    try {
      if (kind === "audiooutput") {
        await this.mixer.setSinkId(deviceId);
        store.set(KEYS.spkId, deviceId);
      } else {
        await this.room?.switchActiveDevice(kind, deviceId, true);
        store.set(kind === "audioinput" ? KEYS.micId : KEYS.camId, deviceId);
      }
    } catch (e) {
      this.notify("error", this.mediaErrorText(e));
    }
  }

  // ---------- volumes (local only) ----------
  setMovieVolume = (v: number) => {
    this.mixer.setMovieVolume(v);
    store.set(KEYS.movieVolume, v);
    this.set({ movieVolume: v });
  };
  setVoiceVolume = (v: number) => {
    this.mixer.setVoiceVolume(v);
    store.set(KEYS.voiceVolume, v);
    this.set({ voiceVolume: v });
  };
  private checkAudio() {
    this.set({ audioBlocked: !this.mixer.isRunning });
  }

  // ---------- sharing (host) ----------
  setContentHint = (hint: ContentHint) => {
    store.set(KEYS.contentHint, hint);
    this.set({ contentHint: hint });
  };

  async startScreenShare(hint: ContentHint = this.snap.contentHint) {
    if (!this.isHost || !this.room) return;
    if (!navigator.mediaDevices?.getDisplayMedia) {
      this.notify("error", t("error.shareUnsupported"));
      return;
    }
    const p = PRESETS[this.snap.preset];
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: p.width },
          height: { ideal: p.height },
          frameRate: { ideal: p.fps, max: p.fps },
          displaySurface: "browser",
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
          // Lets us mute the tab locally and play it through the movie slider instead.
          suppressLocalAudioPlayback: true,
        },
        preferCurrentTab: false,
        selfBrowserSurface: "exclude",
        surfaceSwitching: "include",
        systemAudio: "include",
      } as DisplayMediaStreamOptions);
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      this.notify(name === "NotAllowedError" ? "info" : "error", name === "NotAllowedError" ? t("error.shareCancelled") : t("error.shareFailed"));
      return;
    }
    await this.stopShare();
    const video = stream.getVideoTracks()[0];
    const audio = stream.getAudioTracks()[0] ?? null;
    video.contentHint = hint;
    if (!audio) this.notify("warn", t("error.noTabAudio"), undefined, 12000);

    // If the browser really muted the tab locally, give the host a slider-controlled copy.
    let localAudioCopy: MediaStreamTrack | null = null;
    if (audio && (audio.getSettings() as { suppressLocalAudioPlayback?: boolean }).suppressLocalAudioPlayback) {
      localAudioCopy = audio.clone();
    }

    video.addEventListener("ended", () => {
      if (this.share?.video === video) void this.stopShare(true);
    });
    this.share = { kind: "screen", video, audio, localAudioCopy, pubs: [], hint };
    this.lastBy = this.snap.self.name;
    await this.publishShare();
  }

  async loadFile(file: File) {
    if (!this.isHost || !this.room) return;
    const el = this.fileVideo;
    if (!(el as HTMLVideoElement & { captureStream?: unknown }).captureStream) {
      this.notify("error", t("error.captureUnsupported"));
      return;
    }
    if (file.type && !file.type.startsWith("video/") && !/\.(mkv|mov|mp4|m4v|webm)$/i.test(file.name)) {
      this.notify("error", t("error.notVideo"));
      return;
    }
    await this.stopShare();
    if (this.fileUrl) URL.revokeObjectURL(this.fileUrl);
    this.fileUrl = URL.createObjectURL(file);
    this.fileName = file.name;
    el.src = this.fileUrl;
    el.load();

    const ok = await new Promise<boolean>((resolve) => {
      const done = (v: boolean) => {
        el.removeEventListener("loadedmetadata", onOk);
        el.removeEventListener("error", onErr);
        clearTimeout(timer);
        resolve(v);
      };
      const onOk = () => done(true);
      const onErr = () => done(false);
      const timer = setTimeout(() => done(false), 15000);
      el.addEventListener("loadedmetadata", onOk);
      el.addEventListener("error", onErr);
    });
    if (!ok || !el.videoWidth) {
      this.notify("error", t("error.fileUnplayable", { name: file.name }), undefined, 12000);
      el.removeAttribute("src");
      this.fileName = "";
      return;
    }

    await this.mixer.resume();
    const audio = this.mixer.attachFileElement(el);
    const cap = (el as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream();
    let video = cap.getVideoTracks()[0];
    if (!video) {
      await new Promise((r) => setTimeout(r, 300));
      video = cap.getVideoTracks()[0];
    }
    if (!video) {
      this.notify("error", t("error.captureUnsupported"));
      return;
    }
    video.contentHint = "motion";
    // Nudge the decoder so a first frame exists before anyone presses play.
    try {
      el.currentTime = Math.min(0.05, el.duration || 0.05);
    } catch {
      /* ignore */
    }

    this.lastBy = this.snap.self.name;
    this.lastAction = "load";
    this.share = { kind: "file", video, audio, localAudioCopy: null, pubs: [], hint: "motion" };
    await this.publishShare();
    this.publishLocalPlayback();
    await this.broadcastState();
  }

  private async publishShare() {
    const room = this.room;
    const s = this.share;
    if (!room || !s) return;
    const lp = room.localParticipant;
    const p = PRESETS[this.snap.preset];
    const vOpts: TrackPublishOptions = {
      source: Track.Source.ScreenShare,
      name: s.kind === "file" ? TRACK_NAME_FILE : TRACK_NAME_SCREEN,
      stream: "movie",
      simulcast: false, // one high-bitrate layer beats three small ones for shared content
      videoEncoding: { maxBitrate: p.bitrate, maxFramerate: p.fps },
      degradationPreference: s.hint === "motion" ? "maintain-framerate" : "maintain-resolution",
    };
    try {
      s.pubs = [];
      s.pubs.push(await lp.publishTrack(s.video, vOpts));
      if (s.audio) {
        s.pubs.push(
          await lp.publishTrack(s.audio, {
            source: Track.Source.ScreenShareAudio,
            name: "movie-audio",
            stream: "movie",
            audioPreset: AudioPresets.musicHighQualityStereo,
            dtx: false,
            red: false,
            forceStereo: true,
          }),
        );
      }
    } catch {
      this.notify("error", t("error.publishFailed"));
      return;
    }
    const w = s.video.getSettings().width ?? null;
    this.set({ sourceWidth: w });
    this.stats.reset();
    if (!isPresetAvailable(this.snap.preset, w)) await this.setPreset("1080p30");
    else await this.setPreset(this.snap.preset);
    this.refresh();
  }

  async stopShare(userInitiated = false) {
    const s = this.share;
    if (!s) return;
    this.share = null;
    const lp = this.room?.localParticipant;
    for (const pub of s.pubs) {
      if (pub.track && lp) await lp.unpublishTrack(pub.track, false).catch(() => undefined);
    }
    s.video.stop();
    if (s.kind === "screen") s.audio?.stop(); // the file's audio track is long-lived; keep it
    s.localAudioCopy?.stop();
    if (s.kind === "file") this.fileVideo.pause();
    this.mixer.setMovieTrack(null);
    this.set({ playback: null, sourceWidth: null, stats: null });
    this.refresh();
    if (userInitiated) this.notify("info", t("toast.shareStopped"));
  }

  // ---------- quality ----------
  async setPreset(id: PresetId) {
    store.set(KEYS.quality, id);
    this.set({ preset: id });
    const s = this.share;
    if (!s) return;
    const p = PRESETS[id];
    if (s.kind === "screen") {
      await s.video.applyConstraints({ width: { ideal: p.width }, height: { ideal: p.height }, frameRate: { ideal: p.fps, max: p.fps } }).catch(() => undefined);
    }
    const w = s.video.getSettings().width ?? this.snap.sourceWidth;
    const track = s.pubs.find((x) => x.source === Track.Source.ScreenShare)?.track as LocalVideoTrack | undefined;
    try {
      await applyPresetToSender(track?.sender, p, w ?? null);
    } catch {
      this.notify("warn", t("error.qualityNotApplied"));
    }
    this.stats.reset();
    this.set({ sourceWidth: w ?? null });
  }

  // ---------- stats + warnings ----------
  private async sampleStats() {
    const pub = this.moviePub;
    const track = pub?.track;
    if (!track || !this.room) {
      if (this.snap.stats) this.set({ stats: null });
      return;
    }
    let sample: StatsSample | null = null;
    try {
      if (this.isHost) sample = await this.stats.read((track as LocalVideoTrack).sender, "send");
      else sample = await this.stats.read((track as RemoteTrack & { receiver?: RTCRtpReceiver }).receiver, "recv");
    } catch {
      return;
    }
    if (!sample) return;
    this.set({ stats: sample });

    const struggling = sample.lossPct > 5 || (this.isHost && sample.limited === "bandwidth");
    this.badSamples = struggling ? this.badSamples + 1 : 0;
    if (this.badSamples >= 5) {
      this.badSamples = 0;
      if (this.isHost) this.warnDegrade("self");
      else if (Date.now() - this.lastWeakSentAt > 30000) {
        this.lastWeakSentAt = Date.now();
        this.notify("warn", t("warn.yourConnection"));
        void this.send({ t: "weak" });
      }
    }
  }

  private warnDegrade(who: "self" | "partner") {
    if (Date.now() - this.lastWarnAt < 60000) return;
    this.lastWarnAt = Date.now();
    const canLower = this.snap.preset !== "720p30";
    this.notify(
      "warn",
      who === "self" ? t("warn.hostConnection") : t("warn.partnerConnection"),
      canLower ? { label: t("warn.lower"), run: () => void this.setPreset("720p30") } : undefined,
    );
  }

  // ---------- text helpers ----------
  private errorText(code: string) {
    switch (code) {
      case "wrong_password":
        return t("error.wrongPassword");
      case "room_full":
        return t("error.roomFull");
      case "room_not_found":
        return t("error.roomNotFound");
      case "too_many_attempts":
        return t("error.tooManyAttempts");
      case "network":
        return t("error.network");
      case "bad_host_secret":
        return t("error.badHostKey");
      default:
        return t("error.connectFailed");
    }
  }

  private mediaErrorText(e: unknown) {
    const name = e instanceof Error ? e.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") return t("error.mediaDenied");
    if (name === "NotFoundError" || name === "OverconstrainedError") return t("error.noDevice");
    if (name === "NotReadableError") return t("error.deviceBusy");
    return t("error.mediaGeneric");
  }

  get connectionState() {
    return this.room?.state ?? ConnectionState.Disconnected;
  }
}
