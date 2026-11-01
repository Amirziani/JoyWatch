# JoyWatch ♥

A private, cozy watch-together app for two people in different cities.
The host shares a Chrome tab **or** plays a local video file; both of you see it in high quality,
see each other in small floating bubbles, and each control the **movie volume** and the
**partner's voice volume** separately.

- **Stack:** Next.js (App Router) · TypeScript · Tailwind · LiveKit (WebRTC + TURN) · Upstash Redis / Vercel KV
- **Cost:** ~$0/month for two users (LiveKit Cloud free tier, Upstash free tier, Vercel Hobby)
- **Privacy:** no accounts; passwords are bcrypt-hashed server-side; local video files are never uploaded.

---

## 1. Setup

### LiveKit Cloud
1. Create a free project at <https://cloud.livekit.io>.
2. **Settings → Keys → Create key.** You need three values:
   `LIVEKIT_URL` (looks like `wss://your-project.livekit.cloud`), `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.

### Room storage (Upstash Redis, a.k.a. Vercel KV)
Option A (easiest, on Vercel): *Project → Storage → Create → Upstash for Redis (free)*. Vercel injects
`KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
Option B: create a database at <https://console.upstash.com> and copy the **REST** URL + token.
(`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` also work.)

### Local development
```bash
cp .env.example .env.local   # fill in the values above
npm install
npm run dev                  # http://localhost:3000
```
Without KV credentials, `npm run dev` falls back to an in-memory store (rooms vanish on restart).
Use two different browser profiles (or one normal + one incognito) to be both people.
`localhost` counts as a secure context, so camera and mic work.

### Tests / checks
```bash
npm run typecheck && npm run lint && npm test
```

## 2. Deploy to Vercel
1. Push this repo to GitHub.
2. <https://vercel.com/new> → import the repo (framework: Next.js, nothing to change).
3. Add the environment variables: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
   (+ `KV_REST_API_URL`, `KV_REST_API_TOKEN` — added automatically if you connected the Upstash integration).
4. Deploy. Your URL is `https://<project>.vercel.app`. HTTPS is required for camera/mic/screen capture and Vercel provides it.

## 3. How to use
1. **Host:** open the site → enter your name → **Create room**. Send your partner the link and password (Invite button → *Copy invite message*).
2. **Partner:** opens the link, enters the password and a display name.
3. **Host** picks what to watch:
   - **Share a tab or window** — choose *Chrome Tab* and tick **Also share tab audio**. (macOS browsers can only capture audio from a Chrome tab, not the whole system.)
   - **Play a video file** — pick or drag in an mp4/mov/mkv. It plays on the host's computer and streams to the partner.
4. **Either person** can play, pause and seek a local file. The progress bar is shared and shows who paused.
5. Each person has their own **Movie volume** and **Partner's voice** sliders (speaker icon). They only change what *you* hear.
6. The host can change **quality** live (720p30 · 1080p30 · 1080p60 · 4K30 when the source is 4K).

### Keyboard shortcuts
`Space` play/pause · `M` mute · `V` camera · `B` bubbles · `F` fullscreen · `←`/`→` seek 10 s

## 4. Architecture
```
src/
  app/                      Next.js routes (pages + API)
    api/rooms/…             create room · exists/end room · issue LiveKit token
  lib/
    server/
      auth/password.ts      bcrypt hashing + host capability secret   (auth)
      rooms/                RoomService interface + Upstash + memory  (room data)
      roomLogic.ts          create / authorize / end / rate limit     (room rules)
      livekit.ts            token minting, 2-person limit             (media server)
    client/
      session.ts            SessionController: LiveKit room, sharing, playback sync, stats
      useSession.ts         React binding (useSyncExternalStore)
    media/
      audioMixer.ts         Web Audio: separate GainNode per source
      quality.ts            presets → resolution / fps / max bitrate
      stats.ts              live resolution / fps / bitrate / loss
    protocol.ts             data-channel messages (play / pause / seek / state)
    i18n/                   ALL UI strings (en.ts) + locale/RTL plumbing
  components/               UI
```
**Adding accounts / many rooms / paid plans later:** auth lives in `server/auth`, persistence behind
`RoomService` (`ownerId` and `plan` fields are already reserved on `RoomRecord`), and the token route is the
only place that decides who may enter a LiveKit room — so these can be added without touching the media code.

**Adding Egyptian Arabic (RTL):** copy `src/lib/i18n/en.ts` to `ar-EG.ts`, translate, register it in
`src/lib/i18n/index.ts` with `dir: "rtl"`. The layout already uses logical Tailwind properties (`ms-`, `ps-`, `start-`…)
and media timelines are pinned LTR.

### Audio design
- Partner voice and the movie audio each pass through their own `GainNode` on the listener's machine, so sliders never affect the other person.
- For a local file, the `<video>` is routed through Web Audio and tapped **before** the host's movie gain into a `MediaStreamAudioDestinationNode`; that track is what gets published. The host's slider therefore changes only what the host hears.
- For a tab share the host's tab is muted locally (`suppressLocalAudioPlayback`) and a copy is played through the same movie slider, when the browser supports it.
- Mics use `echoCancellation`, `noiseSuppression`, `autoGainControl`; a one-time tip recommends headphones.

### Video design
- Simulcast is off for shared content; one explicit high-bitrate layer is published (`maxBitrate`/`maxFramerate` per preset), adaptive stream/dynacast are off so the SDK never downscales it.
- `contentHint = "motion"` for movies and files, `"detail"` for text/slides (selectable when sharing).
- Presets are re-applied live to the RTP sender (`RTCRtpSender.setParameters`), no re-prompt for screen capture.
- Camera bubbles are 480×360 @ 24 fps at ≤350 kbps.

## 5. Known limits
- DRM services (Netflix, Disney+, …) capture as black. Out of scope.
- macOS: tab audio only, no system audio.
- `captureStream()` for local files needs Chrome/Edge/Firefox; Safari is best-effort. The browser must be able to *decode* the file (mkv support varies — H.264/AAC mp4 is safest).
- Max 2 participants per room (enforced server-side by LiveKit `maxParticipants`).
