"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { body } from "@/components/world/systems/body";
import { npcMotion } from "@/components/world/npc/motion";

/**
 * Cats and dogs.
 *
 * A campus has animals in it — not many, and nowhere in particular: a dog
 * sitting beside the people it came with, a cat asleep on a kerb by the
 * trees, another crossing the plaza on business of its own. They are built
 * from primitives at the proportions of the real animals: a body, a chest,
 * a neck, a head with a muzzle and ears, four legs hinged twice, a tail;
 * dogs stand half a metre at the shoulder, cats a hand's breadth, and both
 * come in a few coats.
 *
 * Behaviour is a small state machine: idle, sit, wander (a few metres
 * around home, and back), and a look when the visitor comes near. Cats
 * step away when the visitor comes too close; dogs look up and hold their
 * ground. Nothing is drawn beyond forty-five metres.
 */

type Kind = "dog" | "cat";
type Mode = "idle" | "sit" | "wander";

type Animal = {
  kind: Kind;
  at: [number, number, number];
  facing: number;
  coat: number;
  mode: Mode;
  /** How far it roams from home, when it roams. */
  roam?: number;
};

const COATS: Record<Kind, { body: string; belly: string; ear: string }[]> = {
  dog: [
    { body: "#6b4a2e", belly: "#c9a77a", ear: "#4a3220" },
    { body: "#1f1c1a", belly: "#3a3230", ear: "#141210" },
    { body: "#e6d6bd", belly: "#f4ecdf", ear: "#cbb79a" },
    { body: "#7d7a78", belly: "#a8a4a0", ear: "#5e5a58" },
  ],
  cat: [
    { body: "#8a8580", belly: "#c9c4be", ear: "#6c6763" },
    { body: "#d98a4a", belly: "#f1d2b0", ear: "#b86f38" },
    { body: "#1c1a1c", belly: "#2a2628", ear: "#141214" },
    { body: "#f1ede8", belly: "#faf7f2", ear: "#d8d0c8" },
  ],
};

/** Authored, like the people. */
export const ANIMALS: Animal[] = [
  { kind: "dog", at: [-9.2, 0, 19.4], facing: -Math.PI / 2 + 0.6, coat: 0, mode: "sit" },
  { kind: "cat", at: [-28.4, 0.44, 24], facing: Math.PI / 2, coat: 1, mode: "sit" },
  { kind: "cat", at: [10, 0, 12], facing: 0, coat: 0, mode: "wander", roam: 5 },
  { kind: "dog", at: [-6, 0, -54.5], facing: Math.PI / 2, coat: 2, mode: "idle" },
  { kind: "cat", at: [19, 0, -52], facing: Math.PI, coat: 2, mode: "wander", roam: 3 },
  { kind: "dog", at: [24.5, 9, -6], facing: Math.PI / 2, coat: 3, mode: "sit" },
  { kind: "cat", at: [40, 0, -74], facing: -Math.PI / 2, coat: 3, mode: "wander", roam: 2.5 },
  { kind: "dog", at: [22, 0, 20], facing: -Math.PI / 2, coat: 1, mode: "idle" },
];

const FAR = 45;
const LOOK_AT = 7;
const CAT_FLEE = 2.6;

const FUR = (colour: string) => <meshStandardMaterial color={colour} roughness={0.95} metalness={0} />;

/** The dog: body 0.42 long, 0.5 at the shoulder. Built facing +z. */
function Dog({ coat }: { coat: (typeof COATS.dog)[number] }) {
  return (
    <group>
      {/* Body and chest. */}
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.12, 0.34, 6, 12]} />
        {FUR(coat.body)}
      </mesh>
      <mesh position={[0, 0.34, 0.06]} scale={[0.9, 0.8, 1]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        {FUR(coat.belly)}
      </mesh>
      {/* Neck and head. */}
      <mesh position={[0, 0.5, 0.24]} rotation={[-0.6, 0, 0]}>
        <capsuleGeometry args={[0.07, 0.1, 4, 10]} />
        {FUR(coat.body)}
      </mesh>
      <group name="head" position={[0, 0.58, 0.32]}>
        <mesh scale={[1, 0.95, 1.05]}>
          <sphereGeometry args={[0.1, 12, 10]} />
          {FUR(coat.body)}
        </mesh>
        {/* The brow ridge, the muzzle tapering to the nose, the cheeks. */}
        <mesh position={[0, 0.045, 0.05]} scale={[1, 0.6, 0.9]}>
          <sphereGeometry args={[0.075, 10, 8]} />
          {FUR(coat.body)}
        </mesh>
        <mesh position={[0, -0.03, 0.11]} rotation={[-0.15, 0, 0]} scale={[0.72, 0.62, 1.15]}>
          <sphereGeometry args={[0.078, 10, 8]} />
          {FUR(coat.belly)}
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={`cheek${side}`} position={[side * 0.055, -0.03, 0.07]} scale={[1, 0.8, 0.9]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            {FUR(coat.body)}
          </mesh>
        ))}
        <mesh position={[0, -0.015, 0.195]} scale={[1.2, 0.9, 0.8]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#111" roughness={0.3} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.05, 0.02, 0.08]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshStandardMaterial color="#111" roughness={0.2} />
            </mesh>
            {/* Drooping ears. */}
            <mesh position={[side * 0.09, 0.02, -0.01]} rotation={[0.1, 0, side * 0.5]} scale={[0.5, 1, 0.7]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              {FUR(coat.ear)}
            </mesh>
          </group>
        ))}
        {/* Collar. */}
        <mesh position={[0, -0.09, -0.06]} rotation={[Math.PI / 2 + 0.4, 0, 0]}>
          <torusGeometry args={[0.075, 0.012, 6, 16]} />
          <meshStandardMaterial color="#c97a65" roughness={0.6} />
        </mesh>
      </group>
      {/* Legs: hinged at the shoulder/hip and at the knee. */}
      {(
        [
          [-0.08, 0.15],
          [0.08, 0.15],
          [-0.08, -0.15],
          [0.08, -0.15],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <group key={i} position={[x, 0.36, z]} name={`leg${i}`}>
          <mesh position={[0, -0.09, 0]}>
            <capsuleGeometry args={[0.035, 0.12, 4, 8]} />
            {FUR(coat.body)}
          </mesh>
          <group position={[0, -0.18, 0]} name={`shin${i}`}>
            <mesh position={[0, -0.08, 0]}>
              <capsuleGeometry args={[0.028, 0.12, 4, 8]} />
              {FUR(coat.body)}
            </mesh>
            <mesh position={[0, -0.16, 0.02]}>
              <boxGeometry args={[0.06, 0.035, 0.08]} />
              {FUR(coat.ear)}
            </mesh>
          </group>
        </group>
      ))}
      {/* Tail. */}
      <mesh name="tail" position={[0, 0.48, -0.24]} rotation={[-0.9, 0, 0]}>
        <capsuleGeometry args={[0.022, 0.24, 4, 8]} />
        {FUR(coat.body)}
      </mesh>
    </group>
  );
}

/** The cat: 0.3 at the shoulder, long tail. Built facing +z. */
function Cat({ coat }: { coat: (typeof COATS.cat)[number] }) {
  return (
    <group>
      <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.065, 0.24, 6, 12]} />
        {FUR(coat.body)}
      </mesh>
      <mesh position={[0, 0.2, 0.02]} scale={[0.9, 0.7, 1]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        {FUR(coat.belly)}
      </mesh>
      <group name="head" position={[0, 0.31, 0.19]}>
        <mesh scale={[1, 0.9, 0.95]}>
          <sphereGeometry args={[0.062, 12, 10]} />
          {FUR(coat.body)}
        </mesh>
        {/* A short muzzle, two whisker pads, the nose. */}
        <mesh position={[0, -0.022, 0.048]} scale={[0.8, 0.6, 0.9]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          {FUR(coat.belly)}
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={`pad${side}`} position={[side * 0.016, -0.026, 0.066]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            {FUR(coat.belly)}
          </mesh>
        ))}
        <mesh position={[0, -0.01, 0.077]} scale={[1.1, 0.8, 0.7]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshStandardMaterial color="#d98a8a" roughness={0.5} />
        </mesh>
        {/* The forehead, so the skull is not a ball. */}
        <mesh position={[0, 0.03, -0.01]} scale={[1.05, 0.7, 1]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          {FUR(coat.body)}
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.03, 0.01, 0.05]} scale={[1, 1.3, 0.6]}>
              <sphereGeometry args={[0.011, 8, 8]} />
              <meshStandardMaterial color="#b9d35a" roughness={0.2} />
            </mesh>
            {/* Pointed ears. */}
            <mesh position={[side * 0.04, 0.06, -0.01]} rotation={[0, 0, side * -0.3]}>
              <coneGeometry args={[0.022, 0.05, 4]} />
              {FUR(coat.ear)}
            </mesh>
          </group>
        ))}
      </group>
      {(
        [
          [-0.04, 0.09],
          [0.04, 0.09],
          [-0.04, -0.09],
          [0.04, -0.09],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <group key={i} position={[x, 0.21, z]} name={`leg${i}`}>
          <mesh position={[0, -0.06, 0]}>
            <capsuleGeometry args={[0.018, 0.08, 4, 8]} />
            {FUR(coat.body)}
          </mesh>
          <group position={[0, -0.11, 0]} name={`shin${i}`}>
            <mesh position={[0, -0.05, 0]}>
              <capsuleGeometry args={[0.015, 0.07, 4, 8]} />
              {FUR(coat.body)}
            </mesh>
            <mesh position={[0, -0.095, 0.01]}>
              <boxGeometry args={[0.032, 0.02, 0.045]} />
              {FUR(coat.belly)}
            </mesh>
          </group>
        </group>
      ))}
      {/* The tail: two segments, curving up. */}
      <group name="tail" position={[0, 0.26, -0.15]} rotation={[-0.5, 0, 0]}>
        <mesh position={[0, 0.08, 0]}>
          <capsuleGeometry args={[0.013, 0.14, 4, 8]} />
          {FUR(coat.body)}
        </mesh>
        <mesh position={[0, 0.2, 0.02]} rotation={[0.5, 0, 0]}>
          <capsuleGeometry args={[0.011, 0.12, 4, 8]} />
          {FUR(coat.body)}
        </mesh>
      </group>
    </group>
  );
}

export function Animals({ compact }: { compact: boolean }) {
  const list = useMemo(() => (compact ? ANIMALS.filter((_, i) => i % 2 === 0) : ANIMALS), [compact]);
  const nodes = useRef<(THREE.Group | null)[]>([]);
  const state = useRef(
    list.map((a) => ({
      x: a.at[0],
      z: a.at[2],
      facing: a.facing,
      t: Math.random() * 10,
      leg: 0,
      target: null as [number, number] | null,
      wait: 1 + Math.random() * 3,
      sit: a.mode === "sit" ? 1 : 0,
      flee: 0,
    })),
  );

  useFrame((_, raw) => {
    const delta = Math.min(raw, 0.05);
    list.forEach((a, i) => {
      const node = nodes.current[i];
      if (!node) return;
      const st = state.current[i]!;
      st.t += delta;
      const dx = body.x - st.x;
      const dz = body.z - st.z;
      const distance = Math.hypot(dx, dz);
      node.visible = distance < FAR;
      if (distance >= FAR) return;

      const scale = a.kind === "dog" ? 1 : 1;
      let moving = 0;

      /* A cat steps away from a visitor who comes too close. */
      if (a.kind === "cat" && distance < CAT_FLEE && st.flee <= 0) {
        st.target = [st.x - (dx / distance) * 3.5, st.z - (dz / distance) * 3.5];
        st.flee = 4;
        st.sit = 0;
      }
      if (st.flee > 0) st.flee -= delta;

      /* Wandering: pick a point within roam of home, walk to it, wait. */
      if (a.mode === "wander" && !st.target && st.wait <= 0) {
        const r = a.roam ?? 3;
        st.target = [a.at[0] + (Math.random() - 0.5) * 2 * r, a.at[2] + (Math.random() - 0.5) * 2 * r];
      }
      if (st.target) {
        const tx = st.target[0] - st.x;
        const tz = st.target[1] - st.z;
        const left = Math.hypot(tx, tz);
        if (left < 0.15) {
          st.target = null;
          st.wait = 2 + Math.random() * 5;
          if (a.mode === "sit") st.sit = 1;
          /* A cat that has just stepped away turns to look back. */
          if (a.kind === "cat" && st.flee > 0) st.facing = Math.atan2(dx, dz);
        } else {
          /* Turn first, then go: an animal facing away from where it wants to
             be turns on the spot, and only trots as fast as it faces the way. */
          const heading = Math.atan2(tx, tz);
          const off = Math.atan2(Math.sin(heading - st.facing), Math.cos(heading - st.facing));
          const most = (st.flee > 0 ? 6 : 3.5) * delta;
          st.facing += Math.max(-most, Math.min(most, off * (1 - Math.exp(-8 * delta))));
          const align = Math.max(0, Math.cos(off) - 0.5) / 0.5;
          const speed = (a.kind === "dog" ? 1.1 : 0.75) * (st.flee > 0 ? 1.8 : 1) * align * align;
          st.x += (tx / left) * speed * delta;
          st.z += (tz / left) * speed * delta;
          st.leg += speed * delta * 9;
          moving = align > 0.05 ? 1 : 0;
        }
      } else if (st.wait > 0) {
        st.wait -= delta;
      }
      node.position.set(st.x, a.at[1], st.z);
      node.rotation.y = st.facing;
      npcMotion.record(`animal:${i}`, st.x, st.z, st.facing, delta);

      /* Sitting: the hind end drops and the body tips up. */
      const sit = st.sit;
      node.rotation.x = -sit * 0.55 * scale;
      node.position.y = a.at[1] - sit * (a.kind === "dog" ? 0.1 : 0.06);

      /* The head looks at the visitor when they are near; otherwise it
         drifts. */
      const head = node.getObjectByName("head");
      if (head) {
        const bearing = Math.atan2(dx, dz) - st.facing;
        const toward = Math.atan2(Math.sin(bearing), Math.cos(bearing));
        const want = distance < LOOK_AT ? THREE.MathUtils.clamp(toward, -1.1, 1.1) : Math.sin(st.t * 0.5) * 0.3;
        head.rotation.y += (want - head.rotation.y) * Math.min(1, 4 * delta);
        head.rotation.x = sit * 0.5 + (distance < LOOK_AT ? 0.15 : Math.sin(st.t * 0.8) * 0.05);
      }
      /* Legs trot; seated, the hind legs fold. */
      for (let k = 0; k < 4; k += 1) {
        const leg = node.getObjectByName(`leg${k}`);
        const shin = node.getObjectByName(`shin${k}`);
        if (!leg || !shin) continue;
        const phase = st.leg + (k === 0 || k === 3 ? 0 : Math.PI);
        const rear = k >= 2;
        leg.rotation.x = Math.sin(phase) * 0.6 * moving + (rear ? sit * 1.3 : sit * 0.2);
        shin.rotation.x = Math.max(0, Math.sin(phase + 1)) * 0.8 * moving + (rear ? -sit * 1.8 : 0);
      }
      const tail = node.getObjectByName("tail");
      if (tail) {
        const wag = a.kind === "dog" && distance < LOOK_AT ? Math.sin(st.t * 9) * 0.5 : Math.sin(st.t * 1.5) * 0.15;
        tail.rotation.z = wag;
      }
    });
  });

  return (
    <group name="animals">
      {list.map((a, i) => (
        <group
          key={i}
          ref={(node) => {
            nodes.current[i] = node;
          }}
          position={a.at}
          rotation={[0, a.facing, 0]}
        >
          {a.kind === "dog" ? <Dog coat={COATS.dog[a.coat]!} /> : <Cat coat={COATS.cat[a.coat]!} />}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[a.kind === "dog" ? 0.34 : 0.2, 12]} />
            <meshBasicMaterial color="#000" transparent opacity={0.35} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
