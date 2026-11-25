"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import mark from "@/assets/brand/archon-mark.png";
import { Contact, Glow, MATERIAL } from "@/components/world/pieces/Kit";
import { useMerged } from "@/components/world/pieces/merge";

/**
 * The Archon gate: the supplied logo at the size of architecture.
 *
 * Three bars measured off the logo file (428, 300 and 206 wide; 76, 71 and 71
 * high) hung in the air, and their faces are the file's own brushed metal with
 * its orange light. The plan's two collider footprints keep a low plinth each.
 */
const SCALE = 0.039;
const LEFT = -8.3;
const BASE = 5.4;
const MARK = { w: 429, h: 273 };
const PYLONS = [-7.8, 7.8];
const BARS = [
  { x: 1, y: 1, w: 427, h: 74 },
  { x: 1, y: 107, w: 299, h: 69 },
  { x: 1, y: 202, w: 204, h: 69 },
].map((bar) => ({
  ...bar,
  width: bar.w * SCALE,
  height: bar.h * SCALE,
  cy: BASE + (MARK.h - bar.y - bar.h / 2) * SCALE,
}));

/** A plane for one bar's face, cut out of the logo file. */
function face(bar: (typeof BARS)[number], flip: boolean) {
  const plane = new THREE.PlaneGeometry(bar.width, bar.height);
  const uv = plane.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i += 1) {
    const u = flip ? 1 - uv.getX(i) : uv.getX(i);
    uv.setXY(i, (bar.x + u * bar.w) / MARK.w, 1 - (bar.y + (1 - uv.getY(i)) * bar.h) / MARK.h);
  }
  return plane;
}

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
  const metal = useMemo(() => {
    const map = new THREE.TextureLoader().load(mark.src);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }, []);
  useEffect(() => () => metal.dispose(), [metal]);
  const slabs = useMerged(
    () => BARS.map((bar) => ({ geometry: new THREE.BoxGeometry(bar.width, bar.height, 1.3), at: [LEFT + bar.width / 2, bar.cy, 0] as [number, number, number] })),
    [],
  );
  const faces = useMerged(
    () =>
      BARS.flatMap((bar) =>
        [1, -1].map((side) => ({
          geometry: face(bar, side === -1),
          at: [LEFT + bar.width / 2, bar.cy, side * 0.66] as [number, number, number],
          turn: [0, side === 1 ? 0 : Math.PI, 0] as [number, number, number],
        })),
      ),
    [],
  );

  return (
    <group name="gate">
      {/* The plinths, where the pylons stood. */}
      <mesh geometry={segmentsB}>
        <meshStandardMaterial color="#232120" roughness={0.5} metalness={0.3} flatShading />
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
          <meshStandardMaterial color="#8d9094" roughness={0.28} metalness={0.9} />
        </mesh>
        <mesh geometry={faces}>
          <meshBasicMaterial map={metal} toneMapped={false} />
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
