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

export type Tier = "desktop" | "high" | "medium" | "low" | "safe";

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
  /**
   * The longest side, in texels, of any panel, board or photograph on a
   * screen. Width alone was capped before, and a tall panel painted past
   * two thousand texels high on a phone; a hundred of those, each held as
   * a canvas and again on the GPU with its mipmaps, came to more than a
   * gigabyte at the moment the boot uploaded them — and a phone's browser
   * is killed on memory, without an error, and reloads the page.
   */
  textureMax: number;
  /** The same for the department signs, which are read from furthest away. */
  signMax: number;
}

export const QUALITY: Record<Tier, QualityProfile> = {
  /* Phones render sharper than they used to: the people are one draw each
     now, and a phone's text at half its native density was the softest
     thing in the world. The governor still steps down on a slow device.
     A phone's textures are capped on their long side: at 1024 texels a
     panel still has more texels across than a phone held upright has
     pixels when the panel fills the screen, and the world's textures fit
     in under three hundred megabytes instead of more than a gigabyte with
     their canvases (scripts/memprofile.mjs). */
  desktop: { dpr: { start: 1.5, min: 1.0, max: 2.0 }, textureScale: 1, anisotropy: 16, reflections: 128, panelDensity: 830, panelMax: 2560, screenScale: 2, textureMax: 4096, signMax: 2560 },
  high: { dpr: { start: 2.0, min: 1.3, max: 2.0 }, textureScale: 1, anisotropy: 16, reflections: 128, panelDensity: 720, panelMax: 2048, screenScale: 1.5, textureMax: 1024, signMax: 1280 },
  medium: { dpr: { start: 1.6, min: 1.15, max: 1.75 }, textureScale: 1, anisotropy: 8, reflections: 64, panelDensity: 620, panelMax: 2048, screenScale: 1.5, textureMax: 1024, signMax: 1280 },
  low: { dpr: { start: 1.25, min: 0.95, max: 1.35 }, textureScale: 0.85, anisotropy: 8, reflections: 64, panelDensity: 520, panelMax: 1536, screenScale: 1.25, textureMax: 896, signMax: 1152 },
  /* After the world failed to start on this device: the least it can be
     and still be the world — every panel legible, a plain pixel ratio, a
     small reflection. */
  safe: { dpr: { start: 1.0, min: 0.95, max: 1.25 }, textureScale: 0.85, anisotropy: 4, reflections: 32, panelDensity: 440, panelMax: 1024, screenScale: 1, textureMax: 768, signMax: 1024 },
};

/**
 * A phone or tablet operating system, whatever the width of its window: an
 * iPad in landscape is as wide as a laptop and has a phone's memory rules.
 * iPadOS reports itself as a Mac, and is told apart by its touch points.
 */
export function mobileOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod|Android/i.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1);
}

/**
 * Which tier this machine is.
 *
 * Cores and memory, as the browser reports them. Safari reports no memory
 * at all, and an iPhone is not a four-gigabyte Android; an Apple device with
 * unknown memory is assumed to have enough. A mobile operating system is
 * never the desktop tier, however wide its window. `safe` is asked for when
 * the world has already failed to start here once.
 */
export function detectTier(compact: boolean, safe = false): Tier {
  if (safe) return "safe";
  if (!compact && !mobileOS()) return "desktop";
  if (typeof navigator === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency ?? 4;
  const apple = /iPhone|iPad|Macintosh/.test(navigator.userAgent);
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? (apple ? 6 : 4);
  if (cores >= 6 && memory >= 6) return "high";
  if (cores >= 4 && memory >= 4) return "medium";
  return "low";
}

/**
 * Did the world fail to start here last time?
 *
 * A phone's browser that runs out of memory kills the page without an
 * error and loads it again; nothing in the page runs to say so. So the boot
 * writes that it has begun, and clears it when the world has been on screen
 * for a few seconds — or when the page is left normally, which fires
 * `pagehide` and a crash does not. A page that finds the note still there
 * was killed while starting, and starts again in the safe tier; twice, and
 * it asks before trying a third time rather than crashing in a loop.
 */
const BOOT_KEY = "archon-world-boot";
const BOOT_WINDOW = 10 * 60 * 1000;
type BootNote = { pending: boolean; failures: number; at: number };

function readNote(): BootNote {
  try {
    const raw = window.localStorage.getItem(BOOT_KEY);
    const note = raw ? (JSON.parse(raw) as BootNote) : null;
    if (note && Date.now() - note.at < BOOT_WINDOW) return note;
  } catch {
    /* Storage refused: every start is a first start. */
  }
  return { pending: false, failures: 0, at: 0 };
}

function writeNote(note: BootNote) {
  try {
    window.localStorage.setItem(BOOT_KEY, JSON.stringify(note));
  } catch {
    /* Not remembered; the world still starts. */
  }
}

export const bootGuard = {
  /** How many starts in a row have failed, counting one found unfinished now. */
  failures(): number {
    if (typeof window === "undefined") return 0;
    const note = readNote();
    const failures = note.failures + (note.pending ? 1 : 0);
    if (note.pending) writeNote({ pending: false, failures, at: Date.now() });
    return failures;
  },
  begin() {
    const note = readNote();
    writeNote({ pending: true, failures: note.failures, at: Date.now() });
  },
  /** The world is up: a clean slate. */
  succeed() {
    writeNote({ pending: false, failures: 0, at: Date.now() });
  },
  /** Left normally, mid-start: not a failure. */
  leave() {
    const note = readNote();
    if (note.pending) writeNote({ pending: false, failures: note.failures, at: note.at });
  },
  /** Counted without a reload: the graphics context was lost. */
  fail() {
    const note = readNote();
    writeNote({ pending: false, failures: note.failures + 1, at: Date.now() });
  },
};

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
  /** The world was started in the safe tier after failing to start here. */
  safe: false,
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
