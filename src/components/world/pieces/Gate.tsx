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
 * The two pylons are the only part you can collide with, and they stand
 * exactly where the old gate's legs stood so the plan did not have to change.
 * The bars breathe — a few centimetres of very slow rise and fall — which is
 * what makes them read as suspended rather than as a sign on posts.
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

  /* The pylons, as four pieces for both: the dark segments (two shades, so
     two pieces), the gaps of light with the caps, and the lit verticals. */
  /* The pylons: tapered shafts of dark stone, faceted, standing in the
     plan's collider footprint (4.9 by 7.2 at x = ±7.8), each with a base
     that flares to the deck. */
  const segmentsA = useMerged(
    () =>
      PYLONS.flatMap((x) => [
        /* The lower body, to two thirds. */
        {
          geometry: new THREE.CylinderGeometry(1.7, 2.3, 8.4, 6),
          at: [x, 4.2, 0] as [number, number, number],
          turn: [0, Math.PI / 6, 0] as [number, number, number],
          scale: [1, 1, 1.45] as [number, number, number],
        },
        /* The upper section, set in and turned, carrying the bars. */
        {
          geometry: new THREE.CylinderGeometry(1.25, 1.5, 4.2, 6),
          at: [x, 10.4, 0] as [number, number, number],
          turn: [0, Math.PI / 6 + 0.26, 0] as [number, number, number],
          scale: [1, 1, 1.4] as [number, number, number],
        },
      ]),
    [],
  );
  /* Silver ribs where the sections step, and an inset cut between them. */
  const ribs = useMerged(
    () =>
      PYLONS.flatMap((x) => [
        { geometry: new THREE.CylinderGeometry(1.78, 1.78, 0.28, 6), at: [x, 8.4, 0] as [number, number, number], turn: [0, Math.PI / 6, 0] as [number, number, number], scale: [1, 1, 1.45] as [number, number, number] },
        { geometry: new THREE.CylinderGeometry(2.0, 2.0, 0.22, 6), at: [x, 5.0, 0] as [number, number, number], turn: [0, Math.PI / 6, 0] as [number, number, number], scale: [1, 1, 1.45] as [number, number, number] },
        { geometry: new THREE.CylinderGeometry(1.32, 1.32, 0.2, 6), at: [x, 12.4, 0] as [number, number, number], turn: [0, Math.PI / 6 + 0.26, 0] as [number, number, number], scale: [1, 1, 1.4] as [number, number, number] },
      ]),
    [],
  );
  const cut = useMerged(
    () =>
      PYLONS.map((x) => ({
        geometry: new THREE.CylinderGeometry(1.15, 1.15, 0.5, 6),
        at: [x, 8.65, 0] as [number, number, number],
        turn: [0, Math.PI / 6, 0] as [number, number, number],
        scale: [1, 1, 1.4] as [number, number, number],
      })),
    [],
  );
  const segmentsB = useMerged(
    () =>
      PYLONS.map((x) => ({
        geometry: new THREE.CylinderGeometry(2.45, 2.7, 0.9, 6),
        at: [x, 0.45, 0] as [number, number, number],
        turn: [0, Math.PI / 6, 0] as [number, number, number],
        scale: [1, 1, 1.45] as [number, number, number],
      })),
    [],
  );
  /* Rings of light at three heights, and the cap that carries the bars. */
  const gaps = useMerged(
    () =>
      PYLONS.flatMap((x) => [
        ...[2.6, 6.6, 11.0].map((y, i) => ({
          geometry: new THREE.CylinderGeometry([2.15, 1.9, 1.34][i]!, [2.2, 1.95, 1.38][i]!, 0.12, 6, 1, true),
          at: [x, y, 0] as [number, number, number],
          turn: [0, Math.PI / 6, 0] as [number, number, number],
          scale: [1, 1, 1.45] as [number, number, number],
        })),
        {
          geometry: new THREE.CylinderGeometry(1.5, 1.4, 0.14, 6),
          at: [x, 12.5, 0] as [number, number, number],
          turn: [0, Math.PI / 6, 0] as [number, number, number],
          scale: [1, 1, 1.45] as [number, number, number],
        },
      ]),
    [],
  );
  /* One warm-white edge of light up the inner face of each pylon. */
  const verticals = useMerged(
    () =>
      PYLONS.map((x) => ({
        geometry: new THREE.BoxGeometry(0.1, 11.6, 0.16),
        at: [x - Math.sign(x) * 1.75, 6.4, 0] as [number, number, number],
      })),
    [],
  );
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
      {/* The pylons. */}
      <mesh geometry={segmentsA}>
        <meshStandardMaterial color="#26344f" roughness={0.45} metalness={0.35} flatShading />
      </mesh>
      <mesh geometry={segmentsB}>
        <meshStandardMaterial color="#1a2540" roughness={0.5} metalness={0.3} flatShading />
      </mesh>
      <mesh geometry={ribs}>
        <meshStandardMaterial color="#c9d2de" roughness={0.42} metalness={0.55} flatShading />
      </mesh>
      <mesh geometry={cut}>
        <meshStandardMaterial color="#0a1020" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh geometry={gaps}>
        <meshBasicMaterial color={MATERIAL.warmWhite} toneMapped={false} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      <mesh geometry={verticals}>
        <Glow colour={MATERIAL.warmWhite} opacity={0.9} />
      </mesh>
      {PYLONS.map((x) => (
        <Contact key={x} texture={texture} at={[x, 0.02, 0]} size={[9, 12]} opacity={0.75} />
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
