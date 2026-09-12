"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Contact, Glow, MATERIAL } from "@/components/world/pieces/Kit";
import { useMerged } from "@/components/world/pieces/merge";

/**
 * The Archon gate.
 *
 * The centre of the world is the Archon mark at the size of architecture —
 * and the mark is three left-aligned bars of decreasing width, measured off
 * the supplied logo (heights 7.4 on an 11 pitch, widths 34 / 24.5 / 15). Here
 * they are built at sixty centimetres to the unit and hung in the air between
 * two pylons: three slabs of light metal, each with a lit front face, the
 * shortest at the bottom so the visitor walks in under it. Seen from the
 * gallery above, or from any island across the water, it is the logo. Walked
 * through, it is a gate.
 *
 * There are no pylons any more: the mark hangs on its own in front of the
 * landmark's wheel, which is the composition the reference world has. Where
 * the pylons stood — the plan's two collider footprints at x = ±7.8 — two
 * low plinths of dark stone remain, each carrying a ring of light, so the
 * solid the visitor still walks around is a solid they can see. The bars
 * breathe — a few centimetres of very slow rise and fall — which is what
 * makes them read as suspended rather than as a sign on posts.
 */

const SCALE = 0.5;
const LEFT = -8.5;
const BAR_H = 7.4 * SCALE;
const PITCH = 11 * SCALE;
const BASE = 7;
const PYLONS = [-7.8, 7.8];
const BARS = [
  { width: 34 * SCALE, y: BASE + PITCH * 2 },
  { width: 24.5 * SCALE, y: BASE + PITCH },
  { width: 15 * SCALE, y: BASE },
];

export function Gate({ texture }: { texture: THREE.Texture }) {
  const bars = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!bars.current) return;
    bars.current.position.y = Math.sin(clock.elapsedTime * 0.35) * 0.09;
  });

  /* The plinths: faceted dark stone in the plan's collider footprints (4.9
     by 7.2 at x = ±7.8), a ring of light let into each. */
  /* Silver ribs where the sections step, and an inset cut between them. */
  const segmentsB = useMerged(
    () =>
      PYLONS.flatMap((x) => [
        {
          geometry: new THREE.CylinderGeometry(2.3, 2.7, 1.6, 6),
          at: [x, 0.8, 0] as [number, number, number],
          turn: [0, Math.PI / 6, 0] as [number, number, number],
          scale: [1, 1, 1.45] as [number, number, number],
        },
        {
          geometry: new THREE.CylinderGeometry(1.9, 2.2, 0.5, 6),
          at: [x, 1.85, 0] as [number, number, number],
          turn: [0, Math.PI / 6, 0] as [number, number, number],
          scale: [1, 1, 1.45] as [number, number, number],
        },
      ]),
    [],
  );
  /* Rings of light at three heights, and the cap that carries the bars. */
  const gaps = useMerged(
    () =>
      PYLONS.map((x) => ({
        geometry: new THREE.CylinderGeometry(2.24, 2.3, 0.1, 6, 1, true),
        at: [x, 1.62, 0] as [number, number, number],
        turn: [0, Math.PI / 6, 0] as [number, number, number],
        scale: [1, 1, 1.45] as [number, number, number],
      })),
    [],
  );
  /* One warm-white edge of light up the inner face of each pylon. */
  /* The mark: three slabs, six lit faces, three hairlines — three pieces. */
  const slabs = useMerged(
    () => BARS.map((bar) => ({ geometry: new THREE.BoxGeometry(bar.width, BAR_H, 1.3), at: [LEFT + bar.width / 2, bar.y + BAR_H / 2, 0] as [number, number, number] })),
    [],
  );
  const faces = useMerged(
    () =>
      BARS.flatMap((bar) =>
        [1, -1].map((side) => ({
          geometry: new THREE.PlaneGeometry(bar.width - 0.5, BAR_H - 0.5),
          at: [LEFT + bar.width / 2, bar.y + BAR_H / 2, side * 0.66] as [number, number, number],
          turn: [0, side === 1 ? 0 : Math.PI, 0] as [number, number, number],
        })),
      ),
    [],
  );
  const hairlines = useMerged(
    () =>
      BARS.map((bar) => ({
        geometry: new THREE.PlaneGeometry(bar.width, 0.12),
        at: [LEFT + bar.width / 2, bar.y - 0.02, 0] as [number, number, number],
        turn: [Math.PI / 2, 0, 0] as [number, number, number],
      })),
    [],
  );

  return (
    <group name="gate">
      {/* The plinths, where the pylons stood. */}
      <mesh geometry={segmentsB}>
        <meshStandardMaterial color="#1a2540" roughness={0.5} metalness={0.3} flatShading />
      </mesh>
      <mesh geometry={gaps}>
        <meshBasicMaterial color={MATERIAL.warmWhite} toneMapped={false} side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
      {PYLONS.map((x) => (
        <Contact key={x} texture={texture} at={[x, 0.02, 0]} size={[8, 10]} opacity={0.6} />
      ))}

      {/* The mark. */}
      <group ref={bars}>
        <mesh geometry={slabs}>
          <meshStandardMaterial color="#dfe8f4" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Lit front and back faces, slightly inset. */}
        <mesh geometry={faces}>
          <Glow colour="#f4f8ff" opacity={0.64} />
        </mesh>
        {/* A hairline of the world's blue along the underside. */}
        <mesh geometry={hairlines}>
          <Glow colour={MATERIAL.cyan} opacity={0.8} />
        </mesh>
      </group>

      {/* The threshold, lit across the passage on the floor. */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10.6, 0.12]} />
        <Glow colour={MATERIAL.glow} opacity={0.7} />
      </mesh>
      <Contact texture={texture} at={[0, 0.02, 0]} size={[14, 16]} opacity={0.3} colour={MATERIAL.glow} />
    </group>
  );
}
