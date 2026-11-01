export interface BrowserSupport {
  ok: boolean;
  canShareScreen: boolean;
  canCaptureFile: boolean;
}

export function checkBrowser(): BrowserSupport {
  const w = window as unknown as Record<string, unknown>;
  const ok =
    typeof w.RTCPeerConnection === "function" &&
    !!navigator.mediaDevices?.getUserMedia &&
    (typeof w.AudioContext === "function" || typeof w.webkitAudioContext === "function");
  return {
    ok,
    canShareScreen: !!navigator.mediaDevices?.getDisplayMedia,
    canCaptureFile: "captureStream" in HTMLVideoElement.prototype,
  };
}

export const isMac = () => /Mac/i.test(navigator.platform || navigator.userAgent);
