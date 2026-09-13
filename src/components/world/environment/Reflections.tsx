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
 * no compiles at all — the programs the capture itself renders with, into
 * an untoned float target, are compiled ahead as well.
 */
export interface ReflectionRig {
  /** A placeholder environment: black, but the right kind of texture. */
  prime(): void;
  /** Photograph the world from the plaza and make it the environment. */
  capture(): void;
  /**
   * The same photograph one face of the cube per frame: six small renders
   * instead of one large one, so no frame carries the first draw of
   * everything behind the camera. `nextFrame` waits for the next frame.
   */
  captureStaged(nextFrame: () => Promise<void>, cancelled: () => boolean): Promise<void>;
  /**
   * The capture renders into a float target, untoned, so every material
   * needs a second program for it. Have them built ahead: `compile` is
   * called with the capture's target current.
   */
  prewarm(compile: () => unknown): unknown;
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
    prewarm(compile) {
      const previous = gl.getRenderTarget();
      gl.setRenderTarget(target, 0);
      try {
        return compile();
      } finally {
        gl.setRenderTarget(previous);
      }
    },
    async captureStaged(nextFrame, cancelled) {
      camera.updateMatrixWorld();
      if (camera.coordinateSystem !== gl.coordinateSystem) {
        camera.coordinateSystem = gl.coordinateSystem;
        camera.updateCoordinateSystem();
      }
      const faces = camera.children as THREE.PerspectiveCamera[];
      for (let face = 0; face < 6; face += 1) {
        if (cancelled()) return;
        const hidden: THREE.Object3D[] = [];
        scene.traverse((object) => {
          if (object.userData.noReflect && object.visible) {
            object.visible = false;
            hidden.push(object);
          }
        });
        const previous = gl.getRenderTarget();
        const exposure = gl.toneMappingExposure;
        const mapping = gl.toneMapping;
        gl.toneMapping = THREE.NoToneMapping;
        gl.toneMappingExposure = 1;
        const mipmaps = target.texture.generateMipmaps;
        target.texture.generateMipmaps = false;
        gl.setRenderTarget(target, face);
        gl.render(scene, faces[face]!);
        target.texture.generateMipmaps = mipmaps;
        gl.setRenderTarget(previous);
        gl.toneMapping = mapping;
        gl.toneMappingExposure = exposure;
        for (const object of hidden) object.visible = true;
        await nextFrame();
      }
      if (cancelled()) return;
      target.texture.needsPMREMUpdate = true;
      apply(pmrem.fromCubemap(target.texture).texture);
    },
    capture() {
      /* Points of light — stars, dust — are left out of the photograph: at
         the capture's resolution each is a hot texel, and every rough
         surface would wear it as a soft blob. */
      const hidden: THREE.Object3D[] = [];
      scene.traverse((object) => {
        if (object.userData.noReflect && object.visible) {
          object.visible = false;
          hidden.push(object);
        }
      });
      const exposure = gl.toneMappingExposure;
      const mapping = gl.toneMapping;
      gl.toneMapping = THREE.NoToneMapping;
      gl.toneMappingExposure = 1;
      camera.update(gl, scene);
      gl.toneMapping = mapping;
      gl.toneMappingExposure = exposure;
      for (const object of hidden) object.visible = true;
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
