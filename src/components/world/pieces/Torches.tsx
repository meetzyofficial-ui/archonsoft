"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Flames, type Emitter } from "@/components/world/pieces/Fire";
import { useGlowTexture } from "@/components/world/pieces/Kit";
import { useMerged } from "@/components/world/pieces/merge";
import { worldEvents } from "@/components/world/systems/events";
import { qualityStore } from "@/components/world/systems/quality";
import type { Torch } from "@/data/world-torches";

/**
 * Fire columns.
 *
 * Pale stone, Aegean in its proportions: a stepped base, a fluted shaft
 * that tapers, a square capital, and on it a wide shallow bowl of dark
 * bronze with fire in it. Four to a bridge, and one cloud of flame for the
 * four — the fire piece takes several emitters — so a bridge's torches are
 * a handful of draws: the stone in one, the bronze in one, the flames in
 * two, the pools of light in one.
 */
export function Torches({ list }: { list: Torch[] }) {
  const glow = useGlowTexture();
  const stone = useMerged(
    () =>
      list.flatMap(({ at }) => [
        { geometry: new THREE.BoxGeometry(0.9, 0.16, 0.9), at: [at[0], at[1] + 0.08, at[2]] as [number, number, number] },
        { geometry: new THREE.BoxGeometry(0.72, 0.12, 0.72), at: [at[0], at[1] + 0.22, at[2]] as [number, number, number] },
        { geometry: new THREE.CylinderGeometry(0.2, 0.26, 1.7, 12), at: [at[0], at[1] + 1.13, at[2]] as [number, number, number] },
        { geometry: new THREE.CylinderGeometry(0.26, 0.22, 0.1, 12), at: [at[0], at[1] + 2.03, at[2]] as [number, number, number] },
        { geometry: new THREE.BoxGeometry(0.62, 0.12, 0.62), at: [at[0], at[1] + 2.14, at[2]] as [number, number, number] },
      ]),
    [list],
  );
  /* The flutes: eight thin ribs let into each shaft. */
  const flutes = useMerged(
    () =>
      list.flatMap(({ at }) =>
        Array.from({ length: 8 }, (_, k) => {
          const a = (k / 8) * Math.PI * 2;
          return {
            geometry: new THREE.BoxGeometry(0.035, 1.6, 0.06),
            at: [at[0] + Math.cos(a) * 0.225, at[1] + 1.1, at[2] + Math.sin(a) * 0.225] as [number, number, number],
            turn: [0, -a, 0] as [number, number, number],
          };
        }),
      ),
    [list],
  );
  const bronze = useMerged(
    () =>
      list.flatMap(({ at }) => [
        { geometry: new THREE.CylinderGeometry(0.46, 0.22, 0.3, 16, 1, true), at: [at[0], at[1] + 2.36, at[2]] as [number, number, number] },
        { geometry: new THREE.TorusGeometry(0.46, 0.03, 8, 20), at: [at[0], at[1] + 2.51, at[2]] as [number, number, number], turn: [Math.PI / 2, 0, 0] as [number, number, number] },
        { geometry: new THREE.CylinderGeometry(0.22, 0.22, 0.02, 16), at: [at[0], at[1] + 2.22, at[2]] as [number, number, number] },
      ]),
    [list],
  );
  /* Embers glowing in the bowl, and the pool of light each throws on the deck. */
  const embers = useMerged(
    () => list.map(({ at }) => ({ geometry: new THREE.CircleGeometry(0.4, 16), at: [at[0], at[1] + 2.4, at[2]] as [number, number, number], turn: [-Math.PI / 2, 0, 0] as [number, number, number] })),
    [list],
  );
  const pools = useMerged(
    () => list.map(({ at }) => ({ geometry: new THREE.PlaneGeometry(5, 5), at: [at[0], at[1] + 0.03, at[2]] as [number, number, number], turn: [-Math.PI / 2, 0, 0] as [number, number, number] })),
    [list],
  );
  const emitters = useMemo<Emitter[]>(
    () => list.map(({ at }) => ({ at: new THREE.Vector3(at[0], at[1] + 2.42, at[2]), strength: 1, span: 1.45 })),
    [list],
  );
  const read = (out: Emitter[], state: { heat: number }) => {
    for (const e of emitters) out.push(e);
    state.heat = 0.95;
  };
  /* Where the bridge's fire is, for its distance from the camera. */
  const center = useMemo(() => {
    const c = new THREE.Vector3();
    for (const { at } of list) c.add(new THREE.Vector3(at[0], at[1] + 2.4, at[2]));
    return c.divideScalar(Math.max(1, list.length));
  }, [list]);
  const count = qualityStore.tier === "desktop" ? 130 * list.length : qualityStore.tier === "low" ? 55 * list.length : 90 * list.length;
  useEffect(() => {
    worldEvents.emit("fire:lit", { count: list.length });
  }, [list.length]);

  return (
    <group name="torches">
      <mesh geometry={stone}>
        <meshStandardMaterial color="#d9d3c6" roughness={0.78} metalness={0.02} />
      </mesh>
      {qualityStore.tier === "desktop" ? (
        <mesh geometry={flutes}>
          <meshStandardMaterial color="#b9b2a4" roughness={0.85} />
        </mesh>
      ) : null}
      <mesh geometry={bronze}>
        <meshStandardMaterial color="#4a3a2a" roughness={0.45} metalness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={embers}>
        <meshBasicMaterial color="#ff6a1a" toneMapped={false} transparent opacity={0.85} />
      </mesh>
      <mesh geometry={pools}>
        <meshBasicMaterial map={glow} color="#ff8a3a" transparent opacity={0.3} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <Flames count={count} read={read} scale={0.7} lod={{ center, far: qualityStore.tier === "desktop" ? 140 : 90 }} sparkRatio={qualityStore.tier === "desktop" ? 0.2 : 0} smokeRatio={qualityStore.tier === "desktop" ? 0.1 : 0} />
    </group>
  );
}
