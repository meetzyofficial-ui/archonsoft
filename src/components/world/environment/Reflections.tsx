"use client";

import * as THREE from "three";

/**
 * What the world reflects.
 *
 * The decks are polished stone, the robot is ceramic and brushed metal, the
 * gate is light alloy — and none of it looks like anything unless there is a
 * world for it to reflect. A cube camera standing on the plaza photographs
 * the sky, the planet, the lit architecture and the sea; the result is
 * filtered into an environment map every standard material in the scene
 * picks up. No per-frame cost: the reflections are of the world as it
 * stands, not of the visitor's every step, and at these roughnesses nobody
 * can tell.
 *
 * Driven by the boot sequence rather than by timers, because *when* this
 * happens is the whole matter. Setting `scene.environment` for the first
 * time changes the shader of every lit material in the world, and if that
 * happens after the first frame every one of them is recompiled on the
 * spot — a second-long freeze in the middle of the opening sweep on a
 * phone. So the boot primes the environment with a placeholder first, has
 * every shader compiled against it while the scene is still hidden, and
 * only then takes the real photograph, which by then costs six renders and
 * no compiles at all.
 */
export interface ReflectionRig {
  /** A placeholder environment: black, but the right kind of texture. */
  prime(): void;
  /** Photograph the world from the plaza and make it the environment. */
  capture(): void;
  dispose(): void;
}

export function createReflections(gl: THREE.WebGLRenderer, scene: THREE.Scene, size: number): ReflectionRig {
  const target = new THREE.WebGLCubeRenderTarget(size, {
    type: THREE.HalfFloatType,
    generateMipmaps: false,
  });
  const camera = new THREE.CubeCamera(1, 900, target);
  camera.position.set(0, 7, 6);
  const pmrem = new THREE.PMREMGenerator(gl);
  let env: THREE.Texture | null = null;

  const apply = (next: THREE.Texture) => {
    env?.dispose();
    env = next;
    scene.environment = env;
    scene.environmentIntensity = 0.85;
  };

  return {
    prime() {
      /* The unrendered target is black; filtered, it is a black environment
         of exactly the type the real one will be, so the programs compiled
         against it are the programs the real one uses. */
      apply(pmrem.fromCubemap(target.texture).texture);
    },
    capture() {
      const exposure = gl.toneMappingExposure;
      const mapping = gl.toneMapping;
      gl.toneMapping = THREE.NoToneMapping;
      gl.toneMappingExposure = 1;
      camera.update(gl, scene);
      gl.toneMapping = mapping;
      gl.toneMappingExposure = exposure;
      apply(pmrem.fromCubemap(target.texture).texture);
    },
    dispose() {
      scene.environment = null;
      env?.dispose();
      target.dispose();
      pmrem.dispose();
    },
  };
}
