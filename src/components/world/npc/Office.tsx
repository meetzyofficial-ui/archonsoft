"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { animateFace, newFaceState, type FaceState } from "@/components/world/npc/face";
import { FRAMES, guideStore, HAIRS, Person, SKINS, WARDROBE } from "@/components/world/npc/Guides";
import { screenTexture, SCREEN_ASPECT } from "@/components/world/npc/screens";
import { Backlight, Glow, MATERIAL } from "@/components/world/pieces/Kit";
import { useMerged } from "@/components/world/pieces/merge";
import { body } from "@/components/world/systems/body";
import { interactables } from "@/components/world/systems/focus";
import { DESK, deskSlots, officeFacing, type Office as OfficeSpec } from "@/data/departments";

/**
 * An office.
 *
 * A working room set on the deck: desks in rows with monitors, keyboards
 * and a laptop or two; chairs with people in them, working — typing, reading
 * a screen, glancing at a colleague — who notice the visitor coming, turn a
 * head, and when spoken to swivel round, smile and explain what the room
 * does. Behind them a glass partition carries a board showing the same
 * screen large, backlit, with the department's colour along its edge; a
 * light beam runs over the desks; a plant stands at each end.
 *
 * Built from the same data the walking loop collides with, so the desks
 * you see are the desks you cannot walk through. Everything that does not
 * move is merged into a handful of draws; the people carry the world's
 * level-of-detail tags and drop their faces and fingers at forty metres.
 */

const NEAR_AT = 14;
const MID_AT = 40;
const NOTICE_AT = 7.5;
const TALK_AT = 5.6;

/* Who sits at a desk: a stable pick of body, skin, hair and clothes from
   the role's name, so the same person is at the same desk every visit. */
const CLOTHES = ["navy", "charcoal", "denim", "teal", "olive", "camel", "cream", "sand", "plum"] as const;

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function seatedPose(fig: THREE.Object3D, k: number) {
  /* Thighs forward, shins down: the hip pivot is at 0.96 in the rig, and the
     figure is lowered so the seat is at chair height. */
  for (const side of ["L", "R"]) {
    const leg = fig.getObjectByName(`leg${side}`);
    const shin = fig.getObjectByName(`shin${side}`);
    if (leg) leg.rotation.x = -Math.PI / 2 + 0.12;
    if (shin) shin.rotation.x = Math.PI / 2 - 0.05;
  }
  fig.position.y = 0.5 - 0.96 * k;
}

type Worker = {
  role: string;
  x: number;
  z: number;
  frame: (typeof FRAMES)[number];
  skin: string;
  hair: string;
  wardrobe: (typeof WARDROBE)[string];
  rhythm: number;
  offset: number;
  /** Whether this one looks up when the visitor comes near. */
  attentive: boolean;
  face: FaceState;
  typing: number;
};

export function Office({
  id,
  office,
  label,
  action,
  onTalk,
  compact = false,
}: {
  id: string;
  office: OfficeSpec;
  label: string;
  action: string;
  onTalk: (id: string) => void;
  /** A phone seats fewer people: four at the lobby, two in a department. */
  compact?: boolean;
}) {
  const gl = useThree((state) => state.gl);
  const root = useRef<THREE.Group>(null);
  const figures = useRef<(THREE.Group | null)[]>([]);
  const tier = useRef(-2);
  const time = useRef(Math.random() * 10);
  const posed = useRef(false);
  const facing = officeFacing(office);
  const roles = useMemo(() => (compact ? office.roles.slice(0, id === "lobby" ? 4 : 2) : office.roles), [compact, id, office.roles]);
  const slots = useMemo(() => deskSlots(roles.length), [roles.length]);
  const rows = Math.ceil(roles.length / 3);
  const span = Math.min(roles.length, 3) * (DESK.width + DESK.gap) + 1.2;
  const backZ = -rows * 1.2 - 1.9;
  const depth = rows * 2.4 + 3.6;
  const boardW = Math.min(span - 0.6, 4.4);
  const boardH = boardW / SCREEN_ASPECT;

  const workers = useMemo<Worker[]>(
    () =>
      roles.map((role, i) => {
        const h = hash(`${id}:${role}:${i}`);
        return {
          role,
          x: slots[i]!.x,
          z: slots[i]!.z - 0.62,
          frame: FRAMES[h % FRAMES.length]!,
          skin: SKINS[(h >>> 3) % SKINS.length]!,
          hair: HAIRS[(h >>> 6) % HAIRS.length]!,
          wardrobe: WARDROBE[CLOTHES[(h >>> 9) % CLOTHES.length]!]!,
          rhythm: 0.7 + ((h >>> 12) % 100) / 200,
          offset: ((h >>> 15) % 628) / 100,
          attentive: i === 0 || (h >>> 20) % 3 !== 0,
          face: newFaceState(((h >>> 4) % 1000) / 1000),
          typing: 0.5 + ((h >>> 7) % 100) / 200,
        };
      }),
    [id, roles, slots],
  );

  const screen = useMemo(
    () => screenTexture(office.screen, office.accent, Math.min(8, gl.capabilities.getMaxAnisotropy())),
    [gl, office.accent, office.screen],
  );

  /* The furniture, merged by material. */
  const wood = useMerged(
    () =>
      slots.flatMap((s) => [
        { geometry: new THREE.BoxGeometry(DESK.width, 0.05, DESK.depth), at: [s.x, DESK.height, s.z] as [number, number, number] },
        { geometry: new THREE.BoxGeometry(DESK.width - 0.1, 0.55, 0.04), at: [s.x, DESK.height - 0.32, s.z + DESK.depth / 2 - 0.05] as [number, number, number] },
      ]),
    [slots],
  );
  const metal = useMerged(
    () =>
      slots.flatMap((s) => [
        /* Desk legs. */
        ...[-1, 1].map((side) => ({ geometry: new THREE.BoxGeometry(0.05, DESK.height, DESK.depth - 0.1), at: [s.x + side * (DESK.width / 2 - 0.06), DESK.height / 2, s.z] as [number, number, number] })),
        /* Monitor stand and neck. */
        { geometry: new THREE.CylinderGeometry(0.11, 0.13, 0.02, 12), at: [s.x, DESK.height + 0.035, s.z + 0.16] as [number, number, number] },
        { geometry: new THREE.BoxGeometry(0.05, 0.22, 0.03), at: [s.x, DESK.height + 0.15, s.z + 0.2] as [number, number, number] },
        /* Chair post and base. */
        { geometry: new THREE.CylinderGeometry(0.025, 0.025, 0.36, 8), at: [s.x, 0.26, s.z - 0.62] as [number, number, number] },
        { geometry: new THREE.CylinderGeometry(0.26, 0.26, 0.025, 10), at: [s.x, 0.04, s.z - 0.62] as [number, number, number] },
      ]),
    [slots],
  );
  const dark = useMerged(
    () =>
      slots.flatMap((s, i) => [
        /* Bezel. */
        { geometry: new THREE.BoxGeometry(0.64, 0.4, 0.03), at: [s.x, DESK.height + 0.42, s.z + 0.2] as [number, number, number] },
        /* Keyboard and mouse. */
        { geometry: new THREE.BoxGeometry(0.42, 0.02, 0.14), at: [s.x - 0.04, DESK.height + 0.035, s.z - 0.12] as [number, number, number] },
        { geometry: new THREE.BoxGeometry(0.06, 0.02, 0.1), at: [s.x + 0.3, DESK.height + 0.035, s.z - 0.12] as [number, number, number] },
        /* A drawer unit under one end of the desk. */
        { geometry: new THREE.BoxGeometry(0.4, 0.56, 0.6), at: [s.x + 0.55, 0.3, s.z] as [number, number, number] },
        /* Chair seat and back. */
        { geometry: new THREE.BoxGeometry(0.46, 0.06, 0.46), at: [s.x, 0.47, s.z - 0.62] as [number, number, number] },
        { geometry: new THREE.BoxGeometry(0.44, 0.52, 0.05), at: [s.x, 0.78, s.z - 0.85] as [number, number, number], turn: [-0.08, 0, 0] as [number, number, number] },
        /* A laptop, open, on every other desk. */
        ...(i % 2 === 1
          ? [
              { geometry: new THREE.BoxGeometry(0.32, 0.015, 0.22), at: [s.x + 0.52, DESK.height + 0.033, s.z - 0.05] as [number, number, number], turn: [0, -0.3, 0] as [number, number, number] },
              { geometry: new THREE.BoxGeometry(0.32, 0.21, 0.012), at: [s.x + 0.55, DESK.height + 0.13, s.z + 0.06] as [number, number, number], turn: [-0.2, -0.3, 0] as [number, number, number] },
            ]
          : []),
      ]),
    [slots],
  );
  const screens = useMerged(
    () =>
      slots.flatMap((s, i) => [
        { geometry: new THREE.PlaneGeometry(0.6, 0.6 / SCREEN_ASPECT), at: [s.x, DESK.height + 0.42, s.z + 0.183] as [number, number, number], turn: [0, Math.PI, 0] as [number, number, number] },
        ...(i % 2 === 1
          ? [{ geometry: new THREE.PlaneGeometry(0.29, 0.29 / SCREEN_ASPECT), at: [s.x + 0.548, DESK.height + 0.13, s.z + 0.052] as [number, number, number], turn: [-0.2, Math.PI - 0.3, 0] as [number, number, number] }]
          : []),
      ]),
    [slots],
  );
  const ceramics = useMerged(
    () =>
      slots.flatMap((s, i) =>
        i % 3 === 0
          ? [
              { geometry: new THREE.CylinderGeometry(0.045, 0.04, 0.09, 10), at: [s.x - 0.55, DESK.height + 0.07, s.z - 0.1] as [number, number, number] },
              { geometry: new THREE.TorusGeometry(0.035, 0.008, 6, 10), at: [s.x - 0.5, DESK.height + 0.07, s.z - 0.1] as [number, number, number] },
            ]
          : [],
      ),
    [slots],
  );
  const pots = useMerged(
    () =>
      [-1, 1].map((side) => ({ geometry: new THREE.CylinderGeometry(0.26, 0.2, 0.5, 10), at: [side * (span / 2 - 0.3), 0.25, backZ + 0.8] as [number, number, number] })),
    [span, backZ],
  );
  const leaves = useMerged(
    () =>
      [-1, 1].flatMap((side) =>
        [0, 1, 2, 3].map((k) => ({
          geometry: new THREE.IcosahedronGeometry(0.22 + (k % 2) * 0.08, 1),
          at: [side * (span / 2 - 0.3) + Math.cos(k * 1.7) * 0.18, 0.72 + k * 0.16, backZ + 0.8 + Math.sin(k * 1.7) * 0.18] as [number, number, number],
        })),
      ),
    [span, backZ],
  );
  const frame = useMerged(
    () => [
      /* The partition's frame and the beam over the desks. */
      { geometry: new THREE.BoxGeometry(span, 0.08, 0.16), at: [0, 3.0, backZ] as [number, number, number] },
      { geometry: new THREE.BoxGeometry(span, 0.06, 0.16), at: [0, 0.03, backZ] as [number, number, number] },
      ...[-1, 1].map((side) => ({ geometry: new THREE.BoxGeometry(0.12, 3.0, 0.16), at: [side * span / 2, 1.5, backZ] as [number, number, number] })),
      ...[-1, 1].map((side) => ({ geometry: new THREE.BoxGeometry(0.12, 3.2, 0.12), at: [side * span / 2, 1.6, backZ + depth - 0.6] as [number, number, number] })),
      ...[-1, 1].map((side) => ({ geometry: new THREE.BoxGeometry(0.1, 0.1, depth - 0.5), at: [side * span / 2, 3.2, backZ + (depth - 0.5) / 2] as [number, number, number] })),
      { geometry: new THREE.BoxGeometry(span, 0.1, 0.1), at: [0, 3.2, backZ + depth - 0.6] as [number, number, number] },
    ],
    [span, backZ, depth],
  );
  const lightStrips = useMerged(
    () => [
      ...[-1, 1].map((side) => ({ geometry: new THREE.PlaneGeometry(0.04, depth - 0.6), at: [side * (span / 2 - 0.02), 3.14, backZ + (depth - 0.5) / 2] as [number, number, number], turn: [Math.PI / 2, 0, 0] as [number, number, number] })),
      /* The floor rim in the department's colour. */
      { geometry: new THREE.PlaneGeometry(span + 1.6, 0.04), at: [0, 0.018, backZ + depth - 0.2] as [number, number, number], turn: [-Math.PI / 2, 0, 0] as [number, number, number] },
      ...[-1, 1].map((side) => ({ geometry: new THREE.PlaneGeometry(0.04, depth), at: [side * (span / 2 + 0.8), 0.018, backZ + depth / 2 - 0.2] as [number, number, number], turn: [-Math.PI / 2, 0, 0] as [number, number, number] })),
    ],
    [span, backZ, depth],
  );

  /* The visitor can talk to the room from its front. */
  useEffect(
    () =>
      interactables.add({
        id: `office:${id}`,
        at: [office.at[0] + Math.sin(facing) * 3.4, office.at[1] + 1.3, office.at[2] + Math.cos(facing) * 3.4],
        reach: TALK_AT,
        label,
        action,
        activate: () => onTalk(id),
        priority: 5,
      }),
    [action, facing, id, label, office.at, onTalk],
  );

  const local = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, raw) => {
    const node = root.current;
    if (!node) return;
    const delta = Math.min(raw, 0.05);
    time.current += delta;
    const t = time.current;

    /* The visitor, in the office's frame. */
    local.set(body.x, body.floor, body.z);
    node.worldToLocal(local);
    const distance = Math.hypot(local.x, local.z - (backZ + depth / 2));
    const talking = guideStore.talking === `office:${id}`;

    const wantTier = distance < NEAR_AT ? 2 : distance < MID_AT ? 1 : 0;
    if (wantTier !== tier.current) {
      tier.current = wantTier;
      for (const fig of figures.current) {
        fig?.traverse((part) => {
          const lod = part.userData.lod as number | undefined;
          if (lod) part.visible = lod <= wantTier;
        });
      }
    }

    workers.forEach((worker, i) => {
      const fig = figures.current[i];
      if (!fig) return;
      const k = worker.frame.height / 1.78;
      if (!posed.current) seatedPose(fig, k);

      const dx = local.x - worker.x;
      const dz = local.z - worker.z;
      const near = Math.hypot(dx, dz);
      const toward = Math.atan2(dx, dz);
      const speaker = talking && i === 0;
      /* Noticing: the attentive look up inside the notice distance, the
         speaker swivels the chair round entirely. */
      const noticing = worker.attentive && near < NOTICE_AT ? THREE.MathUtils.clamp(1 - (near - 2) / (NOTICE_AT - 2), 0.35, 1) : 0;
      const swivel = speaker ? THREE.MathUtils.clamp(toward, -1.2, 1.2) : 0;
      fig.rotation.y += (swivel - fig.rotation.y) * Math.min(1, 3 * delta);

      const head = fig.getObjectByName("head");
      if (head) {
        const look = noticing > 0 ? THREE.MathUtils.clamp(toward - fig.rotation.y, -1.05, 1.05) * (0.75 + noticing * 0.25) : Math.sin(t * 0.4 * worker.rhythm + worker.offset) * 0.12;
        head.rotation.y += (look - head.rotation.y) * Math.min(1, 3.5 * delta);
        /* Reading the screen the head is down a little; noticing, it lifts. */
        const pitch = noticing > 0 || speaker ? 0.02 : 0.22 + Math.sin(t * 0.9 + worker.offset) * 0.03;
        head.rotation.x += (pitch - head.rotation.x) * Math.min(1, 3 * delta);
      }

      /* Arms: at the keyboard, typing in bursts; the speaker's right hand
         lifts and moves as they explain. */
      const armR = fig.getObjectByName("armR");
      const armL = fig.getObjectByName("armL");
      const foreR = fig.getObjectByName("foreR");
      const foreL = fig.getObjectByName("foreL");
      const burst = Math.max(0, Math.sin(t * 0.5 * worker.rhythm + worker.offset)) > 0.2 ? 1 : 0;
      const type = burst * Math.sin(t * 13 * worker.typing + worker.offset) * 0.05;
      const ease = Math.min(1, 5 * delta);
      if (armR && armL && foreR && foreL) {
        const gesture = speaker ? 0.7 + Math.sin(t * 1.8) * 0.18 : 0;
        armR.rotation.x += (-0.55 - gesture * 0.4 - armR.rotation.x) * ease;
        armR.rotation.z += (-0.12 - gesture * 0.25 - armR.rotation.z) * ease;
        foreR.rotation.x += (-1.05 - gesture * 0.6 + (speaker ? 0 : type) - foreR.rotation.x) * ease;
        armL.rotation.x += (-0.55 - armL.rotation.x) * ease;
        armL.rotation.z += (0.12 - armL.rotation.z) * ease;
        foreL.rotation.x += (-1.05 - (speaker ? 0 : type * 0.8) - foreL.rotation.x) * ease;
      }
      /* Breathing, in the chair. */
      fig.position.y = 0.5 - 0.96 * k + Math.sin(t * 1.3 * worker.rhythm + worker.offset) * 0.006;

      if (head) {
        animateFace(fig, worker.face, {
          t,
          dt: delta,
          smile: speaker ? 0.6 : noticing > 0 && near < TALK_AT ? 0.5 : 0.08,
          curious: noticing > 0 && !speaker ? 0.4 : 0,
          talking: speaker ? 1 : 0,
          gazeYaw: noticing > 0 ? THREE.MathUtils.clamp(toward - fig.rotation.y, -0.8, 0.8) - head.rotation.y : 0,
          gazePitch: noticing > 0 ? -0.05 : -0.2,
        });
      }
    });
    posed.current = true;
  });

  return (
    <group ref={root} position={office.at} rotation={[0, facing, 0]} name={`office:${id}`}>
      {/* The floor plate. */}
      <mesh position={[0, 0.02, backZ + depth / 2 - 0.2]}>
        <boxGeometry args={[span + 1.8, 0.04, depth + 0.4]} />
        <meshStandardMaterial color="#101a30" roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh geometry={lightStrips}>
        <Glow colour={office.accent} opacity={0.8} />
      </mesh>

      {/* Furniture. */}
      <mesh geometry={wood}>
        <meshStandardMaterial color="#d9cdb8" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh geometry={metal}>
        <meshStandardMaterial color="#8d97a6" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh geometry={dark}>
        <meshStandardMaterial color="#161a22" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh geometry={screens}>
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      <mesh geometry={ceramics}>
        <meshStandardMaterial color="#f1ede6" roughness={0.4} />
      </mesh>
      <mesh geometry={pots}>
        <meshStandardMaterial color="#2a2f3a" roughness={0.8} />
      </mesh>
      <mesh geometry={leaves}>
        <meshStandardMaterial color={MATERIAL.green} roughness={0.95} flatShading />
      </mesh>

      {/* The partition and the frame. */}
      <mesh geometry={frame}>
        <meshStandardMaterial color="#b3bcc8" roughness={0.35} metalness={0.85} />
      </mesh>
      <mesh position={[0, 1.5, backZ]}>
        <boxGeometry args={[span - 0.12, 2.92, 0.04]} />
        <meshPhysicalMaterial color="#1a2a48" transparent opacity={0.42} roughness={0.08} metalness={0.3} envMapIntensity={1.4} depthWrite={false} />
      </mesh>
      {/* The board: the department's screen, large, backlit. */}
      <group position={[0, 1.2 + boardH / 2 + 0.2, backZ + 0.1]}>
        <Backlight size={[boardW, boardH]} strength={0.75} inset={0.06} />
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[boardW + 0.14, boardH + 0.14, 0.05]} />
          <meshStandardMaterial color="#0e1524" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh>
          <planeGeometry args={[boardW, boardH]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
        <mesh position={[0, -boardH / 2 - 0.12, 0]}>
          <planeGeometry args={[boardW, 0.03]} />
          <Glow colour={office.accent} opacity={0.9} />
        </mesh>
      </group>
      {/* Glass along both sides, half the depth of the room, and a
          translucent canopy over it: a room, open at the front. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (span / 2), 1.5, backZ + (depth - 0.5) / 2]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[depth - 0.7, 2.92, 0.04]} />
          <meshPhysicalMaterial color="#1a2a48" transparent opacity={0.28} roughness={0.08} metalness={0.3} envMapIntensity={1.4} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[0, 3.26, backZ + (depth - 0.5) / 2]}>
        <boxGeometry args={[span + 0.1, 0.05, depth - 0.5]} />
        <meshPhysicalMaterial color="#223a66" transparent opacity={0.22} roughness={0.1} metalness={0.4} envMapIntensity={1.2} depthWrite={false} />
      </mesh>
      {/* The light beam's warm underside. */}
      <mesh position={[0, 3.14, backZ + depth - 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[span, 0.05]} />
        <Glow colour={MATERIAL.warmWhite} opacity={0.85} />
      </mesh>

      {/* The people, in their chairs. */}
      {workers.map((worker, i) => (
        <group
          key={worker.role + i}
          ref={(node) => {
            figures.current[i] = node;
          }}
          position={[worker.x, 0, worker.z]}
        >
          <Person frame={worker.frame} wardrobe={worker.wardrobe} skin={worker.skin} hair={worker.hair} projectId={id} />
        </group>
      ))}
    </group>
  );
}
