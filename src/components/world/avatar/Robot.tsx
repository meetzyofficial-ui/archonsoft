"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { guideStore } from "@/components/world/npc/Guides";
import { fireStore, Flames, type Emitter } from "@/components/world/pieces/Fire";
import { Glow } from "@/components/world/pieces/Kit";
import { qualityStore } from "@/components/world/systems/quality";
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

/*
 * The palette, and what each surface does with light — which matters more
 * than the colours. Ceramic is bright, barely metallic, with a clear coat
 * that catches one sharp highlight; polished silver is a mirror with a
 * little grain; gunmetal is dark metal, rougher, the understructure the
 * plates sit on; graphite is matte, for joints and recesses; the visor is
 * black glass. Reading the figure from across a plaza: white and silver
 * armour over a dark frame, cyan where it is alive.
 */
/*
 * Matte black, and fire.
 *
 * The machine is black through and through — black ceramic armour with the
 * faintest sheen, dark titanium where the plates meet, black gunmetal for
 * the frame, matte graphite in the joints, black glass over the eyes — so
 * that the only colour on it is what burns: flame off the shoulders, the
 * back, the wrists and the crown, a core of the same fire in the chest, and
 * the orange the fire throws onto the black around it. The surfaces are
 * rough enough not to mirror the world and smooth enough to catch the fire
 * as a warm rim; none of them is glossy plastic.
 */
const GUNMETAL = { color: "#12151b", roughness: 0.56, metalness: 0.9, envMapIntensity: 0.8 } as const;
const TITANIUM = { color: "#222831", roughness: 0.5, metalness: 0.88, envMapIntensity: 0.8 } as const;
/* Dark titanium trims: the one surface allowed a controlled metallic light. */
const SILVER = { color: "#2c333d", roughness: 0.38, metalness: 0.92, envMapIntensity: 1.1 } as const;
/* Black ceramic: the armour. Barely metallic, a thin clear coat for one soft highlight. */
const ARMOUR = { color: "#0e1115", roughness: 0.6, metalness: 0.06, envMapIntensity: 0.7, clearcoat: 0.3, clearcoatRoughness: 0.45 } as const;
const DARK_TI = { color: "#181d25", roughness: 0.52, metalness: 0.86, envMapIntensity: 0.8 } as const;
const GRAPHITE = { color: "#0a0d11", roughness: 0.82, metalness: 0.4 } as const;
/* Polished silver, in small measure: the collar, the wrist rings, the fasteners. */
const SILVER_TRIM = { color: "#9aa4b1", roughness: 0.26, metalness: 0.96, envMapIntensity: 1.5 } as const;
const CAVITY = { color: "#04060a", roughness: 0.9, metalness: 0.3 } as const;
const VISOR = { color: "#030710", roughness: 0.05, metalness: 0.94, envMapIntensity: 1.8, clearcoat: 1, clearcoatRoughness: 0.06 } as const;
const CYAN = "#5ee6ff";
const BLUE = "#2f9dff";
const AMBER = "#ffb347";
/* The fire's own colours, for the lights let into the armour. */
const EMBER = "#ff7a2a";
const FLAME = "#ffb066";
const VIOLET = EMBER;
const MAGENTA = "#ff9a4a";
const ONE = new THREE.Vector3(1, 1, 1);

const V3 = (x: number, y: number, z: number): [number, number, number] => [x, y, z];

/** Where fire comes from: an empty the flame cloud reads every frame. */
function Vent({ at, strength, span = 1, trail = false }: { at: [number, number, number]; strength: number; span?: number; trail?: boolean }) {
  return <object3D name="vent" position={at} userData={{ strength, span, trail }} />;
}

/** One merged piece with one material: the way most of the body is drawn. */
function Piece({ parts, material }: { parts: () => Part[]; material: Record<string, unknown> }) {
  const geometry = useMerged(parts, []);
  return (
    <mesh geometry={geometry}>
      {"clearcoat" in material ? <meshPhysicalMaterial {...(material as object)} /> : <meshStandardMaterial {...(material as object)} />}
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
  ];
  const dark = () => [
    /* The visor recess, and the jaw: a graphite lower face with a chin guard,
       and the underside of the brow, dark, so the white wedge reads as a
       plate with thickness. */
    { geometry: new THREE.SphereGeometry(0.118, 16, 12), at: V3(0, 0.1, 0.075), scale: V3(1.06, 0.72, 0.62) },
    { geometry: new THREE.BoxGeometry(0.15, 0.07, 0.13), at: V3(0, 0.005, 0.05), turn: V3(0.1, 0, 0) },
    { geometry: new THREE.BoxGeometry(0.11, 0.04, 0.05), at: V3(0, -0.02, 0.11) },
    { geometry: new THREE.BoxGeometry(0.21, 0.012, 0.07), at: V3(0, 0.162, 0.1), turn: V3(0.35, 0, 0) },
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
  const cores = useMerged(
    () => [
      { geometry: new THREE.PlaneGeometry(0.016, 0.005), at: V3(-0.036, 0.112, 0.1545), turn: V3(0, -0.25, 0.08) },
      { geometry: new THREE.PlaneGeometry(0.016, 0.005), at: V3(0.036, 0.112, 0.1545), turn: V3(0, 0.25, -0.08) },
    ],
    [],
  );
  const slits = useMerged(
    () => [-0.03, 0, 0.03].map((x) => ({ geometry: new THREE.PlaneGeometry(0.008, 0.028), at: V3(x, 0.0, 0.117) })),
    [],
  );
  const temples = () => [
    { geometry: new THREE.SphereGeometry(0.075, 12, 10), at: V3(-0.108, 0.09, 0.02), turn: V3(0, -0.3, 0.15), scale: V3(0.5, 1, 1.1) },
    { geometry: new THREE.SphereGeometry(0.075, 12, 10), at: V3(0.108, 0.09, 0.02), turn: V3(0, 0.3, -0.15), scale: V3(0.5, 1, 1.1) },
  ];
  return (
    <>
      <Piece parts={shell} material={ARMOUR} />
      <Piece parts={temples} material={SILVER} />
      <Piece parts={dark} material={GRAPHITE} />
      <Piece parts={trims} material={GUNMETAL} />
      {/* The visor glass, and the depth behind it. */}
      <mesh position={[0, 0.1, 0.084]} scale={[1, 0.6, 0.6]}>
        <sphereGeometry args={[0.115, 16, 12]} />
        <meshPhysicalMaterial {...VISOR} />
      </mesh>
      <mesh position={[0, 0.1, 0.07]} scale={[0.9, 0.5, 0.55]}>
        <sphereGeometry args={[0.11, 12, 10]} />
        <meshStandardMaterial {...CAVITY} />
      </mesh>
      {/* The eyes: two bars of cyan behind the glass, a blue wash on the
          glass around them, and a white-hot core in each — three depths,
          which is what makes them eyes and not stickers. */}
      <mesh position={[0, 0.112, 0.15]}>
        <planeGeometry args={[0.17, 0.055]} />
        <meshBasicMaterial color={BLUE} transparent opacity={0.3} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh geometry={eyes} name="eyes">
        <meshBasicMaterial color={CYAN} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <mesh geometry={cores}>
        <meshBasicMaterial color="#eafcff" toneMapped={false} />
      </mesh>
      <Vent at={[0, 0.26, -0.06]} strength={0.55} span={0.7} />
      <Vent at={[-0.13, 0.16, -0.05]} strength={0.3} span={0.5} />
      <Vent at={[0.13, 0.16, -0.05]} strength={0.3} span={0.5} />
      {/* A small amber sensor on the right temple. */}
      <mesh position={[0.163, 0.155, -0.005]} rotation={[0.2, Math.PI / 2, 0.1]}>
        <circleGeometry args={[0.008, 8]} />
        <Glow colour={AMBER} opacity={0.85} />
      </mesh>
      {/* Amber tells on the jaw. */}
      <mesh geometry={slits}>
        <meshBasicMaterial color={AMBER} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      {/* Ear-module lights, turning very slowly: a servo at work. */}
      {[-1, 1].map((side) => (
        <mesh key={side} name="ear" position={[side * 0.162, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.028, 0.028, 0.006, 6]} />
          <Glow colour={BLUE} opacity={0.7} />
        </mesh>
      ))}
    </>
  );
}

/* ----------------------------------------------------------------- torso */

function Chest() {
  /* The chest plate: chamfered, wider at the collarbone — ceramic — with
     two pectoral plates of the same laid over it, the seams between them
     dark; silver at the collar and the fasteners. */
  const plate = () => [
    { geometry: new THREE.CylinderGeometry(0.29, 0.235, 0.38, 8), at: V3(0, 0.02, 0.05), turn: V3(0.08, Math.PI / 8, 0), scale: V3(1, 1, 0.58) },
  ];
  const armour = () => [
    { geometry: new THREE.BoxGeometry(0.2, 0.18, 0.04), at: V3(-0.13, 0.06, 0.175), turn: V3(0.1, -0.15, 0) },
    { geometry: new THREE.BoxGeometry(0.2, 0.18, 0.04), at: V3(0.13, 0.06, 0.175), turn: V3(0.1, 0.15, 0) },
  ];
  const metal = () => [
    /* The ribcage. */
    { geometry: new THREE.CapsuleGeometry(0.17, 0.28, 6, 14), at: V3(0, 0, 0), turn: V3(0, 0, Math.PI / 2) },
  ];
  /* The back: the visitor sees the machine from behind most of the time,
     so the back is armour too — a ceramic back plate, two silver scapulae
     — with the spine a dark line between them. */
  const back = () => [
    { geometry: new THREE.BoxGeometry(0.42, 0.34, 0.1), at: V3(0, -0.02, -0.1) },
    { geometry: new THREE.BoxGeometry(0.36, 0.1, 0.06), at: V3(0, 0.17, -0.13), turn: V3(-0.2, 0, 0) },
  ];
  const scapulae = () => [
    { geometry: new THREE.BoxGeometry(0.13, 0.2, 0.03), at: V3(-0.12, 0.05, -0.16), turn: V3(0, -0.1, 0.1) },
    { geometry: new THREE.BoxGeometry(0.13, 0.2, 0.03), at: V3(0.12, 0.05, -0.16), turn: V3(0, 0.1, -0.1) },
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
    { geometry: new THREE.BoxGeometry(0.1, 0.5, 0.06), at: V3(0, -0.1, -0.165) },
    { geometry: new THREE.CylinderGeometry(0.2, 0.235, 0.05, 8), at: V3(0, -0.14, 0.05), turn: V3(0, Math.PI / 8, 0), scale: V3(1, 1, 0.58) },
    { geometry: new THREE.BoxGeometry(0.14, 0.12, 0.02), at: V3(-0.005, -0.078, 0.196) },
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
      <Piece parts={back} material={ARMOUR} />
      <Piece parts={scapulae} material={SILVER} />
      <Piece parts={plate} material={ARMOUR} />
      <Piece parts={armour} material={ARMOUR} />
      <Piece parts={silver} material={SILVER_TRIM} />
      <Piece parts={dark} material={GRAPHITE} />
      <Piece parts={seams} material={CAVITY} />
      {/* A cyan hairline along the belt: the machine's own energy, cool against the fire. */}
      <mesh position={[0, -0.14, 0.168]}>
        <planeGeometry args={[0.3, 0.006]} />
        <Glow colour={CYAN} opacity={0.6} />
      </mesh>
      {/* Fire off the back: two vents under the scapulae, one at the spine. */}
      <Vent at={[-0.15, 0.12, -0.2]} strength={0.9} span={1.1} />
      <Vent at={[0.15, 0.12, -0.2]} strength={0.9} span={1.1} />
      <Vent at={[0, -0.08, -0.21]} strength={0.6} span={0.9} />
      {/* The mark, small, on the left pectoral: three bars, each shorter. */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.2 + (0.05 - i * 0.013) / 2, 0.135 - i * 0.02, 0.2]} rotation={[0.1, -0.15, 0]}>
          <planeGeometry args={[0.05 - i * 0.013, 0.011]} />
          <Glow colour={MAGENTA} opacity={0.7} />
        </mesh>
      ))}
      {/* Amber micro-indicators under the right pectoral. */}
      {[0, 1].map((i) => (
        <mesh key={i} position={[0.16 + i * 0.03, -0.045, 0.198]} rotation={[0.1, 0.15, 0]}>
          <planeGeometry args={[0.014, 0.006]} />
          <Glow colour={AMBER} opacity={0.75} />
        </mesh>
      ))}
      {/* The mark on the back, violet, quiet. */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.06 + (0.12 - i * 0.03) / 2, 0.1 - i * 0.045, -0.2]} rotation={[0, Math.PI, 0]}>
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
    { geometry: new THREE.BoxGeometry(0.3, 0.15, 0.05), at: V3(0, 0.06, -0.115), turn: V3(-0.15, 0, 0) },
  ];
  const hips = () => [
    { geometry: new THREE.BoxGeometry(0.06, 0.18, 0.22), at: V3(-0.2, 0.08, 0), turn: V3(0, 0, 0.15) },
    { geometry: new THREE.BoxGeometry(0.06, 0.18, 0.22), at: V3(0.2, 0.08, 0), turn: V3(0, 0, -0.15) },
  ];
  const bands = () => [0, 1, 2].map((i) => ({ geometry: new THREE.BoxGeometry(0.22, 0.06, 0.12), at: V3(0, 0.2 + i * 0.09, 0.08), scale: V3(1, 1, 0.6) }));
  return (
    <>
      <Piece parts={metal} material={GUNMETAL} />
      <Piece parts={armour} material={ARMOUR} />
      <Piece parts={hips} material={SILVER} />
      <Piece parts={bands} material={SILVER} />
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
        <meshPhysicalMaterial {...ARMOUR} />
      </mesh>
      <Vent at={[0, -0.06, 0.03]} strength={0.5} span={0.6} />
      {/* The palm core. */}
      <mesh position={[0, -0.045, 0.027]}>
        <circleGeometry args={[0.014, 10]} />
        <Glow colour={FLAME} opacity={0.7} />
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
  const plate = () => [{ geometry: new THREE.BoxGeometry(0.06, 0.2, 0.14), at: V3(side * 0.07, -0.2, 0), turn: V3(0, 0, side * -0.06) }];
  return (
    <>
      <Piece parts={metal} material={GUNMETAL} />
      <Piece parts={sleeve} material={SILVER} />
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
    /* The elbow piston, behind the joint. */
    { geometry: new THREE.CylinderGeometry(0.014, 0.014, 0.16, 8), at: V3(0, -0.1, -0.07), turn: V3(0.3, 0, 0) },
  ];
  const rail = () => [{ geometry: new THREE.BoxGeometry(0.02, 0.22, 0.03), at: V3(0, -0.16, 0.075) }];
  return (
    <>
      <Piece parts={metal} material={GUNMETAL} />
      <Piece parts={armour} material={ARMOUR} />
      <Piece parts={rail} material={SILVER} />
      <Piece parts={silver} material={SILVER_TRIM} />
      <Vent at={[0, -0.2, -0.08]} strength={0.45} span={0.7} />
      {/* Wrist accent: cyan. */}
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
  const armour = () => [
    { geometry: new THREE.BoxGeometry(0.17, 0.36, 0.09), at: V3(0, -0.22, 0.075), turn: V3(0.08, 0, 0) },
    { geometry: new THREE.BoxGeometry(0.15, 0.3, 0.05), at: V3(0, -0.24, -0.07), turn: V3(-0.06, 0, 0) },
  ];
  const side_ = () => [{ geometry: new THREE.BoxGeometry(0.05, 0.3, 0.16), at: V3(side * 0.1, -0.24, 0), turn: V3(0, 0, side * 0.1) }];
  /* A piston down the back of the thigh. */
  const piston = () => [
    { geometry: new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), at: V3(0, -0.24, -0.11) },
    { geometry: new THREE.CylinderGeometry(0.032, 0.032, 0.08, 8), at: V3(0, -0.1, -0.11) },
  ];
  return (
    <>
      <Piece parts={metal} material={DARK_TI} />
      <Piece parts={armour} material={ARMOUR} />
      <Piece parts={side_} material={SILVER} />
      <Piece parts={piston} material={SILVER} />
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
  ];
  const metal = () => [
    /* The knee piston, its housing, and the calf behind. */
    { geometry: new THREE.CylinderGeometry(0.022, 0.022, 0.2, 8), at: V3(0, -0.08, -0.085), turn: V3(0.35, 0, 0) },
    { geometry: new THREE.CylinderGeometry(0.03, 0.03, 0.006, 12), at: V3(side * 0.092, 0, 0), turn: V3(0, 0, Math.PI / 2) },
  ];
  const calf = () => [{ geometry: new THREE.SphereGeometry(0.07, 10, 10), at: V3(0, -0.2, -0.06), scale: V3(1, 1.6, 0.9) }];
  const shinPlate = () => [{ geometry: new THREE.BoxGeometry(0.15, 0.36, 0.09), at: V3(0, -0.25, 0.06), turn: V3(-0.06, 0, 0) }];
  return (
    <>
      <Piece parts={dark} material={DARK_TI} />
      <Piece parts={armour} material={SILVER} />
      <Piece parts={shinPlate} material={ARMOUR} />
      <Piece parts={calf} material={SILVER} />
      <Piece parts={metal} material={TITANIUM} />
      <Vent at={[0, -0.02, -0.08]} strength={0.35} span={0.6} />
      {/* The shin light, and an amber tell at the knee. */}
      <mesh position={[0, -0.25, 0.106]}>
        <planeGeometry args={[0.024, 0.3]} />
        <Glow colour={EMBER} opacity={0.75} />
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
      <Vent at={[0, -0.09, -0.12]} strength={0.4} span={0.8} trail />
      {/* A cyan line under the sole, and the thruster flare that opens in
          the air. */}
      <mesh position={[0, -0.112, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.14, 0.3]} />
        <Glow colour={EMBER} opacity={0.35} />
      </mesh>
      <mesh name="flare" position={[0, -0.13, 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1]}>
        <circleGeometry args={[0.14, 16]} />
        <meshBasicMaterial color={EMBER} transparent opacity={0} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function Pauldron({ side }: { side: number }) {
  const armour = () => [
    { geometry: new THREE.SphereGeometry(0.158, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.46), at: V3(side * 0.05, 0.07, 0), turn: V3(0, 0, side * -0.6), scale: V3(1, 0.72, 1) },
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
      <Piece parts={lower} material={GUNMETAL} />
      <Vent at={[side * 0.07, 0.14, -0.02]} strength={1} span={1.2} />
      {/* The shoulder strip: a short bar of cyan on the plate, and an amber
          module on the left shoulder only. */}
      <mesh position={[side * 0.12, 0.0, 0.02]} rotation={[0, 0, side * -0.4]}>
        <boxGeometry args={[0.08, 0.012, 0.1]} />
        <Glow colour={EMBER} opacity={0.6} />
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
  const flares = useRef<THREE.Object3D[] | null>(null);
  const ears = useRef<THREE.Object3D[] | null>(null);
  const vents = useRef<THREE.Object3D[] | null>(null);
  const previous = useRef(new THREE.Vector3(body.x, 0, body.z));
  const worldVelocity = useRef(new THREE.Vector3());
  const ventAt = useRef(new THREE.Vector3());
  const inverse = useRef(new THREE.Quaternion());
  const heat = useRef(1);

  /* The fire reads the vents in the root's frame: where each is right now,
     how hard it burns, and how fast the body is moving so the flames trail. */
  const readFire = (out: Emitter[], state: { heat: number; velocity: THREE.Vector3 }) => {
    const node = root.current;
    if (!node) return;
    if (!vents.current) {
      const found: THREE.Object3D[] = [];
      node.traverse((part) => {
        if (part.name === "vent") found.push(part);
      });
      vents.current = found;
    }
    const moving = Math.min(1, body.pace * 2.2);
    for (const vent of vents.current) {
      vent.getWorldPosition(ventAt.current);
      node.worldToLocal(ventAt.current);
      const data = vent.userData as { strength: number; span: number; trail: boolean };
      const strength = data.trail ? data.strength * moving : data.strength;
      if (strength <= 0.02) continue;
      out.push({ at: ventAt.current.clone(), strength, span: data.span });
    }
    state.heat = heat.current;
    inverse.current.copy(node.quaternion).invert();
    state.velocity.copy(worldVelocity.current).applyQuaternion(inverse.current);
  };

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

    /* Where the feet are — and how far off the floor; and how fast, for the fire. */
    node.position.set(body.x, body.floor, body.z);
    if (delta > 0) {
      worldVelocity.current.set((body.x - previous.current.x) / delta, 0, (body.z - previous.current.z) / delta);
      if (worldVelocity.current.length() > 12) worldVelocity.current.setLength(12);
    }
    previous.current.set(body.x, 0, body.z);
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
      const fl: THREE.Object3D[] = [];
      const er: THREE.Object3D[] = [];
      node.traverse((part) => {
        if (part.name === "flare") fl.push(part);
        if (part.name === "ear") er.push(part);
      });
      flares.current = fl;
      ears.current = er;
    }
    for (const f of fingerGroups.current) f.rotation.x = s.curl + Math.sin(t * 2.7) * 0.03 * still;
    /* The thruster flares under the boots open in the air. */
    for (const flare of flares.current ?? []) {
      const m = (flare as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = air * (0.35 + Math.sin(t * 30) * 0.1) + body.glow * 0.3;
      flare.scale.setScalar(1 + air * 1.2);
    }
    for (const ear of ears.current ?? []) ear.rotation.x = Math.sin(t * 0.8) * 0.4;
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
    /* Idle the core breathes; walking it beats a little faster and harder;
       a jump flashes it; a teleport floods it. */
    const airborne = body.lift > 0.02 ? 1 : 0;
    const excite = s.attend * 0.15 + body.glow * 0.9 + Math.max(0, body.landing - 0.6) * 0.8 + pace * 0.15 + airborne * 0.5;
    if (eyes.current) {
      const m = (eyes.current as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.78 + Math.sin(t * 2.2) * 0.08 + excite * 0.4;
      eyes.current.scale.y = 1 - Math.max(0, Math.sin(t * 0.9) - 0.985) * 40;
    }
    /* How hard it burns: a low idle flame, more on the move, a burst in the
       air, a blaze through a teleport; and it breathes. */
    /* Idle small; walking more; running plain; a burst at take-off and a
       flare on landing; a blaze through a teleport. */
    const takeoff = airborne * Math.max(0, body.vy) * 0.1;
    const wantHeat = 0.62 + pace * 0.6 + airborne * 0.35 + takeoff + body.glow * 1.8 + Math.max(0, body.landing - 0.55) * 1.1 + Math.sin(t * 1.3) * 0.05;
    heat.current += (wantHeat - heat.current) * Math.min(1, (wantHeat > heat.current ? 14 : 5) * delta);
    fireStore.heat = heat.current;
    fireStore.flicker = Math.sin(t * 17) * 0.5 + Math.sin(t * 29 + 1) * 0.3 + Math.sin(t * 7) * 0.2;
    const beat = Math.sin(t * (1.7 + pace * 2.2));
    if (core.current) (core.current.material as THREE.MeshBasicMaterial).opacity = 0.62 + beat * (0.16 + pace * 0.1) + excite;
    if (coreHalo.current) {
      const halo = coreHalo.current;
      (halo.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(t * 1.7 + 0.6) * 0.07 + excite * 0.6;
      halo.scale.setScalar(1 + excite * 0.35);
    }
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
      (disc.current.material as THREE.MeshBasicMaterial).opacity = (0.09 + (disc.current.scale.x - 1) * 0.5) * (1 - air * 0.5) * (0.7 + heat.current * 0.3 + fireStore.flicker * 0.08);
    }
  });

  return (
    <group ref={root} name="robot">
      {/* The teleport column and the landing marks stand on the deck; the
          figure itself rides on `figure`, which lifts with the jump. */}
      <mesh ref={column} position={[0, 2.2, 0]} visible={false}>
        <cylinderGeometry args={[0.7, 0.9, 4.4, 16, 1, true]} />
        <meshBasicMaterial color={EMBER} transparent opacity={0} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
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
          <meshBasicMaterial color="#ffc08a" transparent opacity={0} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
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
              <meshBasicMaterial color={EMBER} transparent opacity={0.2} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
            <mesh ref={core} geometry={coreGeometry}>
              <meshBasicMaterial color={FLAME} transparent opacity={0.8} toneMapped={false} />
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
            material={SILVER_TRIM}
          />
          <mesh position={[0, 0.845, 0.02]} rotation={[Math.PI / 2 + 0.15, 0, 0]}>
            <torusGeometry args={[0.125, 0.018, 8, 24, Math.PI * 1.5]} />
            <meshPhysicalMaterial {...ARMOUR} />
          </mesh>
          <group ref={head} position={[0, 1.0, 0]}>
            <Head />
          </group>
        </group>
      </group>

      {/* The light the fire throws on the deck. */}
      <mesh ref={disc} position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 24]} />
        <meshBasicMaterial color={EMBER} transparent opacity={0.12} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* The fire itself. */}
      <Flames
        count={qualityStore.tier === "desktop" ? 1500 : qualityStore.tier === "high" ? 1000 : 600}
        read={readFire}
        scale={0.62}
        smokeRatio={qualityStore.tier === "desktop" ? 0.12 : 0}
      />
      {/* No heat distortion: bending the air behind the flames needs the scene
          rendered a second time (transmission), which halved the frame rate
          on a desktop and would be off on every phone. The smoke, the sparks
          and the light on the black armour carry the heat instead. */}
    </group>
  );
}
