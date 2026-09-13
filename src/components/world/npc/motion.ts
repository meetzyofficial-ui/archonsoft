/**
 * Which way people walk, measured.
 *
 * Every figure that moves reports where it is and which way it faces, once
 * a frame. Between two reports its travel is compared with its facing (a
 * figure faces +z, so facing yaw θ is the direction (sin θ, cos θ)): moving
 * at a walking pace with the facing more than ninety degrees from the
 * travel is walking backwards, and is counted. The QA harness reads the
 * tally; nothing in the world depends on it.
 */

type Last = { x: number; z: number; yaw: number; at: number };

const last = new Map<string, Last>();

const stats = {
  /** Frames on which someone was moving at a walking pace. */
  samples: 0,
  /** Of those, frames on which they faced away from where they went. */
  backwards: 0,
  /** The worst alignment seen: 1 is straight ahead, −1 straight backwards. */
  worst: 1,
  /** Steps taken more than sixty degrees off the facing: crabbing. */
  sideways: 0,
  /** The fastest turn seen, radians a second — a snap would show here. */
  maxTurn: 0,
  who: [] as string[],
};

export const npcMotion = {
  record(id: string, x: number, z: number, yaw: number, frameDt: number) {
    const now = performance.now();
    const before = last.get(id);
    last.set(id, { x, z, yaw, at: now });
    /* Measured over the real time since this figure last reported, so a
       figure stepped every few frames, or out of range for a while, is not
       mistaken for a fast one. Gaps longer than a quarter second are not a
       step at all. */
    const dt = before ? (now - before.at) / 1000 : 0;
    if (!before || dt <= 0 || dt > 0.25 || frameDt <= 0) return;
    const turned = Math.abs(Math.atan2(Math.sin(yaw - before.yaw), Math.cos(yaw - before.yaw)));
    /* Frames longer than a fifth of a second are hitches, not turns. */
    if (dt < 0.2 && turned < 1.5) stats.maxTurn = Math.max(stats.maxTurn, turned / dt);
    const mx = x - before.x;
    const mz = z - before.z;
    const moved = Math.hypot(mx, mz);
    /* Teleports and first frames are not steps. */
    if (moved > 3 || moved / dt < 0.35) return;
    const align = (mx * Math.sin(yaw) + mz * Math.cos(yaw)) / moved;
    stats.samples += 1;
    stats.worst = Math.min(stats.worst, align);
    if (align < 0.5) stats.sideways += 1;
    if (align < 0) {
      stats.backwards += 1;
      if (stats.who.length < 8 && !stats.who.includes(id)) stats.who.push(id);
    }
  },
  read: () => ({ ...stats, who: [...stats.who] }),
  reset() {
    stats.samples = 0;
    stats.backwards = 0;
    stats.worst = 1;
    stats.sideways = 0;
    stats.maxTurn = 0;
    stats.who = [];
  },
};

if (typeof window !== "undefined") {
  (window as unknown as { __archonNpcMotion?: (reset?: boolean) => unknown }).__archonNpcMotion = (reset) => {
    const out = npcMotion.read();
    if (reset) npcMotion.reset();
    return out;
  };
}
