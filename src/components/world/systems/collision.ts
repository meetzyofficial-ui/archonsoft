import type { Box } from "@/data/world-map";

/**
 * Collision.
 *
 * A person is a circle on a plan and walls are rectangles, so the horizontal
 * problem is two dimensional and stays that way — there is no physics engine
 * here and nothing in the world needs one.
 *
 * What the world does have is two levels. A gallery runs above the hub and a
 * ramp climbs to it, which means "is this wall in the way?" can no longer be
 * answered from the plan alone: the parapet of the gallery is nine metres up,
 * solid to somebody standing on the gallery and thin air to somebody crossing
 * the floor beneath it. So every box keeps the height band it occupies, and a
 * rectangle only counts as an obstacle when that band overlaps the band the
 * visitor's body is currently standing in.
 *
 * This is the whole of the third dimension. There is no falling, no jumping
 * and no gravity: the floor under any point is a known height, the visitor is
 * always standing on it, and walking off the gallery is prevented by its
 * parapet rather than punished by a drop.
 */

export type Rect = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** The height band the obstacle occupies, in world metres. */
  minY: number;
  maxY: number;
};

/** How wide the visitor is. Enough to stop them clipping a doorway jamb. */
export const BODY_RADIUS = 0.42;

/** How tall. A box whose underside clears this is a lintel, not a wall. */
const BODY_HEIGHT = 2.1;

export function buildRects(boxes: Box[]): Rect[] {
  return boxes.map((box) => ({
    minX: box.at[0] - box.size[0] / 2,
    maxX: box.at[0] + box.size[0] / 2,
    minZ: box.at[2] - box.size[2] / 2,
    maxZ: box.at[2] + box.size[2] / 2,
    minY: box.at[1] - box.size[1] / 2,
    maxY: box.at[1] + box.size[1] / 2,
  }));
}

/**
 * Slide along whatever was hit rather than stopping dead against it.
 *
 * Each axis is resolved on its own, which is what produces sliding: walking
 * into a wall at an angle, the component along the wall survives and the
 * component into it does not. Resolving both at once instead would make every
 * wall sticky, and sticky walls are the single thing that makes a first-person
 * camera feel like a debug tool.
 *
 * `feet` is the height of the floor the visitor is standing on. Everything
 * that does not reach them, or starts above their head, is not in the way.
 */
export function slide(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  rects: Rect[],
  feet = 0,
): [number, number] {
  let x = toX;
  let z = fromZ;
  const head = feet + BODY_HEIGHT;

  for (const rect of rects) {
    if (!inBand(rect, feet, head)) continue;
    if (overlaps(x, z, rect)) {
      x = fromX < rect.minX ? rect.minX - BODY_RADIUS : rect.maxX + BODY_RADIUS;
    }
  }

  z = toZ;
  for (const rect of rects) {
    if (!inBand(rect, feet, head)) continue;
    if (overlaps(x, z, rect)) {
      z = fromZ < rect.minZ ? rect.minZ - BODY_RADIUS : rect.maxZ + BODY_RADIUS;
    }
  }

  return [x, z];
}

/* A little tolerance at the feet so that a floor slab flush with the level it
   carries is not read as a wall standing on it. */
const UNDERFOOT = 0.12;

function inBand(rect: Rect, feet: number, head: number): boolean {
  return rect.maxY > feet + UNDERFOOT && rect.minY < head;
}

function overlaps(x: number, z: number, rect: Rect): boolean {
  return (
    x + BODY_RADIUS > rect.minX &&
    x - BODY_RADIUS < rect.maxX &&
    z + BODY_RADIUS > rect.minZ &&
    z - BODY_RADIUS < rect.maxZ
  );
}
