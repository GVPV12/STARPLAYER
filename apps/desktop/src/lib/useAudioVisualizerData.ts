import { useEffect, useRef, useState } from "react";
import { getFrequencyData } from "./audioAnalyser.js";

export interface VisualizerData {
  frequencyData: Uint8Array | null;
  /** 0-1 normalized loudness, weighted toward the lower/bass bins for a "beat" feel. */
  energy: number;
  /** 0-1 — jumps to 1 the instant a beat is detected, then decays back to 0. Drives the visualizer's pulse. */
  beatPulse: number;
}

/** How long real audio data must read as silent (while supposedly playing) before we
 *  assume the analyser is CORS-tainted and switch to a simulated pattern instead of
 *  just leaving the visualizer blank. */
const SILENCE_ENERGY_THRESHOLD = 0.015;
const SILENT_FRAMES_BEFORE_FALLBACK = 45;
const SIMULATED_BIN_COUNT = 64;
const SIMULATED_BEAT_INTERVAL_MS = 500; // ~120 simulated BPM

/**
 * Lightweight onset detection: keep a short rolling average of bass-band
 * energy, and flag a "beat" whenever the current sample spikes well above
 * that average (a sudden kick/snare-style transient). No FFT beyond what the
 * AnalyserNode already gives us, no extra dependency — just a small ring
 * buffer and a few comparisons per frame.
 */
const BEAT_HISTORY_SIZE = 30; // ~0.5s of frames
const BEAT_THRESHOLD_MULTIPLIER = 1.25;
const BEAT_MIN_ENERGY = 0.12;
const BEAT_MIN_INTERVAL_MS = 220; // caps detection at ~270 BPM so it can't double-trigger per hit
const BEAT_PULSE_DECAY_PER_MS = 1 / 220;

/** Bin range (fftSize 1024 → ~43Hz/bin) covering roughly 45–650Hz — the
 *  kick-drum fundamental + first harmonics, skipping bin 0 (DC). Averaging
 *  the full spectrum instead would blend in snare/hi-hat/vocal energy and
 *  blur out the transient the onset detector needs to lock onto. */
const BASS_BIN_START = 1;
const BASS_BIN_END = 16;

/** Bars/dots/ring/wave read the first N entries of `frequencyData` directly
 *  (no resampling of their own) to draw across the full spectrum, so they
 *  need a buffer with the same bin count the visuals were designed around —
 *  independent of whatever resolution the analyser uses internally for beat
 *  detection. 64 matches the analyser's old fftSize (128) so their look is
 *  unchanged even though the analyser itself now runs at a much finer 1024. */
const VISUAL_BIN_COUNT = 64;

function downsampleForDisplay(source: Uint8Array): Uint8Array {
  const out = new Uint8Array(VISUAL_BIN_COUNT);
  const bandSize = source.length / VISUAL_BIN_COUNT;
  for (let i = 0; i < VISUAL_BIN_COUNT; i += 1) {
    const start = Math.floor(i * bandSize);
    const end = Math.max(start + 1, Math.floor((i + 1) * bandSize));
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += source[j]!;
    out[i] = Math.round(sum / (end - start));
  }
  return out;
}

/** Polls the shared analyser via rAF while `active` is true; idle (and cheap) otherwise. */
export function useAudioVisualizerData(active: boolean): VisualizerData {
  const [data, setData] = useState<VisualizerData>({ frequencyData: null, energy: 0, beatPulse: 0 });
  const frameRef = useRef<number | undefined>(undefined);
  const silentFrameCountRef = useRef(0);
  const useSimulatedRef = useRef(false);
  const simulatedClockRef = useRef(0);
  const bassHistoryRef = useRef<number[]>([]);
  const lastBeatAtRef = useRef(0);
  const nextSimulatedBeatAtRef = useRef(0);
  const beatPulseRef = useRef(0);
  const lastFrameAtRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setData({ frequencyData: null, energy: 0, beatPulse: 0 });
      silentFrameCountRef.current = 0;
      useSimulatedRef.current = false;
      bassHistoryRef.current = [];
      beatPulseRef.current = 0;
      lastBeatAtRef.current = 0;
      nextSimulatedBeatAtRef.current = 0;
      lastFrameAtRef.current = 0;
      return;
    }

    function decayPulse(now: number) {
      const elapsedMs = lastFrameAtRef.current ? now - lastFrameAtRef.current : 16;
      beatPulseRef.current = Math.max(0, beatPulseRef.current - elapsedMs * BEAT_PULSE_DECAY_PER_MS);
      lastFrameAtRef.current = now;
    }

    function tick(now: number) {
      const realData = getFrequencyData();
      let energy = 0;
      if (realData) {
        const end = Math.min(realData.length, BASS_BIN_END);
        let sum = 0;
        let count = 0;
        for (let i = BASS_BIN_START; i < end; i += 1) {
          sum += realData[i]!;
          count += 1;
        }
        energy = count > 0 ? sum / count / 255 : 0;
      }

      if (!useSimulatedRef.current) {
        silentFrameCountRef.current = energy < SILENCE_ENERGY_THRESHOLD ? silentFrameCountRef.current + 1 : 0;
        if (silentFrameCountRef.current > SILENT_FRAMES_BEFORE_FALLBACK) {
          // Real analyser data has stayed silent for ~0.75s of active playback —
          // most likely the audio source is CORS-tainted. Fall back to a
          // simulated pattern so the visualizer never just looks broken/blank.
          useSimulatedRef.current = true;
        }
      }

      if (useSimulatedRef.current) {
        simulatedClockRef.current += 0.045;
        const t = simulatedClockRef.current;
        const simulated = new Uint8Array(SIMULATED_BIN_COUNT);
        for (let i = 0; i < SIMULATED_BIN_COUNT; i += 1) {
          const wave = Math.sin(t * 1.7 + i * 0.35) * 0.5 + Math.sin(t * 0.6 + i * 0.12) * 0.3 + 0.5;
          simulated[i] = Math.max(0, Math.min(255, Math.round(wave * 190)));
        }
        const simulatedEnergy = Math.max(0, Math.min(1, 0.35 + Math.sin(t * 0.9) * 0.15));

        if (now >= nextSimulatedBeatAtRef.current) {
          beatPulseRef.current = 1;
          nextSimulatedBeatAtRef.current = now + SIMULATED_BEAT_INTERVAL_MS;
        } else {
          decayPulse(now);
        }

        setData({ frequencyData: simulated, energy: simulatedEnergy, beatPulse: beatPulseRef.current });
      } else if (realData) {
        const history = bassHistoryRef.current;
        const localAverage = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : energy;

        if (
          energy > BEAT_MIN_ENERGY &&
          energy > localAverage * BEAT_THRESHOLD_MULTIPLIER &&
          now - lastBeatAtRef.current > BEAT_MIN_INTERVAL_MS
        ) {
          beatPulseRef.current = 1;
          lastBeatAtRef.current = now;
          lastFrameAtRef.current = now;
        } else {
          decayPulse(now);
        }

        history.push(energy);
        if (history.length > BEAT_HISTORY_SIZE) history.shift();

        setData({ frequencyData: downsampleForDisplay(realData), energy, beatPulse: beatPulseRef.current });
      }

      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active]);

  return data;
}
