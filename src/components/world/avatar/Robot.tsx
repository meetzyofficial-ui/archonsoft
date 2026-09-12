"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { guideStore } from "@/components/world/npc/Guides";
import { Glow } from "@/components/world/pieces/Kit";
import { mergeParts, useMerged, type Part } from "@/components/world/pieces/merge";
import { body, STRIDE } from "@/components/world/systems/body";

/**
 * The Archon Explorer.
 *
 * The visitor's body in the world, and the world's main character: a
 * 2.1-metre humanoid exploration android. Not a toy and not a soldier — an
 * advanced machine built by a studio that cares how things look: gunmetal
 * and titanium underneath, warm-white ceramic armour laid over it in plates
 * that read as separate parts, brushed-silver trims where the plates meet,
 * graphite in the joints, and a little light where a machine would have
 * light — two eyes behind a dark visor, a core in the chest, indicator
 * strips at the shoulders and wrists, an amber tell at the knees.
 *
 * It is built from primitives rather than loaded, so it costs nothing to
 * download; and it is built cheaply — everything that does not move
 * relative to its limb is merged into one piece per material, so the whole
 * figure is about eighty draws for several hundred visible parts.
 *
 * It animates procedurally: the walk is a function of metres walked, the
 * breathing a function of time, the head turns to whatever the visitor is
 * standing in front of, and when a guide or the host is speaking the whole
 * figure settles into listening. Everything moves from `body`, which the
 * walking loop writes each frame.
 */

const GUNMETAL = { color: "#3b4453", roughness: 0.42, metalness: 0.85, envMapIntensity: 1.2 } as const;
const TITANIUM = { color: "#8b95a4", roughness: 0.38, metalness: 0.9, envMapIntensity: 1.3 } as const;
const SILVER = { color: "#b7c1cc", roughness: 0.3, metalness: 0.92, envMapIntensity: 1.4 } as const;
const ARMOUR = { color: "#e9edf1", roughness: 0.34, metalness: 0.14, envMapIntensity: 1.2 } as const;
const GRAPHITE = { color: "#1b222c", roughness: 0.58, metalness: 0.55 } as const;
const CAVITY = { color: "#080d14", roughness: 0.8, metalness: 0.3 } as const;
const VISOR = { color: "#08111f", roughness: 0.06, metalness: 0.75, envMapIntensity: 1.6 } as const;
const CYAN = "#56d9ff";
const BLUE = "#2b9fff";
const AMBER = "#ffb347";
const VIOLET = "#8d7cff";
const ONE = new THREE.Vector3(1, 1, 1);

const V3 = (x: number, y: number, z: number): [number, number, number] => [x, y, z];

/** One merged piece with one material: the way most of the body is drawn. */
function Piece({ parts, material }: { parts: () => Part[]; material: Record<string, unknown> }) {
  const geometry = useMerged(parts, []);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial {...(material as object)} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ head */

function Head() {
  const shell = () => [
    { geometry: new THREE.SphereGeometry(0.128, 22, 16), at: V3(0, 0.12, -0.012), scale: V3(1, 1.14, 1.12) },
    /* The brow: a wedge over the visor. */
    { geometry: new THREE.BoxGeometry(0.22, 0.05, 0.1), at: V3(0, 0.185, 0.085), turn: V3(0.35, 0, 0) },
    /* The crown ridge, front to back. */
    { geometry: new THREE.BoxGeometry(0.03, 0.035, 0.2), at: V3(0, 0.255, -0.02), turn: V3(0.15, 0, 0) },
    /* Temple plates. */
    { geometry: new THREE.SphereGeometry(0.075, 12, 10), at: V3(-0.108, 0.09, 0.02), turn: V3(0, -0.3, 0.15), scale: V3(0.5, 1, 1.1) },
    { geometry: new THREE.SphereGeometry(0.075, 12, 10), at: V3(0.108, 0.09, 0.02), turn: V3(0, 0.3, -0.15), scale: V3(0.5, 1, 1.1) },
  ];
  const dark = () => [
    /* The visor recess, and the jaw: a graphite lower face with a chin guard. */
    { geometry: new THREE.SphereGeometry(0.118, 16, 12), at: V3(0, 0.1, 0.075), scale: V3(1.06, 0.72, 0.62) },
    { geometry: new THREE.BoxGeometry(0.15, 0.07, 0.13), at: V3(0, 0.005, 0.05), turn: V3(0.1, 0, 0) },
    { geometry: new THREE.BoxGeometry(0.11, 0.04, 0.05), at: V3(0, -0.02, 0.11) },
  ];
  const trims = () => [
    /* Ear modules, a sensor fin on the right, a cheek plate on each side. */
    { geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.045, 12), at: V3(-0.138, 0.1, 0), turn: V3(0, 0, Math.PI / 2) },
    { geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.045, 12), at: V3(0.138, 0.1, 0), turn: V3(0, 0, Math.PI / 2) },
    { geometry: new THREE.BoxGeometry(0.012, 0.09, 0.05), at: V3(0.16, 0.16, -0.02), turn: V3(0.2, 0, 0.1) },
    { geometry: new THREE.BoxGeometry(0.03, 0.05, 0.08), at: V3(-0.11, 0.0, 0.07), turn: V3(0, -0.4, 0) },
    { geometry: new THREE.BoxGeometry(0.03, 0.05, 0.08), at: V3(0.11, 0.0, 0.07), turn: V3(0, 0.4, 0) },
  ];
  const eyes = useMerged(
    () => [
      { geometry: new THREE.PlaneGeometry(0.036, 0.012), at: V3(-0.036, 0.112, 0.153), turn: V3(0, -0.25, 0.08) },
      { geometry: new THREE.PlaneGeometry(0.036, 0.012), at: V3(0.036, 0.112, 0.153), turn: V3(0, 0.25, -0.08) },
    ],
    [],
  );
  const slits = useMerged(
    () => [-0.03, 0, 0.03].map((x) => ({ geometry: new THREE.PlaneGeometry(0.008, 0.028), at: V3(x, 0.0, 0.117) })),
    [],
  );
  return (
    <>
      <Piece parts={shell} material={ARMOUR} />
      <Piece parts={dark} material={GRAPHITE} />
      <Piece parts={trims} material={TITANIUM} />
      {/* The visor glass, and the depth behind it. */}
      <mesh position={[0, 0.1, 0.084]} scale={[1, 0.6, 0.6]}>
        <sphereGeometry args={[0.115, 16, 12]} />
        <meshStandardMaterial {...VISOR} />
      </mesh>
      <mesh position={[0, 0.1, 0.07]} scale={[0.9, 0.5, 0.55]}>
        <sphereGeometry args={[0.11, 12, 10]} />
        <meshStandardMaterial {...CAVITY} />
      </mesh>
      {/* The eyes: two bars of cyan behind the glass. */}
      <mesh geometry={eyes} name="eyes">
        <meshBasicMaterial color={CYAN} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      {/* Amber tells on the jaw. */}
      <mesh geometry={slits}>
        <meshBasicMaterial color={AMBER} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      {/* Ear-module lights. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.162, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.028, 0.028, 0.006, 12]} />
          <Glow colour={BLUE} opacity={0.7} />
        </mesh>
      ))}
    </>
  );
}

/* ----------------------------------------------------------------- torso */

function Chest() {
  const armour = () => [
    /* The chest plate: chamfered, wider at the collarbone, and two pectoral
       plates over it. */
    { geometry: new THREE.CylinderGeometry(0.29, 0.235, 0.38, 8), at: V3(0, 0.02, 0.05), turn: V3(0.08, Math.PI / 8, 0), scale: V3(1, 1, 0.58) },
    { geometry: new THREE.BoxGeometry(0.2, 0.18, 0.04), at: V3(-0.13, 0.06, 0.175), turn: V3(0.1, -0.15, 0) },
    { geometry: new THREE.BoxGeometry(0.2, 0.18, 0.04), at: V3(0.13, 0.06, 0.175), turn: V3(0.1, 0.15, 0) },
  ];
  const metal = () => [
    /* The ribcage and the back plate. */
    { geometry: new THREE.CapsuleGeometry(0.17, 0.28, 6, 14), at: V3(0, 0, 0), turn: V3(0, 0, Math.PI / 2) },
    { geometry: new THREE.BoxGeometry(0.42, 0.34, 0.1), at: V3(0, -0.02, -0.1) },
  ];
  const silver = () => [
    /* The collar plate, and fasteners at the plates' outer edges. */
    { geometry: new THREE.CylinderGeometry(0.24, 0.29, 0.06, 8), at: V3(0, 0.2, 0.06), turn: V3(0.25, Math.PI / 8, 0), scale: V3(1, 1, 0.6) },
    ...[-1, 1].flatMap((side) =>
      [0.11, 0.0].map((y) => ({ geometry: new THREE.CylinderGeometry(0.006, 0.006, 0.006, 8), at: V3(side * 0.215, y, 0.19) })),
    ),
  ];
  const dark = () => [
    /* The spine, the belt under the chest, the core recess. */
    { geometry: new THREE.BoxGeometry(0.12, 0.5, 0.08), at: V3(0, -0.1, -0.15) },
    { geometry: new THREE.CylinderGeometry(0.2, 0.235, 0.05, 8), at: V3(0, -0.14, 0.05), turn: V3(0, Math.PI / 8, 0), scale: V3(1, 1, 0.58) },
    { geometry: new THREE.BoxGeometry(0.16, 0.14, 0.02), at: V3(0, -0.08, 0.196) },
  ];
  const seams = () => [
    { geometry: new THREE.PlaneGeometry(0.012, 0.3), at: V3(0, 0.02, 0.2) },
    { geometry: new THREE.BoxGeometry(0.18, 0.006, 0.004), at: V3(-0.13, -0.01, 0.197), turn: V3(0.1, -0.15, 0) },
    { geometry: new THREE.BoxGeometry(0.18, 0.006, 0.004), at: V3(0.13, -0.01, 0.197), turn: V3(0.1, 0.15, 0) },
    { geometry: new THREE.PlaneGeometry(0.16, 0.008), at: V3(-0.252, 0.02, 0.07), turn: V3(0, -Math.PI / 2, 0) },
    { geometry: new THREE.PlaneGeometry(0.16, 0.008), at: V3(0.252, 0.02, 0.07), turn: V3(0, Math.PI / 2, 0) },
  ];
  return (
    <>
      <Piece parts={metal} material={GUNMETAL} />
      <Piece parts={armour} material={ARMOUR} />
      <Piece parts={silver} material={SILVER} />
      <Piece parts={dark} material={GRAPHITE} />
      <Piece parts={seams} material={CAVITY} />
      {/* The mark on the back, violet, quiet. */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.06 + (0.12 - i * 0.03) / 2, 0.1 - i * 0.045, -0.155]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.12 - i * 0.03, 0.026]} />
          <Glow colour={VIOLET} opacity={0.6} />
        </mesh>
      ))}
    </>
  );
}

function Waist() {
  const metal = () => [
    /* The pelvis, and three abdomen segments. */
    { geometry: new THREE.BoxGeometry(0.36, 0.2, 0.24), at: V3(0, 0.05, 0) },
    ...[0, 1, 2].map((i) => ({ geometry: new THREE.CylinderGeometry(0.135 + i * 0.01, 0.13 + i * 0.01, 0.085, 14), at: V3(0, 0.2 + i * 0.09, 0) })),
  ];
  const armour = () => [
    { geometry: new THREE.BoxGeometry(0.28, 0.16, 0.06), at: V3(0, 0.06, 0.12), turn: V3(0.2, 0, 0) },
    { geometry: new THREE.BoxGeometry(0.06, 0.18, 0.22), at: V3(-0.2, 0.08, 0), turn: V3(0, 0, 0.15) },
    { geometry: new THREE.BoxGeometry(0.06, 0.18, 0.22), at: V3(0.2, 0.08, 0), turn: V3(0, 0, -0.15) },
  ];
  const bands = () => [0, 1, 2].map((i) => ({ geometry: new THREE.BoxGeometry(0.22, 0.06, 0.12), at: V3(0, 0.2 + i * 0.09, 0.08), scale: V3(1, 1, 0.6) }));
  return (
    <>
      <Piece parts={metal} material={GUNMETAL} />
      <Piece parts={armour} material={ARMOUR} />
      <Piece parts={bands} material={TITANIUM} />
    </>
  );
}

/* ------------------------------------------------------------------ limbs */

function Hand({ side }: { side: number }) {
  const fingers = useMerged(
    () => [
      ...[0, 1, 2, 3].flatMap((i) => [
        { geometry: new THREE.BoxGeometry(0.018, 0.04, 0.02), at: V3(-0.033 + i * 0.022, 0.08, 0.005), turn: V3(0.2, 0, 0) },
        { geometry: new THREE.BoxGeometry(0.016, 0.036, 0.018), at: V3(-0.033 + i * 0.022, 0.045, 0.014), turn: V3(0.55, 0, 0) },
      ]),
      { geometry: new THREE.BoxGeometry(0.02, 0.06, 0.02), at: V3(side * 0.055, 0.055, 0.02), turn: V3(0.5, 0, side * 0.7) },
    ],
    [side],
  );
  const palm = () => [
    { geometry: new THREE.BoxGeometry(0.1, 0.11, 0.05), at: V3(0, -0.045, 0) },
    { geometry: new THREE.BoxGeometry(0.096, 0.02, 0.04), at: V3(0, -0.095, 0.005) },
  ];
  return (
    <group>
      <Piece parts={palm} material={GRAPHITE} />
      <mesh position={[0, -0.04, -0.03]}>
        <boxGeometry args={[0.09, 0.09, 0.016]} />
        <meshStandardMaterial {...ARMOUR} />
      </mesh>
      <group name="fingers" position={[0, -0.1, 0]}>
        <mesh geometry={fingers} position={[0, -0.1, 0]}>
          <meshStandardMaterial {...GRAPHITE} />
        </mesh>
      </group>
    </group>
  );
}

function UpperArm({ side }: { side: number }) {
  const metal = () => [{ geometry: new THREE.CapsuleGeometry(0.06, 0.26, 4, 12), at: V3(0, -0.19, 0) }];
  const sleeve = () => [{ geometry: new THREE.CapsuleGeometry(0.075, 0.18, 4, 12), at: V3(0, -0.2, 0) }];
  const plate = () => [{ geometry: new THREE.BoxGeometry(0.05, 0.16, 0.12), at: V3(side * 0.07, -0.2, 0) }];
  return (
    <>
      <Piece parts={metal} material={GUNMETAL} />
      <Piece parts={sleeve} material={TITANIUM} />
      <Piece parts={plate} material={ARMOUR} />
    </>
  );
}

function Forearm({ side }: { side: number }) {
  const metal = () => [
    { geometry: new THREE.SphereGeometry(0.07, 10, 10), at: V3(0, 0, 0) },
    { geometry: new THREE.CapsuleGeometry(0.05, 0.26, 4, 12), at: V3(0, -0.18, 0) },
  ];
  const armour = () => [{ geometry: new THREE.BoxGeometry(0.13, 0.26, 0.12), at: V3(0, -0.17, 0.01) }];
  const silver = () => [
    { geometry: new THREE.BoxGeometry(0.03, 0.2, 0.1), at: V3(side * 0.06, -0.14, 0) },
    { geometry: new THREE.TorusGeometry(0.058, 0.012, 6, 16), at: V3(0, -0.31, 0), turn: V3(Math.PI / 2, 0, 0) },
  ];
  return (
    <>
      <Piece parts={metal} material={GRAPHITE} />
      <Piece parts={armour} material={ARMOUR} />
      <Piece parts={silver} material={SILVER} />
      {/* Wrist accent. */}
      <mesh position={[0, -0.3, 0.062]}>
        <planeGeometry args={[0.05, 0.016]} />
        <Glow colour={CYAN} />
      </mesh>
    </>
  );
}

function Thigh({ side }: { side: number }) {
  const metal = () => [
    { geometry: new THREE.SphereGeometry(0.115, 12, 12), at: V3(0, 0, 0) },
    { geometry: new THREE.CapsuleGeometry(0.09, 0.3, 4, 14), at: V3(0, -0.25, 0) },
    { geometry: new THREE.CylinderGeometry(0.088, 0.088, 0.05, 12), at: V3(0, -0.44, 0) },
  ];
  const armour = () => [{ geometry: new THREE.BoxGeometry(0.17, 0.36, 0.09), at: V3(0, -0.22, 0.075), turn: V3(0.08, 0, 0) }];
  const side_ = () => [{ geometry: new THREE.BoxGeometry(0.05, 0.3, 0.16), at: V3(side * 0.1, -0.24, 0), turn: V3(0, 0, side * 0.1) }];
  return (
    <>
      <Piece parts={metal} material={GUNMETAL} />
      <Piece parts={armour} material={ARMOUR} />
      <Piece parts={side_} material={TITANIUM} />
    </>
  );
}

function Shin({ side }: { side: number }) {
  const dark = () => [
    { geometry: new THREE.SphereGeometry(0.09, 12, 12), at: V3(0, 0, 0) },
    { geometry: new THREE.CapsuleGeometry(0.068, 0.34, 4, 12), at: V3(0, -0.24, 0) },
    { geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12), at: V3(side * 0.075, 0, 0) },
  ];
  const armour = () => [
    { geometry: new THREE.SphereGeometry(0.075, 10, 10), at: V3(0, 0.01, 0.06), turn: V3(0.3, 0, 0), scale: V3(1, 1.2, 0.7) },
    { geometry: new THREE.BoxGeometry(0.15, 0.36, 0.09), at: V3(0, -0.25, 0.06), turn: V3(-0.06, 0, 0) },
  ];
  const metal = () => [
    /* The knee piston, its housing, and the calf behind. */
    { geometry: new THREE.CylinderGeometry(0.022, 0.022, 0.2, 8), at: V3(0, -0.08, -0.085), turn: V3(0.35, 0, 0) },
    { geometry: new THREE.CylinderGeometry(0.03, 0.03, 0.006, 12), at: V3(side * 0.092, 0, 0), turn: V3(0, 0, Math.PI / 2) },
    { geometry: new THREE.SphereGeometry(0.07, 10, 10), at: V3(0, -0.2, -0.06), scale: V3(1, 1.6, 0.9) },
  ];
  return (
    <>
      <Piece parts={dark} material={GRAPHITE} />
      <Piece parts={armour} material={ARMOUR} />
      <Piece parts={metal} material={TITANIUM} />
      {/* The shin light, and an amber tell at the knee. */}
      <mesh position={[0, -0.25, 0.106]}>
        <planeGeometry args={[0.024, 0.3]} />
        <Glow colour={CYAN} opacity={0.75} />
      </mesh>
      <mesh position={[side * 0.094, 0, 0]} rotation={[0, (side * Math.PI) / 2, 0]}>
        <circleGeometry args={[0.012, 10]} />
        <Glow colour={AMBER} opacity={0.7} />
      </mesh>
    </>
  );
}

function Foot() {
  const dark = () => [
    { geometry: new THREE.SphereGeometry(0.065, 10, 10), at: V3(0, 0, 0) },
    { geometry: new THREE.BoxGeometry(0.2, 0.1, 0.36), at: V3(0, -0.06, 0.05) },
  ];
  const armour = () => [
    { geometry: new THREE.BoxGeometry(0.18, 0.08, 0.12), at: V3(0, -0.045, 0.19) },
    { geometry: new THREE.BoxGeometry(0.21, 0.03, 0.3), at: V3(0, -0.02, 0.06) },
  ];
  const silver = () => [
    { geometry: new THREE.BoxGeometry(0.16, 0.09, 0.1), at: V3(0, -0.03, -0.1) },
    { geometry: new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), at: V3(-0.07, 0.01, 0), turn: V3(0, 0, Math.PI / 2) },
    { geometry: new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), at: V3(0.07, 0.01, 0), turn: V3(0, 0, Math.PI / 2) },
  ];
  return (
    <>
      <Piece parts={dark} material={GRAPHITE} />
      <Piece parts={armour} material={ARMOUR} />
      <Piece parts={silver} material={SILVER} />
    </>
  );
}

function Pauldron({ side }: { side: number }) {
  const armour = () => [
    { geometry: new THREE.SphereGeometry(0.145, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.46), at: V3(side * 0.045, 0.065, 0), turn: V3(0, 0, side * -0.6), scale: V3(1, 0.72, 1) },
  ];
  const lower = () => [
    { geometry: new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), at: V3(side * 0.15, -0.03, 0), turn: V3(0, 0, side * -0.9), scale: V3(0.7, 0.5, 0.9) },
  ];
  const silver = () => [
    { geometry: new THREE.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), at: V3(side * 0.03, 0.03, 0), turn: V3(0, 0, side * -0.55), scale: V3(1, 0.75, 0.95) },
    { geometry: new THREE.TorusGeometry(0.1, 0.012, 6, 20), at: V3(0, 0, 0), turn: V3(0, 0, Math.PI / 2) },
  ];
  return (
    <>
      <mesh>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial {...GRAPHITE} />
      </mesh>
      <Piece parts={silver} material={SILVER} />
      <Piece parts={armour} material={ARMOUR} />
      <Piece parts={lower} material={TITANIUM} />
      {/* The shoulder strip: a short bar of cyan on the plate, and an amber
          module on the left shoulder only. */}
      <mesh position={[side * 0.12, 0.0, 0.02]} rotation={[0, 0, side * -0.4]}>
        <boxGeometry args={[0.08, 0.012, 0.1]} />
        <Glow colour={CYAN} opacity={0.6} />
      </mesh>
      {side < 0 ? (
        <>
          <mesh position={[-0.13, 0.11, -0.02]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.06, 0.03, 0.08]} />
            <meshStandardMaterial {...TITANIUM} />
          </mesh>
          <mesh position={[-0.16, 0.125, -0.02]} rotation={[0, 0, 0.4]}>
            <planeGeometry args={[0.012, 0.05]} />
            <Glow colour={AMBER} opacity={0.75} />
          </mesh>
        </>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ robot */

export function Robot() {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const foreL = useRef<THREE.Group>(null);
  const foreR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const shinL = useRef<THREE.Group>(null);
  const shinR = useRef<THREE.Group>(null);
  const footL = useRef<THREE.Group>(null);
  const footR = useRef<THREE.Group>(null);
  const disc = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const coreHalo = useRef<THREE.Mesh>(null);
  const shoulders = useRef<THREE.Group>(null);
  const lastStep = useRef(0);

  const look = useMemo(() => new THREE.Vector3(), []);
  const smooth = useRef({ headYaw: 0, headPitch: 0, lean: 0, bob: 0, attend: 0, run: 0, curl: 0, squash: 0, shift: 0 });
  const shell = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const mist = useRef<THREE.Mesh>(null);
  const column = useRef<THREE.Mesh>(null);
  const figure = useRef<THREE.Group>(null);
  const lastLanding = useRef(0);
  const time = useRef(0);
  const fingerGroups = useRef<THREE.Object3D[] | null>(null);
  const eyes = useRef<THREE.Object3D | null>(null);

  /* The core: three left-aligned bars of cyan light let into the chest,
     in one piece; a blue hexagon of light behind them. */
  const coreGeometry = useMerged(
    () => [0, 1, 2].map((i) => ({ geometry: new THREE.PlaneGeometry(0.11 - i * 0.03, 0.02), at: V3(-0.06 + (0.11 - i * 0.03) / 2, -0.04 - i * 0.038, 0.208) })),
    [],
  );
  const haloGeometry = useMemo(() => mergeParts([{ geometry: new THREE.CircleGeometry(0.1, 6), at: V3(-0.005, -0.078, 0.2), turn: V3(0, 0, Math.PI / 6) }]), []);

  useFrame((_, raw) => {
    const node = root.current;
    if (!node) return;
    const delta = Math.min(raw, 0.05);
    time.current += delta;
    const t = time.current;
    const s = smooth.current;

    /* Where the feet are — and how far off the floor. */
    node.position.set(body.x, body.floor, body.z);
    if (figure.current) {
      figure.current.position.y = body.lift;
      /* The wind-up compresses the body; the landing compresses it again
         and releases. In the air it stretches a little on the way up. */
      const air = body.lift > 0.02 ? 1 : 0;
      /* Landing: compression, then one small rebound before it settles. */
      const rebound = body.landing > 0.2 && body.landing < 0.5 ? Math.sin(((body.landing - 0.2) / 0.3) * Math.PI) * 0.035 : 0;
      const wantSquash = -body.crouch * 0.08 - Math.max(0, body.landing - 0.55) * 0.16 + rebound + air * Math.max(0, body.vy) * 0.006;
      s.squash += (wantSquash - s.squash) * Math.min(1, 16 * delta);
      figure.current.scale.set(1 - s.squash * 0.5, 1 + s.squash, 1 - s.squash * 0.5);
      /* Arriving from a teleport the body pops in from a little small. */
      const pop = 1 - body.glow * 0.25;
      figure.current.scale.multiplyScalar(pop);
      figure.current.visible = !body.hidden;
    }
    /* The rig is modelled facing +z; the body's heading is measured in the
       camera's convention where forward is −z. */
    node.rotation.y = body.facing + Math.PI;

    /* The stride: legs and arms swing out of phase, driven by distance so
       the feet never slide. Standing still the phase stops with them. */
    const phase = body.walked * STRIDE * Math.PI;
    const pace = body.pace;
    const swing = Math.sin(phase);
    const active = Math.min(1, pace * 3.5);
    s.run += (THREE.MathUtils.clamp((pace - 0.55) / 0.5, 0, 1) - s.run) * Math.min(1, 4 * delta);
    const legAmp = 0.3 + pace * 0.45;
    const armAmp = 0.2 + pace * 0.3 + s.run * 0.25;

    /* When a guide or the host is speaking the machine attends: it stops
       swinging its arms, squares up, and leans in a degree or two. */
    const attending = guideStore.talking ? 1 : 0;
    s.attend += (attending - s.attend) * Math.min(1, 2.5 * delta);
    const calm = 1 - s.attend * 0.8;

    /* Standing, the weight shifts slowly from one leg to the other. */
    const still = 1 - active;
    s.shift += (Math.sin(t * 0.35) * still - s.shift) * Math.min(1, 2 * delta);

    /* In the air the legs tuck: thighs forward, knees bent, toes down; the
       wind-up and the landing bend the knees the other way. */
    const air = THREE.MathUtils.clamp(body.lift * 2.5, 0, 1);
    const bend = body.crouch * 0.5 + Math.max(0, body.landing - 0.5) * 1.1;
    if (legL.current) legL.current.rotation.x = swing * legAmp * active * (1 - air) - air * 0.55 - bend * 0.45 + Math.max(0, s.shift) * 0.04;
    if (legR.current) legR.current.rotation.x = -swing * legAmp * active * (1 - air) - air * 0.35 - bend * 0.45 + Math.max(0, -s.shift) * 0.04;
    if (shinL.current) shinL.current.rotation.x = Math.max(0, -swing) * (0.95 + s.run * 0.3) * active * (1 - air) + air * 1.1 + bend * 0.9 + Math.max(0, s.shift) * 0.06;
    if (shinR.current) shinR.current.rotation.x = Math.max(0, swing) * (0.95 + s.run * 0.3) * active * (1 - air) + air * 0.9 + bend * 0.9 + Math.max(0, -s.shift) * 0.06;
    if (footL.current) footL.current.rotation.x = -Math.max(0, -swing) * 0.5 * active + air * 0.35 - bend * 0.45;
    if (footR.current) footR.current.rotation.x = -Math.max(0, swing) * 0.5 * active + air * 0.35 - bend * 0.45;
    if (armL.current) armL.current.rotation.z = air * 0.35 + still * 0.04;
    if (armR.current) armR.current.rotation.z = -air * 0.35 - still * 0.04;
    /* Fingers curl with effort: a fist at a run, open at rest; they clench
       on a landing. */
    s.curl += (0.25 + pace * 0.5 + air * 0.4 + Math.max(0, body.landing - 0.5) * 0.8 - s.curl) * Math.min(1, 6 * delta);
    if (!fingerGroups.current) {
      const found: THREE.Object3D[] = [];
      node.traverse((part) => {
        if (part.name === "fingers") found.push(part);
      });
      fingerGroups.current = found;
      eyes.current = node.getObjectByName("eyes") ?? null;
    }
    for (const f of fingerGroups.current) f.rotation.x = s.curl;
    if (armL.current) armL.current.rotation.x = -Math.sin(phase - 0.18) * armAmp * 0.94 * active * calm;
    if (armR.current) armR.current.rotation.x = swing * armAmp * active * calm;
    if (foreL.current) foreL.current.rotation.x = -0.32 - Math.max(0, swing) * 0.4 * active - s.run * 0.5 - s.attend * 0.15;
    if (foreR.current) foreR.current.rotation.x = -0.32 - Math.max(0, -swing) * 0.4 * active - s.run * 0.5 - s.attend * 0.15;

    /* Bob and lean. */
    const bob = Math.abs(Math.sin(phase)) * 0.055 * active;
    s.bob += (bob - s.bob) * Math.min(1, 14 * delta);
    s.lean += (pace * 0.12 + s.run * 0.1 + s.attend * 0.05 - s.lean) * Math.min(1, 6 * delta);
    if (torso.current) {
      const breath = 1 + Math.sin(t * 1.6) * 0.012 * still;
      torso.current.position.y = 1.04 + s.bob + Math.sin(t * 1.6) * 0.004 * still;
      torso.current.position.x = s.shift * 0.02;
      torso.current.rotation.x = s.lean;
      torso.current.rotation.z = Math.sin(phase / 2) * 0.03 * active + Math.sin(t * 0.7) * 0.006 * still - s.shift * 0.025;
      torso.current.rotation.y = Math.sin(t * 0.5) * 0.01 * still + Math.sin(phase) * 0.05 * active * (1 - air);
      torso.current.scale.set(1, breath, 1);
    }
    if (chest.current) chest.current.rotation.x = Math.sin(t * 1.6) * 0.01 * still;

    /* The head looks at whatever is in focus, within the limits of a neck;
       otherwise it drifts, with the small corrections of a machine. */
    let wantYaw = Math.sin(t * 0.6) * 0.08 * still + Math.sin(t * 3.1) * 0.006 * still;
    let wantPitch = Math.sin(t * 0.45) * 0.04 * still;
    if (body.lookAt) {
      look.set(body.lookAt[0] - body.x, body.lookAt[1] - (body.floor + 1.95), body.lookAt[2] - body.z);
      const flat = Math.hypot(look.x, look.z);
      let yaw = Math.atan2(-look.x, -look.z) - body.facing;
      yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
      wantYaw = THREE.MathUtils.clamp(-yaw, -1.1, 1.1);
      wantPitch = THREE.MathUtils.clamp(Math.atan2(look.y, flat), -0.5, 0.4);
    }
    const headEase = 5 + s.run * 5;
    s.headYaw += (wantYaw - s.headYaw) * Math.min(1, headEase * delta);
    s.headPitch += (wantPitch - s.headPitch) * Math.min(1, headEase * delta);
    if (head.current) {
      head.current.rotation.y = s.headYaw;
      head.current.rotation.x = -s.headPitch - s.lean * 0.6;
    }

    /* The eyes: steady, a slow pulse, brighter when attending or on a
       landing; the core breathes with them and flares for a teleport. */
    const excite = s.attend * 0.15 + body.glow * 0.4 + Math.max(0, body.landing - 0.6) * 0.8 + pace * 0.15;
    if (eyes.current) {
      const m = (eyes.current as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.78 + Math.sin(t * 2.2) * 0.08 + excite * 0.4;
      eyes.current.scale.y = 1 - Math.max(0, Math.sin(t * 0.9) - 0.985) * 40;
    }
    if (core.current) (core.current.material as THREE.MeshBasicMaterial).opacity = 0.62 + Math.sin(t * 1.7) * 0.16 + excite;
    if (coreHalo.current) (coreHalo.current.material as THREE.MeshBasicMaterial).opacity = 0.16 + Math.sin(t * 1.7 + 0.6) * 0.06 + excite * 0.5;
    if (shoulders.current) shoulders.current.rotation.y = -Math.sin(phase) * 0.12 * active;

    /* Teleport: a luminous shell over the body, a column of light and a
       ring on the deck, all driven by the glow the walking loop writes. */
    if (shell.current) {
      const m = shell.current.material as THREE.MeshBasicMaterial;
      m.opacity = body.glow * 0.55;
      shell.current.visible = body.glow > 0.01 && !body.hidden;
    }
    if (column.current) {
      const m = column.current.material as THREE.MeshBasicMaterial;
      m.opacity = body.glow * 0.35;
      column.current.visible = body.glow > 0.01;
      column.current.scale.set(1 + (1 - body.glow) * 0.6, 1, 1 + (1 - body.glow) * 0.6);
    }
    /* Landing: an impact ring spreading and fading, a puff of mist. */
    if (ring.current && mist.current) {
      if (body.landing > 0.95 && lastLanding.current <= 0) lastLanding.current = 1;
      if (lastLanding.current > 0) {
        lastLanding.current = Math.max(0, lastLanding.current - delta * 1.8);
        const k = 1 - lastLanding.current;
        ring.current.visible = true;
        mist.current.visible = true;
        ring.current.scale.setScalar(0.6 + k * 2.2);
        (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.55;
        mist.current.scale.setScalar(0.8 + k * 1.6);
        mist.current.position.y = 0.1 + k * 0.5;
        (mist.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.22;
      } else {
        ring.current.visible = false;
        mist.current.visible = false;
      }
    }

    /* Foot impact: each time a foot lands the light on the deck flares and
       settles. The shadow disc fades as the body leaves the deck. */
    if (disc.current) {
      const stepPhase = Math.floor(body.walked * STRIDE * 2);
      if (stepPhase !== lastStep.current) {
        lastStep.current = stepPhase;
        disc.current.scale.setScalar(1.35 + s.run * 0.3);
      }
      disc.current.scale.lerp(ONE, Math.min(1, 6 * delta));
      (disc.current.material as THREE.MeshBasicMaterial).opacity = (0.08 + (disc.current.scale.x - 1) * 0.5) * (1 - air * 0.5);
    }
  });

  return (
    <group ref={root} name="robot">
      {/* The teleport column and the landing marks stand on the deck; the
          figure itself rides on `figure`, which lifts with the jump. */}
      <mesh ref={column} position={[0, 2.2, 0]} visible={false}>
        <cylinderGeometry args={[0.7, 0.9, 4.4, 16, 1, true]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.55, 0.68, 40]} />
        <meshBasicMaterial color="#dff4ff" transparent opacity={0} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={mist} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <circleGeometry args={[0.9, 24]} />
        <meshBasicMaterial color="#9ad6ff" transparent opacity={0} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <group ref={figure}>
        <mesh ref={shell} position={[0, 1.08, 0]} visible={false}>
          <capsuleGeometry args={[0.46, 1.3, 6, 14]} />
          <meshBasicMaterial color="#bfefff" transparent opacity={0} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Legs. Hips at 1.04m; thigh 0.5, shin 0.48, foot. */}
        {[-1, 1].map((side) => (
          <group key={side} ref={side < 0 ? legL : legR} position={[side * 0.18, 1.04, 0]}>
            <Thigh side={side} />
            <group ref={side < 0 ? shinL : shinR} position={[0, -0.5, 0]}>
              <Shin side={side} />
              <group ref={side < 0 ? footL : footR} position={[0, -0.48, 0]}>
                <Foot />
              </group>
            </group>
          </group>
        ))}

        {/* Torso, arms and head all ride on the pelvis group so they bob and
            lean together. */}
        <group ref={torso} position={[0, 1.04, 0]}>
          <Waist />
          <group ref={chest} position={[0, 0.6, 0]}>
            <Chest />
            <mesh ref={coreHalo} geometry={haloGeometry}>
              <meshBasicMaterial color={BLUE} transparent opacity={0.16} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
            <mesh ref={core} geometry={coreGeometry}>
              <meshBasicMaterial color={CYAN} transparent opacity={0.7} toneMapped={false} />
            </mesh>
          </group>

          <group ref={shoulders}>
            {[-1, 1].map((side) => (
              <group key={side} position={[side * 0.4, 0.8, 0]}>
                <Pauldron side={side} />
                <group ref={side < 0 ? armL : armR}>
                  <UpperArm side={side} />
                  <group ref={side < 0 ? foreL : foreR} position={[0, -0.38, 0]}>
                    <Forearm side={side} />
                    <group position={[0, -0.36, 0]}>
                      <Hand side={side} />
                    </group>
                  </group>
                </group>
              </group>
            ))}
          </group>

          {/* Neck: a graphite column with its articulation showing, inside a
              layered collar. */}
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.055, 0.07, 0.12, 12]} />
            <meshStandardMaterial {...GRAPHITE} />
          </mesh>
          <Piece
            parts={() => [
              { geometry: new THREE.TorusGeometry(0.062, 0.01, 6, 20), at: V3(0, 0.93, 0), turn: V3(Math.PI / 2, 0, 0) },
              { geometry: new THREE.TorusGeometry(0.1, 0.022, 8, 24), at: V3(0, 0.86, 0), turn: V3(Math.PI / 2, 0, 0) },
            ]}
            material={SILVER}
          />
          <mesh position={[0, 0.845, 0.02]} rotation={[Math.PI / 2 + 0.15, 0, 0]}>
            <torusGeometry args={[0.125, 0.018, 8, 24, Math.PI * 1.5]} />
            <meshStandardMaterial {...ARMOUR} />
          </mesh>
          <group ref={head} position={[0, 1.0, 0]}>
            <Head />
          </group>
        </group>
      </group>

      {/* The light the body throws on the deck. */}
      <mesh ref={disc} position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 24]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.1} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
