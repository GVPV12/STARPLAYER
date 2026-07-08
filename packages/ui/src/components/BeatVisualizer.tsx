import { useEffect, useRef } from "react";
import type { VisualizerColorMode, VisualizerStyle } from "@starplayer/core";
import { useSkin } from "../SkinProvider.js";
import styles from "./BeatVisualizer.module.css";

export interface BeatVisualizerProps {
  style: VisualizerStyle;
  colorMode: VisualizerColorMode;
  /** Live frequency-domain data (0-255 per bin), or null while nothing is analyzed yet. */
  frequencyData: Uint8Array | null;
  /** Normalized 0-1 loudness/energy, used to blend between the two colors. */
  energy: number;
  /** 0-1 — spikes to 1 the instant a beat is detected, then decays back to 0. */
  beatPulse: number;
  relaxedColor: string;
  energeticColor: string;
}

/** Dark-background skins get a strong neon glow; light ones get little to none so it doesn't look muddy. */
const DARK_GLOW_SKIN_IDS = new Set(["vaporwave", "gradient-glass", "neon-pink"]);

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const value = parseInt(full, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function mixColor(colorA: string, colorB: string, t: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const clamped = Math.min(1, Math.max(0, t));
  const r = Math.round(a.r + (b.r - a.r) * clamped);
  const g = Math.round(a.g + (b.g - a.g) * clamped);
  const bl = Math.round(a.b + (b.b - a.b) * clamped);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Hue for a 0-1 position along a rainbow sweep, slowly drifting over time. */
function rainbowHue(position: number, rotation: number): number {
  return (position * 300 + rotation * 30) % 360;
}

interface DrawContext {
  ctx: CanvasRenderingContext2D;
  data: Uint8Array;
  w: number;
  h: number;
  color: string;
  colorMode: VisualizerColorMode;
  relaxedColor: string;
  energeticColor: string;
  glow: number;
  rotation: number;
  beatPulse: number;
}

function drawBars({ ctx, data, w, h, color, colorMode, glow, rotation, beatPulse }: DrawContext) {
  const barCount = Math.min(32, data.length);
  const barWidth = w / barCount;
  const baseline = h * 0.78;
  const maxHeight = h * 0.55 * (1 + beatPulse * 0.22);
  for (let i = 0; i < barCount; i += 1) {
    const value = data[i]! / 255;
    const barHeight = value * maxHeight;
    const barColor = colorMode === "rainbow" ? `hsl(${rainbowHue(i / barCount, rotation)}, 90%, 60%)` : color;
    if (glow > 0) {
      ctx.shadowColor = barColor;
      ctx.shadowBlur = 14 * glow * (1 + beatPulse * 0.6);
    }
    ctx.globalAlpha = 0.3 + value * 0.7;
    ctx.fillStyle = barColor;
    ctx.fillRect(i * barWidth + barWidth * 0.15, baseline - barHeight, barWidth * 0.7, barHeight);
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawDots({ ctx, data, w, h, color, colorMode, glow, rotation, beatPulse }: DrawContext) {
  const cols = Math.min(20, data.length);
  const rows = 7;
  const colWidth = w / cols;
  const rowHeight = (h * 0.6) / rows;
  const topOffset = h * 0.15;
  const dotRadius = Math.min(colWidth, rowHeight) * 0.28 * (1 + beatPulse * 0.35);
  for (let c = 0; c < cols; c += 1) {
    const value = data[c]! / 255;
    const litRows = Math.round(value * rows);
    const dotColor = colorMode === "rainbow" ? `hsl(${rainbowHue(c / cols, rotation)}, 90%, 60%)` : color;
    if (glow > 0) {
      ctx.shadowColor = dotColor;
      ctx.shadowBlur = 8 * glow * (1 + beatPulse * 0.6);
    }
    for (let r = 0; r < rows; r += 1) {
      const lit = r >= rows - litRows;
      ctx.globalAlpha = lit ? 0.9 : 0.1;
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(c * colWidth + colWidth / 2, topOffset + h * 0.6 - (r * rowHeight + rowHeight / 2), dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawWave({ ctx, data, w, h, color, colorMode, glow, rotation, beatPulse }: DrawContext) {
  ctx.lineWidth = Math.max(2, w * 0.0035) * (1 + beatPulse * 0.4);
  if (colorMode === "rainbow") {
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    const stops = 6;
    for (let i = 0; i <= stops; i += 1) {
      gradient.addColorStop(i / stops, `hsl(${rainbowHue(i / stops, rotation)}, 90%, 60%)`);
    }
    ctx.strokeStyle = gradient;
    ctx.shadowColor = `hsl(${rainbowHue(0.5, rotation)}, 90%, 60%)`;
  } else {
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
  }
  // Amplitude + glow are both sized to leave headroom within the canvas —
  // the wave sits in a strip that's taller than what's visually shown (see
  // PlayerScreen's .fullWidthVisualizerInner), but the canvas can still only
  // render within its own pixel bounds, so the glow must fit inside it too.
  // The beat pulse only nudges line thickness (above), not amplitude/glow —
  // those are already tight against the canvas edge with no margin to spare.
  ctx.shadowBlur = glow > 0 ? 13 * glow : 5;
  ctx.beginPath();
  const step = w / (data.length - 1);
  for (let i = 0; i < data.length; i += 1) {
    const value = data[i]! / 255;
    const x = i * step;
    const y = h / 2 - value * h * 0.3 + Math.sin(i * 0.6) * h * 0.02;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawRing({ ctx, data, w, h, color, colorMode, glow, rotation, beatPulse }: DrawContext) {
  const cx = w / 2;
  const cy = h / 2;
  // Base radius sits just inside the cover's edge (so spikes visibly cross
  // it), and the spike extension + glow are both capped well within the
  // canvas so nothing gets clipped at the edge — including the beat pulse's
  // extra boost, which is deliberately modest to preserve that margin.
  const safeMax = Math.min(w, h) / 2;
  const baseRadius = safeMax * 0.62;
  const spikeExtension = 0.32 + beatPulse * 0.1;
  const spikes = Math.min(48, data.length);
  ctx.lineWidth = Math.max(1.5, w * 0.004);
  for (let i = 0; i < spikes; i += 1) {
    const angle = (i / spikes) * Math.PI * 2;
    const value = data[i]! / 255;
    const outerR = baseRadius * (1 + value * spikeExtension);
    const spikeColor = colorMode === "rainbow" ? `hsl(${rainbowHue(i / spikes, rotation)}, 90%, 60%)` : color;
    ctx.strokeStyle = spikeColor;
    ctx.shadowColor = spikeColor;
    ctx.shadowBlur = glow > 0 ? 10 * glow * (1 + beatPulse * 0.3) : 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * baseRadius, cy + Math.sin(angle) * baseRadius);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

/** Smooth glowing arc that sweeps between the two configured colors (or a full rainbow), evoking a neon ring. */
function drawCircle({ ctx, data, w, h, relaxedColor, energeticColor, colorMode, glow, rotation, beatPulse }: DrawContext) {
  const cx = w / 2;
  const cy = h / 2;
  const safeMax = Math.min(w, h) / 2;
  const bassCount = Math.max(1, Math.floor(data.length * 0.5));
  let bass = 0;
  for (let i = 0; i < bassCount; i += 1) bass += data[i]!;
  bass = bass / bassCount / 255;
  // Reserve room for line thickness + glow blur so the ring never clips
  // against the canvas edge — radius itself uses at most ~70% of the
  // available half-size, leaving the rest for stroke + shadow (the beat
  // pulse's own boost is kept small so it never eats into that margin).
  const thickness = Math.max(3, safeMax * (0.05 + bass * 0.05));
  const shadowBlur = glow > 0 ? safeMax * 0.14 * glow * (1 + beatPulse * 0.2) : safeMax * 0.04;
  const radius = safeMax * 0.7 * (0.94 + bass * 0.12 + beatPulse * 0.03);

  let strokeStyle: string | CanvasGradient;
  if (colorMode === "rainbow" && typeof ctx.createConicGradient === "function") {
    const gradient = ctx.createConicGradient(rotation, cx, cy);
    for (let i = 0; i <= 8; i += 1) {
      gradient.addColorStop(i / 8, `hsl(${(i * 45 + rotation * 30) % 360}, 90%, 60%)`);
    }
    strokeStyle = gradient;
  } else if (typeof ctx.createConicGradient === "function") {
    const gradient = ctx.createConicGradient(rotation, cx, cy);
    gradient.addColorStop(0, relaxedColor);
    gradient.addColorStop(0.5, energeticColor);
    gradient.addColorStop(1, relaxedColor);
    strokeStyle = gradient;
  } else {
    strokeStyle = mixColor(relaxedColor, energeticColor, 0.5);
  }

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.shadowColor = colorMode === "rainbow" ? `hsl(${(rotation * 30) % 360}, 90%, 60%)` : energeticColor;
  ctx.shadowBlur = shadowBlur;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

const DRAWERS: Record<VisualizerStyle, (dc: DrawContext) => void> = {
  bars: drawBars,
  dots: drawDots,
  wave: drawWave,
  ring: drawRing,
  circle: drawCircle,
};

/**
 * Canvas-based audio-reactive visualizer. Reads the current skin only to
 * decide how much neon glow to apply (strong on dark skins, subtle on light
 * ones) — the actual frequency data is supplied by the caller, so this stays
 * agnostic to whatever platform-specific audio analysis feeds it.
 */
export function BeatVisualizer({
  style,
  colorMode,
  frequencyData,
  energy,
  beatPulse,
  relaxedColor,
  energeticColor,
}: BeatVisualizerProps) {
  const skin = useSkin();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef(frequencyData);
  const energyRef = useRef(energy);
  const beatPulseRef = useRef(beatPulse);
  dataRef.current = frequencyData;
  energyRef.current = energy;
  beatPulseRef.current = beatPulse;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = Math.max(1, rect.width * dpr);
      canvas!.height = Math.max(1, rect.height * dpr);
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const glow = DARK_GLOW_SKIN_IDS.has(skin.id) ? 1 : 0.25;
    let rotation = 0;
    let frameId: number;
    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);
      const data = dataRef.current;
      if (data) {
        rotation += 0.012;
        const color = mixColor(relaxedColor, energeticColor, energyRef.current);
        DRAWERS[style]({
          ctx: ctx!,
          data,
          w,
          h,
          color,
          colorMode,
          relaxedColor,
          energeticColor,
          glow,
          rotation,
          beatPulse: beatPulseRef.current,
        });
      }
      frameId = requestAnimationFrame(draw);
    }
    frameId = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [style, colorMode, relaxedColor, energeticColor, skin.id]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
