/**
 * How much of a person, and how often they move.
 *
 * Three tiers by distance — the face and the fingers up close, the figure
 * that reads at a walk in the middle distance, a silhouette beyond — and
 * nobody at all past the far edge. A phone draws its tiers closer.
 *
 * Not every person is equally worth it. The one the visitor is talking to
 * is drawn whole and moves every frame wherever they stand; the nearest
 * person to the visitor is the next most looked at; the host of a room and
 * the lobby team hold their detail further out than the people behind
 * them. Everyone else moves every other frame in the middle distance and
 * every fourth as a silhouette, staggered so no two step on the same frame.
 */

export const NPC_LOD = {
  desktop: { near: 8, mid: 20, far: 45 },
  phone: { near: 5, mid: 13, far: 30 },
} as const;

/** Talking to the visitor, a room's host, the lobby, everyone else. */
export const IMPORTANCE = { speaking: 4, host: 1.6, lobby: 1.25, staff: 1 } as const;

/** −1 hidden, 0 silhouette, 1 figure, 2 full. */
export function npcTier(distance: number, phone: boolean, reach: number = IMPORTANCE.staff, key?: string): number {
  if (reach >= IMPORTANCE.speaking) return 2;
  const lod = phone ? NPC_LOD.phone : NPC_LOD.desktop;
  if (key !== undefined) npcFocus.offer(key, distance);
  const nearest = key !== undefined && npcFocus.nearest === key && distance < lod.mid * reach;
  if (nearest || distance < lod.near * reach) return 2;
  if (distance < lod.mid * reach) return 1;
  if (distance < lod.far * reach) return 0;
  return -1;
}

/** Every how many frames a person at this tier is animated. */
export function npcStride(tier: number): number {
  return tier >= 2 ? 1 : tier === 1 ? 2 : 4;
}

/**
 * The nearest person, frame to frame. Every system offers its people's
 * distances as it goes; the clock at the head of the frame settles who was
 * nearest last frame.
 */
export const npcFocus = {
  frame: 0,
  nearest: null as string | null,
  best: Infinity,
  bestKey: null as string | null,
  offer(key: string, distance: number) {
    if (distance < this.best) {
      this.best = distance;
      this.bestKey = key;
    }
  },
  tick() {
    this.nearest = this.bestKey;
    this.best = Infinity;
    this.bestKey = null;
    this.frame += 1;
  },
};

/** Whether this frame is one this person moves on. */
export function npcStep(tier: number, slot: number): boolean {
  const stride = npcStride(tier);
  return stride === 1 || (npcFocus.frame + slot) % stride === 0;
}
