"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MATERIAL } from "@/components/world/pieces/Kit";
import { qualityStore } from "@/components/world/systems/quality";

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
 *
 * Every tier is wrapped in a glass curtain wall: one merged mesh for the
 * whole set, its faces UV-scaled so a tiled texture of panes and mullions
 * lands at a storey's pitch, with lit interiors in an emissive map — a
 * ceiling of warm light and the dark line of a desk under it — behind
 * about a third of the panes. From the plaza a building is glass with
 * offices behind it; from the water it is a lit facade, not a box.
 */

let windowMaps: { map: THREE.CanvasTexture; emissive: THREE.CanvasTexture } | null = null;

/** A tile of four by four panes: glass in the colour map, lit rooms in the emissive map. */
function useWindowMaps(light: string) {
  return useMemo(() => {
    if (windowMaps) return windowMaps;
    const size = 512;
    const pane = size / 4;
    const make = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      return canvas;
    };
    const glass = make();
    const lit = make();
    const g = glass.getContext("2d")!;
    const e = lit.getContext("2d")!;
    e.fillStyle = "#000";
    e.fillRect(0, 0, size, size);
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const x = col * pane;
        const y = row * pane;
        /* The glass: a dark blue pane with a diagonal sheen. */
        const grad = g.createLinearGradient(x, y, x + pane, y + pane);
        grad.addColorStop(0, "#152540");
        grad.addColorStop(0.5, "#0a1526");
        grad.addColorStop(1, "#101d34");
        g.fillStyle = grad;
        g.fillRect(x, y, pane, pane);
        /* Spandrel: the floor slab band along the bottom of each storey. */
        g.fillStyle = "#1a2438";
        g.fillRect(x, y + pane * 0.8, pane, pane * 0.2);
        /* Mullions. */
        g.fillStyle = "#3a4a66";
        g.fillRect(x, y, pane, 4);
        g.fillRect(x, y, 4, pane);
        g.fillRect(x + pane / 2 - 1, y, 2, pane * 0.8);
        /* A lit room behind about a third of the panes. */
        if (rand() < 0.36) {
          const warm = rand() < 0.75;
          const eg = e.createLinearGradient(x, y, x, y + pane * 0.8);
          eg.addColorStop(0, warm ? "#ffe2bd" : "#cfe4ff");
          eg.addColorStop(0.25, warm ? "#d9b78f" : "#9fb9d9");
          eg.addColorStop(1, warm ? "#5a4530" : "#2d3a52");
          e.fillStyle = eg;
          e.fillRect(x + 4, y + 4, pane - 8, pane * 0.8 - 4);
          /* The desk line and a monitor's glow. */
          e.fillStyle = "#1a1410";
          e.fillRect(x + 4, y + pane * 0.55, pane - 8, pane * 0.06);
          e.fillStyle = warm ? "#fff6e6" : "#e6f2ff";
          e.fillRect(x + pane * (0.25 + rand() * 0.4), y + pane * 0.4, pane * 0.14, pane * 0.12);
          /* The mullions in front of the light. */
          e.fillStyle = "#000";
          e.fillRect(x + pane / 2 - 1, y, 2, pane * 0.8);
        }
      }
    }
    const map = new THREE.CanvasTexture(glass);
    const emissive = new THREE.CanvasTexture(lit);
    for (const texture of [map, emissive]) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
    }
    void light;
    windowMaps = { map, emissive };
    return windowMaps;
  }, [light]);
}

/** One plane per face of every tier, UVs scaled to the storey pitch, merged. */
function curtainWalls(list: Facade[]): THREE.BufferGeometry | null {
  const parts: THREE.BufferGeometry[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const STOREY = 3.4;
  const PANES = 4;
  for (const f of list) {
    const [x, y0, z] = f.at;
    e.set(0, f.turn ?? 0, 0);
    q.setFromEuler(e);
    let y = y0;
    let [w, d] = f.size;
    for (const h of f.tiers) {
      const faces: [number, number, number, number, number][] = [
        [0, d / 2 + 0.03, 0, w, 0],
        [0, -d / 2 - 0.03, Math.PI, w, 0],
        [w / 2 + 0.03, 0, Math.PI / 2, d, 0],
        [-w / 2 - 0.03, 0, -Math.PI / 2, d, 0],
      ];
      for (const [ox, oz, yaw, len] of faces) {
        const plane = new THREE.PlaneGeometry(len, h);
        const uv = plane.attributes.uv as THREE.BufferAttribute;
        const across = len / (STOREY * PANES);
        const up = h / (STOREY * PANES);
        for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * across, uv.getY(i) * up);
        plane.rotateY(yaw);
        plane.translate(ox, h / 2, oz);
        plane.applyQuaternion(q);
        plane.translate(x, y, z);
        parts.push(plane);
      }
      y += h;
      w *= 0.8;
      d *= 0.82;
    }
  }
  if (!parts.length) return null;
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  return merged;
}
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
  const windows = useWindowMaps(light);
  const curtain = useMemo(() => curtainWalls(list), [list]);
  useEffect(() => () => curtain?.dispose(), [curtain]);

  return (
    <group name="facades">
      {curtain ? (
        <mesh geometry={curtain}>
          <meshStandardMaterial
            map={windows.map}
            emissiveMap={windows.emissive}
            emissive="#ffffff"
            emissiveIntensity={1.15}
            roughness={0.16}
            metalness={0.55}
            envMapIntensity={1.3}
          />
        </mesh>
      ) : null}
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
      {qualityStore.tier === "desktop" ? (
        <instancedMesh ref={lit} args={[undefined, undefined, counts.lights]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={light} toneMapped={false} transparent opacity={0.5} />
        </instancedMesh>
      ) : null}
      <instancedMesh ref={rocks} args={[undefined, undefined, list.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.1, 1, 7, 1]} />
        <meshStandardMaterial color="#1a2032" roughness={0.95} flatShading />
      </instancedMesh>
    </group>
  );
}
