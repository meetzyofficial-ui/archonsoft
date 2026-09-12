"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MATERIAL } from "@/components/world/pieces/Kit";

/**
 * Facades: the buildings of the campus.
 *
 * A plaza with nothing around it but a rail is a platform; a plaza with
 * buildings standing round it is a place. These are building masses set on
 * outcrops just off the islands' rims, over the water, where nothing can
 * walk into them — stepped in two or three tiers, with recessed bands of
 * dark glass for windows, a lit trim along each parapet, a chamfered crown
 * on the taller ones, and a few lit windows at night. Each is authored, not
 * scattered, and the whole set is eight instanced draws.
 *
 * `at` is the foot; `size` the footprint; `tiers` the heights of the stacked
 * masses (each set in from the one below); `turn` the yaw. Colours follow
 * the district: the body is graphite-blue, the glass darker, the trim the
 * district's light.
 */
export type Facade = {
  at: [number, number, number];
  size: [number, number];
  tiers: number[];
  turn?: number;
  /** Light colour of the trims and the lit windows. */
  light?: string;
};

export function Facades({ list }: { list: Facade[] }) {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const glass = useRef<THREE.InstancedMesh>(null);
  const trims = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  const lit = useRef<THREE.InstancedMesh>(null);
  const rocks = useRef<THREE.InstancedMesh>(null);
  const counts = useMemo(() => {
    let tiers = 0;
    let bands = 0;
    let lights = 0;
    for (const f of list) {
      tiers += f.tiers.length;
      for (const h of f.tiers) {
        const rows = Math.max(1, Math.floor(h / 3.4));
        bands += rows;
        lights += rows * 2;
      }
    }
    return { tiers, bands, lights };
  }, [list]);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    let ti = 0;
    let bi = 0;
    let li = 0;
    list.forEach((f, fi) => {
      const [x, y0, z] = f.at;
      const turn = f.turn ?? 0;
      e.set(0, turn, 0);
      q.setFromEuler(e);
      let y = y0;
      let [w, d] = f.size;
      f.tiers.forEach((h, k) => {
        /* The mass. */
        p.set(x, y + h / 2, z);
        sc.set(w, h, d);
        bodies.current?.setMatrixAt(ti, m.compose(p, q, sc));
        /* The parapet trim on top of it. */
        p.set(x, y + h + 0.06, z);
        sc.set(w + 0.12, 0.12, d + 0.12);
        trims.current?.setMatrixAt(ti, m.compose(p, q, sc));
        /* The crown, only on the last tier of a tall building. */
        if (k === f.tiers.length - 1 && y + h - y0 > 14) {
          p.set(x, y + h + 0.9, z);
          sc.set(w * 0.72, 1.6, d * 0.72);
          crowns.current?.setMatrixAt(fi, m.compose(p, q, sc));
        } else if (k === f.tiers.length - 1) {
          crowns.current?.setMatrixAt(fi, zero);
        }
        /* Window bands: a recessed strip of dark glass every storey, on the
           face toward the plaza (the tier's +z face after the turn), and two
           lit windows per band, offset so no two buildings match. */
        const rows = Math.max(1, Math.floor(h / 3.4));
        for (let r = 0; r < rows; r += 1) {
          const by = y + 1.6 + r * 3.4;
          p.set(x, by, z).add(new THREE.Vector3(0, 0, d / 2 + 0.02).applyQuaternion(q));
          sc.set(w - 0.8, 1.3, 0.16);
          glass.current?.setMatrixAt(bi, m.compose(p, q, sc));
          bi += 1;
          for (let s = 0; s < 2; s += 1) {
            const seed = Math.sin(fi * 12.9 + k * 3.1 + r * 7.7 + s * 5.3);
            if (seed > 0.15) {
              const ox = (seed * 0.5 + (s - 0.5) * 0.5) * (w - 1.6);
              p.set(x, by, z).add(new THREE.Vector3(ox, 0, d / 2 + 0.12).applyQuaternion(q));
              sc.set(0.9 + Math.abs(seed) * 0.8, 0.8, 0.04);
              lit.current?.setMatrixAt(li, m.compose(p, q, sc));
            } else {
              lit.current?.setMatrixAt(li, zero);
            }
            li += 1;
          }
        }
        y += h;
        w *= 0.8;
        d *= 0.82;
        ti += 1;
      });
      /* The outcrop it stands on. */
      p.set(x, y0 - 3.4, z);
      sc.set(Math.max(f.size[0], f.size[1]) * 0.75, 7, Math.max(f.size[0], f.size[1]) * 0.7);
      e.set(0, turn + 0.4, 0);
      q.setFromEuler(e);
      rocks.current?.setMatrixAt(fi, m.compose(p, q, sc));
    });
    for (const ref of [bodies, glass, trims, crowns, lit, rocks]) {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    }
  }, [list]);

  const light = list[0]?.light ?? MATERIAL.warmWhite;

  return (
    <group name="facades">
      <instancedMesh ref={bodies} args={[undefined, undefined, counts.tiers]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1c2a48" roughness={0.6} metalness={0.3} />
      </instancedMesh>
      <instancedMesh ref={glass} args={[undefined, undefined, counts.bands]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial color="#06101f" roughness={0.12} metalness={0.6} envMapIntensity={1.2} />
      </instancedMesh>
      <instancedMesh ref={trims} args={[undefined, undefined, counts.tiers]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={light} toneMapped={false} transparent opacity={0.7} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, list.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.4, 0.5, 1, 6]} />
        <meshStandardMaterial color="#c9d2de" roughness={0.45} metalness={0.5} flatShading />
      </instancedMesh>
      <instancedMesh ref={lit} args={[undefined, undefined, counts.lights]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={light} toneMapped={false} transparent opacity={0.5} />
      </instancedMesh>
      <instancedMesh ref={rocks} args={[undefined, undefined, list.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.1, 1, 7, 1]} />
        <meshStandardMaterial color="#1a2032" roughness={0.95} flatShading />
      </instancedMesh>
    </group>
  );
}
