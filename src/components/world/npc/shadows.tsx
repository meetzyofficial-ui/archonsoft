"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { npcFocus } from "@/components/world/npc/lod";

/**
 * The soft dark disc under every person, drawn once for all of them.
 *
 * Each person used to carry its own disc — a draw call apiece for a shape
 * that never differs. Here every person registers its root, and one
 * instanced mesh places a disc under each root that is actually shown,
 * from the root's own world matrix, so a seated person's disc sinks with
 * them exactly as it did when it was their child.
 *
 * The component also keeps the people's frame clock: it is mounted ahead
 * of them, so its tick is the first thing each frame.
 */

const roots = new Set<THREE.Object3D>();
const CAPACITY = 192;

export const npcShadows = {
  add(root: THREE.Object3D) {
    roots.add(root);
    return () => {
      roots.delete(root);
    };
  },
};

function shown(object: THREE.Object3D | null) {
  while (object) {
    if (!object.visible) return false;
    object = object.parent;
  }
  return true;
}

const DISC = new THREE.Matrix4().makeTranslation(0, 0.012, 0).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
const M = new THREE.Matrix4();

export function NpcShadows() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.CircleGeometry(0.4, 16), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    npcFocus.tick();
    const node = mesh.current;
    if (!node) return;
    let n = 0;
    for (const root of roots) {
      if (n >= CAPACITY) break;
      if (!shown(root)) continue;
      node.setMatrixAt(n, M.multiplyMatrices(root.matrixWorld, DISC));
      n += 1;
    }
    node.count = n;
    node.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, CAPACITY]} frustumCulled={false} name="npc-shadows">
      <meshBasicMaterial color="#000000" transparent opacity={0.45} toneMapped={false} depthWrite={false} />
    </instancedMesh>
  );
}
