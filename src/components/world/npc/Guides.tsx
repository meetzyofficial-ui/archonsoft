"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { animateFace, newFaceState } from "@/components/world/npc/face";
import { Glow, MATERIAL } from "@/components/world/pieces/Kit";
import { useMerged } from "@/components/world/pieces/merge";
import { body } from "@/components/world/systems/body";
import { qualityStore } from "@/components/world/systems/quality";
import { discovery } from "@/components/world/systems/discovery";
import { interactables } from "@/components/world/systems/focus";
import type { PreparedGuide } from "@/lib/worldPayload";

/**
 * The people at the projects.
 *
 * Each station has two or three of them. Left alone they stand together and
 * behave the way a small group does — shifting weight, glancing at each other
 * and at the work, one of them occasionally turning to look at the water.
 * When the visitor comes within sight they notice: heads turn first, then the
 * whole body squares up. Closer still, one of them greets — the line appears
 * in the interface and the key prompt offers the conversation. Asked, they
 * explain the project, and the one speaking gestures while the text is read.
 *
 * The state machine is three states and a distance: IDLE beyond twenty
 * metres, ATTENTION inside that, GREETING inside the guide's own `greetAt`.
 * It is evaluated every frame from `body`, never from React, and the only
 * thing that leaves this file is the store the HUD reads the greeting from.
 *
 * The figures are built from primitives like the explorer, deliberately
 * plainer than it: a person is not the hero here, the project is. They are
 * dark-clothed with a pale head and one warm accent apiece — the only place
 * the world's terracotta appears at eye level.
 */

export type GuidePhase = "idle" | "attention" | "greeting";

type GuideReading = { id: string | null; phase: GuidePhase };

let reading: GuideReading = { id: null, phase: "idle" };
const listeners = new Set<() => void>();

export const guideStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => reading,
  set(next: GuideReading) {
    if (next.id === reading.id && next.phase === reading.phase) return;
    reading = next;
    listeners.forEach((listener) => listener());
  },
  /** The guide whose explanation is open right now, so that one gestures. */
  talking: null as string | null,
};

const ATTENTION_AT = 20;

/**
 * Four silhouettes, three skin tones, and a wardrobe per project.
 *
 * The figures are built from primitives — no rig, no download — but at the
 * proportions of a person: shoes, calves and thighs with a knee between,
 * hips, a chest that is wider than the waist, a clavicle line, a neck, a
 * head that is taller than it is wide, and hair with a shape. Each project's
 * group dresses differently, quietly: DP Pano in navy over a light shirt with
 * a tablet in hand; Meetzy in casual knits with a badge on a lanyard; Erden
 * in a long cream coat with a warm scarf and a folio under the arm. They are
 * the people who work here, not soldiers and not mannequins.
 */

export type Wardrobe = {
  cloth: string;
  cloth2: string;
  shirt: string;
  accent: string;
  accessory: "tablet" | "badge" | "folio" | "bag" | "headphones" | "none";
  coat: boolean;
  /** A skirt or dress over the hips instead of trousers. */
  skirt?: boolean;
  /** Pale shoes — sneakers — rather than dark. */
  sneakers?: boolean;
  /** A scarf in the accent colour. */
  scarf?: boolean;
};

export const WARDROBE: Record<string, Wardrobe> = {
  dppano: { cloth: "#1e2c4c", cloth2: "#2a3a60", shirt: "#cfe0f6", accent: "#6aa8ff", accessory: "tablet", coat: false },
  meetzy: { cloth: "#2c2f3d", cloth2: "#3a3550", shirt: "#e8dcd2", accent: "#f2a08c", accessory: "badge", coat: false },
  erden: { cloth: "#d8cbb8", cloth2: "#bfae98", shirt: "#f5efe6", accent: "#d98a6a", accessory: "folio", coat: true },
  /* The population: what people wear to a creative campus. */
  denim: { cloth: "#3a4e78", cloth2: "#2b3550", shirt: "#f1ede6", accent: "#c97a65", accessory: "bag", coat: false, sneakers: true },
  olive: { cloth: "#5a6047", cloth2: "#2e2a26", shirt: "#e9e2d2", accent: "#f2a889", accessory: "headphones", coat: true },
  rust: { cloth: "#8a4a3a", cloth2: "#2a2422", shirt: "#f4e9dc", accent: "#ffe9d5", accessory: "none", coat: false },
  plum: { cloth: "#4a2f4f", cloth2: "#2a2230", shirt: "#e7c7b5", accent: "#b9a7ff", accessory: "bag", coat: false, skirt: true },
  sand: { cloth: "#c9b89a", cloth2: "#8a7a62", shirt: "#fff8ef", accent: "#54d9ff", accessory: "tablet", coat: true },
  charcoal: { cloth: "#26282f", cloth2: "#1a1c22", shirt: "#d9dee8", accent: "#f2a7c7", accessory: "headphones", coat: false, sneakers: true },
  teal: { cloth: "#2f5f66", cloth2: "#22303a", shirt: "#f4e9dc", accent: "#ffe9d5", accessory: "none", coat: false, skirt: true },
  camel: { cloth: "#a8815a", cloth2: "#3a2f28", shirt: "#f1ede6", accent: "#c97a65", accessory: "bag", coat: true },
  navy: { cloth: "#22304f", cloth2: "#1a2238", shirt: "#e8dcd2", accent: "#6aa8ff", accessory: "badge", coat: false },
  cream: { cloth: "#efe6d8", cloth2: "#b8a58c", shirt: "#f7f2ea", accent: "#f2a889", accessory: "none", coat: false, skirt: true, sneakers: true },
  /* The host: cream, warm white, a breath of peach and blue. */
  host: { cloth: "#e8dccb", cloth2: "#cdbfa9", shirt: "#fff8ef", accent: "#f2a889", accessory: "none", coat: true, sneakers: false, scarf: true },
};

export const SKINS = ["#e9cfb7", "#c99a76", "#8f6146", "#f0d9c4", "#b0805e"];
export const HAIRS = ["#1a1512", "#3b2a1f", "#5a4632", "#101010", "#8a5a3a", "#c9a26a"];

/** Silhouettes: height, shoulder width, build, hair shape. */
export const FRAMES = [
  { height: 1.84, shoulders: 0.26, build: 1.0, hair: "short" },
  { height: 1.76, shoulders: 0.3, build: 1.12, hair: "cropped" },
  { height: 1.67, shoulders: 0.23, build: 0.92, hair: "long" },
  { height: 1.73, shoulders: 0.25, build: 1.0, hair: "bun" },
  { height: 1.9, shoulders: 0.29, build: 1.06, hair: "curly" },
  { height: 1.62, shoulders: 0.22, build: 0.9, hair: "ponytail" },
  { height: 1.8, shoulders: 0.27, build: 1.18, hair: "short" },
  { height: 1.7, shoulders: 0.24, build: 0.96, hair: "bob" },
] as const;
export type HairStyle = (typeof FRAMES)[number]["hair"];
/** Iris colours, by the person. */
const IRISES = ["#4a3222", "#2f5a3a", "#3a5f8a", "#6b4a2a", "#2a2a2a"];
export type Frame = (typeof FRAMES)[number];

/**
 * How they stand. Nobody stands to attention: one has the arms folded, one
 * a hand on the hip, one holds what they carry up in front of them, one is
 * simply at ease. Rotations for each arm and forearm, in radians; the
 * gesture system moves the right arm off these when someone speaks.
 */
type Pose = { armR: [number, number]; foreR: [number, number]; armL: [number, number]; foreL: [number, number] };
const POSES: Record<string, Pose> = {
  relaxed: { armR: [0.05, -0.08], foreR: [-0.3, 0], armL: [0.05, 0.08], foreL: [-0.25, 0] },
  crossed: { armR: [-0.35, -0.3], foreR: [-1.75, -0.9], armL: [-0.3, 0.3], foreL: [-1.7, 0.9] },
  hip: { armR: [0.15, -0.45], foreR: [-0.9, -1.2], armL: [0.05, 0.08], foreL: [-0.25, 0] },
  holding: { armR: [-0.3, -0.15], foreR: [-1.5, -0.3], armL: [-0.35, 0.15], foreL: [-1.55, 0.3] },
};
const POSE_ORDER = ["relaxed", "crossed", "holding", "hip", "relaxed", "crossed"] as const;

/**
 * Three distances, three amounts of person.
 *
 * Beyond forty metres a figure is a silhouette and gets the parts that make
 * one: legs, torso, jacket, arms, head, hair. Inside that it gets the things
 * that read at a walk — shoes, hands, knees, ears, collar, cuffs, what it
 * carries. Inside fourteen metres it gets a face, fingers, seams and the
 * detail on the badge. `lod` on a part says which tier it belongs to; the
 * group toggles them as the visitor comes and goes, so at the spawn point
 * eight people are a hundred and twenty draws instead of two hundred and
 * fifty, and at arm's length they hold up.
 */
const NEAR_AT = 14;
const MID_AT = 40;
const CLOSE_AT = 3;

/** Each project lights its people a little differently. */
const TINT: Record<string, { colour: string; amount: number }> = {
  dppano: { colour: "#9ad6ff", amount: 0.1 },
  meetzy: { colour: "#ffd0b4", amount: 0.1 },
  erden: { colour: "#ffe2c4", amount: 0.13 },
};

function tinted(base: string, tint: { colour: string; amount: number } | undefined) {
  if (!tint) return base;
  return "#" + new THREE.Color(base).lerp(new THREE.Color(tint.colour), tint.amount).getHexString();
}

/**
 * Hair, as layered masses: a cap over the skull, and what the style adds —
 * a fringe, sideburns, a fall down the back, a bun, a tail, curls. Never
 * one sphere.
 */
function Hair({ style, colour }: { style: HairStyle; colour: string }) {
  const mat = <meshStandardMaterial color={colour} roughness={0.88} metalness={0} />;
  const cap = (
    <mesh position={[0, 0.042, -0.012]} scale={[1.04, 1.08, 1.05]}>
      <sphereGeometry args={[0.11, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
      {mat}
    </mesh>
  );
  return (
    <group name="hair">
      {cap}
      {style === "short" ? (
        <>
          {/* A fringe pushed to one side, and sideburns. */}
          <mesh position={[0.02, 0.078, 0.07]} rotation={[0.4, 0, -0.25]} scale={[1, 0.5, 0.7]} userData={{ lod: 1 }}>
            <sphereGeometry args={[0.062, 10, 8]} />
            {mat}
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.1, 0.0, 0.01]} scale={[0.45, 1.1, 0.8]} userData={{ lod: 1 }}>
              <sphereGeometry args={[0.04, 8, 8]} />
              {mat}
            </mesh>
          ))}
        </>
      ) : null}
      {style === "cropped" ? (
        <mesh position={[0, 0.07, 0.03]} scale={[1, 0.45, 0.9]} userData={{ lod: 1 }}>
          <sphereGeometry args={[0.09, 10, 8]} />
          {mat}
        </mesh>
      ) : null}
      {style === "long" ? (
        <>
          {/* The fall down the back, and strands past the ears. */}
          <mesh position={[0, -0.09, -0.06]} scale={[1.1, 1, 0.8]}>
            <capsuleGeometry args={[0.08, 0.2, 4, 10]} />
            {mat}
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.1, -0.05, -0.005]} rotation={[0, 0, side * 0.06]} userData={{ lod: 1 }}>
              <capsuleGeometry args={[0.026, 0.16, 4, 8]} />
              {mat}
            </mesh>
          ))}
          <mesh position={[-0.03, 0.08, 0.075]} rotation={[0.5, 0, 0.3]} scale={[1, 0.45, 0.6]} userData={{ lod: 1 }}>
            <sphereGeometry args={[0.06, 8, 8]} />
            {mat}
          </mesh>
        </>
      ) : null}
      {style === "bun" ? (
        <>
          <mesh position={[0, 0.09, -0.11]}>
            <sphereGeometry args={[0.048, 10, 8]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.065, -0.07]} scale={[1, 0.5, 1]} userData={{ lod: 1 }}>
            <sphereGeometry args={[0.06, 8, 8]} />
            {mat}
          </mesh>
          <mesh position={[0.025, 0.085, 0.07]} rotation={[0.4, 0, -0.2]} scale={[1, 0.4, 0.6]} userData={{ lod: 1 }}>
            <sphereGeometry args={[0.055, 8, 8]} />
            {mat}
          </mesh>
        </>
      ) : null}
      {style === "curly" ? (
        <>
          {[[-0.06, 0.09, 0.02], [0.06, 0.09, 0.02], [0, 0.11, -0.03], [-0.07, 0.05, -0.06], [0.07, 0.05, -0.06], [0, 0.085, 0.075]].map((at, i) => (
            <mesh key={i} position={at as [number, number, number]} scale={[1, 0.9, 1]} userData={i > 2 ? { lod: 1 } : undefined}>
              <sphereGeometry args={[0.052, 8, 8]} />
              {mat}
            </mesh>
          ))}
        </>
      ) : null}
      {style === "ponytail" ? (
        <>
          <mesh position={[0, 0.03, -0.11]} rotation={[0.9, 0, 0]}>
            <capsuleGeometry args={[0.032, 0.22, 4, 8]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.07, -0.09]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            {mat}
          </mesh>
          <mesh position={[0.02, 0.085, 0.072]} rotation={[0.5, 0, -0.35]} scale={[1, 0.4, 0.6]} userData={{ lod: 1 }}>
            <sphereGeometry args={[0.056, 8, 8]} />
            {mat}
          </mesh>
        </>
      ) : null}
      {style === "bob" ? (
        <>
          {/* A bob: the mass falls straight to the jaw all round. */}
          <mesh position={[0, -0.02, -0.02]} scale={[1.12, 1, 1.08]}>
            <cylinderGeometry args={[0.105, 0.115, 0.14, 14, 1, true]} />
            <meshStandardMaterial color={colour} roughness={0.88} metalness={0} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.082, 0.07]} rotation={[0.45, 0, 0]} scale={[1.05, 0.4, 0.6]} userData={{ lod: 1 }}>
            <sphereGeometry args={[0.062, 8, 8]} />
            {mat}
          </mesh>
        </>
      ) : null}
    </group>
  );
}

function Fingers({ skin, side }: { skin: string; side: number }) {
  /* Four fingers and a thumb as one piece: a suggestion of a hand, not a
     hand. */
  const geometry = useMerged(
    () => [
      ...[0, 1, 2, 3].map((i) => ({
        geometry: new THREE.CapsuleGeometry(0.008, 0.03, 2, 5),
        at: [-0.024 + i * 0.016, -0.045, 0.004] as [number, number, number],
        turn: [0.25, 0, 0] as [number, number, number],
      })),
      {
        geometry: new THREE.CapsuleGeometry(0.008, 0.024, 2, 5),
        at: [side * 0.036, -0.015, 0.018] as [number, number, number],
        turn: [0.6, 0, side * 0.9] as [number, number, number],
      },
    ],
    [side],
  );
  return (
    <mesh geometry={geometry} userData={{ lod: 2 }}>
      <meshLambertMaterial color={skin} />
    </mesh>
  );
}

export function Person({
  frame,
  wardrobe,
  skin,
  hair,
  projectId,
}: {
  frame: Frame;
  wardrobe: Wardrobe;
  skin: string;
  hair: string;
  projectId: string;
}) {
  const k = frame.height / 1.78;
  const b = frame.build;
  const sh = frame.shoulders;
  const tint = TINT[projectId];
  const skinLit = useMemo(() => tinted(skin, tint), [skin, tint]);
  const shirtLit = useMemo(() => tinted(wardrobe.shirt, tint), [wardrobe.shirt, tint]);
  const clothLit = useMemo(() => tinted(wardrobe.cloth, tint && { ...tint, amount: tint.amount * 0.5 }), [wardrobe.cloth, tint]);
  const faceLine = useMemo(() => "#" + new THREE.Color(skin).multiplyScalar(0.62).getHexString(), [skin]);
  const lipColour = useMemo(() => "#" + new THREE.Color(skin).lerp(new THREE.Color("#a0524a"), 0.45).getHexString(), [skin]);
  const iris = useMemo(() => IRISES[(skin.charCodeAt(1) + hair.charCodeAt(2)) % IRISES.length]!, [hair, skin]);
  const jacketY = wardrobe.coat ? 1.08 : 1.22;
  const jacketH = wardrobe.coat ? 0.78 : 0.42;
  const jacketD = 0.26 * b;
  return (
    <group scale={[k, k, k]} name="npc">
      {/* Legs: thigh and calf with a knee between, hinged at the hip and the
          knee so the figure can walk and sit. The hip pivot is at 0.96. */}
      {[-1, 1].map((side) => (
        <group key={`leg${side}`} position={[side * 0.1, 0.96, 0]} name={side < 0 ? "legL" : "legR"}>
          <mesh position={[0, -0.21, 0]}>
            <capsuleGeometry args={[0.082 * b, 0.34, 4, 8]} />
            <meshLambertMaterial color={wardrobe.skirt ? skinLit : wardrobe.cloth2} />
          </mesh>
          <group position={[0, -0.44, 0]} name={side < 0 ? "shinL" : "shinR"}>
            <mesh userData={{ lod: 1 }}>
              <sphereGeometry args={[0.07 * b, 8, 8]} />
              <meshLambertMaterial color={wardrobe.skirt ? skinLit : wardrobe.cloth2} />
            </mesh>
            <mesh position={[0, -0.22, 0]}>
              <capsuleGeometry args={[0.065 * b, 0.36, 4, 8]} />
              <meshLambertMaterial color={wardrobe.skirt ? skinLit : wardrobe.cloth2} />
            </mesh>
            {/* Trouser hem, a shade darker. */}
            {!wardrobe.skirt ? (
              <mesh position={[0, -0.405, 0]} userData={{ lod: 2 }}>
                <cylinderGeometry args={[0.068 * b, 0.068 * b, 0.02, 10]} />
                <meshLambertMaterial color="#10141f" />
              </mesh>
            ) : null}
            {/* Shoes ride on the shin: an upper, a sole, a heel. */}
            <mesh position={[0, -0.465, 0.045]} scale={[1, 0.8, 1]} userData={{ lod: 1 }}>
              <capsuleGeometry args={[0.052, 0.17, 4, 8]} />
              <meshStandardMaterial color={wardrobe.sneakers ? "#e6e1d8" : "#14161c"} roughness={wardrobe.sneakers ? 0.8 : 0.45} metalness={0.1} />
            </mesh>
            <mesh position={[0, -0.505, 0.04]} userData={{ lod: 1 }}>
              <boxGeometry args={[0.11, 0.022, 0.29]} />
              <meshStandardMaterial color={wardrobe.sneakers ? "#f4f1ea" : "#0b0d12"} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.49, -0.07]} userData={{ lod: 2 }}>
              <boxGeometry args={[0.1, 0.03, 0.06]} />
              <meshStandardMaterial color={wardrobe.sneakers ? "#d8d3ca" : "#0b0d12"} roughness={0.7} />
            </mesh>
          </group>
        </group>
      ))}
      {/* A skirt or dress, where the wardrobe says so. */}
      {wardrobe.skirt ? (
        <>
          <mesh position={[0, 0.78, 0]}>
            <cylinderGeometry args={[0.17 * b, 0.26 * b, 0.42, 16, 1, true]} />
            <meshStandardMaterial color={wardrobe.cloth} roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
          {/* The hem, a little irregular. */}
          <mesh position={[0, 0.575, 0]} rotation={[0.04, 0, 0.03]} userData={{ lod: 1 }}>
            <torusGeometry args={[0.258 * b, 0.012, 6, 18]} />
            <meshStandardMaterial color={wardrobe.cloth} roughness={0.95} />
          </mesh>
        </>
      ) : null}
      {/* Hips. */}
      <mesh position={[0, 0.98, 0]}>
        <boxGeometry args={[0.32 * b, 0.16, 0.2]} />
        <meshLambertMaterial color={wardrobe.cloth2} />
      </mesh>
      {/* Torso: waist to chest, wider at the top. */}
      <mesh position={[0, 1.16, 0]}>
        <capsuleGeometry args={[0.15 * b, 0.16, 4, 10]} />
        <meshLambertMaterial color={shirtLit} />
      </mesh>
      <mesh position={[0, 1.34, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.16 * b, sh * 1.4, 4, 10]} />
        <meshLambertMaterial color={clothLit} />
      </mesh>
      {/* The jacket or coat over it, open at the front so the shirt shows:
          a rounded body, a little wider at the hem when it is a coat. */}
      <mesh position={[0, jacketY, -0.02]} scale={[1, 1, 0.62]}>
        <cylinderGeometry args={[sh * 0.9 + 0.05, wardrobe.coat ? sh * 0.9 + 0.09 : sh * 0.9 + 0.03, jacketH, 14, 1, true]} />
        <meshStandardMaterial color={clothLit} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, jacketY + jacketH / 2, -0.02]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.62, 1]}>
        <circleGeometry args={[sh * 0.9 + 0.05, 14]} />
        <meshStandardMaterial color={clothLit} roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[0, 1.24, 0.1 * b + 0.02]} userData={{ lod: 1 }}>
        <planeGeometry args={[0.1, 0.34]} />
        <meshLambertMaterial color={shirtLit} />
      </mesh>
      {/* The jacket's seams: the two front edges, and the hem. */}
      {[-1, 1].map((side) => (
        <mesh key={`seam${side}`} position={[side * 0.06, jacketY, jacketD / 2 - 0.03 + 0.002]} userData={{ lod: 2 }}>
          <planeGeometry args={[0.006, jacketH - 0.02]} />
          <meshLambertMaterial color={wardrobe.cloth2} />
        </mesh>
      ))}
      <mesh position={[0, jacketY - jacketH / 2 + 0.006, jacketD / 2 - 0.03 + 0.002]} userData={{ lod: 2 }}>
        <planeGeometry args={[sh * 2 + 0.1, 0.012]} />
        <meshLambertMaterial color={wardrobe.cloth2} />
      </mesh>
      {/* Lapels: two angled panels down from the collar, the front of the
          jacket opening over the shirt. */}
      {[-1, 1].map((side) => (
        <mesh
          key={`lapel${side}`}
          position={[side * 0.055, jacketY + jacketH / 2 - 0.1, jacketD / 2 - 0.03 + 0.004]}
          rotation={[0.08, side * -0.28, side * 0.16]}
          userData={{ lod: 1 }}
        >
          <boxGeometry args={[0.06, 0.16, 0.012]} />
          <meshStandardMaterial color={wardrobe.cloth2} roughness={0.92} />
        </mesh>
      ))}
      {/* Coats carry a little structure at the shoulder. */}
      {wardrobe.coat
        ? [-1, 1].map((side) => (
            <mesh key={`epaulet${side}`} position={[side * (sh + 0.01), 1.45, -0.02]} rotation={[0, 0, side * -0.25]} userData={{ lod: 1 }}>
              <boxGeometry args={[0.1, 0.03, 0.14]} />
              <meshStandardMaterial color={clothLit} roughness={0.92} />
            </mesh>
          ))
        : null}
      {/* The waistband. */}
      <mesh position={[0, 1.055, 0]} userData={{ lod: 1 }}>
        <cylinderGeometry args={[0.165 * b, 0.165 * b, 0.03, 12]} />
        <meshStandardMaterial color="#1a1a20" roughness={0.6} />
      </mesh>
      {/* Collar: two small lapels either side of the neck. */}
      {[-1, 1].map((side) => (
        <mesh
          key={`collar${side}`}
          position={[side * 0.07, 1.47, 0.09 * b]}
          rotation={[0.35, 0, side * -0.55]}
          userData={{ lod: 1 }}
        >
          <boxGeometry args={[0.07, 0.09, 0.012]} />
          <meshLambertMaterial color={wardrobe.coat ? wardrobe.cloth2 : shirtLit} />
        </mesh>
      ))}
      {/* Clavicle line and neck. */}
      <mesh position={[0, 1.47, 0]} userData={{ lod: 1 }}>
        <boxGeometry args={[sh * 2 + 0.04, 0.05, 0.16]} />
        <meshLambertMaterial color={clothLit} />
      </mesh>
      <mesh position={[0, 1.53, 0]} userData={{ lod: 1 }}>
        <cylinderGeometry args={[0.05, 0.06, 0.1, 10]} />
        <meshLambertMaterial color={skinLit} />
      </mesh>
      {/* Arms. */}
      {[-1, 1].map((side) => (
        <group key={`arm${side}`} position={[side * (sh + 0.04), 1.45, 0]} name={side < 0 ? "armL" : "armR"}>
          <mesh userData={{ lod: 1 }}>
            <sphereGeometry args={[0.07 * b, 8, 8]} />
            <meshLambertMaterial color={clothLit} />
          </mesh>
          <mesh position={[0, -0.17, 0]}>
            <capsuleGeometry args={[0.055 * b, 0.22, 4, 8]} />
            <meshLambertMaterial color={clothLit} />
          </mesh>
          <group position={[0, -0.32, 0]} name={side < 0 ? "foreL" : "foreR"}>
            <mesh position={[0, -0.14, 0]}>
              <capsuleGeometry args={[0.05 * b, 0.2, 4, 8]} />
              <meshLambertMaterial color={wardrobe.coat ? clothLit : shirtLit} />
            </mesh>
            {/* The cuff. */}
            <mesh position={[0, -0.245, 0]} userData={{ lod: 1 }}>
              <cylinderGeometry args={[0.053 * b, 0.05 * b, 0.03, 10]} />
              <meshLambertMaterial color={wardrobe.coat ? wardrobe.accent : wardrobe.cloth2} />
            </mesh>
            {/* The hand: a palm, and fingers close up. */}
            <group position={[0, -0.3, 0]} userData={{ lod: 1 }}>
              <mesh scale={[0.85, 1.1, 0.55]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshLambertMaterial color={skinLit} />
              </mesh>
              <Fingers skin={skinLit} side={side} />
            </group>
            {/* What they carry. */}
            {wardrobe.accessory === "tablet" && side > 0 ? (
              <group position={[0.02, -0.3, 0.1]} rotation={[-0.5, 0, 0]} userData={{ lod: 1 }}>
                <mesh>
                  <boxGeometry args={[0.2, 0.28, 0.012]} />
                  <meshStandardMaterial color="#0c1220" roughness={0.3} metalness={0.5} />
                </mesh>
                <mesh position={[0, 0, 0.008]}>
                  <planeGeometry args={[0.17, 0.24]} />
                  <Glow colour={wardrobe.accent} opacity={0.55} />
                </mesh>
                {/* Lines of interface on the screen. */}
                {[0.07, 0.02, -0.03, -0.08].map((y, i) => (
                  <mesh key={y} position={[-0.02 + (i % 2) * 0.01, y, 0.01]} userData={{ lod: 2 }}>
                    <planeGeometry args={[0.1 - (i % 2) * 0.03, 0.008]} />
                    <Glow colour="#eaf4ff" opacity={0.7} />
                  </mesh>
                ))}
              </group>
            ) : null}
            {wardrobe.accessory === "folio" && side < 0 ? (
              <group position={[-0.02, -0.16, 0.02]} rotation={[0, 0, 0.1]} userData={{ lod: 1 }}>
                <mesh>
                  <boxGeometry args={[0.05, 0.34, 0.26]} />
                  <meshStandardMaterial color="#f1e9dc" roughness={0.7} metalness={0} />
                </mesh>
                {/* The folio's spine and its strap. */}
                <mesh position={[-0.026, 0, 0]} userData={{ lod: 2 }}>
                  <boxGeometry args={[0.004, 0.34, 0.26]} />
                  <meshLambertMaterial color={wardrobe.accent} />
                </mesh>
                <mesh position={[0, 0.02, 0]} userData={{ lod: 2 }}>
                  <boxGeometry args={[0.054, 0.02, 0.27]} />
                  <meshLambertMaterial color={wardrobe.accent} />
                </mesh>
              </group>
            ) : null}
          </group>
        </group>
      ))}
      {/* Badge on a lanyard. */}
      {wardrobe.accessory === "badge" ? (
        <group userData={{ lod: 1 }}>
          <mesh position={[0, 1.36, 0.13 * b]}>
            <boxGeometry args={[0.003, 0.24, 0.003]} />
            <meshLambertMaterial color={wardrobe.accent} />
          </mesh>
          <mesh position={[0, 1.2, 0.14 * b]}>
            <planeGeometry args={[0.08, 0.11]} />
            <Glow colour={wardrobe.accent} opacity={0.8} />
          </mesh>
          {/* The badge's face: a darker card with a light strip. */}
          <mesh position={[0, 1.19, 0.14 * b + 0.002]} userData={{ lod: 2 }}>
            <planeGeometry args={[0.064, 0.07]} />
            <meshLambertMaterial color="#2a2530" />
          </mesh>
          <mesh position={[0, 1.235, 0.14 * b + 0.003]} userData={{ lod: 2 }}>
            <planeGeometry args={[0.064, 0.012]} />
            <Glow colour="#ffffff" opacity={0.75} />
          </mesh>
        </group>
      ) : null}
      {/* A bag on a strap across the body. */}
      {wardrobe.accessory === "bag" ? (
        <group userData={{ lod: 1 }}>
          <mesh position={[0.06, 1.28, 0]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.02, 0.5, 0.02]} />
            <meshLambertMaterial color={wardrobe.cloth2} />
          </mesh>
          <mesh position={[-0.2 * b, 0.98, -0.02]} rotation={[0, 0, 0.1]}>
            <boxGeometry args={[0.1, 0.2, 0.22]} />
            <meshStandardMaterial color={wardrobe.accent} roughness={0.7} metalness={0.05} />
          </mesh>
        </group>
      ) : null}
      {/* Headphones around the neck. */}
      {wardrobe.accessory === "headphones" ? (
        <mesh position={[0, 1.5, 0.03]} rotation={[Math.PI / 2 + 0.3, 0, 0]} userData={{ lod: 1 }}>
          <torusGeometry args={[0.1, 0.02, 8, 18, Math.PI * 1.4]} />
          <meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.4} />
        </mesh>
      ) : null}
      {/* Scarf. */}
      {(wardrobe.coat && wardrobe.accessory === "folio") || wardrobe.scarf ? (
        <mesh position={[0, 1.5, 0.02]} rotation={[Math.PI / 2, 0, 0]} userData={{ lod: 1 }}>
          <torusGeometry args={[0.1, 0.045, 8, 16]} />
          <meshStandardMaterial color={wardrobe.accent} roughness={0.95} metalness={0} />
        </mesh>
      ) : null}
      {/* Head: a skull, a jaw, cheeks, a chin — and the face on it. */}
      <group position={[0, 1.7, 0]} name="head">
        <mesh scale={[1, 1.12, 1.02]}>
          <sphereGeometry args={[0.108, 16, 14]} />
          <meshStandardMaterial color={skinLit} roughness={0.72} metalness={0} />
        </mesh>
        {/* Forehead and the back of the skull, so the head is not a ball. */}
        <mesh position={[0, 0.03, -0.012]} scale={[0.98, 0.98, 1.06]} userData={{ lod: 1 }}>
          <sphereGeometry args={[0.104, 12, 10]} />
          <meshStandardMaterial color={skinLit} roughness={0.72} metalness={0} />
        </mesh>
        {/* The jaw and chin. */}
        <mesh position={[0, -0.07, 0.018]} scale={[0.8, 0.58, 0.82]} userData={{ lod: 1 }}>
          <sphereGeometry args={[0.1, 12, 8]} />
          <meshStandardMaterial color={skinLit} roughness={0.72} metalness={0} />
        </mesh>
        <mesh position={[0, -0.115, 0.055]} scale={[0.8, 0.6, 0.7]} userData={{ lod: 2 }}>
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshStandardMaterial color={skinLit} roughness={0.72} metalness={0} />
        </mesh>
        {/* Cheeks. */}
        {[-1, 1].map((side) => (
          <mesh key={`cheek${side}`} position={[side * 0.055, -0.03, 0.062]} scale={[1, 0.8, 0.7]} userData={{ lod: 2 }}>
            <sphereGeometry args={[0.036, 8, 8]} />
            <meshStandardMaterial color={skinLit} roughness={0.72} metalness={0} />
          </mesh>
        ))}
        {/* Ears. */}
        {[-1, 1].map((side) => (
          <mesh key={`ear${side}`} position={[side * 0.106, -0.005, -0.005]} scale={[0.6, 1.2, 0.8]} userData={{ lod: 1 }}>
            <sphereGeometry args={[0.024, 8, 8]} />
            <meshStandardMaterial color={skinLit} roughness={0.72} metalness={0} />
          </mesh>
        ))}
        {/* The face, close up: eye sockets, eyes that can blink, brows that
            can rise, a nose with a bridge, lips that can smile and speak. */}
        <group name="face" userData={{ lod: 2 }}>
          {[-1, 1].map((side) => (
            <group key={`eye${side}`} position={[side * 0.038, 0.014, 0.092]}>
              {/* The socket, a shade darker, behind the eye. */}
              <mesh position={[0, 0, -0.006]} scale={[1.5, 1.1, 0.5]}>
                <sphereGeometry args={[0.017, 8, 8]} />
                <meshStandardMaterial color={faceLine} roughness={0.8} />
              </mesh>
              {/* Sclera, iris, pupil, catchlight. */}
              <mesh scale={[1, 0.78, 0.55]}>
                <sphereGeometry args={[0.0165, 10, 8]} />
                <meshStandardMaterial color="#f1ede6" roughness={0.25} metalness={0} />
              </mesh>
              <group name={side < 0 ? "gazeL" : "gazeR"}>
                <mesh position={[0, 0, 0.0085]} scale={[1, 1, 0.3]}>
                  <sphereGeometry args={[0.0078, 10, 8]} />
                  <meshStandardMaterial color={iris} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0, 0.0104]} scale={[1, 1, 0.3]}>
                  <sphereGeometry args={[0.0036, 8, 6]} />
                  <meshBasicMaterial color="#0c0a0c" toneMapped={false} />
                </mesh>
                <mesh position={[side * 0.003, 0.003, 0.0118]}>
                  <sphereGeometry args={[0.0014, 6, 6]} />
                  <meshBasicMaterial color="#ffffff" toneMapped={false} />
                </mesh>
              </group>
              {/* Lids: an upper shell that closes over the eye, a thin lower lid. */}
              <group name={side < 0 ? "lidL" : "lidR"} rotation={[-0.35, 0, 0]}>
                <mesh scale={[1.06, 0.84, 0.6]}>
                  <sphereGeometry args={[0.0175, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                  <meshStandardMaterial color={skinLit} roughness={0.72} />
                </mesh>
              </group>
              <mesh position={[0, -0.011, 0.006]} rotation={[0.5, 0, 0]}>
                <boxGeometry args={[0.03, 0.004, 0.006]} />
                <meshStandardMaterial color={faceLine} roughness={0.8} />
              </mesh>
              {/* The brow. */}
              <mesh name={side < 0 ? "browL" : "browR"} position={[0, 0.026, 0.007]} rotation={[0.2, 0, side * -0.14]}>
                <boxGeometry args={[0.034, 0.006, 0.009]} />
                <meshStandardMaterial color={hair} roughness={0.9} />
              </mesh>
            </group>
          ))}
          {/* Nose: bridge and tip. */}
          <mesh position={[0, -0.005, 0.104]} rotation={[0.28, 0, 0]}>
            <boxGeometry args={[0.014, 0.036, 0.014]} />
            <meshStandardMaterial color={skinLit} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.028, 0.114]} scale={[1.15, 0.9, 1]}>
            <sphereGeometry args={[0.011, 8, 8]} />
            <meshStandardMaterial color={skinLit} roughness={0.7} />
          </mesh>
          {/* The mouth: upper lip, lower lip; the group smiles, the lower lip speaks. */}
          <group name="mouth" position={[0, -0.058, 0.098]}>
            <mesh position={[0, 0.003, 0]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.034, 0.005, 0.008]} />
              <meshStandardMaterial color={lipColour} roughness={0.55} />
            </mesh>
            <mesh name="lipLower" position={[0, -0.004, 0.001]} scale={[0.9, 1, 1]}>
              <boxGeometry args={[0.034, 0.007, 0.009]} />
              <meshStandardMaterial color={lipColour} roughness={0.5} />
            </mesh>
          </group>
        </group>
        <Hair style={frame.hair} colour={hair} />
      </group>
      {/* The shadow under them. */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function GuideGroup({ guide, onTalk }: { guide: PreparedGuide; onTalk: (guide: PreparedGuide) => void }) {
  const figures = useRef<(THREE.Group | null)[]>([]);
  const marker = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const phase = useRef<GuidePhase>("idle");
  /* Which tier of detail the figures are showing; -1 until the first frame. */
  const tier = useRef(-1);
  const time = useRef(Math.random() * 10);
  const greeted = useRef(false);

  /* Where each person stands, relative to the group: a loose arc facing the
     approach, so the visitor arrives into a conversation rather than a row. */
  const spots = useMemo(() => {
    const n = guide.npcCount;
    return Array.from({ length: n }, (_, i) => {
      const spread = (i - (n - 1) / 2) * 1.35;
      const seed = i + guide.projectId.length * 7;
      return {
        x: spread,
        z: Math.abs(spread) * 0.35,
        turn: -spread * 0.22,
        frame: FRAMES[(seed + i) % FRAMES.length]!,
        skin: SKINS[(seed * 3 + i) % SKINS.length]!,
        hair: HAIRS[(seed + i * 2) % HAIRS.length]!,
        wardrobe: WARDROBE[guide.projectId] ?? WARDROBE.dppano!,
        pose: POSES[POSE_ORDER[(seed + i * 2) % POSE_ORDER.length]!]!,
        /* Each has their own idle rhythm. */
        rhythm: 0.6 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
        /* When, in the idle cycle, this one gestures. */
        beat: 6 + Math.random() * 8,
        face: newFaceState(Math.random()),
      };
    });
  }, [guide.npcCount, guide.projectId]);

  useEffect(
    () =>
      interactables.add({
        id: guide.id,
        at: [guide.at[0], guide.at[1] + 1.4, guide.at[2]],
        reach: guide.greetAt,
        label: guide.name,
        action: guide.askText,
        activate: () => onTalk(guide),
        priority: 4,
      }),
    [guide, onTalk],
  );

  const toVisitor = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, raw) => {
    const delta = Math.min(raw, 0.05);
    time.current += delta;
    const t = time.current;

    /* Distance and bearing to the visitor, in the group's own frame. */
    toVisitor.set(body.x - guide.at[0], 0, body.z - guide.at[2]);
    const distance = toVisitor.length();
    const bearing = Math.atan2(-toVisitor.x, -toVisitor.z) + Math.PI;

    const next: GuidePhase =
      distance < guide.greetAt ? "greeting" : distance < ATTENTION_AT ? "attention" : "idle";
    if (next !== phase.current) {
      phase.current = next;
      if (next === "greeting" && !greeted.current) {
        greeted.current = true;
        discovery.find(`${guide.id}:greeted`);
      }
    }
    if (next === "greeting") guideStore.set({ id: guide.id, phase: next });
    else if (guideStore.get().id === guide.id) guideStore.set({ id: null, phase: "idle" });

    const talking = guideStore.talking === guide.id;

    /* How much of each person to draw, by distance. Toggled only when the
       tier changes, never per frame. */
    /* On a phone the guides beyond forty metres are not drawn: their
       station's screens and dais mark the place until the visitor is near. */
    const phone = qualityStore.tier !== "desktop";
    const wantTier = distance < (phone ? 6 : NEAR_AT) ? 2 : distance < (phone ? 22 : MID_AT) ? 1 : phone ? -1 : 0;
    if (wantTier !== tier.current) {
      tier.current = wantTier;
      for (const fig of figures.current) {
        if (!fig) continue;
        fig.visible = wantTier >= 0;
        fig.traverse((part) => {
          const lod = part.userData.lod as number | undefined;
          if (lod) part.visible = lod <= wantTier;
        });
      }
    }
    if (wantTier < 0) return;

    /* Inside three metres the group is ready to talk: everyone squares up
       to the visitor, heads hold the gaze, and the whole figure leans in
       by a degree or two. */
    const close = THREE.MathUtils.clamp(1 - (distance - 1.2) / (CLOSE_AT - 1.2), 0, 1);
    /* The visitor's direction, in the group's frame, for the speaker's step. */
    const stepX = distance > 0.01 ? toVisitor.x / distance : 0;
    const stepZ = distance > 0.01 ? toVisitor.z / distance : 0;

    spots.forEach((spot, i) => {
      const fig = figures.current[i];
      if (!fig) return;
      const idleYaw = guide.facing + spot.turn + Math.sin(t * 0.3 * spot.rhythm + spot.offset) * 0.25;
      /* In IDLE they face their own way and glance about; the moment they
         notice, they turn to the visitor — loosely at first, exactly when
         the visitor is close. */
      const spread = (i - (spots.length - 1) / 2) * 0.08 * (1 - close);
      const wantYaw = next === "idle" ? idleYaw : bearing + spread;
      let diff = wantYaw - fig.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      fig.rotation.y += diff * Math.min(1, (next === "idle" ? 1.2 : 4) * delta);

      /* Weight shift and breathing; a slight lean in, close. */
      fig.position.y = Math.sin(t * 1.4 * spot.rhythm + spot.offset) * 0.012;
      fig.rotation.z = Math.sin(t * 0.5 * spot.rhythm + spot.offset) * 0.02;
      fig.rotation.x += (close * 0.035 - fig.rotation.x) * Math.min(1, 3 * delta);

      /* The one explaining takes a quarter step towards the visitor. */
      const speaker = talking && i === 0;
      const wantX = spot.x + (speaker ? stepX * 0.28 : 0);
      const wantZ = spot.z + (speaker ? stepZ * 0.28 : 0);
      fig.position.x += (wantX - fig.position.x) * Math.min(1, 2.5 * delta);
      fig.position.z += (wantZ - fig.position.z) * Math.min(1, 2.5 * delta);

      const head = fig.getObjectByName("head");
      if (head) {
        /* Heads lead the body: they look at the visitor before the body
           turns, and at each other when nobody is there. Close, the gaze
           holds — almost the whole turn — and the head tips a little. */
        const glance = Math.sin(t * 0.7 * spot.rhythm + spot.offset * 2) * 0.5;
        const toward = Math.atan2(Math.sin(bearing - fig.rotation.y), Math.cos(bearing - fig.rotation.y));
        head.rotation.y = next === "idle" ? glance : toward * (0.6 + close * 0.3);
        head.rotation.x = Math.sin(t * 0.9 + spot.offset) * 0.04 + close * 0.06;
        head.rotation.z += (close * 0.05 * (i % 2 ? -1 : 1) - head.rotation.z) * Math.min(1, 3 * delta);
      }

      /* Arms. In idle, every so often one of them raises a forearm as if
         making a point to the others, then lets it fall. In conversation
         the first one explains — the forearm lifts and moves a little — and
         the others listen with the occasional nod. Nobody waves. */
      const armR = fig.getObjectByName("armR");
      const foreR = fig.getObjectByName("foreR");
      const armL = fig.getObjectByName("armL");
      const foreL = fig.getObjectByName("foreL");
      if (armR && foreR && armL && foreL) {
        const speakerHere = talking && i === 0;
        const beat = (t + spot.offset * 3) % spot.beat;
        const idleGesture = next === "idle" && beat < 2.2 ? Math.sin((beat / 2.2) * Math.PI) : 0;
        const talkGesture = speakerHere ? 0.75 + Math.sin(t * 1.9) * 0.18 : 0;
        const lift = Math.max(idleGesture * 0.55, talkGesture);
        const pose = spot.pose;
        /* The right arm: its resting pose, unfolded by however much it is
           gesturing. The left keeps its pose and drifts. */
        const ease = Math.min(1, 4.5 * delta);
        const open = Math.min(1, lift * 1.4);
        armR.rotation.x += (pose.armR[0] * (1 - open) - lift * 0.5 - armR.rotation.x) * ease;
        armR.rotation.z += (pose.armR[1] * (1 - open) + (speakerHere ? -0.25 : 0) - armR.rotation.z) * ease;
        foreR.rotation.x += (pose.foreR[0] * (1 - open) - lift * 1.3 - foreR.rotation.x) * ease;
        foreR.rotation.y += (pose.foreR[1] * (1 - open) - foreR.rotation.y) * ease;
        armL.rotation.x += (pose.armL[0] - armL.rotation.x) * ease;
        armL.rotation.z += (pose.armL[1] - armL.rotation.z) * ease;
        foreL.rotation.x += (pose.foreL[0] + Math.sin(t * 0.6 + spot.offset) * 0.05 - foreL.rotation.x) * ease;
        foreL.rotation.y += (pose.foreL[1] - foreL.rotation.y) * ease;
        /* Listening, the folded arms stay folded; a speaker's do not. */
      }
      if (head && talking && i > 0) {
        /* Listening: a slow nod now and then. */
        const nod = Math.max(0, Math.sin(t * 1.1 + spot.offset)) ** 6;
        head.rotation.x += nod * 0.12;
      }
      /* The face: curious as the visitor comes near, a smile at the
         greeting, the speaker's mouth moving while the explanation is read. */
      if (head) {
        const speakerHere = talking && i === 0;
        animateFace(fig, spot.face, {
          t,
          dt: delta,
          smile: next === "greeting" ? 0.7 + close * 0.3 : talking ? 0.35 : 0,
          curious: next === "attention" ? 0.6 : next === "greeting" ? 0.3 : 0,
          talking: speakerHere ? 1 : 0,
          gazeYaw: next === "idle" ? 0 : Math.atan2(Math.sin(bearing - fig.rotation.y), Math.cos(bearing - fig.rotation.y)) - head.rotation.y,
          gazePitch: -0.05,
        });
      }
    });

    /* Under the one explaining: a faint ring in the project's colour, so
       the speaker can be told from the listeners at a glance. */
    if (ring.current) {
      const speaker = figures.current[0];
      const m = ring.current.material as THREE.MeshBasicMaterial;
      const want = talking ? 0.28 + Math.sin(t * 2.2) * 0.06 : 0;
      m.opacity += (want - m.opacity) * Math.min(1, 4 * delta);
      ring.current.visible = m.opacity > 0.01;
      if (speaker) ring.current.position.set(speaker.position.x, 0.02, speaker.position.z);
    }

    /* The marker over the group brightens as the visitor comes near. */
    if (marker.current) {
      const m = marker.current.material as THREE.MeshBasicMaterial;
      const near = THREE.MathUtils.clamp(1 - distance / ATTENTION_AT, 0, 1);
      m.opacity = 0.25 + near * 0.6 + (next === "greeting" ? Math.sin(t * 4) * 0.12 : 0);
      marker.current.position.y = 2.75 + Math.sin(t * 1.3) * 0.06;
      marker.current.rotation.y = t * 0.8;
    }
  });

  return (
    <group position={guide.at}>
      {spots.map((spot, i) => (
        <group
          key={i}
          ref={(node) => {
            figures.current[i] = node;
          }}
          position={[spot.x, 0, spot.z]}
          rotation={[0, guide.facing + spot.turn, 0]}
        >
          <Person frame={spot.frame} wardrobe={spot.wardrobe} skin={spot.skin} hair={spot.hair} projectId={guide.projectId} />
        </group>
      ))}
      {/* A small warm marker over the group: the one thing in the world in
          the warm colour that is not on a person, because it marks a place
          where you can talk to one. */}
      <mesh ref={marker} position={[0, 2.75, 0]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshBasicMaterial color={MATERIAL.warm} transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <mesh ref={ring} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.48, 0.54, 32]} />
        <meshBasicMaterial color={guide.accent} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function Guides({
  guides,
  onTalk,
}: {
  guides: PreparedGuide[];
  onTalk: (guide: PreparedGuide) => void;
}) {
  return (
    <>
      {guides.map((guide) => (
        <GuideGroup key={guide.id} guide={guide} onTalk={onTalk} />
      ))}
    </>
  );
}
