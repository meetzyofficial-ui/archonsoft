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
 * panel — so no tier renders below 0.85× and no tier paints a panel below
 * three quarters of its full resolution.
 */

export type Tier = "desktop" | "high" | "medium" | "low";

export interface QualityProfile {
  /** The pixel ratio the world starts at, and the floor the governor may step down to. */
  dpr: { start: number; min: number; max: number };
  /** Panel textures are painted at this fraction of their full resolution. */
  textureScale: number;
  /** Anisotropic filtering requested for textures read at grazing angles; capped by the GPU. */
  anisotropy: number;
  /** The cube capture behind every reflection. */
  reflections: number;
}

export const QUALITY: Record<Tier, QualityProfile> = {
  desktop: { dpr: { start: 1.5, min: 1.0, max: 1.5 }, textureScale: 1, anisotropy: 16, reflections: 128 },
  high: { dpr: { start: 1.5, min: 1.15, max: 1.5 }, textureScale: 1, anisotropy: 16, reflections: 128 },
  medium: { dpr: { start: 1.15, min: 1.0, max: 1.25 }, textureScale: 1, anisotropy: 8, reflections: 64 },
  low: { dpr: { start: 1.0, min: 0.85, max: 1.0 }, textureScale: 0.75, anisotropy: 8, reflections: 64 },
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
