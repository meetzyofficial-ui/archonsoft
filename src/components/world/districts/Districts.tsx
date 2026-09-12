"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { moodStore } from "@/components/world/environment/mood";
import {
  Arch,
  Backlight,
  BuiltWall,
  Colonnade,
  Deck,
  Doorway,
  Glow,
  Island,
  Label,
  LightLine,
  LightTowers,
  LightWash,
  MATERIAL,
  Plinth,
  Service,
  Spires,
  Trees,
  WallField,
} from "@/components/world/pieces/Kit";
import { Gate } from "@/components/world/pieces/Gate";
import { Facades, type Facade } from "@/components/world/pieces/Facades";
import { useMerged } from "@/components/world/pieces/merge";
import { PhotoSurface } from "@/components/world/pieces/Surface";
import {
  CORRIDOR,
  GALLERY,
  GALLERY_DECKS,
  GALLERY_RAILS,
  RAMP_FOOT,
  RAMP_RUN,
  WALLS,
  getZone,
  type ZoneId,
} from "@/data/world-map";
import type { PreparedInstallation } from "@/lib/worldPayload";
import { WORLD_DESTINATIONS } from "@/data/world-destinations";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/**
 * The settlement.
 *
 * Seven islands over a cosmic ocean, joined by bridges, with the Archon mark
 * standing in the middle of the first. The plan is the plan it always was —
 * every collider, every district boundary and every walkable height is
 * unchanged — but the building that stood on it is gone. There is no ceiling
 * anywhere. The walls are parapets with fins. The floors hang in space with
 * light around their edges and the sea moving underneath.
 *
 * Each shipped product has a station: a raised dais with its real screens
 * hanging over it as holograms, a floating tag with its number and its
 * category, and the people who will tell you about it (drawn by `Guides`).
 */

export function Walls() {
  return (
    <group name="walls">
      <WallField boxes={WALLS} />
    </group>
  );
}

/** A district's own line of light down its long axis. */
function DistrictLine({
  zone,
  at,
  length,
  intensity,
}: {
  zone: ZoneId;
  at: [number, number];
  length: number;
  intensity: number;
}) {
  return (
    <LightLine
      at={[at[0], 0.035, at[1]]}
      length={length}
      axis="z"
      colour={getZone(zone).accent}
      intensity={intensity}
      thickness={0.09}
    />
  );
}

/* --------------------------------------------------------------- bridges */

/**
 * The bridges between islands.
 *
 * The corridors used to have no floor of their own because the rooms either
 * side ran up to them; over water a gap is a gap, so every passage gets a
 * slender deck with lit edges and a rail of energy down each side.
 */
function Bridge({
  at,
  size,
  texture,
  colour = MATERIAL.glow,
}: {
  at: [number, number];
  size: [number, number];
  texture: THREE.Texture;
  colour?: string;
}) {
  const alongZ = size[1] > size[0];
  return (
    <group>
      <Island at={at} size={size} texture={texture} colour={colour} depth={1.4} rock={false} falls={false} />
      <Service
        at={[at[0], 0.62, at[1]]}
        length={alongZ ? size[1] : size[0]}
        turn={alongZ ? Math.PI / 2 : 0}
        height={0.06}
        colour={MATERIAL.warmWhite}
      />
    </group>
  );
}

export function Bridges({ texture }: { texture: THREE.Texture }) {
  return (
    <group name="bridges">
      {/* Hub to Shipped. */}
      <Bridge at={[0, -26]} size={[CORRIDOR + 2, 9]} texture={texture} colour={getZone("shipped").accent} />
      {/* Hub to Archive. */}
      <Bridge at={[0, 37]} size={[CORRIDOR + 2, 7]} texture={texture} colour={getZone("archive").accent} />
      {/* Hub to Labs, Hub to Systems. */}
      <Bridge at={[32, 0]} size={[5, CORRIDOR + 2]} texture={texture} colour={getZone("labs").accent} />
      <Bridge at={[-32, 0]} size={[5, CORRIDOR + 2]} texture={texture} colour={getZone("systems").accent} />
      {/* Shipped to the hall of screens. */}
      <Bridge at={[32, -66]} size={[5, 11.6]} texture={texture} colour={getZone("boards").accent} />
    </group>
  );
}

/* --------------------------------------------------------------- gallery */

const FLANK_X = 24.5;
const GALLERY_LIGHT = getZone("gallery").accent;

export function Gallery({ texture }: { texture: THREE.Texture }) {
  const decks = useMerged(
    () => GALLERY_DECKS.map((box) => ({ geometry: new THREE.BoxGeometry(...box.size), at: box.at })),
    [],
  );
  const undersides = useMerged(
    () =>
      GALLERY_DECKS.map((box) => ({
        geometry: new THREE.PlaneGeometry(box.size[0], box.size[2]),
        at: [box.at[0], box.at[1] - box.size[1] / 2 - 0.01, box.at[2]] as [number, number, number],
        turn: [Math.PI / 2, 0, 0] as [number, number, number],
      })),
    [],
  );
  const pylons = useMerged(
    () =>
      [-FLANK_X, FLANK_X].flatMap((x) =>
        Array.from({ length: 7 }, (_, i) => ({
          geometry: new THREE.BoxGeometry(0.5, GALLERY - 0.3, 0.5),
          at: [x, GALLERY / 2 - 0.1, -24 + i * 9] as [number, number, number],
        })),
      ),
    [],
  );
  const pylonLines = useMerged(
    () =>
      [-FLANK_X, FLANK_X].flatMap((x) =>
        Array.from({ length: 7 }, (_, i) => ({
          geometry: new THREE.PlaneGeometry(0.05, GALLERY - 0.5),
          at: [x + 0.26, GALLERY / 2 - 0.1, -24 + i * 9] as [number, number, number],
          turn: [0, Math.PI / 2, 0] as [number, number, number],
        })),
      ),
    [],
  );
  return (
    <group name="gallery">
      {/* The decks, and their lit undersides so the walkway glows over the
          plaza: two pieces for the whole gallery. */}
      <mesh geometry={decks}>
        <Deck colour={MATERIAL.stoneLight} roughness={0.4} />
      </mesh>
      <mesh geometry={undersides}>
        <Glow colour={GALLERY_LIGHT} opacity={0.18} />
      </mesh>

      {GALLERY_RAILS.map((box, index) => (
        <BuiltWall key={`rail-${index}`} at={box.at} size={box.size} texture={texture} colour={GALLERY_LIGHT} fins={false} />
      ))}

      {/* The pylons that carry each flank, and the lit line on each. */}
      <mesh geometry={pylons}>
        <meshLambertMaterial color={MATERIAL.structureLight} />
      </mesh>
      <mesh geometry={pylonLines}>
        <Glow colour={GALLERY_LIGHT} opacity={0.35} />
      </mesh>

      <Ramp />

      {/* The museum: artwork hanging in the air beyond the flanks, over the
          water — frames of pale metal around plates of violet glass, at
          different sizes and heights, and two kinetic sculptures turning. */}
      <GalleryArt />

      <LightLine at={[-FLANK_X + 1.9, GALLERY + 0.03, -7.3]} length={37} axis="z" colour={GALLERY_LIGHT} intensity={0.6} />
      <LightLine at={[FLANK_X - 1.9, GALLERY + 0.03, 2]} length={56} axis="z" colour={GALLERY_LIGHT} intensity={0.6} />
      <LightLine at={[0, GALLERY + 0.03, -24.1]} length={2 * FLANK_X - 4} colour={GALLERY_LIGHT} intensity={0.6} />
      <LightWash at={[-FLANK_X + 1.1, GALLERY + 0.02, -7.3]} size={[2.4, 37]} texture={texture} colour={GALLERY_LIGHT} intensity={0.14} />
      <LightWash at={[FLANK_X - 1.1, GALLERY + 0.02, 2]} size={[2.4, 56]} texture={texture} colour={GALLERY_LIGHT} intensity={0.14} />

      <Plinth at={[RAMP_FOOT[0], 0.09, RAMP_FOOT[2] + 0.6]} size={[4.4, 0.18, 1.2]} texture={texture} colour={GALLERY_LIGHT} />
      <LightLine at={[RAMP_FOOT[0], 0.2, RAMP_FOOT[2] + 0.62]} length={4.2} colour={GALLERY_LIGHT} intensity={0.7} />
      <LightWash at={[RAMP_FOOT[0], 0.03, RAMP_FOOT[2] - 1.4]} size={[4.4, 5]} texture={texture} colour={GALLERY_LIGHT} intensity={0.18} />
    </group>
  );
}

const ART: { at: [number, number, number]; w: number; h: number; turn: number }[] = [
  { at: [-40, 13, -14], w: 7, h: 4.4, turn: 0.35 },
  { at: [-44, 17.5, 2], w: 4.2, h: 6.4, turn: 0.2 },
  { at: [-41, 11.5, 18], w: 9, h: 5, turn: 0.45 },
  { at: [-47, 22, -26], w: 5, h: 5, turn: 0.1 },
  { at: [40, 12.5, -20], w: 6.5, h: 4, turn: -0.4 },
  { at: [45, 18, -4], w: 4.8, h: 7.2, turn: -0.25 },
  { at: [42, 14, 12], w: 8.4, h: 4.8, turn: -0.35 },
  { at: [48, 24, 28], w: 5.6, h: 5.6, turn: -0.15 },
  { at: [-36, 26, 36], w: 6, h: 3.6, turn: 0.6 },
  { at: [36, 28, 40], w: 3.8, h: 6, turn: -0.6 },
];

function GalleryArt() {
  const frames = useMerged(
    () =>
      ART.flatMap((art) => {
        const t = 0.14;
        return [
          { geometry: new THREE.BoxGeometry(art.w + t, t, t), at: [0, art.h / 2, 0] as [number, number, number] },
          { geometry: new THREE.BoxGeometry(art.w + t, t, t), at: [0, -art.h / 2, 0] as [number, number, number] },
          { geometry: new THREE.BoxGeometry(t, art.h + t, t), at: [-art.w / 2, 0, 0] as [number, number, number] },
          { geometry: new THREE.BoxGeometry(t, art.h + t, t), at: [art.w / 2, 0, 0] as [number, number, number] },
        ].map((part) => {
          const g = part.geometry;
          g.translate(...part.at);
          g.rotateY(art.turn);
          g.translate(...art.at);
          return { geometry: g };
        });
      }),
    [],
  );
  const plates = useMerged(
    () =>
      ART.map((art) => {
        const g = new THREE.PlaneGeometry(art.w, art.h);
        g.rotateY(art.turn);
        g.translate(...art.at);
        return { geometry: g };
      }),
    [],
  );
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.position.y = Math.sin(clock.elapsedTime * 0.25) * 0.25;
  });
  return (
    <group ref={group} name="gallery:art">
      <mesh geometry={frames}>
        <meshStandardMaterial color="#d9dee8" roughness={0.35} metalness={0.8} />
      </mesh>
      <mesh geometry={plates}>
        <meshPhysicalMaterial color="#8b72ff" transparent opacity={0.22} roughness={0.15} metalness={0.3} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Orbital at={[-42, 20, -6]} colour="#b9a7ff" scale={0.7} />
      <Orbital at={[44, 21, 6]} colour="#c2e4ff" scale={0.55} />
    </group>
  );
}

function Ramp() {
  const run = Math.abs(RAMP_RUN.from - RAMP_RUN.to);
  const length = Math.hypot(run, RAMP_RUN.rise);
  const pitch = Math.atan2(RAMP_RUN.rise, run);
  const centre: [number, number, number] = [
    RAMP_RUN.x,
    RAMP_RUN.rise / 2 - 0.16,
    (RAMP_RUN.from + RAMP_RUN.to) / 2,
  ];
  return (
    <group>
      <mesh position={centre} rotation={[pitch, 0, 0]}>
        <boxGeometry args={[RAMP_RUN.width, 0.32, length]} />
        <meshLambertMaterial color={MATERIAL.deck} />
      </mesh>
      <mesh
        position={[centre[0] + RAMP_RUN.width / 2 - 0.12, centre[1] + 0.18, centre[2]]}
        rotation={[pitch - Math.PI / 2, 0, Math.PI / 2]}
      >
        <planeGeometry args={[length, 0.06]} />
        <Glow colour={GALLERY_LIGHT} opacity={0.6} />
      </mesh>
      <mesh
        position={[centre[0] - RAMP_RUN.width / 2 + 0.12, centre[1] + 0.18, centre[2]]}
        rotation={[pitch - Math.PI / 2, 0, Math.PI / 2]}
      >
        <planeGeometry args={[length, 0.06]} />
        <Glow colour={GALLERY_LIGHT} opacity={0.6} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------- hub */

const TOWERS: [number, number, number][] = [[-20, 0, -22], [-20, 0, 26], [20, 0, -22], [20, 0, 26]];

/**
 * The landmark's skyline: spires rising out of the sea around the hub —
 * a dense group behind the gate framing the mark and the planet, and looser
 * ones at the corners, taller to the east than the west so the cluster is a
 * skyline and not a fence. Foot, height, girth; every foot is below the
 * waterline.
 */
const HUB_SPIRES: [number, number, number, number, number][] = [
  /* Behind the gate, either side of the bridge north: the landmark's own
     towers, the tallest to the east. */
  [-15, -4, -27.5, 62, 7],
  [16.5, -4, -27.5, 84, 8.5],
  [-25, -4, -27, 44, 5.2],
  [26, -4, -27, 52, 5.6],
  /* The corners, and one lone tower west. */
  [38, -4, -38, 104, 10],
  [-39, -4, -36, 70, 7.5],
  [37.5, -4, 42, 58, 6.5],
  [-37, -4, 44, 88, 8],
  [-43, -4, 8, 36, 4.5],
];

/**
 * The campus round the plaza. Every one stands off the rim over the water,
 * clear of the four bridges; the tiers step back, the tall ones carry a
 * crown, and no two are the same height.
 */
const HUB_FACADES: Facade[] = [
  { at: [-41, -3, -16], size: [10, 8], tiers: [8, 6], turn: Math.PI / 2, light: MATERIAL.warmWhite },
  { at: [-42, -3, 26], size: [9, 8], tiers: [14, 5, 4], turn: Math.PI / 2 },
  { at: [41, -3, -14], size: [10, 8], tiers: [8, 5], turn: -Math.PI / 2 },
  { at: [42, -3, 14], size: [9, 8], tiers: [12, 6], turn: -Math.PI / 2 },
  { at: [-18, -3, 43], size: [12, 9], tiers: [9, 5], turn: Math.PI },
  { at: [20, -3, 44], size: [10, 9], tiers: [12, 6, 3], turn: Math.PI },
];
const SHIPPED_FACADES: Facade[] = [
  { at: [-41, -3, -40], size: [10, 8], tiers: [10, 6], turn: Math.PI / 2, light: "#ffd9c4" },
  { at: [-42, -3, -58], size: [9, 8], tiers: [16, 6], turn: Math.PI / 2 },
  { at: [41, -3, -36], size: [10, 8], tiers: [8, 6], turn: -Math.PI / 2 },
  { at: [42, -3, -50], size: [9, 8], tiers: [13, 5], turn: -Math.PI / 2 },
];
const BOARDS_FACADES: Facade[] = [
  { at: [50, -3, -89], size: [14, 9], tiers: [10, 6], turn: 0, light: "#cfe6ff" },
  { at: [72, -3, -90], size: [10, 9], tiers: [15, 7], turn: 0 },
  { at: [46, -3, -44], size: [12, 8], tiers: [8], turn: Math.PI },
  { at: [70, -3, -43], size: [10, 8], tiers: [11, 5], turn: Math.PI },
];
const LABS_FACADES: Facade[] = [
  { at: [50, -3, -37], size: [12, 9], tiers: [9, 5], turn: 0, light: "#c9b8ff" },
  { at: [72, -3, -38], size: [10, 9], tiers: [14, 6], turn: 0 },
  { at: [52, -3, 37], size: [12, 9], tiers: [11, 6], turn: Math.PI },
  { at: [74, -3, 38], size: [9, 8], tiers: [7], turn: Math.PI },
];
const SYSTEMS_FACADES: Facade[] = [
  { at: [-52, -3, -35], size: [12, 9], tiers: [10, 6], turn: 0, light: "#a8f0f0" },
  { at: [-74, -3, -36], size: [10, 9], tiers: [15, 7], turn: 0 },
  { at: [-54, -3, 35], size: [12, 9], tiers: [8], turn: Math.PI },
  { at: [-76, -3, 36], size: [9, 9], tiers: [12, 5], turn: Math.PI },
];
const ARCHIVE_FACADES: Facade[] = [
  { at: [34, -3, 60], size: [9, 9], tiers: [9, 5], turn: -Math.PI / 2, light: "#9fb0ff" },
  { at: [-34, -3, 66], size: [9, 9], tiers: [12, 6], turn: Math.PI / 2 },
];

const HUB_TREES: [number, number, number][] = [
  [-32.4, -0.3, -20], [-33, -0.3, -9], [-32.2, -0.3, 10], [-33, -0.3, 19], [-32.4, -0.3, 27],
  [32.4, -0.3, -16], [33, -0.3, -6], [32.2, -0.3, 12], [33, -0.3, 22], [32.6, -0.3, 30],
  [-14, -0.3, 36.6], [14.5, -0.3, 36.6], [-23, -0.3, 36.2], [23, -0.3, 36.2],
  [-9.5, -0.3, -32.6], [9.5, -0.3, -32.6],
];

export function Hub({ texture, locale = "tr" }: { texture: THREE.Texture; locale?: Locale }) {
  const accent = getZone("hub").accent;
  const rings = useMerged(() => [14, 22, 30].map((r) => ({ geometry: new THREE.RingGeometry(r, r + 0.06, 96) })), []);
  return (
    <group name="hub">
      <Island at={[0, 2]} size={[60, 64]} runner={[CORRIDOR + 4, 64]} glass texture={texture} colour={accent} depth={3.2} />
      {/* The buildings of the campus, standing round the plaza over the
          water: stepped masses with bands of dark glass and lit parapets. */}
      <Facades list={HUB_FACADES} />

      {/* Concentric rings on the deck around the mark, in place of a grid —
          three rings, one draw. */}
      <mesh geometry={rings} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Glow colour={MATERIAL.warmWhite} opacity={0.26} />
      </mesh>
      {/* A pool of warm light on the plaza under the mark. */}
      <LightWash at={[0, 0.02, 0]} size={[34, 30]} texture={texture} colour={MATERIAL.warmWhite} intensity={0.1} />

      <Gate texture={texture} />
      {/* The landmark's ring: a great wheel of brushed metal suspended behind
          the mark, a line of light around its inner edge — the circular
          form the reference world hangs over its centre. */}
      <group position={[0, 15.5, -11.5]} rotation={[0.06, 0, 0]} name="landmark-ring">
        <mesh>
          <torusGeometry args={[12, 0.55, 10, 96]} />
          <meshStandardMaterial color="#aeb8c4" roughness={0.35} metalness={0.85} />
        </mesh>
        <mesh position={[0, 0, 0.35]}>
          <torusGeometry args={[11.4, 0.09, 6, 96]} />
          <Glow colour={MATERIAL.warmWhite} opacity={0.9} />
        </mesh>
        <mesh position={[0, 0, -0.35]}>
          <torusGeometry args={[11.4, 0.09, 6, 96]} />
          <Glow colour={MATERIAL.cyan} opacity={0.5} />
        </mesh>
        {/* Four spokes of stone to the hub of the wheel. */}
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} rotation={[0, 0, (k * Math.PI) / 4 + Math.PI / 8]}>
            <boxGeometry args={[23.4, 0.22, 0.3]} />
            <meshStandardMaterial color="#26344f" roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[1.4, 1.4, 0.7, 12]} />
          <meshStandardMaterial color="#c9d2de" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>

      {/* The skyline behind and around the landmark. */}
      <Spires at={HUB_SPIRES} />

      {/* Four sculptural pylons at the corners of the plaza. */}
      <LightTowers at={TOWERS} height={19} />

      {/* Trees along the flanks and around the arrival: dark green, and the
          blossom the hub is known for. */}
      <Trees at={HUB_TREES} blossom={0.55} rock />

      {/* The four ways out, each lit in the colour of what is beyond it. */}
      <Threshold at={[0, 0, -30]} width={CORRIDOR} height={7.5} zone="shipped" texture={texture} />
      <Threshold at={[0, 0, 34]} width={CORRIDOR} height={5.4} zone="archive" texture={texture} facing={-1} />
      <Threshold at={[30, 0, 0]} width={CORRIDOR} height={6.4} zone="labs" texture={texture} turn={Math.PI / 2} />
      <Threshold at={[-30, 0, 0]} width={CORRIDOR} height={6.4} zone="systems" texture={texture} turn={Math.PI / 2} facing={-1} />

      {/* Wayfinding: a totem by the arrival, on the right, with the five
          destinations — the same five the rail and the number keys use. */}
      <Wayfinding locale={locale} />

      {/* Where the visitor arrives: a lit ring on the deck. */}
      <mesh position={[0, 0.02, 24]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 1.72, 48]} />
        <Glow colour={accent} opacity={0.75} />
      </mesh>
      <mesh position={[0, 0.015, 24]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.6, 2.64, 48]} />
        <Glow colour={accent} opacity={0.3} />
      </mesh>
      <Plinth at={[0, 0.2, 29.5]} size={[7, 0.4, 1.4]} texture={texture} colour={accent} />
    </group>
  );
}

/** A portal that says where it goes, in the colour of the district beyond. */
function Threshold({
  at,
  width,
  height,
  zone,
  texture,
  turn = 0,
  facing = 1,
}: {
  at: [number, number, number];
  width: number;
  height: number;
  zone: ZoneId;
  texture: THREE.Texture;
  turn?: number;
  facing?: number;
}) {
  const accent = getZone(zone).accent;
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <Doorway at={[0, 0, 0]} width={width} height={height} colour={accent} />
      <mesh position={[0, 0.04, facing * 1.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, 0.08]} />
        <Glow colour={accent} opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.02, facing * 4.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 3, 8]} />
        <meshBasicMaterial map={texture} color={accent} transparent opacity={0.1} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------- stations */

/**
 * Each project's station is a different place.
 *
 * DP Pano is education technology: structured, cool, silver and blue, a
 * frame of brushed metal carrying its boards. Meetzy is events and people:
 * round, warm, peach against the blue, with an orbital ring turning over
 * the gathering. Erden Davetiye is invitations: cream stone, a delicate
 * arch, blush and terracotta, blossom either side. The brand accents on the
 * cards stay the projects' own; these are the colours their islands are lit
 * in.
 */
type StationTheme = {
  light: string;
  frame: string;
  wash: string;
  stone: string;
  shape: "structured" | "orbital" | "arch";
};

const STATION_THEMES: Record<string, StationTheme> = {
  dppano: { light: "#6fcbff", frame: "#aeb8c4", wash: "#2d8cff", stone: "#1a2a48", shape: "structured" },
  meetzy: { light: "#f2a889", frame: "#2c3448", wash: "#f2a889", stone: "#1f2440", shape: "orbital" },
  erden: { light: "#e7c7b5", frame: "#f4e9dc", wash: "#c97a65", stone: "#3a3030", shape: "arch" },
};
const DEFAULT_THEME: StationTheme = STATION_THEMES.dppano!;

/**
 * A project's station.
 *
 * A round dais with a ring of light, the project's real screens hanging over
 * it as a row of holograms, a tag floating above with the project's number
 * and category, and a thin beacon rising from the middle so the station can
 * be found from any island. The guides stand in front of it.
 */
function Station({
  installation,
  index,
  at,
  turn,
  texture,
  height = 4.6,
  spacing = 4.4,
  photoHeight = 3.6,
  facing,
}: {
  installation: PreparedInstallation;
  index: number;
  at: [number, number, number];
  /** Which way the screens face. */
  turn: number;
  texture: THREE.Texture;
  height?: number;
  spacing?: number;
  photoHeight?: number;
  /** Where the visitor approaches from, for the tag. */
  facing: number;
}) {
  const beacon = useRef<THREE.Mesh>(null);
  const holo = useRef<THREE.Group>(null);
  const outer = useRef<THREE.Mesh>(null);
  const sheen = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (beacon.current) {
      const m = beacon.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.22 + Math.sin(t * 1.1 + index) * 0.08;
    }
    if (holo.current) holo.current.position.y = height + Math.sin(t * 0.6 + index) * 0.08;
    if (outer.current) outer.current.rotation.z = t * 0.05 * (index % 2 ? -1 : 1);
    /* A refresh: a thin band of light sweeping down the screens every few
       seconds, the hologram re-drawing itself. */
    if (sheen.current) {
      const cycle = (t * 0.35 + index * 0.4) % 1;
      sheen.current.position.y = photoHeight / 2 - cycle * photoHeight;
      (sheen.current.material as THREE.MeshBasicMaterial).opacity = cycle < 0.85 ? 0.22 : 0;
    }
  });
  const theme = STATION_THEMES[installation.id] ?? DEFAULT_THEME;
  const accent = theme.light;
  const photos = installation.photos;
  const span = spacing * (photos.length - 1);
  const plates = useMerged(
    () =>
      photos.map((photo, i) => ({
        geometry: new THREE.PlaneGeometry(photoHeight * (photo.width / photo.height) + 0.4, photoHeight + 0.4),
        at: [-span / 2 + i * spacing, 0, -0.08] as [number, number, number],
      })),
    [photos, photoHeight, span, spacing],
  );
  const threads = useMerged(
    () =>
      photos.map((_, i) => ({
        geometry: new THREE.BoxGeometry(0.03, 4.4, 0.03),
        at: [-span / 2 + i * spacing, photoHeight / 2 + 2.2, -0.1] as [number, number, number],
      })),
    [photos, photoHeight, span, spacing],
  );

  return (
    <group position={at} name={`station:${installation.id}`}>
      {/* The dais: polished stone in the station's own colour. */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[5.4, 5.8, 0.36, 40]} />
        <meshStandardMaterial color={theme.stone} roughness={0.35} metalness={0.5} />
      </mesh>
      {/* A wash of the station's light on the deck around it. */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[11, 48]} />
        <meshBasicMaterial map={texture} color={theme.wash} transparent opacity={0.16} toneMapped={false} depthWrite={false} />
      </mesh>
      {/* The station's architecture. */}
      {theme.shape === "structured" ? (
        <group position={[0, 0, 0]} rotation={[0, turn, 0]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (span / 2 + spacing * 0.62), (height + photoHeight / 2 + 1.2) / 2, -0.4]}>
              <boxGeometry args={[0.36, height + photoHeight / 2 + 1.2, 0.36]} />
              <meshStandardMaterial color={theme.frame} roughness={0.35} metalness={0.8} />
            </mesh>
          ))}
          <mesh position={[0, height + photoHeight / 2 + 1.3, -0.4]}>
            <boxGeometry args={[span + spacing * 1.24 + 0.36, 0.3, 0.5]} />
            <meshStandardMaterial color={theme.frame} roughness={0.35} metalness={0.8} />
          </mesh>
          <mesh position={[0, height + photoHeight / 2 + 1.3, -0.12]}>
            <planeGeometry args={[span + spacing * 1.24, 0.06]} />
            <Glow colour={accent} opacity={0.9} />
          </mesh>
        </group>
      ) : null}
      {theme.shape === "orbital" ? (
        <>
          <Orbital at={[0, height + photoHeight / 2 + 4.2, 0]} colour={accent} scale={0.55} />
          <TiltedRing at={[0, 1.6, 0]} radius={7.2} colour={accent} tilt={0.18} />
        </>
      ) : null}
      {theme.shape === "arch" ? (
        <group rotation={[0, turn, 0]}>
          <Arch at={[0, 0, -1.2]} radius={Math.max(7.6, span / 2 + 2.6)} tube={0.6} stone={theme.frame} colour={theme.wash} sweep={Math.PI * 0.92} />
          <Arch at={[0, 0, -2.6]} radius={Math.max(8.8, span / 2 + 3.6)} tube={0.42} stone={theme.frame} colour={accent} sweep={Math.PI * 0.8} />
        </group>
      ) : null}
      <mesh position={[0, 0.37, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.1, 5.36, 48]} />
        <Glow colour={accent} opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.375, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.26, 48]} />
        <Glow colour={accent} opacity={0.35} />
      </mesh>
      {/* A wider ring of light turning slowly on the deck around the dais —
          the station's own halo. Dashed, so the turning shows. */}
      <mesh ref={outer} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.4, 7.6, 12, 1, 0, Math.PI * 2]} />
        <meshBasicMaterial color={accent} transparent opacity={0.22} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* The lit face of the dais, facing the approach. */}
      <mesh position={[0, 0.18, 0]} rotation={[0, facing, 0]}>
        <mesh position={[0, 0, 5.62]}>
          <planeGeometry args={[7.2, 0.28]} />
          <Glow colour={accent} opacity={0.5} />
        </mesh>
      </mesh>
      {/* The number and the name, on the rim of the dais. */}
      <Label
        lines={[`${String(index).padStart(2, "0")}`, installation.name]}
        at={[Math.sin(facing) * 5.95, 0.19, Math.cos(facing) * 5.95]}
        turn={facing}
        height={0.34}
        accent={accent}
        colour={MATERIAL.white}
        align="center"
      />
      {/* The console the guides stand at: a low lit table with a small
          data plate, between them and the screens. */}
      <group position={[Math.sin(facing) * -2.2, 0, Math.cos(facing) * -2.2]} rotation={[0, facing, 0]}>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[2.6, 0.08, 0.9]} />
          <meshStandardMaterial color={theme.frame} roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[2.2, 0.8, 0.6]} />
          <meshStandardMaterial color={theme.stone} roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.4, 0.7]} />
          <Glow colour={accent} opacity={0.35} />
        </mesh>
        {/* A small hologram rising off the table. */}
        <mesh position={[0, 1.4, 0]} rotation={[-0.35, 0, 0]}>
          <planeGeometry args={[1.6, 0.7]} />
          <meshBasicMaterial color={accent} transparent opacity={0.16} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* The screens, hanging. Real captures of the shipped product, each
          in a dark-glass display with a brushed frame and a soft lit edge. */}
      <group ref={holo} position={[0, height, 0]} rotation={[0, turn, 0]}>
        {photos.map((photo, i) => {
          const w = photoHeight * (photo.width / photo.height);
          const x = -span / 2 + i * spacing;
          return (
            <group key={photo.src} position={[x, 0, 0]}>
              <Screen size={[w, photoHeight]} accent={accent} frame={theme.frame} />
              <PhotoSurface src={photo.src} size={[w - 0.08, photoHeight - 0.08]} />
            </group>
          );
        })}
        {/* The holograms' own light — a thin plate behind each screen — and
            the threads they hang from: one piece each for the whole row. */}
        <mesh geometry={plates}>
          <Glow colour={accent} opacity={0.12} additive />
        </mesh>
        <mesh geometry={threads}>
          <Glow colour={accent} opacity={0.35} />
        </mesh>
        {/* The rail above them all. */}
        <Service at={[0, photoHeight / 2 + 4.4, -0.1]} length={span + spacing} colour={accent} />
        {/* The refresh band. */}
        <mesh ref={sheen} position={[0, 0, 0.03]}>
          <planeGeometry args={[span + spacing, 0.12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        {/* Floating interface layers: two slim translucent plates offset
            behind and above the row, drifting. */}
        <mesh position={[-span / 2 - 1.2, photoHeight * 0.55, -0.8]} rotation={[0, 0.3, 0]}>
          <planeGeometry args={[1.8, 0.5]} />
          <meshBasicMaterial color={accent} transparent opacity={0.22} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[span / 2 + 1.4, -photoHeight * 0.3, -0.6]} rotation={[0, -0.3, 0]}>
          <planeGeometry args={[2.2, 0.4]} />
          <meshBasicMaterial color={accent} transparent opacity={0.18} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* The sign: the project's name, large, and what it is, small. */}
      <Label
        lines={[installation.name, installation.category.toUpperCase()]}
        at={[0, height + photoHeight / 2 + 5.6, 0]}
        turn={facing}
        height={1.3}
        accent={accent}
        align="center"
      />

      {/* The beacon. */}
      <mesh ref={beacon} position={[0, 30, 0]}>
        <cylinderGeometry args={[0.05, 0.12, 60, 8, 1, true]} />
        <meshBasicMaterial color={accent} transparent opacity={0.25} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* --------------------------------------------------------------- shipped */

export function Shipped({
  texture,
  installations,
}: {
  texture: THREE.Texture;
  installations: PreparedInstallation[];
}) {
  const meetzy = installations.find((one) => one.id === "meetzy");
  const erden = installations.find((one) => one.id === "erden");
  const accent = getZone("shipped").accent;

  return (
    <group name="shipped">
      <Island at={[0, -48]} size={[60, 52]} runner={[CORRIDOR + 6, 52]} glass texture={texture} colour={accent} depth={3} deck="#0b142c" />
      <Facades list={SHIPPED_FACADES} />
      <DistrictLine zone="shipped" at={[0, -48]} length={50} intensity={0.55} />
      <Trees
        at={[[-32.4, -0.3, -30], [-33, -0.3, -42], [-32.5, -0.3, -54], [-33, -0.3, -64], [32.4, -0.3, -32], [33, -0.3, -46], [32.5, -0.3, -58], [33, -0.3, -27], [-6, -0.3, -76.6], [6, -0.3, -76.6], [-16, -0.3, -76.8], [16, -0.3, -76.8]]}
        blossom={0.5}
        rock
      />
      {/* Spires beyond the far rim, so the hall has a skyline of its own. */}
      <Spires at={[[-34, -4, -70, 48, 3.2], [35, -4, -72, 60, 3.6], [-14, -4, -80, 36, 2.6], [16, -4, -81, 42, 2.8], [-38, -4, -50, 30, 2.4]]} />

      {[-1, 1].map((side) => (
        <Service key={side} at={[side * 21, 9.4, -48]} length={44} turn={Math.PI / 2} colour={accent} />
      ))}

      {/* Each side of the hall is lit for its project: peach for Meetzy,
          cream for Erden, on a floor that stays the same stone. */}
      <LightWash at={[-16, 0.03, -44]} size={[24, 30]} texture={texture} colour="#f2a889" intensity={0.12} />
      <LightWash at={[16, 0.03, -44]} size={[24, 30]} texture={texture} colour="#e7c7b5" intensity={0.12} />
      {/* Blossom around Erden, evergreens around Meetzy. */}
      <Trees at={[[23.5, 0, -31.5], [24, 0, -57], [23.5, 0, -44]]} blossom={1} />
      <Trees at={[[-23.5, 0, -31.5], [-24, 0, -57]]} blossom={0} />

      {/* Meetzy — 02 — on the west; its screens face the axis. */}
      {meetzy ? (
        <Station installation={meetzy} index={2} at={[-14, 0, -44]} turn={Math.PI / 2} texture={texture} facing={Math.PI / 2} />
      ) : null}

      {/* Erden — 03 — on the east. */}
      {erden ? (
        <Station installation={erden} index={3} at={[14, 0, -44]} turn={-Math.PI / 2} texture={texture} facing={-Math.PI / 2} />
      ) : null}
    </group>
  );
}

/* ---------------------------------------------------------------- boards */

export function Boards({
  texture,
  installation,
}: {
  texture: THREE.Texture;
  installation?: PreparedInstallation;
}) {
  const accent = getZone("boards").accent;
  return (
    <group name="boards">
      <Island at={[59, -66]} size={[50, 24]} runner={[50, CORRIDOR]} glass texture={texture} colour={accent} depth={2.6} deck="#091629" />
      <Facades list={BOARDS_FACADES} />
      <DistrictLine zone="boards" at={[59, -66]} length={46} intensity={0.45} />
      <Trees at={[[40, -0.3, -80.6], [52, -0.3, -80.8], [66, -0.3, -80.6], [78, -0.3, -80.8], [80, -0.3, -51.4], [66, -0.3, -51.2], [52, -0.3, -51.4], [42, -0.3, -51.2]]} blossom={0.25} rock />
      <Spires at={[[88, -4, -66, 52, 3.6], [86, -4, -78, 34, 2.8], [60, -4, -84, 40, 3]]} />

      {[-1, 1].map((side) => (
        <Service key={side} at={[59, 7.2, -66 + side * 10.6]} length={44} colour={accent} />
      ))}

      {/* DP Pano — 01 — its boards hang over the hall, facing the way in. */}
      {installation ? (
        <Station
          installation={installation}
          index={1}
          at={[62, 0, -66]}
          turn={-Math.PI / 2}
          texture={texture}
          facing={-Math.PI / 2}
          spacing={7.2}
          photoHeight={3.8}
          height={4.4}
        />
      ) : null}
    </group>
  );
}

/* ------------------------------------------------------------ wayfinding */

/**
 * The totem at the entrance: a slab of dark glass on a brushed post, the
 * five destinations down it, each row with a number, a name and a line of
 * light that brightens in turn — "look here", not an advertisement. It
 * stands to the right of the arrival, beside the section panels, and clear
 * of the walkway.
 */
const TOTEM_AT: [number, number, number] = [11.6, 0, 34.2];
const TOTEM_TURN = -Math.PI / 2 - 0.42;

function Wayfinding({ locale }: { locale: Locale }) {
  const rows = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    rows.current.forEach((row, i) => {
      if (!row) return;
      /* Each row on its own three-second cycle, a fifth of a cycle apart. */
      const k = 0.5 + 0.5 * Math.sin((t / 3.2) * Math.PI * 2 - i * 1.25);
      (row.material as THREE.MeshBasicMaterial).opacity = 0.18 + k * k * 0.5;
    });
  });
  const rowH = 0.56;
  const top = 3.6;
  return (
    <group position={TOTEM_AT} rotation={[0, TOTEM_TURN, 0]} name="wayfinding">
      {/* The post and the slab. */}
      <mesh position={[0, 1.95, -0.14]}>
        <boxGeometry args={[0.16, 3.9, 0.16]} />
        <meshStandardMaterial color="#aeb8c4" roughness={0.35} metalness={0.85} />
      </mesh>
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[2.1, 3.7, 0.08]} />
        <meshPhysicalMaterial color="#0a1020" roughness={0.15} metalness={0.5} transparent opacity={0.86} envMapIntensity={1.2} />
      </mesh>
      <mesh position={[0, 4.22, 0]}>
        <boxGeometry args={[2.14, 0.04, 0.1]} />
        <Glow colour={MATERIAL.warmWhite} opacity={0.9} />
      </mesh>
      <Label lines={["ARCHON WORLD"]} at={[0, top + 0.42, 0.05]} height={0.22} colour={MATERIAL.warmWhite} accent={MATERIAL.warmWhite} align="center" />
      {WORLD_DESTINATIONS.map((dest, i) => {
        const y = top - i * rowH;
        return (
          <group key={dest.id} position={[0, y, 0.05]}>
            <mesh
              ref={(node) => {
                rows.current[i] = node;
              }}
              position={[-0.9, 0, 0]}
            >
              <planeGeometry args={[0.05, rowH * 0.62]} />
              <meshBasicMaterial color={MATERIAL.cyan} transparent opacity={0.3} toneMapped={false} depthWrite={false} />
            </mesh>
            <Label
              lines={[`${String(dest.number).padStart(2, "0")}  ${t(dest.name, locale).toUpperCase()}`, t(dest.subtitle, locale)]}
              at={[0.1, 0, 0]}
              height={rowH * 0.78}
              colour={MATERIAL.white}
              accent={MATERIAL.warmWhite}
              align="center"
            />
          </group>
        );
      })}
    </group>
  );
}

/* ---------------------------------------------------------------- screen */

/**
 * A premium architectural display: dark glass with a low-roughness face
 * that takes the world's reflections, a thin brushed-metal frame, a soft
 * lit edge in the station's colour, and a faint glow on the air behind it.
 * The screenshot is laid on the glass by `PhotoSurface`.
 */
function Screen({ size, accent, frame }: { size: [number, number]; accent: string; frame: string }) {
  const [w, h] = size;
  const t = 0.06;
  const frameGeometry = useMerged(
    () => [
      { geometry: new THREE.BoxGeometry(w + t * 2, t, 0.1), at: [0, h / 2 + t / 2, -0.02] as [number, number, number] },
      { geometry: new THREE.BoxGeometry(w + t * 2, t, 0.1), at: [0, -h / 2 - t / 2, -0.02] as [number, number, number] },
      { geometry: new THREE.BoxGeometry(t, h, 0.1), at: [-w / 2 - t / 2, 0, -0.02] as [number, number, number] },
      { geometry: new THREE.BoxGeometry(t, h, 0.1), at: [w / 2 + t / 2, 0, -0.02] as [number, number, number] },
    ],
    [w, h],
  );
  const edgeGeometry = useMerged(
    () => [
      { geometry: new THREE.PlaneGeometry(w + t * 2, 0.02), at: [0, h / 2 + t + 0.01, 0.01] as [number, number, number] },
      { geometry: new THREE.PlaneGeometry(w + t * 2, 0.02), at: [0, -h / 2 - t - 0.01, 0.01] as [number, number, number] },
    ],
    [w, h],
  );
  return (
    <group>
      {/* The glass body. */}
      <mesh position={[0, 0, -0.035]}>
        <boxGeometry args={[w, h, 0.06]} />
        <meshPhysicalMaterial color="#070d18" roughness={0.12} metalness={0.5} envMapIntensity={1.4} />
      </mesh>
      <mesh geometry={frameGeometry}>
        <meshStandardMaterial color={frame} roughness={0.32} metalness={0.85} />
      </mesh>
      <mesh geometry={edgeGeometry}>
        <Glow colour={accent} opacity={0.85} />
      </mesh>
      {/* The white LED behind the glass: a line of light just outside the
          frame, a halo on the air behind. */}
      <Backlight size={size} strength={0.8} inset={t + 0.01} />
    </group>
  );
}

/* --------------------------------------------------------------- orbital */

/** A ring of light lying almost flat, tilted, turning: a gathering's halo. */
function TiltedRing({ at, radius, colour, tilt }: { at: [number, number, number]; radius: number; colour: string; tilt: number }) {
  const ring = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.y += Math.min(delta, 0.05) * 0.1;
  });
  return (
    <group ref={ring} position={at}>
      <mesh rotation={[Math.PI / 2 + tilt, 0, 0]}>
        <torusGeometry args={[radius, 0.06, 6, 96]} />
        <Glow colour={colour} opacity={0.75} />
      </mesh>
      <mesh rotation={[Math.PI / 2 + tilt, 0, 0]}>
        <torusGeometry args={[radius, 0.5, 6, 96]} />
        <meshBasicMaterial color={colour} transparent opacity={0.08} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/** Three rings of light turning about each other: a kinetic sculpture. */
function Orbital({ at, colour, scale = 1 }: { at: [number, number, number]; colour: string; scale?: number }) {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  const c = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    if (a.current) a.current.rotation.x += d * 0.25;
    if (b.current) {
      b.current.rotation.y += d * 0.18;
      b.current.rotation.z += d * 0.07;
    }
    if (c.current) c.current.rotation.z -= d * 0.12;
  });
  return (
    <group position={at} scale={[scale, scale, scale]}>
      <mesh ref={a}>
        <torusGeometry args={[6, 0.14, 8, 72]} />
        <meshStandardMaterial color="#d9dee8" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh ref={b} rotation={[0.6, 0, 0]}>
        <torusGeometry args={[4.4, 0.1, 8, 64]} />
        <Glow colour={colour} opacity={0.85} />
      </mesh>
      <mesh ref={c} rotation={[1.2, 0.4, 0]}>
        <torusGeometry args={[7.6, 0.08, 8, 80]} />
        <Glow colour={MATERIAL.warmWhite} opacity={0.6} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.9, 16, 12]} />
        <Glow colour={colour} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.4, 16, 12]} />
        <meshBasicMaterial color={colour} transparent opacity={0.12} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ labs */

export function Labs({ texture }: { texture: THREE.Texture }) {
  const accent = getZone("labs").accent;
  return (
    <group name="labs">
      <Island at={[58, 0]} size={[50, 52]} runner={[24, 52]} texture={texture} colour={accent} depth={2.8} deck="#0e1129" />
      <Facades list={LABS_FACADES} />
      <DistrictLine zone="labs" at={[58, 0]} length={48} intensity={0.45} />
      <Trees at={[[40, -0.3, -28.6], [80, -0.3, -28.8], [80, -0.3, 28.6], [40, -0.3, 28.8], [52, -0.3, -28.4], [64, -0.3, 28.4], [85.6, -0.3, -12], [85.6, -0.3, 14]]} blossom={0.35} rock />
      <group position={[58, 0, 0]}>
        <Colonnade from={-16} to={16} step={16} x={-8} height={7} texture={texture} thickness={0.4} colour={accent} />
        <Colonnade from={-16} to={16} step={16} x={8} height={7} texture={texture} thickness={0.4} colour={accent} />
      </group>
      {/* Labs: an orbital sculpture over the middle of the island — three
          rings turning about each other, the ideas-in-motion of the place. */}
      <Orbital at={[58, 14, 0]} colour={accent} />
      <Spires at={[[86, -4, -18, 46, 3.2], [88, -4, 16, 58, 3.6], [84, -4, 0, 30, 2.6]]} />
      <Doorway at={[34, 0, 0]} width={CORRIDOR} height={6.4} turn={Math.PI / 2} colour={accent} />
      <Service at={[58, 7.6, -24]} length={46} turn={Math.PI / 2} colour={accent} />
      <Service at={[58, 7.6, 24]} length={46} turn={Math.PI / 2} colour={accent} />
    </group>
  );
}

/* --------------------------------------------------------------- systems */

export function Systems({ texture }: { texture: THREE.Texture }) {
  const accent = getZone("systems").accent;
  return (
    <group name="systems">
      <Island at={[-58, 0]} size={[50, 48]} runner={[26, 48]} texture={texture} colour={accent} depth={2.8} deck="#08121f" />
      <Facades list={SYSTEMS_FACADES} />
      <DistrictLine zone="systems" at={[-58, 0]} length={44} intensity={0.4} />
      <Trees at={[[-40, -0.3, -26.6], [-80, -0.3, -26.8], [-80, -0.3, 26.6], [-40, -0.3, 26.8], [-56, -0.3, -26.4], [-60, -0.3, 26.4], [-85.6, -0.3, -10], [-85.6, -0.3, 12]]} blossom={0.2} rock />
      <Spires at={[[-86, -4, -14, 40, 3], [-88, -4, 12, 52, 3.4]]} />
      <Plinth at={[-58, 0.24, 0]} size={[1.4, 0.48, 26]} texture={texture} colour={accent} />
      <Service at={[-70, 11.4, 0]} length={38} turn={Math.PI / 2} colour={accent} />
      <Service at={[-70, 1.1, 0]} length={38} turn={Math.PI / 2} colour={accent} />
      <Doorway at={[-34, 0, 0]} width={CORRIDOR} height={6.4} turn={Math.PI / 2} colour={accent} />
      <LightWash texture={texture} at={[-70, 0.04, 0]} size={[10, 44]} colour={accent} intensity={0.14} />
    </group>
  );
}

/* --------------------------------------------------------------- archive */

export function Archive({ texture }: { texture: THREE.Texture }) {
  const accent = getZone("archive").accent;
  return (
    <group name="archive">
      <Island at={[0, 61]} size={[48, 42]} runner={[16, 42]} texture={texture} colour={accent} depth={2.4} deck="#070b18" />
      <Facades list={ARCHIVE_FACADES} />
      <DistrictLine zone="archive" at={[0, 61]} length={38} intensity={0.28} />
      <Doorway at={[0, 0, 40]} width={CORRIDOR} height={4.4} colour={accent} />
      {/* The stacks: dark monoliths with one lit edge each. */}
      {[-1, 1].map((side) =>
        [48, 58, 68, 78].map((z) => (
          <group key={`${side}-${z}`} position={[side * 17, 0, z]}>
            <mesh position={[0, 2.2, 0]}>
              <boxGeometry args={[5, 4.4, 1.2]} />
              <meshLambertMaterial color={MATERIAL.structure} />
            </mesh>
            <mesh position={[side * -2.52, 2.2, 0]} rotation={[0, (side * -Math.PI) / 2, 0]}>
              <planeGeometry args={[1.2, 4.2]} />
              <Glow colour={accent} opacity={0.22} />
            </mesh>
          </group>
        )),
      )}
      <Service at={[0, 4.9, 61]} length={40} turn={Math.PI / 2} colour={accent} />
    </group>
  );
}

/* -------------------------------------------------------------- lighting */

/**
 * Four lights for the whole world.
 *
 * A hemisphere for sky-to-sea, a cool key from high above, a violet fill from
 * behind, and a soft baby-blue lamp that walks with the visitor. Everything
 * that looks like a light in the world is an unlit material; these four are
 * the only real ones, and their level follows the district's mood.
 */
const WHITE = new THREE.Color("#e4ecf8");

export function Lighting() {
  const lamp = useRef<THREE.PointLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const { camera } = useThree();

  useFrame(() => {
    const level = moodStore.current.light;
    if (lamp.current) {
      lamp.current.position.set(camera.position.x, camera.position.y + 2.2, camera.position.z);
      lamp.current.intensity = 26 * level;
    }
    if (hemi.current) {
      hemi.current.intensity = 1.35 * level;
      /* Lifted toward white, so light metal reads as light metal and not as
         a blue object; the blue is left to the edges and the sea. */
      hemi.current.color.copy(moodStore.current.sky).multiplyScalar(2.2).lerp(WHITE, 0.45);
    }
    if (key.current) {
      key.current.intensity = 2.2 * level;
      key.current.color.copy(moodStore.current.key);
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#3a6fc0", "#101c34", 1.35]} />
      {/* The key is warm and comes from the west, where the sky is lit; the
          fill is cool from the east; the violet comes from behind. */}
      <directionalLight ref={key} position={[-46, 54, 22]} intensity={2.2} color="#ffe9d5" />
      <directionalLight position={[44, 30, -20]} intensity={0.8} color="#6fcbff" />
      <directionalLight position={[-20, 24, -60]} intensity={0.7} color="#8c7bff" />
      <pointLight ref={lamp} intensity={26} distance={34} decay={2} color="#9ad6ff" />
    </>
  );
}
