"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Station } from "@/components/world/districts/Districts";
import { Backlight, Doorway, Glow, Island, LightLine, LightWash, Service } from "@/components/world/pieces/Kit";
import { useMerged, type Part } from "@/components/world/pieces/merge";
import { DataSurface, type SurfacePaint } from "@/components/world/pieces/Surface";
import { body } from "@/components/world/systems/body";
import { qualityStore } from "@/components/world/systems/quality";
import { CORRIDOR, getZone } from "@/data/world-map";
import { OYUNDAL_TABLES } from "@/data/world-oyundal";
import type { Locale } from "@/lib/i18n";
import type { PreparedInstallation } from "@/lib/worldPayload";

/**
 * Oyundal's café, off the south end of Labs.
 *
 * The product happens at a café table, so the district is one: round tables
 * with stools, a QR stand on each, and the two dice of the house turning over
 * the station. Indigo and lime are the product's own.
 *
 * Every material takes one merged geometry, and everything but the sign and
 * the deck stops being drawn when the visitor is far away.
 */

const CENTRE: [number, number] = [68, 45];
const DOOR_X = 61;
const STATION_AT: [number, number, number] = [67, 0, 48];
const INDIGO = "#2416c9";
const LIME = "#c8f031";
const METAL = "#b9bbbe";
const DETAIL_AT = { desktop: 80, other: 52 };

export function OyundalCafe({
  texture,
  installation,
  locale,
}: {
  texture: THREE.Texture;
  installation?: PreparedInstallation;
  locale: Locale;
}) {
  const accent = getZone("oyundal").accent;
  const detail = useRef<THREE.Group>(null);
  const dice = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    const far = qualityStore.tier === "desktop" ? DETAIL_AT.desktop : DETAIL_AT.other;
    const shown = Math.hypot(body.x - CENTRE[0], body.z - CENTRE[1]) < far;
    if (detail.current && detail.current.visible !== shown) detail.current.visible = shown;
    if (!shown) return;
    const t = clock.elapsedTime;
    dice.current.forEach((die, i) => {
      if (!die) return;
      die.rotation.set(t * 0.3 + i, t * 0.42 + i * 2, 0.4);
      die.position.y = 10.6 + Math.sin(t * 0.8 + i * 1.7) * 0.25;
    });
  });

  const tops = useMerged(
    () => OYUNDAL_TABLES.map(([x, z]) => ({ geometry: new THREE.CylinderGeometry(0.95, 0.95, 0.07, 28), at: [x, 0.86, z] as [number, number, number] })),
    [],
  );
  const metal = useMerged(
    () =>
      OYUNDAL_TABLES.flatMap(([x, z]): Part[] => [
        { geometry: new THREE.CylinderGeometry(0.07, 0.07, 0.84, 10), at: [x, 0.42, z] },
        { geometry: new THREE.CylinderGeometry(0.5, 0.55, 0.05, 20), at: [x, 0.03, z] },
        ...stools(x, z).map(([sx, sz]): Part => ({ geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), at: [sx, 0.25, sz] })),
      ]),
    [],
  );
  const seats = useMerged(
    () =>
      OYUNDAL_TABLES.flatMap(([x, z]) =>
        stools(x, z).map(([sx, sz]): Part => ({ geometry: new THREE.CylinderGeometry(0.3, 0.27, 0.12, 18), at: [sx, 0.55, sz] })),
      ),
    [],
  );
  const rims = useMerged(
    () =>
      OYUNDAL_TABLES.map(([x, z]) => ({
        geometry: new THREE.RingGeometry(0.88, 0.95, 32),
        at: [x, 0.9, z] as [number, number, number],
        turn: [-Math.PI / 2, 0, 0] as [number, number, number],
      })),
    [],
  );
  const cups = useMerged(
    () =>
      OYUNDAL_TABLES.flatMap(([x, z]): Part[] => [
        { geometry: new THREE.CylinderGeometry(0.1, 0.07, 0.14, 14), at: [x + 0.5, 0.97, z + 0.2] },
        { geometry: new THREE.CylinderGeometry(0.1, 0.07, 0.14, 14), at: [x - 0.46, 0.97, z - 0.28] },
      ]),
    [],
  );
  const pips = useMerged(() => {
    const out: Part[] = [];
    const r = 0.78;
    const put = (a: number, b: number, face: number) => {
      const turns: [number, number, number][] = [
        [0, 0, 0], [0, Math.PI, 0], [0, Math.PI / 2, 0], [0, -Math.PI / 2, 0], [-Math.PI / 2, 0, 0], [Math.PI / 2, 0, 0],
      ];
      const at: [number, number, number][] = [
        [a, b, r], [a, b, -r], [r, a, b], [-r, a, b], [a, r, b], [a, -r, b],
      ];
      out.push({ geometry: new THREE.CircleGeometry(0.14, 16), at: at[face]!, turn: turns[face]! });
    };
    const k = 0.42;
    const SPOTS: [number, number][][] = [
      [[0, 0]],
      [[-k, -k], [k, k], [-k, k], [k, -k], [-k, 0], [k, 0]],
      [[-k, k], [k, -k]],
      [[-k, -k], [k, k], [-k, k], [k, -k], [0, 0]],
      [[-k, -k], [0, 0], [k, k]],
      [[-k, -k], [k, k], [-k, k], [k, -k]],
    ];
    SPOTS.forEach((spots, face) => spots.forEach(([a, b]) => put(a, b, face)));
    return out;
  }, []);

  return (
    <group name="oyundal">
      <Island at={CENTRE} size={[32, 22]} runner={[CORRIDOR, 22]} texture={texture} colour={accent} depth={2.6} deck="#14122b" />
      <LightLine at={[DOOR_X, 0.035, CENTRE[1]]} length={20} axis="z" colour={accent} intensity={0.45} thickness={0.09} />
      <Service at={[CENTRE[0], 6.4, 54.2]} length={28} colour={accent} />
      <Doorway at={[DOOR_X, 0, 34]} width={CORRIDOR} height={6.4} colour={accent} />
      <LightWash at={[CENTRE[0], 0.03, CENTRE[1]]} size={[30, 20]} texture={texture} colour={INDIGO} intensity={0.3} />
      <Signage locale={locale} />

      {installation ? (
        <Station
          installation={installation}
          index={4}
          at={STATION_AT}
          turn={Math.PI}
          texture={texture}
          facing={Math.PI}
          spacing={3}
          photoHeight={3.8}
          height={4.4}
          cull={DETAIL_AT.desktop}
        />
      ) : null}

      <group ref={detail} name="oyundal:detail">
        <mesh geometry={tops}>
          <meshStandardMaterial color={INDIGO} roughness={0.35} metalness={0.2} />
        </mesh>
        <mesh geometry={metal}>
          <meshStandardMaterial color={METAL} roughness={0.35} metalness={0.85} />
        </mesh>
        <mesh geometry={seats}>
          <meshStandardMaterial color="#ff812b" roughness={0.6} />
        </mesh>
        <mesh geometry={rims}>
          <Glow colour={LIME} opacity={0.85} />
        </mesh>
        <mesh geometry={cups}>
          <meshStandardMaterial color="#fff8ef" roughness={0.5} />
        </mesh>
        {OYUNDAL_TABLES.map(([x, z], i) => (
          <group key={i} position={[x, 1.2, z]} rotation={[-0.12, Math.PI, 0]}>
            <DataSurface paint={QR} size={[0.5, 0.6]} resolution={160} />
            <mesh position={[0, 0, -0.03]}>
              <boxGeometry args={[0.54, 0.64, 0.04]} />
              <meshStandardMaterial color="#fff8ef" roughness={0.5} />
            </mesh>
          </group>
        ))}
        {[-2.6, 2.6].map((dx, i) => (
          <group
            key={dx}
            ref={(node) => {
              dice.current[i] = node;
            }}
            position={[STATION_AT[0] + dx, 10.6, STATION_AT[2]]}
          >
            <mesh>
              <boxGeometry args={[1.54, 1.54, 1.54]} />
              <meshStandardMaterial color={i ? "#ff812b" : "#fff8ef"} roughness={0.4} />
            </mesh>
            <mesh geometry={pips}>
              <meshBasicMaterial color={INDIGO} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

const stools = (x: number, z: number): [number, number][] =>
  [0, 1, 2].map((k) => [x + Math.cos(k * 2.094 + 0.5) * 1.45, z + Math.sin(k * 2.094 + 0.5) * 1.45]);

/** A QR-like card. Not a working code: the real ones belong to real branches. */
const QR: SurfacePaint = (ctx, w, h) => {
  ctx.fillStyle = "#fff8ef";
  ctx.fillRect(0, 0, w, h);
  const n = 11;
  const s = (w * 0.8) / n;
  const x0 = w * 0.1;
  ctx.fillStyle = INDIGO;
  for (let i = 0; i < n; i += 1)
    for (let j = 0; j < n; j += 1) {
      const corner = (i < 4 && j < 4) || (i > 6 && j < 4) || (i < 4 && j > 6);
      if (!corner && (i * 7 + j * 13 + i * j * 3) % 5 < 2) ctx.fillRect(x0 + i * s, x0 + j * s, s, s);
    }
  for (const [i, j] of [[0, 0], [8, 0], [0, 8]] as const) {
    ctx.fillRect(x0 + i * s, x0 + j * s, s * 3, s * 3);
    ctx.fillStyle = LIME;
    ctx.fillRect(x0 + (i + 1) * s, x0 + (j + 1) * s, s, s);
    ctx.fillStyle = INDIGO;
  }
};

const SIGN = { at: [DOOR_X, 9.4, 30] as [number, number, number], size: [9.4, 2.6] as [number, number] };

function Signage({ locale }: { locale: Locale }) {
  const paint = useMemo<SurfacePaint>(
    () => (ctx, w, h) => {
      ctx.fillStyle = INDIGO;
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `800 ${Math.round(h * 0.44)}px Archivo, Arial, sans-serif`;
      const a = "oyun";
      const b = "dal";
      const wa = ctx.measureText(a).width;
      const wb = ctx.measureText(b).width;
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff8ef";
      ctx.fillText(a, w / 2 - (wa + wb) / 2, h * 0.54);
      ctx.fillStyle = LIME;
      ctx.fillText(b, w / 2 - (wa + wb) / 2 + wa, h * 0.54);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff8ef";
      ctx.font = `600 ${Math.round(h * 0.15)}px Archivo, Arial, sans-serif`;
      ctx.fillText(locale === "tr" ? "QR'ı okut, masada oyna" : "Scan the QR, play at the table", w / 2, h * 0.82);
    },
    [locale],
  );
  const [w, h] = SIGN.size;
  return (
    <group position={SIGN.at} name="oyundal:sign">
      <mesh>
        <boxGeometry args={[w + 0.2, h + 0.2, 0.34]} />
        <meshStandardMaterial color={METAL} roughness={0.3} metalness={0.9} />
      </mesh>
      {[0, Math.PI].map((turn) => (
        <group key={turn} rotation={[0, turn, 0]}>
          <group position={[0, 0, 0.19]}>
            <Backlight size={SIGN.size} strength={0.6} halo={false} />
            <DataSurface paint={paint} size={SIGN.size} resolution={768} />
          </group>
        </group>
      ))}
    </group>
  );
}
