/** Minimal class joiner. No runtime dependency needed for this project's size. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Deterministic pseudo-random source, so generative plates render identically
 *  on the server and the client. Mulberry32. */
export function seededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of a string, used to seed the plate for a given slug. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Rounds a generated coordinate to two decimals.
 *
 * Trig results can differ by one ULP between the Node build that renders on the
 * server and the browser build that hydrates, which is enough to make React
 * report a mismatch on an SVG attribute. Quantising removes the whole class of
 * problem, and no drawing needs more precision than this.
 */
export const q = (value: number): number => Math.round(value * 100) / 100;
