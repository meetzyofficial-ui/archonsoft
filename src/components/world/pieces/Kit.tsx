"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Foam } from "@/components/world/pieces/Foam";
import { rimParts, useMerged } from "@/components/world/pieces/merge";
import { qualityStore } from "@/components/world/systems/quality";

/**
 * The kit Archon World is built from.
 *
 * Every island in the world is made of the same handful of parts, which is
 * what makes seven very different districts read as one place — and the only
 * way a world this size stays maintainable: change what a parapet is here and
 * every parapet changes.
 *
 * What the parts *are* has changed completely. The old kit was a building:
 * concrete walls fourteen metres tall, ceilings with beams, a graphite floor.
 * This one is a settlement of platforms hanging in space over a luminous
 * ocean. A "wall" is a low light-rail with tall translucent fins standing on
 * it; a "floor" is a slab with a lit edge and a glow underneath; a "column" is
 * a pylon with a lamp at its head. The collision boxes are the same boxes
 * they always were — the plan did not move — so the visitor walks exactly the
 * same routes through a world that no longer has a ceiling.
 *
 * Materials are Lambert wherever the surface is matte and Standard only where
 * a specular is the point. Everything that glows is an unlit material with
 * `toneMapped` off: light without a light source, which is the whole budget
 * trick of a scene with this many bright edges.
 */

/* --------------------------------------------------------------- palette */

export const MATERIAL = {
  /* Deep-space navy for anything you stand on or lean against. The colour
     in the world comes from its edges and its sky, not from its slabs. */
  deck: "#152139",
  deckDeep: "#0c1426",
  structure: "#1b2740",
  structureLight: "#2a3a5a",
  recess: "#070b13",
  bezel: "#182338",
  /* Light metal — the robot, trims, the underside of a hologram. */
  metal: "#a9bbd3",
  white: "#e6eef8",
  /* The light itself. Baby blue is the world's own colour; cyan is energy,
     violet is depth, and the one warm note is kept for people and for the
     things you can act on. */
  glow: "#9ad6ff",
  cyan: "#4fd2ff",
  violet: "#8f82ff",
  warm: "#e6987a",
  /* Warm white: the edge light of the walkway and the hub, the colour the
     reference world draws its architecture in at night. */
  warmWhite: "#fff4e8",
  peach: "#f2a889",
  blush: "#f2a7c7",
  cream: "#f4e9dc",
  terracotta: "#c97a65",
  green: "#496b50",
  greenDeep: "#2f4a38",
  /* Polished dark stone: the material of the decks. */
  stone: "#0a1327",
  stoneLight: "#162542",
} as const;

/**
 * Paving, painted once: large slabs with a fine seam between them and a
 * faint variation across each, so a deck is a floor of stone and not a
 * plane. Multiplied into the deck colour; the slabs are eight metres.
 */
let pavingTexture: THREE.Texture | null = null;
function usePavingTexture() {
  return useMemo(() => {
    if (pavingTexture) return pavingTexture;
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    /* Four slabs across, each a shade different. */
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 4; j += 1) {
        const v = 236 + Math.round(Math.random() * 19);
        ctx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
        ctx.fillRect(i * 128, j * 128, 128, 128);
      }
    }
    /* Seams. */
    ctx.fillStyle = "#9aa4b8";
    for (let k = 0; k <= 4; k += 1) {
      ctx.fillRect(k * 128 - 1, 0, 2, size);
      ctx.fillRect(0, k * 128 - 1, size, 2);
    }
    pavingTexture = new THREE.CanvasTexture(canvas);
    pavingTexture.wrapS = THREE.RepeatWrapping;
    pavingTexture.wrapT = THREE.RepeatWrapping;
    pavingTexture.colorSpace = THREE.SRGBColorSpace;
    pavingTexture.anisotropy = 4;
    return pavingTexture;
  }, []);
}

/** The deck: dark polished stone that takes the sky and the lights. */
export function Deck({
  colour = MATERIAL.stone,
  roughness = 0.62,
  size,
}: {
  colour?: string;
  roughness?: number;
  /** Physical size of the surface, so the paving repeats at eight metres. */
  size?: [number, number];
}) {
  const paving = usePavingTexture();
  const map = useMemo(() => {
    if (!size) return null;
    const t = paving.clone();
    t.repeat.set(size[0] / 32, size[1] / 32);
    t.needsUpdate = true;
    return t;
  }, [paving, size]);
  useEffect(() => () => map?.dispose(), [map]);
  /* Physical, for `specularIntensity`: the key light's highlight on a
     stone floor is a glint, not a sheet, and without this it laid a pale
     wash over whichever side of the plaza faced the sun. */
  return (
    <meshPhysicalMaterial
      map={map}
      color={colour}
      roughness={roughness}
      metalness={0.1}
      specularIntensity={0.22}
      envMapIntensity={0.3}
    />
  );
}

/* -------------------------------------------------------------- contact */

/** A soft radial blot, painted once, reused for every shadow and every glow. */
export function useContactTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.24, "rgba(0,0,0,0.92)");
      g.addColorStop(0.55, "rgba(0,0,0,0.4)");
      g.addColorStop(0.82, "rgba(0,0,0,0.09)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

export function Contact({
  texture,
  at,
  size,
  opacity = 0.9,
  colour = "#000000",
}: {
  texture: THREE.Texture;
  at: [number, number, number];
  size: [number, number];
  opacity?: number;
  colour?: string;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={at}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        color={colour}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------ backlight */

let glowTexture: THREE.CanvasTexture | null = null;

/**
 * A white radial glow with its alpha in the alpha channel and white in the
 * colour — which the contact blot, black in colour, is not: a black texture
 * under a white additive material adds nothing, and that is exactly what
 * the old backlight did.
 */
export function useGlowTexture() {
  return useMemo(() => {
    if (glowTexture) return glowTexture;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.18, "rgba(255,255,255,0.78)");
      g.addColorStop(0.42, "rgba(255,255,255,0.3)");
      g.addColorStop(0.7, "rgba(255,255,255,0.07)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    glowTexture = new THREE.CanvasTexture(canvas);
    glowTexture.colorSpace = THREE.SRGBColorSpace;
    return glowTexture;
  }, []);
}

/** Four flat bars around a rectangle in the XY plane, `t` wide, outside it. */
function frameParts(w: number, h: number, t: number, z: number) {
  return [
    { geometry: new THREE.PlaneGeometry(w + t * 2, t), at: [0, h / 2 + t / 2, z] as [number, number, number] },
    { geometry: new THREE.PlaneGeometry(w + t * 2, t), at: [0, -h / 2 - t / 2, z] as [number, number, number] },
    { geometry: new THREE.PlaneGeometry(t, h), at: [-w / 2 - t / 2, 0, z] as [number, number, number] },
    { geometry: new THREE.PlaneGeometry(t, h), at: [w / 2 + t / 2, 0, z] as [number, number, number] },
  ];
}

/**
 * The white LED behind a panel.
 *
 * What makes a screen read as a lit thing from across a plaza, and what the
 * reference frames all have: a clean line of white light around the glass
 * where the backlight leaks past the frame, a soft halo on the air behind
 * it, and — for a panel that stands near the ground — a pool of the same
 * light on the deck below. Three or four draws, no light sources, and
 * everything crisp where it should be crisp: the rim is geometry, not a
 * blurred texture, so it stays a line at any distance; only the halo and
 * the pool are soft.
 *
 * `strength` scales the whole thing: the panels by the entrance at one, a
 * far billboard at half, a cell in an array lower still. Not every panel is
 * equally important and a world where they all shout the same says nothing.
 */
export function Backlight({
  size,
  strength = 1,
  inset = 0.05,
  foot,
  forward = 0,
}: {
  size: [number, number];
  strength?: number;
  /** The gap between the panel's edge and the inner edge of the rim. */
  inset?: number;
  /** How far below the panel's centre the floor is, for the pool of light; none for a panel in the air. */
  foot?: number;
  /** How far in front of the panel the pool's centre sits. */
  forward?: number;
}) {
  const [w, h] = size;
  const glow = useGlowTexture();
  const rim = 0.035;
  const soft = 0.2;
  /* A phone keeps the halo and the crisp rim and drops the soft rim and
     the pool: two draws fewer for every panel in the world. */
  const lite = qualityStore.tier !== "desktop";
  const rimGeometry = useMerged(() => frameParts(w + inset * 2, h + inset * 2, rim, 0.002), [w, h, inset]);
  const softGeometry = useMerged(
    () => frameParts(w + inset * 2 + rim * 2, h + inset * 2 + rim * 2, soft, -0.03),
    [w, h, inset],
  );
  return (
    <group>
      {/* The halo on the air behind. */}
      <mesh position={[0, 0, -0.22]}>
        <planeGeometry args={[w * 1.45 + 1.2, h * 1.6 + 1.2]} />
        <meshBasicMaterial map={glow} color="#ffffff" transparent opacity={0.72 * strength} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* The line of light, and the soft edge outside it. */}
      <mesh geometry={rimGeometry}>
        <meshBasicMaterial color="#ffffff" transparent opacity={Math.min(1, 0.96 * strength)} toneMapped={false} depthWrite={false} />
      </mesh>
      {!lite ? (
        <mesh geometry={softGeometry}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2 * strength} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ) : null}
      {/* The pool on the deck. */}
      {foot !== undefined && !lite ? (
        <mesh position={[0, -foot + 0.025, forward + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w + 2.4, 2.8]} />
          <meshBasicMaterial map={glow} color="#ffffff" transparent opacity={0.42 * strength} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ) : null}
    </group>
  );
}

/* ----------------------------------------------------------------- glow */

/** An unlit emissive material, shared where the colour is shared. */
export function Glow({
  colour,
  opacity = 1,
  additive = false,
}: {
  colour: string;
  opacity?: number;
  additive?: boolean;
}) {
  return (
    <meshBasicMaterial
      color={colour}
      transparent={opacity < 1 || additive}
      opacity={opacity}
      toneMapped={false}
      depthWrite={false}
      blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
    />
  );
}

/* ----------------------------------------------------------------- parts */

export function Wall({
  at,
  size,
  colour = MATERIAL.structure,
}: {
  at: [number, number, number];
  size: [number, number, number];
  colour?: string;
}) {
  return (
    <mesh position={at}>
      <boxGeometry args={size} />
      <meshLambertMaterial color={colour} />
    </mesh>
  );
}

/**
 * A collider, made visible.
 *
 * The box is still the box the visitor cannot walk through, but it is drawn
 * as a parapet: a low rail of light along its footprint, a dark kerb under
 * that, and every six metres a tall translucent fin — the silhouette of the
 * wall that used to be here, kept so the districts still have height, with
 * the sky visible between them. The visitor sees over every one of these and
 * through most of them, which is what turns rooms into open platforms.
 */
export function BuiltWall({
  at,
  size,
  texture,
  colour = MATERIAL.glow,
  fins = true,
}: {
  at: [number, number, number];
  size: [number, number, number];
  texture: THREE.Texture;
  colour?: string;
  /** Tall translucent blades at intervals. Off for rails that guard a drop. */
  fins?: boolean;
}) {
  const [w, h, d] = size;
  const [x, y, z] = at;
  const base = y - h / 2;
  const alongX = w >= d;
  const length = alongX ? w : d;
  const thickness = alongX ? d : w;
  const railHeight = 1.15;
  /* A fin every six metres, none on a piece shorter than one bay. */
  const finCount = fins && length >= 5 ? Math.max(1, Math.floor(length / 9)) : 0;
  const finHeight = Math.min(h, 12) * 0.62;

  return (
    <group position={[x, base, z]} rotation={[0, alongX ? 0 : Math.PI / 2, 0]}>
      {/* Kerb. */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[length, 0.44, Math.max(thickness, 0.9)]} />
        <meshLambertMaterial color={MATERIAL.structure} />
      </mesh>
      {/* Rail posts and the rail itself. */}
      <mesh position={[0, railHeight, 0]}>
        <boxGeometry args={[length, 0.06, 0.08]} />
        <meshStandardMaterial color={MATERIAL.metal} roughness={0.35} metalness={0.7} />
      </mesh>
      {/* The line of light along the top of the kerb — the one thing every
          edge in the world has, so a boundary reads as a boundary from across
          the ocean. */}
      <mesh position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, 0.09]} />
        <Glow colour={colour} opacity={0.72} />
      </mesh>
      {/* Fins. */}
      {Array.from({ length: finCount }, (_, i) => {
        const along = -length / 2 + (length / (finCount + 1)) * (i + 1);
        return (
          <group key={i} position={[along, 0, 0]}>
            <mesh position={[0, finHeight / 2 + 0.44, 0]}>
              <boxGeometry args={[0.24, finHeight, 0.34]} />
              <meshLambertMaterial color={MATERIAL.structureLight} />
            </mesh>
            {/* The lit edge up each fin. */}
            <mesh position={[0, finHeight / 2 + 0.44, 0.19]}>
              <planeGeometry args={[0.05, finHeight]} />
              <Glow colour={colour} opacity={0.42} />
            </mesh>
            <mesh position={[0, finHeight / 2 + 0.44, -0.19]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.05, finHeight]} />
              <Glow colour={colour} opacity={0.42} />
            </mesh>
            {/* The lamp at the head. */}
            <mesh position={[0, finHeight + 0.6, 0]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <Glow colour={MATERIAL.white} />
            </mesh>
          </group>
        );
      })}
      <Contact
        texture={texture}
        at={[0, 0.02, 0]}
        size={[length + 3, Math.max(thickness, 0.9) + 4]}
        opacity={0.6}
      />
    </group>
  );
}

/**
 * An island.
 *
 * What used to be a floor plate is now a slab that hangs in space: a deck you
 * stand on, two and a half metres of dark structure under it, a line of light
 * around its whole edge, and a wash of the district's colour thrown down onto
 * the ocean beneath. It is the single most important part in the kit — it is
 * the thing that says "you are standing on something, and there is nothing
 * under it".
 */
export function Island({
  at,
  size,
  colour = MATERIAL.glow,
  texture,
  runner,
  glass = false,
  depth = 2.6,
  rock = true,
  falls = true,
  deck = MATERIAL.stone,
}: {
  at: [number, number];
  size: [number, number];
  colour?: string;
  /** The stone of the deck: each district's a little different. */
  deck?: string;
  texture: THREE.Texture;
  /** A lane down the middle, the way the old floor had one. */
  runner?: [number, number];
  /**
   * The lane is glass.
   *
   * The floor of this world is meant to be anything but ordinary, and the
   * simplest way to say so is to let the visitor see through it: the runner
   * becomes a translucent plate with a lit edge, the structure under the
   * island is split either side of it, and the sea shows through under
   * their feet as they walk the axis.
   */
  glass?: boolean;
  depth?: number;
  /** A faceted rock mass and a turning ring under the island. */
  rock?: boolean;
  /** Curtains of light falling from the rim. */
  falls?: boolean;
}) {
  const [w, d] = size;
  const lane = runner ?? [0, 0];
  const alongZ = lane[1] >= lane[0];
  const rim = useMerged(() => rimParts(w, d, 0.16, 0.16, -0.08), [w, d]);
  const halo = useMerged(() => rimParts(w, d, 0.7, 0.5, -0.5), [w, d]);
  return (
    <group position={[at[0], 0, at[1]]} name="island">
      {/* The deck — as two plates either side of a glass lane, or one. */}
      {glass && runner ? (
        <>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              rotation={[-Math.PI / 2, 0, 0]}
              position={
                alongZ
                  ? [side * ((w + lane[0]) / 4), 0.002, 0]
                  : [0, 0.002, side * ((d + lane[1]) / 4)]
              }
            >
              <planeGeometry args={alongZ ? [(w - lane[0]) / 2, d] : [w, (d - lane[1]) / 2]} />
              <Deck size={alongZ ? [(w - lane[0]) / 2, d] : [w, (d - lane[1]) / 2]} colour={deck} />
            </mesh>
          ))}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
            <planeGeometry args={runner} />
            <meshPhysicalMaterial
              color="#081426"
              transparent
              opacity={0.5}
              roughness={0.08}
              metalness={0.35}
              envMapIntensity={1.6}
              depthWrite={false}
            />
          </mesh>
          {/* The lane's edges, lit. */}
          {[-1, 1].map((side) => (
            <mesh
              key={`edge-${side}`}
              position={alongZ ? [side * (lane[0] / 2), 0.01, 0] : [0, 0.01, side * (lane[1] / 2)]}
              rotation={[-Math.PI / 2, 0, alongZ ? Math.PI / 2 : 0]}
            >
              <planeGeometry args={[alongZ ? d : w, 0.1]} />
              <Glow colour={MATERIAL.warmWhite} opacity={0.75} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
            <planeGeometry args={size} />
            <Deck size={size} colour={deck} />
          </mesh>
          {runner ? (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
              <planeGeometry args={runner} />
              <meshLambertMaterial color="#1a2942" />
            </mesh>
          ) : null}
        </>
      )}
      {/* The structure under it, stepped in so the deck overhangs — split
          either side of a glass lane so there is sea to see. */}
      {glass && runner ? (
        [-1, 1].map((side) => (
          <mesh
            key={`str-${side}`}
            position={
              alongZ
                ? [side * ((w - 1.2 + lane[0]) / 4), -depth / 2 - 0.02, 0]
                : [0, -depth / 2 - 0.02, side * ((d - 1.2 + lane[1]) / 4)]
            }
          >
            <boxGeometry
              args={alongZ ? [(w - 1.2 - lane[0]) / 2, depth, d - 1.2] : [w - 1.2, depth, (d - 1.2 - lane[1]) / 2]}
            />
            <meshLambertMaterial color={MATERIAL.deckDeep} />
          </mesh>
        ))
      ) : (
        <mesh position={[0, -depth / 2 - 0.02, 0]}>
          <boxGeometry args={[w - 1.2, depth, d - 1.2]} />
          <meshLambertMaterial color={MATERIAL.deckDeep} />
        </mesh>
      )}
      {/* The lit rim, all four sides as one piece, and a softer halo just
          below it as another. */}
      <mesh geometry={rim}>
        <Glow colour={colour} opacity={0.95} />
      </mesh>
      <mesh geometry={halo}>
        <Glow colour={colour} opacity={0.14} additive />
      </mesh>
      {/* Where the island meets the sea: cosmic foam. */}
      {rock ? <Foam width={w} depth={d} y={-depth} colour={colour} /> : null}
      {/* The rock: a faceted mass the island sits on, tapering to a point
          the way the reference islands do, so the underside is a shape and
          not a box. */}
      {rock ? (
        <mesh position={[0, -depth - Math.max(w, d) * 0.22, 0]} rotation={[0, Math.PI / 8, 0]}>
          <cylinderGeometry args={[Math.min(w, d) * 0.42, Math.min(w, d) * 0.06, Math.max(w, d) * 0.44, 7, 1]} />
          <meshLambertMaterial color="#0d162a" flatShading />
        </mesh>
      ) : null}
      {/* A ring of light turning slowly beneath the island. */}
      {rock ? <UnderRing radius={Math.min(w, d) * 0.5} y={-depth - 1.2} colour={colour} /> : null}
      {/* Light falling from the rim into the sea. */}
      {falls ? <LightFalls width={w} depth={d} colour={colour} /> : null}
      {/* The underglow on the water. */}
      <Contact
        texture={texture}
        at={[0, -depth - 0.4, 0]}
        size={[w * 1.7, d * 1.7]}
        opacity={0.34}
        colour={colour}
      />
    </group>
  );
}

/** Kept for the plan's sake: a bare deck surface with no structure. */
export function FloorPlate({
  at,
  size,
  runner,
}: {
  at: [number, number];
  size: [number, number];
  runner?: [number, number];
}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[at[0], 0.002, at[1]]}>
        <planeGeometry args={size} />
        <meshLambertMaterial color={MATERIAL.deck} />
      </mesh>
      {runner ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[at[0], 0.006, at[1]]}>
          <planeGeometry args={runner} />
          <meshLambertMaterial color="#182338" />
        </mesh>
      ) : null}
    </group>
  );
}

/**
 * Seams across a deck on the structural module, so a forty-metre platform
 * reads as forty metres before the visitor has taken a step.
 */
export function FloorJoints({
  from,
  to,
  across,
  step,
  axis = "z",
}: {
  from: number;
  to: number;
  across: number;
  step: number;
  axis?: "x" | "z";
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = Math.max(1, Math.floor((to - from) / step) + 1);

  useEffect(() => {
    if (!mesh.current) return;
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i += 1) {
      const along = from + i * step;
      matrix.setPosition(axis === "z" ? 0 : along, 0.008, axis === "z" ? along : 0);
      mesh.current.setMatrixAt(i, matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [axis, count, from, step]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={axis === "z" ? [across, 0.014, 0.06] : [0.06, 0.014, across]} />
      <meshBasicMaterial color="#1e2c48" toneMapped={false} />
    </instancedMesh>
  );
}

/**
 * A row of pylons with a lamp at each head.
 *
 * What the colonnade became. Instanced, because a row is the one thing in a
 * world like this that genuinely repeats.
 */
export function Colonnade({
  from,
  to,
  step,
  x,
  height,
  texture,
  axis = "z",
  thickness = 0.5,
  colour = MATERIAL.glow,
}: {
  from: number;
  to: number;
  step: number;
  x: number;
  height: number;
  texture: THREE.Texture;
  axis?: "x" | "z";
  thickness?: number;
  colour?: string;
}) {
  const piers = useRef<THREE.InstancedMesh>(null);
  const lamps = useRef<THREE.InstancedMesh>(null);
  const feet = useRef<THREE.InstancedMesh>(null);
  const count = Math.max(1, Math.floor((to - from) / step) + 1);

  useEffect(() => {
    const matrix = new THREE.Matrix4();
    const flat = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
    for (let i = 0; i < count; i += 1) {
      const along = from + i * step;
      const px = axis === "z" ? x : along;
      const pz = axis === "z" ? along : x;
      matrix.setPosition(px, height / 2, pz);
      piers.current?.setMatrixAt(i, matrix);
      lamps.current?.setMatrixAt(i, new THREE.Matrix4().setPosition(px, height + 0.35, pz));
      feet.current?.setMatrixAt(i, flat.clone().setPosition(px, 0.024, pz));
    }
    for (const ref of [piers, lamps, feet]) {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    }
  }, [axis, count, from, height, step, x]);

  return (
    <group>
      <instancedMesh ref={piers} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[thickness, height, thickness]} />
        <meshLambertMaterial color={MATERIAL.structureLight} />
      </instancedMesh>
      <instancedMesh ref={lamps} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[thickness * 1.6, 0.16, thickness * 1.6]} />
        <Glow colour={colour} />
      </instancedMesh>
      <instancedMesh ref={feet} args={[undefined, undefined, count]} frustumCulled={false}>
        <planeGeometry args={[thickness * 6, thickness * 6]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0.32}
          color={colour}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}

/** Something to stand a terminal, a screen or a person on. */
export function Plinth({
  at,
  size,
  texture,
  colour = MATERIAL.glow,
}: {
  at: [number, number, number];
  size: [number, number, number];
  texture: THREE.Texture;
  colour?: string;
}) {
  return (
    <group>
      <mesh position={at}>
        <boxGeometry args={size} />
        <meshLambertMaterial color={MATERIAL.structure} />
      </mesh>
      {/* A lit lip round the top. */}
      <mesh position={[at[0], at[1] + size[1] / 2 - 0.03, at[2]]}>
        <boxGeometry args={[size[0] + 0.08, 0.05, size[2] + 0.08]} />
        <Glow colour={colour} opacity={0.55} />
      </mesh>
      <Contact
        texture={texture}
        at={[at[0], 0.03, at[2]]}
        size={[size[0] + 2.4, size[2] + 2.4]}
        opacity={0.7}
      />
    </group>
  );
}

/** A recessed line of light. The world's only kind of lighting fixture. */
export function LightLine({
  at,
  length,
  axis = "x",
  colour = MATERIAL.glow,
  intensity = 0.5,
  thickness = 0.045,
}: {
  at: [number, number, number];
  length: number;
  axis?: "x" | "z";
  colour?: string;
  intensity?: number;
  thickness?: number;
}) {
  return (
    <mesh position={at} rotation={[-Math.PI / 2, 0, axis === "z" ? Math.PI / 2 : 0]}>
      <planeGeometry args={[length, thickness]} />
      <Glow colour={colour} opacity={intensity} />
    </mesh>
  );
}

/** The wash a light line throws onto the surface it is recessed into. */
export function LightWash({
  at,
  size,
  texture,
  colour = MATERIAL.glow,
  intensity = 0.16,
  turn = 0,
  tilt = -Math.PI / 2,
}: {
  at: [number, number, number];
  size: [number, number];
  texture: THREE.Texture;
  colour?: string;
  intensity?: number;
  turn?: number;
  tilt?: number;
}) {
  return (
    <mesh position={at} rotation={[tilt, 0, turn]}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        map={texture}
        color={colour}
        transparent
        opacity={intensity}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * A portal: two slim lit jambs and a floating lintel of light.
 *
 * Openings in this world are always this shape, so the visitor learns what a
 * way through looks like in the first ten seconds and never has to be told
 * again.
 */
export function Doorway({
  at,
  width,
  height,
  turn = 0,
  colour = MATERIAL.glow,
}: {
  at: [number, number, number];
  width: number;
  height: number;
  depth?: number;
  turn?: number;
  colour?: string;
}) {
  const jamb = 0.32;
  /* Both jambs as one piece; their four lit verticals as another. */
  const jambs = useMerged(
    () =>
      [-1, 1].map((side) => ({
        geometry: new THREE.BoxGeometry(jamb, height, 0.8),
        at: [(width / 2 + jamb / 2) * side, height / 2, 0] as [number, number, number],
      })),
    [width, height],
  );
  const lit = useMerged(
    () =>
      [-1, 1].flatMap((side) =>
        [1, -1].map((face) => ({
          geometry: new THREE.PlaneGeometry(0.08, height),
          at: [(width / 2 + jamb / 2) * side, height / 2, face * 0.42] as [number, number, number],
          turn: [0, face === 1 ? 0 : Math.PI, 0] as [number, number, number],
        })),
      ),
    [width, height],
  );
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <mesh geometry={jambs}>
        <meshStandardMaterial color="#aeb8c4" roughness={0.35} metalness={0.85} />
      </mesh>
      <mesh geometry={lit}>
        <Glow colour={colour} opacity={0.6} />
      </mesh>
      {/* A lamp on each jamb, and nothing over the passage: the way through
          is open to the sky. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(width / 2 + jamb / 2) * side, height + 0.2, 0]}>
          <boxGeometry args={[jamb + 0.2, 0.12, 1]} />
          <Glow colour={MATERIAL.warmWhite} opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** A rail of energy: a slim tube with a lit core, where a duct used to be. */
export function Service({
  at,
  length,
  turn = 0,
  height = 0.09,
  colour = MATERIAL.cyan,
}: {
  at: [number, number, number];
  length: number;
  turn?: number;
  height?: number;
  colour?: string;
}) {
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <mesh>
        <boxGeometry args={[length, height, height]} />
        <meshStandardMaterial color={MATERIAL.metal} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0, height / 2 + 0.005]}>
        <planeGeometry args={[length, height * 0.35]} />
        <Glow colour={colour} opacity={0.75} />
      </mesh>
    </group>
  );
}

/* ----------------------------------------------------------------- text */

/**
 * A line of text painted into a canvas and hung in the world.
 *
 * For the small metadata a place carries — a project's number and category
 * on a floating tag, a district's name on its portal. The panel behind it is
 * a translucent plate, so it reads as a hologram and not as a sign.
 */
export function Label({
  lines,
  at,
  turn = 0,
  height = 0.7,
  colour = MATERIAL.white,
  accent = MATERIAL.glow,
  align = "left",
}: {
  lines: string[];
  at: [number, number, number];
  turn?: number;
  /** World height of the whole tag. */
  height?: number;
  colour?: string;
  accent?: string;
  align?: "left" | "center";
}) {
  const texture = useMemo(() => {
    const scale = 6;
    const width = 512;
    const rows = lines.length;
    const lineHeight = 46;
    const canvasHeight = rows * lineHeight + 40;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, width, canvasHeight);
      ctx.textBaseline = "middle";
      lines.forEach((line, i) => {
        const first = i === 0;
        ctx.fillStyle = first ? accent : colour;
        ctx.font = first
          ? `500 ${scale * 3.4}px ui-monospace, Menlo, Consolas, monospace`
          : `400 ${scale * 5.2}px Georgia, "Times New Roman", serif`;
        ctx.textAlign = align;
        const x = align === "center" ? width / 2 : 22;
        const text = first ? line.toUpperCase().split("").join(" ") : line;
        ctx.fillText(text, x, 22 + i * lineHeight + lineHeight / 2);
      });
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [accent, align, colour, lines]);

  useEffect(() => () => texture.dispose(), [texture]);

  const aspect = texture.image.width / texture.image.height;
  const w = height * aspect;

  return (
    <group position={at} rotation={[0, turn, 0]}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[w + 0.3, height + 0.2]} />
        <meshBasicMaterial color="#0a1322" transparent opacity={0.55} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, height]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.08, 0]}>
        <planeGeometry args={[w + 0.3, 0.03]} />
        <Glow colour={accent} opacity={0.8} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------ wall field */

/**
 * Every parapet in the world, in seven draw calls.
 *
 * `BuiltWall` draws one collider as a handful of meshes, which is right for a
 * dozen gallery rails and wrong for the seventy pieces of wall the plan has:
 * drawn one by one they were six hundred draw calls before a single screen
 * or person was on the list. Here the same kerbs, rails, light lines, fins,
 * fin edges and lamps are each one instanced mesh, posed once from the plan.
 * Nothing about what the visitor sees changes; what the GPU is asked to do
 * drops by two orders of magnitude.
 */
export function WallField({
  boxes,
  colour = MATERIAL.glow,
}: {
  boxes: { at: [number, number, number]; size: [number, number, number] }[];
  colour?: string;
}) {
  const kerbs = useRef<THREE.InstancedMesh>(null);
  const tops = useRef<THREE.InstancedMesh>(null);
  const rails = useRef<THREE.InstancedMesh>(null);
  const lines = useRef<THREE.InstancedMesh>(null);
  const fins = useRef<THREE.InstancedMesh>(null);
  const edges = useRef<THREE.InstancedMesh>(null);
  const lamps = useRef<THREE.InstancedMesh>(null);

  const plan = useMemo(() => {
    const walls = boxes.map((box) => {
      const [w, h, d] = box.size;
      const alongX = w >= d;
      const length = alongX ? w : d;
      const thickness = Math.max(alongX ? d : w, 0.9);
      const finCount = length >= 12 ? Math.max(1, Math.floor(length / 16)) : 0;
      const plinth = thickness > 3;
      const finHeight = Math.min(h, 12) * 0.62;
      return { box, alongX, length, thickness, finCount, finHeight, plinth, base: box.at[1] - h / 2 };
    });
    const finTotal = walls.reduce((sum, wall) => sum + wall.finCount, 0);
    return { walls, finTotal };
  }, [boxes]);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    let fin = 0;
    plan.walls.forEach((wall, i) => {
      const [x, , z] = wall.box.at;
      const turn = wall.alongX ? 0 : Math.PI / 2;
      q.setFromEuler(new THREE.Euler(0, turn, 0));
      /* Kerb. */
      p.set(x, wall.base + 0.22, z);
      s.set(wall.length, 0.44, wall.thickness);
      kerbs.current?.setMatrixAt(i, m.compose(p, q, s));
      /* A wide collider is a plinth: its whole top is lit, faintly, so it
         reads as a raised terrace rather than a dark block. */
      p.set(x, wall.base + 0.445, z);
      s.set(wall.plinth ? wall.length - 0.2 : 0.001, wall.plinth ? wall.thickness - 0.2 : 0.001, 1);
      tops.current?.setMatrixAt(i, m.compose(p, q.clone().multiply(flat), s));
      /* Rail. */
      p.set(x, wall.base + 1.15, z);
      s.set(wall.length, 0.06, 0.08);
      rails.current?.setMatrixAt(i, m.compose(p, q, s));
      /* Light line on the kerb. */
      p.set(x, wall.base + 0.46, z);
      s.set(wall.length, 0.09, 1);
      const lineQ = q.clone().multiply(flat);
      lines.current?.setMatrixAt(i, m.compose(p, lineQ, s));
      /* Fins. */
      for (let k = 0; k < wall.finCount; k += 1) {
        const along = -wall.length / 2 + (wall.length / (wall.finCount + 1)) * (k + 1);
        const fx = x + (wall.alongX ? along : 0);
        const fz = z + (wall.alongX ? 0 : along);
        p.set(fx, wall.base + wall.finHeight / 2 + 0.44, fz);
        s.set(0.24, wall.finHeight, 0.34);
        fins.current?.setMatrixAt(fin, m.compose(p, q, s));
        /* The lit edge: one thin plate through the fin, visible both sides. */
        s.set(0.05, wall.finHeight, 0.4);
        edges.current?.setMatrixAt(fin, m.compose(p, q, s));
        p.set(fx, wall.base + wall.finHeight + 0.6, fz);
        s.setScalar(0.24);
        lamps.current?.setMatrixAt(fin, m.compose(p, q, s));
        fin += 1;
      }
    });
    for (const ref of [kerbs, tops, rails, lines, fins, edges, lamps]) {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    }
  }, [plan]);

  const n = plan.walls.length;
  const f = Math.max(1, plan.finTotal);

  return (
    <group>
      <instancedMesh ref={kerbs} args={[undefined, undefined, n]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color={MATERIAL.structure} />
      </instancedMesh>
      <instancedMesh ref={tops} args={[undefined, undefined, n]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <Glow colour={colour} opacity={0.08} additive />
      </instancedMesh>
      <instancedMesh ref={rails} args={[undefined, undefined, n]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={MATERIAL.metal} roughness={0.35} metalness={0.7} />
      </instancedMesh>
      <instancedMesh ref={lines} args={[undefined, undefined, n]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <Glow colour={colour} opacity={0.72} />
      </instancedMesh>
      <instancedMesh ref={fins} args={[undefined, undefined, f]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color={MATERIAL.structureLight} />
      </instancedMesh>
      <instancedMesh ref={edges} args={[undefined, undefined, f]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <Glow colour={colour} opacity={0.42} />
      </instancedMesh>
      <instancedMesh ref={lamps} args={[undefined, undefined, f]} frustumCulled={false}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <Glow colour={MATERIAL.white} />
      </instancedMesh>
    </group>
  );
}

/* ----------------------------------------------------------- under-ring */

function UnderRing({ radius, y, colour }: { radius: number; y: number; colour: string }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += Math.min(delta, 0.05) * 0.06;
  });
  return (
    <mesh ref={ring} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.86, radius * 0.9, 64]} />
      <Glow colour={colour} opacity={0.32} additive />
    </mesh>
  );
}

/* ------------------------------------------------------------------ water */

/**
 * Falling water, painted once: pale blue-white threads of varying weight
 * over a soft body, with gaps, so a plane scrolling it downward reads as a
 * sheet of water and not a gradient. Shared by every fall in the world.
 */
let waterTexture: THREE.Texture | null = null;
export function useWaterTexture() {
  return useMemo(() => {
    if (waterTexture) return waterTexture;
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 128, 512);
    /* The body: soft columns, denser toward the middle of each. */
    for (let i = 0; i < 26; i += 1) {
      const x = Math.random() * 128;
      const w = 2 + Math.random() * 9;
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      const a = 0.12 + Math.random() * 0.2;
      g.addColorStop(0, "rgba(200,235,255,0)");
      g.addColorStop(0.5, `rgba(220,242,255,${a})`);
      g.addColorStop(1, "rgba(200,235,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - w / 2, 0, w, 512);
    }
    /* Threads: bright, thin, broken. */
    for (let i = 0; i < 40; i += 1) {
      const x = Math.random() * 128;
      const y0 = Math.random() * 512;
      const len = 60 + Math.random() * 260;
      const a = 0.35 + Math.random() * 0.5;
      ctx.fillStyle = `rgba(240,250,255,${a})`;
      ctx.fillRect(x, y0, 1 + Math.round(Math.random()), len);
      if (y0 + len > 512) ctx.fillRect(x, 0, 1, y0 + len - 512);
    }
    waterTexture = new THREE.CanvasTexture(canvas);
    waterTexture.wrapT = THREE.RepeatWrapping;
    waterTexture.wrapS = THREE.RepeatWrapping;
    waterTexture.colorSpace = THREE.SRGBColorSpace;
    return waterTexture;
  }, []);
}

/* ------------------------------------------------------------ light falls */

/**
 * Curtains of light falling from an island's rim into the sea below.
 *
 * The reference islands pour water over their edges; here it is light. A
 * few tall additive planes hang from the long sides, their texture offset
 * scrolling downward so the threads seem to fall. One texture, a handful of
 * planes, a single uniform per frame.
 */
function LightFalls({ width, depth, colour }: { width: number; depth: number; colour: string }) {
  const texture = useWaterTexture();
  /* Water, lit by the island: mostly white, a breath of the island's colour. */
  const tint = useMemo(() => "#" + new THREE.Color("#d8f0ff").lerp(new THREE.Color(colour), 0.22).getHexString(), [colour]);
  const group = useRef<THREE.Group>(null);
  const spots = useMemo(() => {
    const out: { x: number; z: number; turn: number; w: number; h: number }[] = [];
    const along = (len: number) => Math.max(1, Math.round(len / 13));
    for (let i = 0; i < along(width); i += 1) {
      const x = -width / 2 + (width / (along(width) + 1)) * (i + 1) + ((i % 3) - 1) * 1.5;
      out.push({ x, z: -depth / 2, turn: 0, w: 3.4 + (i % 2) * 1.4, h: 18 });
      out.push({ x: -x, z: depth / 2, turn: 0, w: 2.8 + (i % 2), h: 15 });
    }
    for (let i = 0; i < along(depth); i += 1) {
      const z = -depth / 2 + (depth / (along(depth) + 1)) * (i + 1) + ((i % 2) - 0.5) * 2;
      out.push({ x: -width / 2, z, turn: Math.PI / 2, w: 3, h: 16 });
      out.push({ x: width / 2, z: -z, turn: Math.PI / 2, w: 3.6, h: 19 });
    }
    return out;
  }, [depth, width]);

  useFrame((_, delta) => {
    texture.offset.y -= Math.min(delta, 0.05) * 0.24;
  });

  /* Every curtain of one island in one buffer: one draw for the lot. */
  const geometry = useMerged(
    () =>
      spots.map((spot) => ({
        geometry: new THREE.PlaneGeometry(spot.w, spot.h),
        at: [spot.x, -spot.h / 2 + 0.2, spot.z] as [number, number, number],
        turn: [0, spot.turn, 0] as [number, number, number],
      })),
    [spots],
  );

  return (
    <group ref={group} name="island:falls">
      <mesh geometry={geometry}>
        <meshBasicMaterial
          map={texture}
          color={tint}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ trees */

/**
 * The world's vegetation.
 *
 * Dark green trees with faceted sculptural canopies, and among them the
 * blossom trees the reference world plants around its hub — pink, with a
 * breath of their own light. A tree is a trunk and two or three canopy
 * masses of different sizes, so no two silhouettes are alike; every tree in
 * a group is drawn with the others, five draws in all. The crowns sway.
 */
/* Leaf greens, and what the fruit trees carry. */
const LEAF_COLOURS = ["#496b50", "#3f7a4a", "#557a3c", "#6d8a36", "#496b50", "#8a6a2a", "#3a6b4a", "#a0602c"];
const FRUIT_COLOURS = ["#d8352f", "#ff8a2a", "#f2d33a"];

export function Trees({
  at,
  blossom = 0.4,
  rock = false,
}: {
  at: [number, number, number][];
  /** What share of them blossom, by position in the list. */
  blossom?: number;
  /**
   * Each tree stands on its own outcrop of rock hanging off the island's
   * rim — the way the reference world grows its trees, on stone over the
   * water — so the visitor walks beside them and never through them.
   */
  rock?: boolean;
}) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const branches = useRef<THREE.InstancedMesh>(null);
  const greens = useRef<THREE.InstancedMesh>(null);
  const pinks = useRef<THREE.InstancedMesh>(null);
  const clusters = useRef<THREE.InstancedMesh>(null);
  const halos = useRef<THREE.InstancedMesh>(null);
  const shrubs = useRef<THREE.InstancedMesh>(null);
  const rocks = useRef<THREE.InstancedMesh>(null);
  const fruits = useRef<THREE.InstancedMesh>(null);
  const count = at.length;
  const CROWNS = 5;
  const BRANCHES = 2;
  const SHRUBS = 2;
  const FRUITS = 9;
  /* Six silhouettes: how the masses sit on the trunk. */
  const seeds = useMemo(
    () =>
      at.map((_, i) => {
        const pink = (i * 0.618) % 1 < blossom;
        const kind = i % 6;
        const h = 2.2 + ((i * 7) % 5) * 0.5 + (kind === 4 ? 1.2 : 0);
        /* The green ones are not one green: most are, some run to a
           yellow-green or an amber, one in six is a copper. And one in
           three of the green trees carries fruit — apples, oranges or
           lemons, by the tree. */
        const leaf = LEAF_COLOURS[(i * 7 + kind) % LEAF_COLOURS.length]!;
        const fruit = !pink && i % 3 === 1 ? FRUIT_COLOURS[(i * 5) % FRUIT_COLOURS.length]! : null;
        return {
          pink,
          kind,
          h,
          leaf,
          fruit,
          lean: (((i * 3) % 5) - 2) * 0.035,
          yaw: i * 1.7,
          crowns: Array.from({ length: CROWNS }, (_, k) => {
            const a = k * 2.4 + i;
            const spread = kind === 2 ? 0.7 : kind === 5 ? 0.3 : 0.5;
            const r = (kind === 1 ? 0.75 : 1.0) * (0.95 + ((i + k) % 3) * 0.18) * (k === 0 ? 1.25 : 1) * (kind === 3 ? 0.8 : 1);
            return {
              ox: Math.cos(a) * spread * (k === 0 ? 0 : 1) * r,
              oy: (k === 0 ? 0.3 : (((k * 5 + i) % 4) - 1.5) * 0.35) + (kind === 4 ? 0.4 : 0),
              oz: Math.sin(a) * spread * (k === 0 ? 0 : 1) * r,
              r,
              squash: 0.72 + ((i + k) % 3) * 0.12,
            };
          }),
          branches: Array.from({ length: BRANCHES }, (_, k) => ({
            yaw: i * 1.3 + k * 2.1,
            tilt: 0.7 + (k % 2) * 0.35,
            len: 0.9 + ((i + k) % 3) * 0.3,
            at: 0.55 + k * 0.18,
          })),
        };
      }),
    [at, blossom],
  );
  const time = useRef(0);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  const ZERO = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);

  /* Colours once: the leaves by tree, the fruit by tree. */
  useEffect(() => {
    const colour = new THREE.Color();
    seeds.forEach((seed, i) => {
      colour.set(seed.leaf);
      for (let k = 0; k < CROWNS; k += 1) greens.current?.setColorAt(i * CROWNS + k, colour);
      if (seed.fruit) {
        colour.set(seed.fruit);
        for (let k = 0; k < FRUITS; k += 1) fruits.current?.setColorAt(i * FRUITS + k, colour);
      }
    });
    if (greens.current?.instanceColor) greens.current.instanceColor.needsUpdate = true;
    if (fruits.current?.instanceColor) fruits.current.instanceColor.needsUpdate = true;
  }, [seeds]);

  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.05);
    const t = time.current;
    at.forEach(([x, y, z], i) => {
      const seed = seeds[i]!;
      const sway = Math.sin(t * 0.6 + i) * 0.016;
      e.set(seed.lean + sway, seed.yaw, sway * 0.6);
      q.setFromEuler(e);
      p.set(x, y + seed.h / 2, z);
      sc.set(0.2, seed.h, 0.2);
      trunks.current?.setMatrixAt(i, matrix.compose(p, q, sc));
      /* Branches: two, leaving the trunk part-way up and reaching into the
         crown. */
      seed.branches.forEach((br, k) => {
        const idx = i * BRANCHES + k;
        e.set(br.tilt, br.yaw, 0, "YXZ");
        q.setFromEuler(e);
        p.set(x + Math.sin(br.yaw) * br.len * 0.3, y + seed.h * br.at + br.len * 0.35, z + Math.cos(br.yaw) * br.len * 0.3);
        sc.set(0.09, br.len, 0.09);
        branches.current?.setMatrixAt(idx, matrix.compose(p, q, sc));
      });
      seed.crowns.forEach((crown, k) => {
        const idx = i * CROWNS + k;
        p.set(x + crown.ox, y + seed.h + crown.oy + crown.r * 0.5, z + crown.oz);
        sc.set(crown.r, crown.r * crown.squash, crown.r);
        e.set(sway * 2, seed.yaw + k * 0.7, sway);
        q.setFromEuler(e);
        matrix.compose(p, q, sc);
        (seed.pink ? pinks : greens).current?.setMatrixAt(idx, matrix);
        (seed.pink ? greens : pinks).current?.setMatrixAt(idx, ZERO);
        /* Blossom clusters: a lighter knot on two of the masses. */
        if (seed.pink && k % 2 === 1) {
          p.set(x + crown.ox * 1.15, y + seed.h + crown.oy + crown.r * 0.75, z + crown.oz * 1.15);
          sc.set(crown.r * 0.45, crown.r * 0.4, crown.r * 0.45);
          clusters.current?.setMatrixAt(idx, matrix.compose(p, q, sc));
        } else {
          clusters.current?.setMatrixAt(idx, ZERO);
        }
        if (seed.pink && k === 0) {
          sc.set(crown.r * 2.2, crown.r * 1.6, crown.r * 2.2);
          halos.current?.setMatrixAt(i, matrix.compose(p, q, sc));
        } else if (!seed.pink && k === 0) {
          halos.current?.setMatrixAt(i, ZERO);
        }
      });
      /* The fruit: small spheres on the outside of the crowns. */
      for (let k = 0; k < FRUITS; k += 1) {
        const idx = i * FRUITS + k;
        if (!seed.fruit) {
          fruits.current?.setMatrixAt(idx, ZERO);
          continue;
        }
        const crown = seed.crowns[k % CROWNS]!;
        const a = k * 2.3 + i * 0.7;
        const b = (k % 3) * 0.9 - 0.6;
        p.set(
          x + crown.ox + Math.cos(a) * Math.cos(b) * crown.r * 0.98,
          y + seed.h + crown.oy + crown.r * 0.5 + Math.sin(b) * crown.r * crown.squash * 0.9 + sway * 3,
          z + crown.oz + Math.sin(a) * Math.cos(b) * crown.r * 0.98,
        );
        const fr = 0.085 + (k % 2) * 0.02;
        sc.set(fr, fr * 1.05, fr);
        e.set(0, a, 0);
        q.setFromEuler(e);
        fruits.current?.setMatrixAt(idx, matrix.compose(p, q, sc));
      }
      /* Low shrubs at the foot. */
      for (let k = 0; k < SHRUBS; k += 1) {
        const a = seed.yaw + k * 2.6;
        p.set(x + Math.cos(a) * 0.65, y + 0.24, z + Math.sin(a) * 0.65);
        const r = 0.5 + ((i + k) % 3) * 0.12;
        sc.set(r, r * 0.6, r);
        e.set(0, a, 0);
        q.setFromEuler(e);
        shrubs.current?.setMatrixAt(i * SHRUBS + k, matrix.compose(p, q, sc));
      }
      /* The outcrop it stands on. */
      if (rock) {
        const r = 1.9 + (i % 3) * 0.5;
        p.set(x, y - 2.4, z);
        sc.set(r, 5.2, r * 0.9);
        e.set(0, seed.yaw * 1.3, 0);
        q.setFromEuler(e);
        rocks.current?.setMatrixAt(i, matrix.compose(p, q, sc));
      }
    });
    for (const ref of [trunks, branches, greens, pinks, clusters, halos, shrubs, rocks, fruits]) {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group name="trees">
      <instancedMesh ref={trunks} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.45, 0.95, 1, 7]} />
        <meshStandardMaterial color="#2a221f" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={branches} args={[undefined, undefined, count * BRANCHES]} frustumCulled={false}>
        <cylinderGeometry args={[0.35, 0.7, 1, 5]} />
        <meshStandardMaterial color="#2a221f" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={greens} args={[undefined, undefined, count * CROWNS]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} flatShading />
      </instancedMesh>
      <instancedMesh ref={fruits} args={[undefined, undefined, count * FRUITS]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.45} metalness={0.05} />
      </instancedMesh>
      <instancedMesh ref={pinks} args={[undefined, undefined, count * CROWNS]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#e39bb6" emissive={MATERIAL.blush} emissiveIntensity={0.1} roughness={0.95} flatShading />
      </instancedMesh>
      {qualityStore.tier === "desktop" ? (
        <instancedMesh ref={clusters} args={[undefined, undefined, count * CROWNS]} frustumCulled={false}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#f5c3d4" roughness={0.95} flatShading />
        </instancedMesh>
      ) : null}
      {qualityStore.tier !== "low" ? (
        <instancedMesh ref={halos} args={[undefined, undefined, count]} frustumCulled={false}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color={MATERIAL.blush} toneMapped={false} transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
        </instancedMesh>
      ) : null}
      <instancedMesh ref={shrubs} args={[undefined, undefined, count * SHRUBS]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={MATERIAL.greenDeep} roughness={1} flatShading />
      </instancedMesh>
      {rock ? (
        <instancedMesh ref={rocks} args={[undefined, undefined, count]} frustumCulled={false}>
          <cylinderGeometry args={[0.5, 0.08, 1, 6, 1]} />
          <meshStandardMaterial color="#1c2233" roughness={0.95} flatShading />
        </instancedMesh>
      ) : null}
    </group>
  );
}

/** Kept for callers that still say `LightTrees`: the same trees, mostly blossom. */
export function LightTrees({ at }: { at: [number, number, number][]; colour?: string }) {
  return <Trees at={at} blossom={0.7} />;
}

/* ----------------------------------------------------------- light towers */

/**
 * Sculptural pylons: tapered shafts of pale stone with one warm-white edge
 * of light and a beam rising from the head — the vertical architecture of
 * the hub. Each has its own height; all are drawn together.
 */
export function LightTowers({
  at,
  height = 18,
  colour = MATERIAL.warmWhite,
}: {
  at: [number, number, number][];
  /** The tallest; the others step down from it. */
  height?: number;
  colour?: string;
}) {
  const shafts = useRef<THREE.InstancedMesh>(null);
  const lines = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);
  const beams = useRef<THREE.InstancedMesh>(null);
  const rings = useRef<THREE.InstancedMesh>(null);
  const count = at.length;
  const RINGS = 2;

  const beamGeometry = useMerged(
    () => [
      { geometry: new THREE.PlaneGeometry(1.4, 1) },
      { geometry: new THREE.PlaneGeometry(1.4, 1), turn: [0, Math.PI / 2, 0] },
    ],
    [],
  );

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    at.forEach(([x, y, z], i) => {
      const h = height * (1 - (i % 3) * 0.14);
      const w = 1.2 + (i % 2) * 0.4;
      e.set(0, i * 0.7, 0);
      q.setFromEuler(e);
      p.set(x, y + h / 2, z);
      sc.set(w, h, w);
      shafts.current?.setMatrixAt(i, m.compose(p, q, sc));
      p.set(x, y + h * 0.5, z);
      sc.set(0.1, h * 0.92, w * 0.62);
      lines.current?.setMatrixAt(i, m.compose(p, q, sc));
      p.set(x, y + h + 0.15, z);
      sc.set(w * 0.7, 0.3, w * 0.7);
      caps.current?.setMatrixAt(i, m.compose(p, q, sc));
      p.set(x, y + h + 12, z);
      sc.set(1, 24, 1);
      beams.current?.setMatrixAt(i, m.compose(p, q, sc));
      /* Two silver ribs, a third and two thirds of the way up. */
      for (let k = 0; k < RINGS; k += 1) {
        p.set(x, y + h * (0.34 + k * 0.32), z);
        const r = w * (1.0 - (0.34 + k * 0.32) * 0.36);
        sc.set(r, 0.24, r);
        rings.current?.setMatrixAt(i * RINGS + k, m.compose(p, q, sc));
      }
    });
    for (const ref of [shafts, lines, caps, beams, rings]) {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    }
  }, [at, height]);

  useFrame(({ clock }) => {
    if (!beams.current) return;
    (beams.current.material as THREE.MeshBasicMaterial).opacity = 0.14 + Math.sin(clock.elapsedTime * 0.5) * 0.04;
  });

  return (
    <group name="towers">
      <instancedMesh ref={shafts} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.3, 0.5, 1, 6]} />
        <meshStandardMaterial color="#2c3c5e" roughness={0.5} metalness={0.3} flatShading />
      </instancedMesh>
      <instancedMesh ref={lines} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <Glow colour={colour} opacity={0.85} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.5, 1, 4]} />
        <Glow colour={MATERIAL.white} />
      </instancedMesh>
      <instancedMesh ref={beams} args={[beamGeometry, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial color={colour} transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={rings} args={[undefined, undefined, count * RINGS]} frustumCulled={false}>
        <cylinderGeometry args={[0.56, 0.56, 1, 6]} />
        <meshStandardMaterial color="#c9d2de" roughness={0.45} metalness={0.5} flatShading />
      </instancedMesh>
    </group>
  );
}

/* ----------------------------------------------------------------- spires */

/**
 * Monumental spires: the landmark's own skyline. Tall tapered shafts of
 * pale stone rising out of the sea around the hub, each with a warm-white
 * edge and a lit head, in three families of height so the cluster reads as
 * a city and not a fence. Instanced: five draws for all of them.
 */
export function Spires({
  at,
}: {
  /** Foot position, height, girth. */
  at: [number, number, number, number, number][];
}) {
  const shafts = useRef<THREE.InstancedMesh>(null);
  const uppers = useRef<THREE.InstancedMesh>(null);
  const edges = useRef<THREE.InstancedMesh>(null);
  const ribs = useRef<THREE.InstancedMesh>(null);
  const cuts = useRef<THREE.InstancedMesh>(null);
  const crownsA = useRef<THREE.InstancedMesh>(null);
  const crownsB = useRef<THREE.InstancedMesh>(null);
  const bands = useRef<THREE.InstancedMesh>(null);
  const count = at.length;
  const RIBS = 3;

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    at.forEach(([x, y, z, h, w], i) => {
      const yaw = i * 0.9;
      e.set(0, yaw, 0);
      q.setFromEuler(e);
      /* The lower section: two thirds of the height, wider. */
      const lowH = h * 0.62;
      p.set(x, y + lowH / 2, z);
      sc.set(w, lowH, w);
      shafts.current?.setMatrixAt(i, m.compose(p, q, sc));
      /* The upper section: set in, turned a little, the rest of the way. */
      const upH = h - lowH;
      e.set(0, yaw + 0.35, 0);
      q.setFromEuler(e);
      p.set(x, y + lowH + upH / 2, z);
      sc.set(w * 0.62, upH, w * 0.62);
      uppers.current?.setMatrixAt(i, m.compose(p, q, sc));
      /* The lit edge, up the lower section. */
      e.set(0, yaw, 0);
      q.setFromEuler(e);
      p.set(x, y + lowH * 0.52, z);
      sc.set(w * 0.08, lowH * 0.9, w * 0.86);
      edges.current?.setMatrixAt(i, m.compose(p, q, sc));
      /* Ribs: rings of stone at three heights, stepping with the taper. */
      for (let k = 0; k < RIBS; k += 1) {
        const f = 0.22 + k * 0.2;
        p.set(x, y + h * f, z);
        const r = k < 2 ? w * (1.04 - f * 0.45) : w * 0.7;
        sc.set(r, 0.6 + w * 0.06, r);
        ribs.current?.setMatrixAt(i * RIBS + k, m.compose(p, q, sc));
      }
      /* An inset cut just under the upper section. */
      p.set(x, y + lowH + 0.4, z);
      sc.set(w * 0.5, 0.8, w * 0.5);
      cuts.current?.setMatrixAt(i, m.compose(p, q, sc));
      /* Two crowns: a faceted point on the odd towers, a stepped cap on the even. */
      e.set(0, yaw + 0.35, 0);
      q.setFromEuler(e);
      if (i % 2) {
        p.set(x, y + h + w * 0.16, z);
        sc.set(w * 0.34, w * 0.5, w * 0.34);
        crownsA.current?.setMatrixAt(i, m.compose(p, q, sc));
        crownsB.current?.setMatrixAt(i, zero);
      } else {
        p.set(x, y + h + 0.5, z);
        sc.set(w * 0.44, 1.0, w * 0.44);
        crownsB.current?.setMatrixAt(i, m.compose(p, q, sc));
        crownsA.current?.setMatrixAt(i, zero);
      }
      /* A ring of light where the sections meet. */
      p.set(x, y + lowH - 0.2, z);
      sc.set(w * 0.66, 0.16, w * 0.66);
      bands.current?.setMatrixAt(i, m.compose(p, q, sc));
    });
    for (const ref of [shafts, uppers, edges, ribs, cuts, crownsA, crownsB, bands]) {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    }
  }, [at]);

  return (
    <group name="spires">
      <instancedMesh ref={shafts} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.36, 0.5, 1, 6]} />
        <meshStandardMaterial color="#2a3a5c" roughness={0.55} metalness={0.3} flatShading />
      </instancedMesh>
      <instancedMesh ref={uppers} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.3, 0.5, 1, 6]} />
        <meshStandardMaterial color="#334668" roughness={0.5} metalness={0.35} flatShading />
      </instancedMesh>
      <instancedMesh ref={edges} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <Glow colour={MATERIAL.warmWhite} opacity={0.7} />
      </instancedMesh>
      <instancedMesh ref={ribs} args={[undefined, undefined, count * RIBS]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
        <meshStandardMaterial color="#c9d2de" roughness={0.5} metalness={0.4} flatShading />
      </instancedMesh>
      <instancedMesh ref={cuts} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
        <meshStandardMaterial color="#0a1020" roughness={0.8} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={crownsA} args={[undefined, undefined, count]} frustumCulled={false}>
        <octahedronGeometry args={[0.5, 0]} />
        <Glow colour="#dff1ff" opacity={0.55} />
      </instancedMesh>
      <instancedMesh ref={crownsB} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.38, 0.5, 1, 6]} />
        <meshStandardMaterial color="#c9d2de" roughness={0.45} metalness={0.5} flatShading />
      </instancedMesh>
      <instancedMesh ref={bands} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.5, 1, 12, 1, true]} />
        <meshBasicMaterial color={MATERIAL.cyan} toneMapped={false} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

/* ------------------------------------------------------------------- arch */

/**
 * A great arch: a segment of torus standing on the deck, in pale stone with
 * a warm-white inner edge. The reference world spans its plazas with these;
 * here they mark the way through the hub and frame the project stations.
 */
export function Arch({
  at,
  radius,
  tube = 0.9,
  turn = 0,
  colour = MATERIAL.warmWhite,
  stone = "#d9dee8",
  sweep = Math.PI,
}: {
  at: [number, number, number];
  radius: number;
  tube?: number;
  turn?: number;
  colour?: string;
  stone?: string;
  sweep?: number;
}) {
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <mesh rotation={[0, 0, (Math.PI - sweep) / 2]}>
        <torusGeometry args={[radius, tube, 8, 48, sweep]} />
        <meshStandardMaterial color={stone} roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh rotation={[0, 0, (Math.PI - sweep) / 2]} position={[0, 0, tube * 0.6]}>
        <torusGeometry args={[radius - tube * 0.55, tube * 0.12, 6, 48, sweep]} />
        <Glow colour={colour} opacity={0.9} />
      </mesh>
    </group>
  );
}
