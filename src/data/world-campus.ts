import type { ZoneId } from "@/data/world-map";

/**
 * The campus plan: where the glass buildings stand, and the trees.
 *
 * Few buildings, each for a reason. Every one stands behind a department —
 * or behind the lobby, as the company's own headquarters — on the far side
 * of the room from where the visitor arrives, so a department reads as a
 * team working in front of its own building. All of them stand over the
 * water outside every walkable deck (the zone bounds in `world-map.ts`),
 * which is why none needs a collider: nobody can reach them.
 *
 * What stood here before and is gone: buildings standing on the Labs and
 * Systems decks either side of the hub, two inside the Archive's bounds at
 * the hub's south corners, a second rank round every island, and the
 * slender towers that filled the skyline.
 */

export type CampusBuilding = {
  /** Which department — or `lobby`, for the headquarters — it stands behind. */
  for: string;
  at: [number, number, number];
  /** Footprint, before the turn: across the face, and deep. */
  size: [number, number];
  /** Storey masses, bottom up, each set in from the one below. */
  tiers: number[];
  /** Yaw: the windowed face turns toward the department. */
  turn: number;
  light?: string;
};

const HALF = Math.PI / 2;

export const CAMPUS: CampusBuilding[] = [
  /* Headquarters, either side of the arrival, behind the lobby team. */
  { for: "lobby", at: [-44, -3, 36], size: [10, 8], tiers: [13, 6], turn: HALF, light: "#fff1e0" },
  { for: "lobby", at: [44, -3, 36], size: [10, 8], tiers: [10, 5], turn: -HALF },
  /* Web, and the innovation lab: west of the shipped hall, behind their rooms.
     Web's stood at (−41, −60) until AracımGo's service hub took that water;
     it now stands off the hub's southern rim, still behind its room, and
     clear of the screen at the hub's door. */
  { for: "web", at: [-50, -3, -47], size: [10, 8], tiers: [14, 6], turn: HALF },
  { for: "other", at: [-40, -3, -38], size: [9, 8], tiers: [9, 4], turn: HALF },
  /* E-commerce: south of the hall, facing back up it. */
  { for: "commerce", at: [14, -3, -85], size: [12, 9], tiers: [11, 5], turn: 0 },
  /* AI and 3D share the labs island: one building east of both rooms. */
  { for: "ai", at: [94, -3, 0], size: [14, 9], tiers: [15, 7], turn: -HALF },
  /* Enterprise: west of its room on the systems island. */
  { for: "enterprise", at: [-94, -3, -17], size: [11, 9], tiers: [12, 6], turn: HALF },
  /* Design and video: the archive's two flanks. */
  { for: "design", at: [-34, -3, 62], size: [9, 9], tiers: [12, 6], turn: HALF },
  { for: "video", at: [34, -3, 66], size: [9, 9], tiers: [9, 5], turn: -HALF },
  /* The hall of screens keeps one, beyond its far rim. */
  { for: "boards", at: [61, -3, -89], size: [14, 9], tiers: [10, 6], turn: 0 },
];

export type TreeSpot = {
  at: [number, number, number];
  /** Growing from its own outcrop of rock off an island's rim. */
  rock?: boolean;
  /** A blossom tree rather than a green one. */
  blossom?: boolean;
  zone?: ZoneId;
};

const rim = (list: [number, number, number][], zone: ZoneId): TreeSpot[] => list.map((at) => ({ at, rock: true, zone }));

/**
 * The trees, all of them, in one list: the same places they always stood,
 * drawn as one set. About one in five blossoms; about a third of the green
 * ones carry fruit (decided where they are drawn).
 */
const PLANTED: TreeSpot[] = [
  ...rim(
    [
      [-32.4, -0.3, -20], [-33, -0.3, -9], [-32.2, -0.3, 10], [-33, -0.3, 19], [-32.4, -0.3, 27],
      [32.4, -0.3, -16], [33, -0.3, -6], [32.2, -0.3, 12], [33, -0.3, 22], [32.6, -0.3, 30],
      [-14, -0.3, 36.6], [14.5, -0.3, 36.6], [-23, -0.3, 36.2], [23, -0.3, 36.2],
      [-9.5, -0.3, -32.6], [9.5, -0.3, -32.6],
    ],
    "hub",
  ),
  ...rim(
    [
      [-32.4, -0.3, -30], [-33, -0.3, -42], [-32.5, -0.3, -54], [-32.6, -0.3, -76.4], [32.4, -0.3, -32], [33, -0.3, -46],
      [32.5, -0.3, -58], [33, -0.3, -27], [-6, -0.3, -76.6], [6, -0.3, -76.6], [-16, -0.3, -76.8], [16, -0.3, -76.8],
    ],
    "shipped",
  ),
  { at: [23.5, 0, -31.5], blossom: true, zone: "shipped" },
  { at: [24, 0, -57], blossom: true, zone: "shipped" },
  { at: [23.5, 0, -44], zone: "shipped" },
  { at: [-23.5, 0, -31.5], zone: "shipped" },
  { at: [-24, 0, -57], zone: "shipped" },
  ...rim([[40, -0.3, -80.6], [52, -0.3, -80.8], [66, -0.3, -80.6], [78, -0.3, -80.8], [80, -0.3, -51.4], [66, -0.3, -51.2], [52, -0.3, -51.4], [42, -0.3, -51.2]], "boards"),
  ...rim([[-40, -0.3, -80.6], [-54, -0.3, -80.8], [-68, -0.3, -80.6], [-80, -0.3, -80.8], [-80, -0.3, -53.4], [-66, -0.3, -53.2]], "aracimgo"),
  ...rim([[40, -0.3, -28.6], [80, -0.3, -28.8], [80, -0.3, 28.6], [40, -0.3, 28.8], [52, -0.3, -28.4], [64, -0.3, 28.4], [85.6, -0.3, -12], [85.6, -0.3, 14]], "labs"),
  ...rim([[-40, -0.3, -26.6], [-80, -0.3, -26.8], [-80, -0.3, 26.6], [-40, -0.3, 26.8], [-56, -0.3, -26.4], [-60, -0.3, 26.4], [-85.6, -0.3, -10], [-85.6, -0.3, 12]], "systems"),
];

export const TREES: TreeSpot[] = PLANTED.map((spot, i) => ({ ...spot, blossom: spot.blossom ?? (spot.rock ? (i * 0.618) % 1 < 0.2 : false) }));
