import { OFFICE_OBSTACLES } from "@/data/departments";
import { DISPLAYS, GALLERY, type Box } from "@/data/world-map";
import { TORCH_OBSTACLES } from "@/data/world-torches";

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
  { at: [-64.2, 0.5, -67], size: [1.0, 1.0, 2.7] },
];

/* AracımGo's service hub (districts/AracimGo.tsx): the entrance screen's
   plinth, the lift and car in each service bay either side of the station,
   each bay's workflow screen, and the four posts carrying the canopy. */
const ARACIMGO_PIECES: Box[] = [
  { at: [-42.5, 1.6, -58.4], size: [5.6, 3.2, 1.2] },
  { at: [-62, 1.3, -59.6], size: [4.6, 2.6, 3.3] },
  { at: [-62, 1.3, -74.4], size: [4.6, 2.6, 3.3] },
  { at: [-58.1, 1.2, -59.6], size: [0.5, 2.4, 1.9] },
  { at: [-58.1, 1.2, -74.4], size: [0.5, 2.4, 1.9] },
  ...[-70, -54].flatMap((x) => [-76, -58].map((z): Box => ({ at: [x, 4.6, z], size: [0.5, 9.2, 0.5] }))),
];

/* The wayfinding totem by the arrival. */
const TOTEM: Box[] = [{ at: [11.6, 2, 34.2], size: [1.6, 4, 1.6] }];

/* The section panels to the right of the entrance: each stands on a plinth
   as wide as its screen, so the whole width is solid. */
const PANELS: Box[] = DISPLAYS.filter((d) => d.zone === "hub" && d.form === "vertical").map(
  (d): Box => ({ at: [d.at[0], 1.6, d.at[2]], size: [0.8, 3.2, d.size[0] + 0.9] }),
);

/* The offices: every desk with its chair, and the board wall behind each
   team, from the same data the scene builds them from. */
export const WORLD_OBSTACLES: Box[] = [...PYLONS, ...CONSOLES, ...TOTEM, ...PANELS, ...ARACIMGO_PIECES, ...OFFICE_OBSTACLES, ...TORCH_OBSTACLES];
