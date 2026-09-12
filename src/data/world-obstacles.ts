import { DISPLAYS, GALLERY, type Box } from "@/data/world-map";

/**
 * Solid things that are not in the plan.
 *
 * The plan (`world-map.ts`) holds the walls and the built colliders and is
 * not changed. These are the obvious physical objects the visual build
 * added since — the pylons carrying the gallery, the consoles at the
 * stations, the wayfinding totem and the section panels by the entrance —
 * which the visitor could otherwise walk through. They are appended to the
 * colliders where the walking loop and the host build their collision set,
 * through the same `buildRects` / `slide` path as everything else.
 */

const FLANK = 24.5;

/* The gallery pylons, except the three the west ramp climbs through. */
const PYLONS: Box[] = [-FLANK, FLANK].flatMap((x) =>
  Array.from({ length: 7 }, (_, i) => -24 + i * 9)
    .filter((z) => !(x < 0 && z >= 12))
    .map((z): Box => ({ at: [x, GALLERY / 2 - 0.1, z], size: [0.6, GALLERY - 0.3, 0.6] })),
);

/* The consoles the guides stand at, in front of each station's screens. */
const CONSOLES: Box[] = [
  { at: [-16.2, 0.5, -44], size: [1.0, 1.0, 2.7] },
  { at: [16.2, 0.5, -44], size: [1.0, 1.0, 2.7] },
  { at: [64.2, 0.5, -66], size: [1.0, 1.0, 2.7] },
];

/* The wayfinding totem by the arrival. */
const TOTEM: Box[] = [{ at: [11.6, 2, 34.2], size: [1.6, 4, 1.6] }];

/* The section panels to the right of the entrance: each stands on a plinth
   as wide as its screen, so the whole width is solid. */
const PANELS: Box[] = DISPLAYS.filter((d) => d.zone === "hub" && d.form === "vertical").map(
  (d): Box => ({ at: [d.at[0], 1.6, d.at[2]], size: [0.8, 3.2, d.size[0] + 0.9] }),
);

export const WORLD_OBSTACLES: Box[] = [...PYLONS, ...CONSOLES, ...TOTEM, ...PANELS];
