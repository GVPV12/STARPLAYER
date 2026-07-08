/**
 * Wraps a single Web Audio `AnalyserNode` around the app's `<audio>` element
 * so the beat visualizer can read real frequency data. `createMediaElementSource`
 * can only be called once per element, so this is a one-time singleton wired
 * up alongside the HTML5 audio backend.
 *
 * Relies on the `<audio>` element being created with `crossOrigin = "anonymous"`
 * (see audioBackend.ts) — without it, Tauri's asset:// protocol loads in
 * no-cors mode and the browser taints the element, so this analyser would
 * silently read all zeros forever regardless of what's playing. If that ever
 * regresses, `getFrequencyData()` still degrades gracefully (returns 0-filled
 * data) and the caller falls back to a simulated pattern instead of crashing.
 */

let audioContext: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let frequencyBuffer: Uint8Array<ArrayBuffer> | null = null;

export function connectAnalyser(audioEl: HTMLAudioElement): AnalyserNode {
  if (analyserNode) return analyserNode;

  audioContext = new AudioContext();
  const source = audioContext.createMediaElementSource(audioEl);
  analyserNode = audioContext.createAnalyser();
  // 1024 gives ~43Hz per bin (at a 44.1kHz sample rate) instead of ~344Hz at
  // the previous fftSize of 128 — fine enough resolution to isolate the
  // kick-drum band from the rest of the mix. Cost is still negligible (512
  // bins, read once per animation frame).
  analyserNode.fftSize = 1024;
  // Lower than the default (0.8) so bass transients aren't smeared across
  // frames — beat detection needs the spike, not an averaged blur of it.
  analyserNode.smoothingTimeConstant = 0.5;
  frequencyBuffer = new Uint8Array(new ArrayBuffer(analyserNode.frequencyBinCount));

  source.connect(analyserNode);
  analyserNode.connect(audioContext.destination);

  return analyserNode;
}

/** Resumes the underlying AudioContext — browsers require a user gesture first. */
export function resumeAudioContext(): void {
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume().catch(() => {
      // Non-critical: worst case the visualizer stays on its simulated fallback.
    });
  }
}

export function getFrequencyData(): Uint8Array | null {
  if (!analyserNode || !frequencyBuffer) return null;
  analyserNode.getByteFrequencyData(frequencyBuffer);
  return frequencyBuffer;
}
