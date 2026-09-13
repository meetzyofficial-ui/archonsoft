"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { animateFace, newFaceState } from "@/components/world/npc/face";
import { IMPORTANCE, npcStep, npcStride, npcTier } from "@/components/world/npc/lod";
import { createPerson, rigIn } from "@/components/world/npc/rig";
import { npcShadows } from "@/components/world/npc/shadows";
import { MATERIAL } from "@/components/world/pieces/Kit";
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
 * Three distances, three amounts of person — see `lod.ts`. Beyond the far
 * tier a figure is a silhouette (legs, torso, jacket, arms, head, hair);
 * nearer it gets what reads at a walk (shoes, hands, knees, ears, collar,
 * cuffs, what it carries); close up a face, fingers, seams and the detail
 * on the badge. Every tier is one draw: the parts are baked in `rig.ts`.
 */
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
  const tint = TINT[projectId];
  const rig = useMemo(
    () =>
      createPerson(
        {
          frame: { height: frame.height, shoulders: frame.shoulders, build: frame.build, hair: frame.hair },
          wardrobe,
          skin,
          hair,
          skinLit: tinted(skin, tint),
          shirtLit: tinted(wardrobe.shirt, tint),
          clothLit: tinted(wardrobe.cloth, tint && { ...tint, amount: tint.amount * 0.5 }),
          iris: IRISES[(skin.charCodeAt(1) + hair.charCodeAt(2)) % IRISES.length]!,
        },
        k,
      ),
    [frame, hair, k, skin, tint, wardrobe],
  );
  useEffect(() => {
    const release = npcShadows.add(rig.root);
    return () => {
      release();
      rig.dispose();
    };
  }, [rig]);
  return <primitive object={rig.root} />;
}

function GuideGroup({ guide, onTalk }: { guide: PreparedGuide; onTalk: (guide: PreparedGuide) => void }) {
  const figures = useRef<(THREE.Group | null)[]>([]);
  const marker = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const phase = useRef<GuidePhase>("idle");
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

    /* How much of each person to draw, by distance: the group being spoken
       to is drawn whole wherever the visitor stands. */
    const phone = qualityStore.tier !== "desktop";

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
      const tier = npcTier(distance, phone, talking ? IMPORTANCE.speaking : IMPORTANCE.staff, `${guide.id}:${i}`);
      rigIn(fig)?.setTier(tier);
      fig.visible = tier >= 0;
      if (tier < 0 || !npcStep(tier, i)) return;
      const delta = Math.min(raw, 0.05) * npcStride(tier);
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
