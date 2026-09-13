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

/** Panes to a tile, each way: eight across and eight storeys. */
const TILE_PANES = 8;

/**
 * A tile of eight by eight panes: glass in the colour map, lit rooms in the
 * emissive map.
 *
 * The glass is a deep blue-grey tint that lifts toward the top of each pane,
 * where it catches the sky, with a slab edge between storeys and slim
 * mullions whose edge catches a line of light. Behind it the building is
 * lit by floor, the way offices are at night: some floors lit along most of
 * their length, some dark, a few single rooms — warm rooms and cool ones,
 * bright and dim, each with a ceiling strip, a back wall, a desk, a monitor
 * and now and then a plant or a partition. The faces of the campus sample
 * this tile at different offsets, so no two faces show the same rooms.
 */
function useWindowMaps(light: string) {
  return useMemo(() => {
    if (windowMaps) return windowMaps;
    const size = qualityStore.tier === "desktop" ? 1024 : 768;
    const pane = size / TILE_PANES;
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
    const slab = pane * 0.16;
    const mullion = Math.max(2, pane * 0.035);
    for (let row = 0; row < TILE_PANES; row += 1) {
      /* A floor: mostly lit, mostly dark, or a few rooms. */
      const floor = rand();
      const floorLit = floor < 0.32 ? 0.82 : floor < 0.62 ? 0.08 : 0.3;
      const floorWarm = rand() < 0.7;
      const floorLevel = 0.55 + rand() * 0.45;
      for (let col = 0; col < TILE_PANES; col += 1) {
        const x = col * pane;
        const y = row * pane;
        const glassH = pane - slab;
        /* The glass: tinted, a touch lighter where it reflects the sky. */
        const grad = g.createLinearGradient(x, y, x, y + glassH);
        grad.addColorStop(0, "#22324a");
        grad.addColorStop(0.35, "#121e31");
        grad.addColorStop(1, "#0b1422");
        g.fillStyle = grad;
        g.fillRect(x, y, pane, glassH);
        /* Faint variation pane to pane: glass is never one flat sheet. */
        g.fillStyle = `rgba(160,190,230,${(rand() * 0.035).toFixed(3)})`;
        g.fillRect(x, y, pane, glassH);
        /* The slab between storeys, and its lit edge. */
        g.fillStyle = "#171e2a";
        g.fillRect(x, y + glassH, pane, slab);
        g.fillStyle = "rgba(210,225,245,0.28)";
        g.fillRect(x, y + glassH, pane, Math.max(1, slab * 0.08));
        /* Mullions, with a hairline of light on one edge. */
        g.fillStyle = "#2c3747";
        g.fillRect(x, y, mullion, glassH);
        g.fillStyle = "rgba(220,232,250,0.35)";
        g.fillRect(x + mullion, y, 1, glassH);

        if (rand() > floorLit) continue;
        const warm = rand() < 0.15 ? !floorWarm : floorWarm;
        const level = floorLevel * (0.75 + rand() * 0.25);
        const inner = { x: x + mullion + 1, y: y + 1, w: pane - mullion - 2, h: glassH - 2 };
        /* The room: a ceiling strip of light, a back wall falling off to the floor. */
        const wall = e.createLinearGradient(inner.x, inner.y, inner.x, inner.y + inner.h);
        const top = warm ? [255, 226, 190] : [206, 226, 255];
        const mid = warm ? [196, 164, 124] : [140, 164, 196];
        const low = warm ? [62, 48, 34] : [36, 46, 62];
        const rgb = (c: number[], k: number) => `rgb(${Math.round(c[0]! * k)},${Math.round(c[1]! * k)},${Math.round(c[2]! * k)})`;
        wall.addColorStop(0, rgb(top, level));
        wall.addColorStop(0.18, rgb(mid, level));
        wall.addColorStop(1, rgb(low, level));
        e.fillStyle = wall;
        e.fillRect(inner.x, inner.y, inner.w, inner.h);
        e.fillStyle = rgb(warm ? [255, 244, 225] : [235, 244, 255], Math.min(1, level * 1.1));
        e.fillRect(inner.x + inner.w * 0.1, inner.y + inner.h * 0.05, inner.w * 0.8, Math.max(1, inner.h * 0.03));
        /* A desk, a monitor on it, sometimes a plant or a partition. */
        e.fillStyle = "#16110d";
        e.fillRect(inner.x, inner.y + inner.h * 0.62, inner.w, inner.h * 0.07);
        const mx = inner.x + inner.w * (0.2 + rand() * 0.5);
        e.fillStyle = "#0c0c10";
        e.fillRect(mx - 1, inner.y + inner.h * 0.44, inner.w * 0.2 + 2, inner.h * 0.16 + 2);
        e.fillStyle = rgb([200, 225, 255], 0.85 * level);
        e.fillRect(mx, inner.y + inner.h * 0.45, inner.w * 0.2, inner.h * 0.14);
        if (rand() < 0.25) {
          e.fillStyle = "#0e140e";
          e.beginPath();
          e.ellipse(inner.x + inner.w * 0.88, inner.y + inner.h * 0.55, inner.w * 0.07, inner.h * 0.12, 0, 0, Math.PI * 2);
          e.fill();
        } else if (rand() < 0.3) {
          e.fillStyle = "rgba(0,0,0,0.55)";
          e.fillRect(inner.x + inner.w * 0.66, inner.y + inner.h * 0.1, Math.max(2, inner.w * 0.03), inner.h * 0.9);
        }
        /* The mullion stays dark in front of the light. */
        e.fillStyle = "#000";
        e.fillRect(x, y, mullion + 1, pane);
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

/**
 * One plane per face of every tier, UVs scaled so a pane is a storey, each
 * face sampling the tile at its own whole-pane offset, merged.
 */
function curtainWalls(list: Facade[]): THREE.BufferGeometry | null {
  const parts: THREE.BufferGeometry[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const STOREY = 3.4;
  let face = 0;
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
        const across = len / (STOREY * TILE_PANES);
        const up = h / (STOREY * TILE_PANES);
        face += 1;
        const offU = Math.floor(((Math.sin(face * 12.9898) * 43758.5453) % 1 + 1) * TILE_PANES) / TILE_PANES;
        const offV = Math.floor(((Math.sin(face * 78.233) * 12543.123) % 1 + 1) * TILE_PANES) / TILE_PANES;
        for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * across + offU, uv.getY(i) * up + offV);
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
            emissiveIntensity={0.9}
            roughness={0.16}
            metalness={0.3}
            envMapIntensity={0.8}
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
