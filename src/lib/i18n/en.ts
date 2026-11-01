/**
 * Every user-facing string in JoyWatch lives here.
 * Placeholders look like {name}. To translate, copy this file (e.g. ar-EG.ts),
 * translate the values, and register it in ./index.ts.
 */
export const en = {
  // app
  "app.name": "JoyWatch",
  "app.description": "A cozy, private place to watch something together while you're apart.",

  // common
  "common.dismiss": "Dismiss",
  "common.close": "Close",
  "common.partner": "Your partner",
  "common.roomPassword": "Room password",
  "common.youSuffix": "(you)",
  "common.yourName": "Your name",

  // wall decoration
  "decor.quote": "Everything is beautiful in its time",
  "decor.jerseyLabel": "Framed red football shirt: JOY.E, number 22",

  // landing
  "landing.badge": "Movie night, long distance ♥",
  "landing.title": "Watch together, even when you're apart.",
  "landing.subtitle": "Share a tab or play a movie from your computer. See each other's faces, hear each other, and keep the volume just how you like it.",
  "landing.createTitle": "Start a room",
  "landing.createHint": "You'll get a link and a password to send to your person.",
  "landing.namePlaceholder": "What should we call you?",
  "landing.nameRequired": "Please tell us your name.",
  "landing.passwordHint": "Share it with your partner. You can change it to anything you like.",
  "landing.passwordShort": "The password needs at least 4 characters.",
  "landing.shuffle": "Suggest another password",
  "landing.createCta": "Create room",
  "landing.creating": "Creating…",
  "landing.createFailed": "We couldn't create the room. Please try again.",
  "landing.joinTitle": "Join a room",
  "landing.joinHint": "Got a link from your partner? Paste it here.",
  "landing.linkLabel": "Room link",
  "landing.joinCta": "Continue",
  "landing.badLink": "That doesn't look like a JoyWatch room link.",
  "landing.feature1": "Share a Chrome tab, or play a file that never leaves your computer",
  "landing.feature2": "Little floating faces you can drag anywhere",
  "landing.feature3": "Separate movie and voice volume, just for you",
  "landing.footer": "Private by design: two people, no accounts, no uploads.",

  // gate
  "gate.checking": "Checking the room…",
  "gate.hostTitle": "Welcome back, host",
  "gate.hostHint": "You created this room, so you can walk right in.",
  "gate.guestTitle": "Join the room",
  "gate.guestHint": "Enter the password your partner gave you.",
  "gate.enterHost": "Enter room",
  "gate.enterGuest": "Join",
  "gate.nameRequired": "Please enter a display name.",
  "gate.passwordRequired": "Please enter the room password.",
  "gate.permissionNote": "Your browser will ask for camera and microphone access.",
  "gate.unsupportedTitle": "This browser can't do video calls",
  "gate.unsupportedBody": "Please open this link in a recent version of Chrome, Edge or Firefox.",
  "gate.missingTitle": "Room not found",
  "gate.missingBody": "This room doesn't exist or has ended. Ask your partner for a fresh link.",
  "gate.makeNew": "Start a new room",

  // room chrome
  "room.pageTitle": "Watching together",
  "room.joining": "Joining the room…",
  "room.waitingPartner": "Waiting for your partner…",
  "room.reconnecting": "Connection hiccup, reconnecting…",
  "room.enableSound": "Tap to enable sound",
  "room.disconnectedTitle": "You got disconnected",
  "room.rejoin": "Rejoin",
  "room.home": "Back to start",
  "room.endedTitle": "The room has ended",
  "room.endedHost": "Thanks for watching together. See you next movie night!",
  "room.endedGuest": "The host ended the room. See you next time!",

  // controls
  "ctl.muteMic": "Mute microphone",
  "ctl.unmuteMic": "Unmute microphone",
  "ctl.camOff": "Turn camera off",
  "ctl.camOn": "Turn camera on",
  "ctl.hideBubbles": "Hide face bubbles",
  "ctl.showBubbles": "Show face bubbles",
  "ctl.volume": "Volume",
  "ctl.share": "Share or play something",
  "ctl.quality": "Video quality",
  "ctl.devices": "Camera, mic & speakers",
  "ctl.invite": "Invite your partner",
  "ctl.stats": "Connection stats",
  "ctl.fullscreen": "Fullscreen",
  "ctl.exitFullscreen": "Exit fullscreen",
  "ctl.leave": "Leave room",
  "ctl.endRoom": "Leave or end room",
  "end.confirm": "End the room for both of you, or just leave?",
  "end.yes": "End for everyone",
  "end.justLeave": "Just leave",

  // bubbles
  "bubble.you": "You",
  "bubble.muted": "Microphone is off",

  // stage
  "stage.hostTitle": "What are we watching?",
  "stage.hostReady": "{name} is here and ready.",
  "stage.hostAlone": "No need to wait for your partner. Pick something and try it out now; invite them whenever you're ready.",
  "stage.shareTab": "Share a tab or window",
  "stage.shareTabHint": "Great for YouTube and other sites. Choose “Chrome Tab” and tick “Also share tab audio”.",
  "stage.playFile": "Play a video file",
  "stage.playFileHint": "mp4, mov, mkv… It plays on your computer and streams to your partner; nothing is uploaded.",
  "stage.dropHint": "Tip: you can also drag a video file onto this window.",
  "stage.dropNow": "Drop it to start watching",
  "stage.guestTitle": "Get comfy",
  "stage.guestWaiting": "{name} will pick something to watch in a moment.",
  "stage.guestNoHost": "Waiting for the host to arrive…",
  "stage.youAreSharing": "You're sharing. Your partner sees what you share.",

  // sharing
  "share.tab": "Share a tab or window",
  "share.switchSource": "Switch to another tab or window",
  "share.tabHint": "Pick “Chrome Tab” and tick “Also share tab audio”.",
  "share.tooltip": "Recommended: Chrome tab + share tab audio",
  "share.macNote": "On a Mac, browsers can only share audio from a Chrome tab, not from the whole screen or other apps.",
  "share.contentType": "What are you sharing?",
  "share.motion": "A movie or video (smooth motion)",
  "share.detail": "Text, slides or a website (sharp detail)",
  "share.file": "Play a video file",
  "share.swapFile": "Swap to a different file",
  "share.fileHint": "Streams straight from your computer.",
  "share.stop": "Stop sharing",

  // playback
  "playback.play": "Play",
  "playback.pause": "Pause",
  "playback.seek": "Seek",
  "playback.heart": "Send a heart",
  "playback.paused": "{name} paused",
  "playback.played": "{name} pressed play",
  "playback.seeked": "{name} skipped ahead",
  "playback.loaded": "{name} picked this one",

  // volume
  "volume.movie": "Movie volume",
  "volume.movieHint": "Shared screen or file audio",
  "volume.voice": "Partner's voice",
  "volume.voiceHint": "How loud your partner sounds",
  "volume.onlyYou": "These only change what you hear. Your partner keeps their own levels.",
  "volume.mute": "Mute",
  "volume.unmute": "Unmute",

  // quality
  "quality.title": "Quality for your partner",
  "quality.720p30": "720p · 30 fps",
  "quality.1080p30": "1080p · 30 fps",
  "quality.1080p60": "1080p · 60 fps",
  "quality.4k30": "4K · 30 fps",
  "quality.needs4k": "Needs a 4K source",
  "quality.hint": "Applies live. Higher presets need a faster upload connection.",
  "quality.noSource": "Pick a quality now; it's used when you start sharing.",

  // stats
  "stats.label": "Live video stats",
  "stats.fps": "fps",
  "stats.mbps": "Mbps",
  "stats.loss": "loss",
  "stats.ms": "ms",
  "stats.waiting": "Waiting for video…",

  // connection quality
  "conn.excellent": "Excellent connection",
  "conn.good": "Good connection",
  "conn.poor": "Weak connection",
  "conn.lost": "Connection lost",
  "conn.unknown": "Connecting",

  // devices
  "devices.camera": "Camera",
  "devices.mic": "Microphone",
  "devices.speakers": "Speakers",
  "devices.default": "System default",
  "devices.speakersUnsupported": "Not supported in this browser",

  // invite
  "invite.title": "Invite your person",
  "invite.hint": "Send them the link and the password.",
  "invite.link": "Room link",
  "invite.copyLink": "Copy link",
  "invite.copyPassword": "Copy password",
  "invite.copyAll": "Copy invite message",
  "invite.copied": "Copied!",
  "invite.message": "Join me on JoyWatch ♥\nLink: {link}\nPassword: {password}",

  // tips + toasts
  "tip.headphones": "Tip: headphones give the best sound.",
  "tip.gotIt": "Got it",
  "toast.partnerJoined": "{name} joined",
  "toast.partnerLeft": "{name} left",
  "toast.reconnected": "Back online",
  "toast.shareStopped": "Stopped sharing",

  // warnings
  "warn.hostConnection": "Your upload is struggling, so your partner's picture may stutter. Try a lower quality.",
  "warn.partnerConnection": "Your partner's connection is struggling. A lower quality may help.",
  "warn.yourConnection": "Your connection looks weak. The picture may stutter. The host can lower the quality.",
  "warn.lower": "Switch to 720p",

  // errors
  "error.network": "Can't reach the server. Check your internet connection.",
  "error.wrongPassword": "That password doesn't match. Please check it with your partner.",
  "error.roomFull": "This room already has two people in it.",
  "error.roomNotFound": "This room doesn't exist or has ended.",
  "error.tooManyAttempts": "Too many wrong passwords. Please wait a few minutes and try again.",
  "error.badHostKey": "This browser isn't recognised as the host of this room.",
  "error.livekitAuth": "The server's LiveKit key or secret is wrong, so calls can't start. The site owner needs to re-enter the LiveKit API key and secret.",
  "error.livekitUnreachable": "The server can't reach LiveKit. The site owner needs to check the LiveKit URL.",
  "error.connectFailed": "Couldn't connect to the call. Please try again.",
  "error.dropped": "The connection dropped and couldn't be restored.",
  "error.endFailed": "Couldn't end the room. Please try again.",
  "error.mediaDenied": "Camera or microphone access was blocked. Allow it from the lock icon in the address bar, then try again.",
  "error.noDevice": "No camera or microphone was found.",
  "error.deviceBusy": "Your camera or microphone is being used by another app.",
  "error.mediaGeneric": "Something went wrong with your camera or microphone.",
  "error.shareUnsupported": "This browser can't share a screen. Use Chrome or Edge on a computer.",
  "error.shareCancelled": "Sharing was cancelled.",
  "error.shareFailed": "Couldn't start sharing. Please try again.",
  "error.noTabAudio": "No audio is being shared. Choose “Chrome Tab” and tick “Also share tab audio” so your partner can hear it.",
  "error.captureUnsupported": "This browser can't stream a video file. Use Chrome or Edge.",
  "error.notVideo": "That doesn't look like a video file.",
  "error.fileUnplayable": "Your browser can't play “{name}”. Try an mp4 (H.264), or another file.",
  "error.publishFailed": "Couldn't send the video to your partner. Please try again.",
  "error.qualityNotApplied": "Couldn't change the quality live. It will apply next time you share.",
  "error.autoplayBlocked": "Your browser blocked playback. Click anywhere on the page and try again.",
} as const;

export type MessageKey = keyof typeof en;
