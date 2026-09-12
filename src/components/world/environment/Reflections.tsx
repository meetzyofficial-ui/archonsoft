"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

/**
 * What the world reflects.
 *
 * The decks are polished stone, the robot is ceramic and brushed metal, the
 * gate is light alloy — and none of it looks like anything unless there is a
 * world for it to reflect. A cube camera standing on the plaza photographs
 * the sky, the planet, the lit architecture and the sea, once the textures
 * have arrived and once more a few seconds later; the result is filtered
 * into an environment map every standard material in the scene picks up.
 * Two captures, no per-frame cost: the reflections are of the world as it
 * stands, not of the visitor's every step, and at these roughnesses nobody
 * can tell.
 */
export function Reflections({ compact }: { compact: boolean }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    const target = new THREE.WebGLCubeRenderTarget(compact ? 64 : 128, {
      type: THREE.HalfFloatType,
      generateMipmaps: false,
    });
    const camera = new THREE.CubeCamera(1, 900, target);
    camera.position.set(0, 7, 6);
    const pmrem = new THREE.PMREMGenerator(gl);
    let env: THREE.Texture | null = null;

    const capture = () => {
      const exposure = gl.toneMappingExposure;
      const mapping = gl.toneMapping;
      gl.toneMapping = THREE.NoToneMapping;
      gl.toneMappingExposure = 1;
      camera.update(gl, scene);
      gl.toneMapping = mapping;
      gl.toneMappingExposure = exposure;
      const next = pmrem.fromCubemap(target.texture).texture;
      env?.dispose();
      env = next;
      scene.environment = env;
      scene.environmentIntensity = 0.85;
    };

    /* A phone captures once, later, at 64px; a desktop twice. Either way it
       happens during the opening, behind the interface, not on a frame the
       visitor is steering. */
    const first = window.setTimeout(capture, compact ? 3000 : 1400);
    const second = compact ? 0 : window.setTimeout(capture, 5200);
    return () => {
      window.clearTimeout(first);
      if (second) window.clearTimeout(second);
      scene.environment = null;
      env?.dispose();
      target.dispose();
      pmrem.dispose();
    };
  }, [compact, gl, scene]);

  return null;
}
