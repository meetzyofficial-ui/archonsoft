"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Foam } from "@/components/world/pieces/Foam";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rimParts, useMerged } from "@/components/world/pieces/merge";
import { releaseOnUpload, useEarlyUpload } from "@/components/world/pieces/release";
import { qualityStore } from "@/components/world/systems/quality";
import type { TreeSpot } from "@/data/world-campus";

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

/**
 * The light of a white LED around a rectangle, as one piece: a crisp core
 * line just outside the glass, and outside that a band that falls from the
 * core's brightness to nothing — the frame glow. Colours ride the vertices
 * and the whole thing is drawn additively, so the core is a line at any
 * distance and only the band is soft.
 */
function ledFrame(w: number, h: number, core: number, band: number, bandLevel: number, z: number) {
  const positions: number[] = [];
  const colours: number[] = [];
  const indices: number[] = [];
  const quad = (a: [number, number], b: [number, number], c: [number, number], d: [number, number], inner: number, outer: number) => {
    const base = positions.length / 3;
    for (const [[x, y], level] of [[a, inner], [b, inner], [c, outer], [d, outer]] as [[number, number], number][]) {
      positions.push(x, y, z);
      colours.push(level, level, level);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const x0 = w / 2;
  const y0 = h / 2;
  const x1 = x0 + core;
  const y1 = y0 + core;
  /* The band falls in two steps — quickly off the core, then slowly to
     nothing — the way light off an LED strip does, not a flat bevel. */
  const xm = x1 + band * 0.25;
  const ym = y1 + band * 0.25;
  const x2 = x1 + band;
  const y2 = y1 + band;
  const mid = bandLevel * 0.3;
  /* The core: four bars that meet at the corners. */
  quad([-x1, y0], [x1, y0], [x1, y1], [-x1, y1], 1, 1);
  quad([x1, -y0], [-x1, -y0], [-x1, -y1], [x1, -y1], 1, 1);
  quad([-x0, -y0], [-x0, y0], [-x1, y0], [-x1, -y0], 1, 1);
  quad([x0, y0], [x0, -y0], [x1, -y0], [x1, y0], 1, 1);
  /* The band, graded outward; mitred at the corners so they do not double. */
  const ring = (ix: number, iy: number, ox: number, oy: number, inner: number, outer: number) => {
    quad([-ix, iy], [ix, iy], [ox, oy], [-ox, oy], inner, outer);
    quad([ix, -iy], [-ix, -iy], [-ox, -oy], [ox, -oy], inner, outer);
    quad([-ix, -iy], [-ix, iy], [-ox, oy], [-ox, -oy], inner, outer);
    quad([ix, iy], [ix, -iy], [ox, -oy], [ox, oy], inner, outer);
  };
  ring(x1, y1, xm, ym, bandLevel, mid);
  ring(xm, ym, x2, y2, mid, 0);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
  geometry.setIndex(indices);
  return geometry;
}

/**
 * The white LED behind a panel.
 *
 * What makes a screen read as a lit thing from across a plaza: a white core
 * line around the glass where the backlight leaks past the frame, a graded
 * glow off that line, a soft halo on the air behind, and — for a panel that
 * stands near the ground — a faint spill of the same light on the deck. No
 * light sources, and no bloom: the core stays a line, the halo sits behind
 * the plate so it never washes over the type, and nothing is pushed past
 * white.
 *
 * `strength` scales the whole thing: the panels by the entrance at one, a
 * far billboard less, a cell in an array lower still. Not every panel is
 * equally important and a world where they all shout the same says nothing.
 */
export function Backlight({
  size,
  strength = 1,
  inset = 0.05,
  foot,
  forward = 0,
  halo = true,
}: {
  size: [number, number];
  strength?: number;
  /** The soft halo on the air behind; a sign whose frame glow is enough goes without. */
  halo?: boolean;
  /** The gap between the panel's edge and the inner edge of the rim. */
  inset?: number;
  /** How far below the panel's centre the floor is, for the pool of light; none for a panel in the air. */
  foot?: number;
  /** How far in front of the panel the pool's centre sits. */
  forward?: number;
}) {
  const [w, h] = size;
  const glow = useGlowTexture();
  /* A phone keeps the core, the frame glow and the halo — they are two draws —
     and the spill on the deck only for the panels that lead. */
  const lite = qualityStore.tier !== "desktop";
  const frame = useMemo(() => ledFrame(w + inset * 2, h + inset * 2, 0.035, 0.2, 0.42, 0.002), [w, h, inset]);
  useEffect(() => () => frame.dispose(), [frame]);
  const spill = foot !== undefined && (!lite || strength >= 0.85);
  return (
    <group>
      {/* The halo on the air behind. */}
      {halo ? (
        <mesh position={[0, 0, -0.22]}>
          <planeGeometry args={[w * 1.45 + 1.2, h * 1.6 + 1.2]} />
          <meshBasicMaterial map={glow} color="#ffffff" transparent opacity={0.62 * strength} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ) : null}
      {/* The core line and the glow off it. */}
      <mesh geometry={frame}>
        <meshBasicMaterial vertexColors transparent opacity={Math.min(1, 0.95 * strength)} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* The spill on the deck. */}
      {spill ? (
        <mesh position={[0, -foot! + 0.025, forward + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w + 2.4, 2.8]} />
          <meshBasicMaterial map={glow} color="#ffffff" transparent opacity={0.34 * strength} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
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
  const gl = useThree((state) => state.gl);
  const texture = useMemo(() => {
    /* Painted at twice the layout, so a tag read from a step away is still type. */
    const density = 2;
    const scale = 6 * density;
    const width = 512 * density;
    const rows = lines.length;
    const lineHeight = 46 * density;
    const canvasHeight = rows * lineHeight + 40 * density;
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
        const x = align === "center" ? width / 2 : 22 * density;
        const text = first ? line.toUpperCase().split("").join(" ") : line;
        ctx.fillText(text, x, 22 * density + i * lineHeight + lineHeight / 2);
      });
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.userData.aspect = width / canvasHeight;
    releaseOnUpload(tex);
    return tex;
  }, [accent, align, colour, lines]);

  useEffect(() => () => texture.dispose(), [texture]);
  useEarlyUpload(gl, texture);

  /* From what was painted: the canvas itself is let go once it is uploaded. */
  const aspect = texture.userData.aspect as number;
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
 * The world's trees, all of them, as one set.
 *
 * A tree is a trunk — oval rather than round, buttressed and flared at the
 * root, bending a little, its bark uneven — from which a limb runs out and
 * up to each of its foliage clumps, with a thinner secondary limb off two of
 * them, so the branches that show through the leaves lead somewhere. Each
 * clump is a few lumpy masses whose surface is pushed in and out by noise,
 * darker underneath and in its dents, so a crown reads as leaves in light
 * and shadow. Trees differ in height, girth, lean, the width and density of
 * the canopy (three clumps or four), the spread of the limbs, the green,
 * and — through a per-instance jitter in the shader — how rough the leaves
 * are. About one in five is a blossom tree, pale pink and unlit; about a
 * third of the green ones carry fruit — apples, oranges or lemons — small,
 * set into the outside of the canopy, and drawn only close enough to see.
 *
 * Seven instanced draws for every tree in the world. Near the camera the
 * crowns are the subdivided clump; further out, the coarse one; beyond the
 * far edge, nothing. A phone's distances are nearer. The crowns sway on
 * their own rhythms, the limbs with them.
 */
const LEAF_GREENS = ["#3d5a33", "#46673a", "#52743e", "#3a573c", "#5b783a", "#486a42", "#647d37", "#415d38", "#355034"];
/* Apple, orange, lemon — in that order, so a tree's kind is its index. */
const FRUIT_COLOURS = ["#b8322c", "#e8842a", "#e3c83a"];
const BARK = ["#3a2d24", "#46362b", "#302620", "#4d3b2e"];

function hash3(x: number, y: number, z: number) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

/** Per-instance roughness, so no two trees' leaves catch the light the same. */
/*
 * And a leaf-scale noise over each clump, in the clump's own coordinates (so
 * it does not swim as the camera moves), that tips the normal and darkens
 * the gaps: a canopy's surface is thousands of small facets of light and
 * shadow, and this is where they come from, without an extra triangle.
 */
const LEAF_NOISE = [
  "float leafHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }",
  "float leafNoise(vec3 p) {",
  "  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(mix(leafHash(i), leafHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(leafHash(i + vec3(0.0, 1.0, 0.0)), leafHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),",
  "             mix(mix(leafHash(i + vec3(0.0, 0.0, 1.0)), leafHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(leafHash(i + vec3(0.0, 1.0, 1.0)), leafHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);",
  "}",
].join("\n");
const roughJitter = (shader: { vertexShader: string; fragmentShader: string }) => {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying float vJitter;\nvarying vec3 vLeaf;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvJitter = fract(sin(float(gl_InstanceID) * 12.9898 + 4.1) * 43758.5453);\nvLeaf = position * 9.0 + vJitter * 17.0;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\nvarying float vJitter;\nvarying vec3 vLeaf;\n${LEAF_NOISE}`)
    .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * (0.84 + 0.3 * vJitter), 0.0, 1.0);")
    .replace(
      "#include <normal_fragment_maps>",
      [
        "#include <normal_fragment_maps>",
        "float leafA = leafNoise(vLeaf);",
        "float leafB = leafNoise(vLeaf * 2.3 + 5.0);",
        "normal = normalize(normal + (vec3(leafA, leafB, leafA * 0.5 + leafB * 0.5) - 0.5) * 0.9);",
        "diffuseColor.rgb *= 0.72 + 0.4 * smoothstep(0.2, 0.8, leafA * 0.6 + leafB * 0.4);",
      ].join("\n"),
    );
};
const roughJitterKey = () => "archon-tree-leaves";
const plainLeaves = () => {};
const plainLeavesKey = () => "archon-tree-leaves-plain";

let treeGeometries: { trunk: THREE.BufferGeometry; branch: THREE.BufferGeometry; clump: THREE.BufferGeometry; coarse: THREE.BufferGeometry; shrub: THREE.BufferGeometry; fruit: THREE.BufferGeometry } | null = null;

function useTreeGeometries() {
  return useMemo(() => {
    if (treeGeometries) return treeGeometries;
    /* The trunk: unit height, oval, four buttresses flaring into the root,
       a slight bend and a slighter twist, bark that is not a perfect
       cylinder, darker at the foot. */
    const trunk = new THREE.CylinderGeometry(0.3, 0.5, 1, 9, 5, true);
    {
      const pos = trunk.attributes.position as THREE.BufferAttribute;
      const colours = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const t = y + 0.5;
        const angle = Math.atan2(z, x) + t * 0.35;
        const buttress = 1 + 0.32 * Math.max(0, Math.cos(angle * 4)) * Math.pow(1 - t, 6);
        const flare = (1 + 0.6 * Math.pow(1 - t, 5)) * buttress;
        const bark = 1 + (hash3(Math.round(x * 24), Math.round(y * 16), Math.round(z * 24)) - 0.5) * 0.14;
        const r = Math.hypot(x, z) * flare * bark;
        pos.setXYZ(i, Math.cos(angle) * r + 0.3 * t * t, y, Math.sin(angle) * r * 0.86);
        const shade = (0.5 + 0.5 * Math.min(1, t * 1.5)) * (0.9 + bark * 0.1);
        colours.set([shade, shade, shade], i * 3);
      }
      trunk.setAttribute("color", new THREE.BufferAttribute(colours, 3));
      trunk.computeVertexNormals();
    }
    /* A limb: base at the origin, reaching up +y to 1, tapering, bending a
       little as it goes — placed by rotating +y onto the way it grows. */
    const branch = new THREE.CylinderGeometry(0.28, 1, 1, 5, 2, true);
    {
      branch.translate(0, 0.5, 0);
      const pos = branch.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i += 1) {
        const t = pos.getY(i);
        pos.setX(i, pos.getX(i) + 0.08 * Math.sin(t * Math.PI));
      }
      branch.computeVertexNormals();
      branch.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pos.count * 3).fill(0.82), 3));
    }
    /* A foliage clump: five lobes of different sizes, their surfaces
       displaced by a noise that depends only on position (so shared edges
       stay closed), merged and smoothed; lighter on top, darker underneath,
       darker again in its dents. The near clump is subdivided once; the far
       one is the same shape, coarse. */
    const clumpOf = (detail: number) => {
      /* Many smaller masses rather than a few big ones, scattered through an
         ellipsoid: the outline of a canopy is leaf clusters, not a ball. The
         coarse clump keeps the larger half. */
      const all: [number, number, number, number][] = [
        [0, 0.05, 0, 0.78],
        [0.55, 0.12, 0.22, 0.52],
        [-0.52, 0.04, -0.26, 0.56],
        [0.12, -0.28, -0.5, 0.48],
        [-0.22, 0.4, 0.4, 0.44],
        [0.38, 0.42, -0.28, 0.42],
        [-0.46, -0.22, 0.34, 0.46],
        [0.6, -0.24, -0.12, 0.38],
        [-0.08, 0.02, 0.66, 0.4],
        [-0.12, -0.12, -0.72, 0.36],
      ];
      const lobes = detail > 0 ? all.slice(0, 7) : detail === 0 ? all.slice(0, 5) : all.slice(0, 3);
      const parts = lobes.map(([ox, oy, oz, r]) => {
        const g = new THREE.IcosahedronGeometry(1, Math.max(0, detail));
        g.deleteAttribute("normal");
        g.deleteAttribute("uv");
        const pos = g.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i += 1) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const z = pos.getZ(i);
          const bump = 1 + (hash3(Math.round(x * 50), Math.round(y * 50), Math.round(z * 50)) - 0.5) * 0.34;
          pos.setXYZ(i, ox + x * r * bump, oy + y * r * bump * 0.84, oz + z * r * bump);
        }
        return g;
      });
      const merged = mergeVertices(mergeGeometries(parts, false)!, 1e-4);
      parts.forEach((g) => g.dispose());
      merged.computeVertexNormals();
      const pos = merged.attributes.position as THREE.BufferAttribute;
      const nor = merged.attributes.normal as THREE.BufferAttribute;
      const colours = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        /* How far out this point sits against where its normal points: a dent reads darker. */
        const outward = (x * nor.getX(i) + y * nor.getY(i) + z * nor.getZ(i)) / Math.max(0.2, Math.hypot(x, y, z));
        const cavity = THREE.MathUtils.clamp(0.72 + outward * 0.34, 0.6, 1.04);
        const light = THREE.MathUtils.clamp(0.6 + y * 0.4, 0.4, 1.06) * cavity * (0.93 + hash3(x * 9, y * 9, z * 9) * 0.14);
        colours.set([light, light, light], i * 3);
      }
      merged.setAttribute("color", new THREE.BufferAttribute(colours, 3));
      return merged;
    };
    const merged = clumpOf(1);
    const coarse = clumpOf(0);
    /* Shrubs are small and low: three coarse masses are plenty. */
    const shrub = clumpOf(-1);
    const fruit = new THREE.SphereGeometry(1, 10, 8);
    fruit.setAttribute("color", new THREE.BufferAttribute(new Float32Array(fruit.attributes.position!.count * 3).fill(1), 3));
    treeGeometries = { trunk, branch, clump: merged, coarse, shrub, fruit };
    return treeGeometries;
  }, []);
}

const UP = new THREE.Vector3(0, 1, 0);
const LIMB = new THREE.Vector3();

export function Trees({ spots }: { spots: TreeSpot[] }) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const branches = useRef<THREE.InstancedMesh>(null);
  const crownsNear = useRef<THREE.InstancedMesh>(null);
  const crownsFar = useRef<THREE.InstancedMesh>(null);
  const fruits = useRef<THREE.InstancedMesh>(null);
  const shrubs = useRef<THREE.InstancedMesh>(null);
  const rocks = useRef<THREE.InstancedMesh>(null);
  const geometries = useTreeGeometries();
  const phone = qualityStore.tier !== "desktop";
  const FAR = phone ? 70 : 110;
  const FRUIT_NEAR = phone ? 24 : 40;
  /* Inside this, crowns are the subdivided clump; beyond, the coarse one. */
  const DETAIL_NEAR = qualityStore.software ? 0 : phone ? 20 : 32;
  /* Limbs only where they can be told from the canopy they run into. */
  const LIMBS_NEAR = phone ? 22 : 36;
  /* The leaf shading is per pixel; a CPU rasteriser goes without it. */
  const leafShader = !qualityStore.software;
  const count = spots.length;
  const CROWNS = 4;
  /* A limb to each outer clump, and a secondary limb off two of them. */
  const BRANCHES = 5;
  const FRUITS = 6;

  const seeds = useMemo(
    () =>
      spots.map((spot, i) => {
        const r = (k: number) => hash3(i * 1.37 + k, i * 0.71 - k, k * 2.3);
        const h = 2.3 + r(1) * 2.3;
        const girth = 0.22 + r(2) * 0.16;
        const spread = 0.7 + r(3) * 0.5;
        const size = (0.95 + r(4) * 0.5) * (h / 3.4);
        /* Some canopies are full (four clumps), some open (three). */
        const clumps = r(40) < 0.35 ? 3 : 4;
        /* One green tree in three, and each of those an apple, an orange or a lemon tree in turn. */
        const fruit = !spot.blossom && i % 3 === 1 ? FRUIT_COLOURS[Math.floor(i / 3) % FRUIT_COLOURS.length]! : null;
        const crowns = Array.from({ length: CROWNS }, (_, k) => {
          const a = k * 2.2 + r(8 + k) * 1.4;
          const rad = size * (k === 0 ? 1.15 : 0.72 + r(12 + k) * 0.36);
          return {
            ox: k === 0 ? 0 : Math.cos(a) * spread * size,
            /* The canopy hangs down round the top of the trunk rather than sitting on it. */
            oy: k === 0 ? -0.05 * size : (r(16 + k) - 0.72) * 0.8 * size,
            oz: k === 0 ? 0 : Math.sin(a) * spread * size,
            r: rad,
            yaw: a,
            shown: k < clumps,
            green: LEAF_GREENS[(i * 3 + k * 2) % LEAF_GREENS.length]!,
          };
        });
        return {
          ...spot,
          h,
          girth,
          fruit,
          lean: (r(5) - 0.5) * 0.14,
          yaw: r(6) * Math.PI * 2,
          sway: 0.7 + r(7) * 0.6,
          bark: BARK[i % BARK.length]!,
          crowns,
          /* Where each limb leaves the trunk, as a share of its height. */
          forks: [0.55 + r(30) * 0.12, 0.62 + r(31) * 0.12, 0.7 + r(32) * 0.1],
        };
      }),
    [spots],
  );

  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  const time = useRef(0);

  useEffect(() => {
    const colour = new THREE.Color();
    const leaf = new THREE.Color();
    seeds.forEach((seed, i) => {
      colour.set(seed.bark);
      trunks.current?.setColorAt(i, colour);
      for (let k = 0; k < BRANCHES; k += 1) branches.current?.setColorAt(i * BRANCHES + k, colour);
      seed.crowns.forEach((crown, k) => {
        leaf.set(seed.blossom ? (k % 2 ? "#e9bccb" : "#dca6b8") : crown.green);
        crownsNear.current?.setColorAt(i * CROWNS + k, leaf);
        crownsFar.current?.setColorAt(i * CROWNS + k, leaf);
      });
      leaf.set(LEAF_GREENS[(i + 5) % LEAF_GREENS.length]!).multiplyScalar(0.8);
      shrubs.current?.setColorAt(i, leaf);
      if (seed.fruit) {
        colour.set(seed.fruit);
        for (let k = 0; k < FRUITS; k += 1) fruits.current?.setColorAt(i * FRUITS + k, colour);
      }
    });
    for (const ref of [trunks, branches, crownsNear, crownsFar, shrubs, fruits]) {
      if (ref.current?.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
  }, [seeds]);

  /* Each tree's colours as Colors, once: written into whichever instance
     slot the tree's parts land in this frame. */
  const palette = useMemo(
    () =>
      seeds.map((seed, i) => ({
        bark: new THREE.Color(seed.bark),
        crowns: seed.crowns.map((crown, k) => new THREE.Color(seed.blossom ? (k % 2 ? "#e9bccb" : "#dca6b8") : crown.green)),
        shrub: new THREE.Color(LEAF_GREENS[(i + 5) % LEAF_GREENS.length]!).multiplyScalar(0.8),
        fruit: seed.fruit ? new THREE.Color(seed.fruit) : null,
      })),
    [seeds],
  );

  /** A limb from (fx, fy, fz) to (tx, ty, tz), `width` thick at its base, into slot `index`. */
  const limb = (index: number, fx: number, fy: number, fz: number, tx: number, ty: number, tz: number, width: number, colour: THREE.Color) => {
    LIMB.set(tx - fx, ty - fy, tz - fz);
    const length = LIMB.length();
    q.setFromUnitVectors(UP, LIMB.divideScalar(Math.max(length, 1e-4)));
    p.set(fx, fy, fz);
    sc.set(width, length, width);
    branches.current?.setMatrixAt(index, matrix.compose(p, q, sc));
    branches.current?.setColorAt(index, colour);
  };

  /*
   * Every frame the parts that are drawn are packed to the front of their
   * instanced mesh and the mesh's count set to how many there are. An
   * instance hidden by a zero-sized matrix is still sent through the vertex
   * shader; one past the count is not sent at all — so a subdivided crown
   * costs nothing when its tree is far, and fruit costs nothing unless a
   * fruit tree is near.
   */
  useFrame(({ camera }, delta) => {
    time.current += Math.min(delta, 0.05);
    const t = time.current;
    const cx = camera.position.x;
    const cz = camera.position.z;
    let nTrunk = 0;
    let nLimb = 0;
    let nNear = 0;
    let nFar = 0;
    let nFruit = 0;
    let nShrub = 0;
    let nRock = 0;
    seeds.forEach((seed, i) => {
      const [x, y, z] = seed.at;
      const distance = Math.hypot(x - cx, z - cz);
      if (distance >= FAR) return;
      const colours = palette[i]!;
      /* Wind: a slow lean and a faster flutter, on the tree's own rhythm. */
      const sway = Math.sin(t * 0.55 * seed.sway + i) * 0.018 + Math.sin(t * 1.7 * seed.sway + i * 2.1) * 0.005;
      e.set(seed.lean + sway, seed.yaw, sway * 0.5);
      q.setFromEuler(e);
      p.set(x, y + seed.h / 2, z);
      sc.set(seed.girth, seed.h, seed.girth);
      trunks.current?.setMatrixAt(nTrunk, matrix.compose(p, q, sc));
      trunks.current?.setColorAt(nTrunk, colours.bark);
      nTrunk += 1;
      const topX = x + (seed.lean + sway) * seed.h * 0.5;
      const near = distance < DETAIL_NEAR;
      seed.crowns.forEach((crown, k) => {
        if (!crown.shown) return;
        const flutter = sway * (1.6 + k * 0.4);
        p.set(topX + crown.ox + flutter * 2, y + seed.h + crown.oy + crown.r * 0.35, z + crown.oz);
        sc.set(crown.r, crown.r * 0.88, crown.r);
        e.set(flutter, crown.yaw, flutter * 0.6);
        q.setFromEuler(e);
        matrix.compose(p, q, sc);
        if (near) {
          crownsNear.current?.setMatrixAt(nNear, matrix);
          crownsNear.current?.setColorAt(nNear, colours.crowns[k]!);
          nNear += 1;
        } else {
          crownsFar.current?.setMatrixAt(nFar, matrix);
          crownsFar.current?.setColorAt(nFar, colours.crowns[k]!);
          nFar += 1;
        }
      });
      /* The limbs: from the trunk into the middle of each outer clump, and a
         thinner one off the first two, out toward the clump's rim. */
      if (distance <= LIMBS_NEAR) {
        for (let k = 0; k < BRANCHES; k += 1) {
          const target = seed.crowns[k < 3 ? k + 1 : k - 2]!;
          if (!target.shown) continue;
          const fy = y + seed.h * seed.forks[k % 3]!;
          const fx = x + (seed.lean + sway) * (fy - y) * 0.5;
          const tx = topX + target.ox * 0.85 + sway * 3;
          const ty = y + seed.h + target.oy + target.r * 0.2;
          const tz = z + target.oz * 0.85;
          if (k < 3) {
            limb(nLimb, fx, fy, z, tx, ty, tz, seed.girth * 0.34, colours.bark);
          } else {
            /* Halfway along the main limb, out past the clump's middle. */
            limb(nLimb, (fx + tx) / 2, (fy + ty) / 2, (z + tz) / 2, tx + target.ox * 0.4, ty + target.r * 0.25, tz + target.oz * 0.4, seed.girth * 0.18, colours.bark);
          }
          nLimb += 1;
        }
      }
      if (seed.fruit && colours.fruit && distance <= FRUIT_NEAR) {
        const kind = FRUIT_COLOURS.indexOf(seed.fruit);
        for (let k = 0; k < FRUITS; k += 1) {
          const crown = seed.crowns[k % CROWNS]!;
          if (!crown.shown) continue;
          /* On the lower and outer part of a clump, just inside its surface. */
          const a = k * 2.3 + i * 0.7;
          const b = -0.15 - (k % 3) * 0.3;
          p.set(
            topX + crown.ox + Math.cos(a) * Math.cos(b) * crown.r * 0.86 + sway * 3,
            y + seed.h + crown.oy + crown.r * 0.35 + Math.sin(b) * crown.r * 0.78,
            z + crown.oz + Math.sin(a) * Math.cos(b) * crown.r * 0.86,
          );
          /* Apples and oranges a hand's width, lemons a little smaller and longer. */
          const fr = (kind === 2 ? 0.05 : 0.058) + (k % 3) * 0.006;
          sc.set(fr, fr * (kind === 2 ? 1.3 : 1.04), fr);
          e.set(0.3 * (k % 2), a, 0);
          q.setFromEuler(e);
          fruits.current?.setMatrixAt(nFruit, matrix.compose(p, q, sc));
          fruits.current?.setColorAt(nFruit, colours.fruit);
          nFruit += 1;
        }
      }
      p.set(x + Math.cos(seed.yaw) * 0.7, y + 0.28, z + Math.sin(seed.yaw) * 0.7);
      const r = 0.45 + (i % 3) * 0.1;
      sc.set(r, r * 0.7, r);
      e.set(0, seed.yaw, 0);
      q.setFromEuler(e);
      shrubs.current?.setMatrixAt(nShrub, matrix.compose(p, q, sc));
      shrubs.current?.setColorAt(nShrub, colours.shrub);
      nShrub += 1;
      if (seed.rock) {
        const rr = 1.9 + (i % 3) * 0.5;
        p.set(x, y - 2.4, z);
        sc.set(rr, 5.2, rr * 0.9);
        e.set(0, seed.yaw * 1.3, 0);
        q.setFromEuler(e);
        rocks.current?.setMatrixAt(nRock, matrix.compose(p, q, sc));
        nRock += 1;
      }
    });
    const counts: [React.RefObject<THREE.InstancedMesh | null>, number][] = [
      [trunks, nTrunk],
      [branches, nLimb],
      [crownsNear, nNear],
      [crownsFar, nFar],
      [shrubs, nShrub],
      [rocks, nRock],
      [fruits, nFruit],
    ];
    for (const [ref, n] of counts) {
      const mesh = ref.current;
      if (!mesh) continue;
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group name="trees">
      <instancedMesh ref={trunks} args={[geometries.trunk, undefined, count]} frustumCulled={false} name="trees:trunks">
        <meshStandardMaterial vertexColors roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={branches} args={[geometries.branch, undefined, count * BRANCHES]} frustumCulled={false} name="trees:limbs">
        <meshStandardMaterial vertexColors roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={crownsNear} args={[geometries.clump, undefined, count * CROWNS]} frustumCulled={false} name="trees:leaves" userData={{
          blossoms: seeds.filter((one) => one.blossom).length,
          fruit: seeds.map((one) => one.fruit),
          open: seeds.filter((one) => one.crowns.some((crown) => !crown.shown)).length,
          heights: seeds.map((one) => one.h),
          girths: seeds.map((one) => one.girth),
        }}>
        <meshStandardMaterial vertexColors roughness={0.84} metalness={0} envMapIntensity={0.45} onBeforeCompile={leafShader ? roughJitter : plainLeaves} customProgramCacheKey={leafShader ? roughJitterKey : plainLeavesKey} />
      </instancedMesh>
      <instancedMesh ref={crownsFar} args={[geometries.coarse, undefined, count * CROWNS]} frustumCulled={false} name="trees:leaves-far">
        <meshStandardMaterial vertexColors roughness={0.84} metalness={0} envMapIntensity={0.45} onBeforeCompile={leafShader ? roughJitter : plainLeaves} customProgramCacheKey={leafShader ? roughJitterKey : plainLeavesKey} />
      </instancedMesh>
      <instancedMesh ref={fruits} args={[geometries.fruit, undefined, count * FRUITS]} frustumCulled={false} name="trees:fruit">
        <meshStandardMaterial vertexColors roughness={0.5} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={shrubs} args={[geometries.shrub, undefined, count]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.95} envMapIntensity={0.4} />
      </instancedMesh>
      <instancedMesh ref={rocks} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.08, 1, 6, 1]} />
        <meshStandardMaterial color="#1c2233" roughness={0.95} flatShading />
      </instancedMesh>
    </group>
  );
}
