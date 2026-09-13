/**
 * Quality.
 *
 * One place that decides how much the device is asked to draw: the pixel
 * ratio it renders at, how sharp the panel textures are painted, how much
 * anisotropy they are filtered with, how large the reflection capture is.
 * Three phone tiers and the desktop, read once from what the browser will
 * say about the machine; then a governor that steps the pixel ratio down
 * only when frames are measurably slow, and back up when they are
 * measurably fast, never in the middle of a frame and never by a jump the
 * eye would catch.
 *
 * The rule that shapes every number here: text stays sharp. A low tier
 * loses distant geometry, reflections and people before it loses a legible
 * panel — so no tier renders below 0.95× and no tier paints a panel below
 * 85% of its full resolution.
 */

export type Tier = "desktop" | "high" | "medium" | "low";

export interface QualityProfile {
  /** The pixel ratio the world starts at, and the floor the governor may step down to. */
  dpr: { start: number; min: number; max: number };
  /** Panel textures are painted at this fraction of their full resolution. */
  textureScale: number;
  /**
   * Panel type is painted at this many texels per square-root metre of
   * panel width, up to `panelMax` on the long side — a five-metre panel at
   * about 1900 on a desktop and 1600 on a good phone — so a phone never
   * allocates a desktop's memory.
   */
  panelDensity: number;
  panelMax: number;
  /** The office monitors and boards are painted at this multiple of their layout. */
  screenScale: number;
  /** Anisotropic filtering requested for textures read at grazing angles; capped by the GPU. */
  anisotropy: number;
  /** The cube capture behind every reflection. */
  reflections: number;
}

export const QUALITY: Record<Tier, QualityProfile> = {
  /* Phones render sharper than they used to: the people are one draw each
     now, and a phone's text at half its native density was the softest
     thing in the world. The governor still steps down on a slow device. */
  desktop: { dpr: { start: 1.5, min: 1.0, max: 2.0 }, textureScale: 1, anisotropy: 16, reflections: 128, panelDensity: 830, panelMax: 2560, screenScale: 2 },
  high: { dpr: { start: 2.0, min: 1.3, max: 2.0 }, textureScale: 1, anisotropy: 16, reflections: 128, panelDensity: 720, panelMax: 2048, screenScale: 2 },
  medium: { dpr: { start: 1.6, min: 1.15, max: 1.75 }, textureScale: 1, anisotropy: 8, reflections: 64, panelDensity: 620, panelMax: 2048, screenScale: 1.5 },
  low: { dpr: { start: 1.25, min: 0.95, max: 1.35 }, textureScale: 0.85, anisotropy: 8, reflections: 64, panelDensity: 520, panelMax: 1536, screenScale: 1.25 },
};

/**
 * Which tier this machine is.
 *
 * Cores and memory, as the browser reports them. Safari reports no memory
 * at all, and an iPhone is not a four-gigabyte Android; an Apple device with
 * unknown memory is assumed to have enough.
 */
export function detectTier(compact: boolean): Tier {
  if (!compact) return "desktop";
  if (typeof navigator === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency ?? 4;
  const apple = /iPhone|iPad|Macintosh/.test(navigator.userAgent);
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? (apple ? 6 : 4);
  if (cores >= 6 && memory >= 6) return "high";
  if (cores >= 4 && memory >= 4) return "medium";
  return "low";
}

/** What the world is currently rendering at, for the HUD and the QA harness. */
export const qualityStore = {
  tier: "desktop" as Tier,
  dpr: 1.5,
  /** Smoothed frame time in milliseconds. */
  frame: 16,
  /** How many times the governor has stepped, either way. */
  steps: 0,
  /**
   * The browser is rasterising on the CPU (SwiftShader, llvmpipe): a machine
   * whose GPU is blocked or absent. Per-pixel detail is dropped for it —
   * the world stays usable at a few frames a second rather than one.
   */
  software: false,
};

/* The governor's thresholds. A frame over 26ms for a second and a half is a
   phone that is struggling; under 13ms for six seconds is one with room to
   spare. Steps are a tenth at a time, at most one every four seconds. */
export const GOVERNOR = {
  slowMs: 26,
  slowFor: 1.5,
  fastMs: 13,
  fastFor: 6,
  step: 0.1,
  cooldown: 4,
};
