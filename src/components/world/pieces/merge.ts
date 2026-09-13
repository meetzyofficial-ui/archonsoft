import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Static geometry, merged.
 *
 * Most of what stands in this world never moves: rims, jambs, pylons, the
 * plates a hologram hangs from. Drawn one mesh at a time each costs a draw
 * call; drawn as one merged buffer they cost one. `usePart` builds a list of
 * primitives placed in space and folds them into a single geometry that
 * shares one material. The parts are disposed once merged, and the merged
 * geometry when the mesh goes.
 */
export type Part = {
  geometry: THREE.BufferGeometry;
  at?: [number, number, number];
  turn?: [number, number, number];
  scale?: [number, number, number];
};

const M = new THREE.Matrix4();
const P = new THREE.Vector3();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const S = new THREE.Vector3();

export function mergeParts(parts: Part[]): THREE.BufferGeometry {
  /* Nothing to merge is an empty geometry, not an error: a room without desks has no lamps. */
  if (parts.length === 0) return new THREE.BufferGeometry();
  const placed = parts.map((part) => {
    const g = part.geometry;
    P.set(...(part.at ?? [0, 0, 0]));
    E.set(...(part.turn ?? [0, 0, 0]));
    Q.setFromEuler(E);
    S.set(...(part.scale ?? [1, 1, 1]));
    g.applyMatrix4(M.compose(P, Q, S));
    return g;
  });
  const merged = mergeGeometries(placed, false) ?? new THREE.BufferGeometry();
  for (const g of placed) g.dispose();
  return merged;
}

/** A merged geometry built once from `build`, disposed with the component. */
export function useMerged(build: () => Part[], deps: readonly unknown[]): THREE.BufferGeometry {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geometry = useMemo(() => mergeParts(build()), deps);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/** A rectangle of boxes: the four sides of a rim at one height. */
export function rimParts(width: number, depth: number, h: number, t: number, y: number): Part[] {
  return [
    { geometry: new THREE.BoxGeometry(width, h, t), at: [0, y, -depth / 2] },
    { geometry: new THREE.BoxGeometry(width, h, t), at: [0, y, depth / 2] },
    { geometry: new THREE.BoxGeometry(t, h, depth), at: [-width / 2, y, 0] },
    { geometry: new THREE.BoxGeometry(t, h, depth), at: [width / 2, y, 0] },
  ];
}
