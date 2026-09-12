"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { moodStore } from "@/components/world/environment/mood";

/**
 * The cosmic ocean.
 *
 * Under every island in Archon World there is water, and the water is not
 * water: a deep navy field with slow swells, threads of cyan energy running
 * through it, and the stars overhead reflected as points that come and go.
 * It runs to the horizon in every direction and fades into the fog there, so
 * the platforms read as hanging over something infinite rather than as boxes
 * on a plane.
 *
 * One mesh, one shader, no textures. The surface is a coarse grid displaced
 * by three sine fields in the vertex stage — enough to catch the light and
 * far too few vertices to cost anything — and the whole look is done in the
 * fragment: a fresnel that lifts the far water toward the sky colour, a
 * flowing line pattern for the energy, and a hash-based twinkle for the
 * reflected stars. The tint follows the district the visitor is standing in,
 * lerped by the mood store, so walking from the hub into Systems changes the
 * colour of the sea.
 */

const VERTEX = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  varying vec3 vWorld;
  varying float vSwell;

  void main() {
    vec3 p = position;
    vec4 world = modelMatrix * vec4(p, 1.0);
    float t = uTime;
    float s =
      sin(world.x * 0.09 + t * 0.35) * cos(world.z * 0.07 - t * 0.22) * 0.55 +
      sin(world.x * 0.21 - t * 0.5) * cos(world.z * 0.17 + t * 0.31) * 0.22 +
      sin((world.x + world.z) * 0.05 + t * 0.18) * 0.35;
    world.y += s;
    vWorld = world.xyz;
    vSwell = s;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uEnergy;
  uniform vec3 uFog;
  uniform float uFogDensity;
  varying vec3 vWorld;
  varying float vSwell;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec3 toEye = cameraPosition - vWorld;
    float dist = length(toEye);
    vec3 view = toEye / dist;

    // The swell decides how much of the surface faces up at the sky.
    float up = clamp(0.55 + vSwell * 0.25, 0.0, 1.0);
    float fresnel = pow(1.0 - clamp(view.y, 0.0, 1.0), 2.4);

    // Deep water near, the sky's colour far; the swell moves between them.
    vec3 colour = mix(uDeep, uShallow, up * 0.3 + fresnel * 0.7);

    // The planet and the lit landmark to the north lie on the water as a
    // broad cool bloom; the nebula to the west lays a violet one.
    float north = clamp(-view.z, 0.0, 1.0);
    float west = clamp(-view.x, 0.0, 1.0);
    colour += vec3(0.11, 0.46, 0.72) * fresnel * north * 0.55;
    colour += vec3(0.37, 0.31, 0.66) * fresnel * west * 0.28;

    // Luminous currents: two slow, wide, wandering bands of energy.
    float wander = sin(vWorld.z * 0.014 + uTime * 0.07) * 3.0;
    float c1 = smoothstep(0.82, 1.0, sin(vWorld.x * 0.05 + wander + uTime * 0.09));
    float c2 = smoothstep(0.88, 1.0, sin(vWorld.z * 0.035 - vWorld.x * 0.012 - uTime * 0.06 + 2.0));
    colour += uEnergy * (c1 * 0.14 + c2 * 0.1) * (0.6 + 0.4 * up);

    // Finer ribbons riding the swell.
    float a = sin(vWorld.x * 0.28 + vWorld.z * 0.12 + uTime * 0.6 + vSwell * 2.0);
    float b = sin(vWorld.z * 0.22 - vWorld.x * 0.08 - uTime * 0.4);
    float ribbons = smoothstep(0.9, 1.0, a) * 0.5 + smoothstep(0.93, 1.0, b) * 0.4;
    colour += uEnergy * ribbons * 0.2;

    // A soft bloom of the sky reflected in a broad band toward the horizon.
    colour += uShallow * fresnel * fresnel * 0.4;

    // Ripple events: now and then a ring spreads from a point and fades.
    vec2 cell = floor(vWorld.xz / 60.0);
    vec2 local = (fract(vWorld.xz / 60.0) - 0.5) * 60.0;
    float seed = hash(cell);
    float ev = fract(uTime * 0.05 + seed);
    float r = length(local - (vec2(seed, hash(cell + 7.0)) - 0.5) * 30.0);
    float ring = smoothstep(1.2, 0.0, abs(r - ev * 26.0)) * (1.0 - ev) * step(0.45, seed);
    colour += vec3(0.6, 0.85, 1.0) * ring * 0.35;

    // Reflected stars: a sparse hash over a coarse grid, blinking slowly.
    vec2 scell = floor(vWorld.xz * 0.6);
    float star = hash(scell);
    float blink = 0.5 + 0.5 * sin(uTime * (0.6 + star * 1.4) + star * 40.0);
    float twinkle = step(0.988, star) * blink;
    vec2 slocal = fract(vWorld.xz * 0.6) - 0.5;
    float dot = smoothstep(0.08, 0.0, length(slocal));
    colour += vec3(0.85, 0.92, 1.0) * twinkle * dot * 1.1;

    // Never flat black directly under the visitor.
    colour += uEnergy * 0.05;

    // Distance fog, matched to the scene fog so the horizon dissolves.
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
    colour = mix(colour, uFog, clamp(fog, 0.0, 1.0));

    gl_FragColor = vec4(colour, 1.0);
  }
`;

export function Ocean({ level = -2.6, reduced = false }: { level?: number; reduced?: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color("#050b1a") },
      uShallow: { value: new THREE.Color("#12305a") },
      uEnergy: { value: new THREE.Color("#3ec6ff") },
      uFog: { value: new THREE.Color("#060a16") },
      uFogDensity: { value: 0.0065 },
    }),
    [],
  );

  useFrame((_, delta) => {
    const m = material.current;
    if (!m) return;
    if (!reduced) uniforms.uTime.value += Math.min(delta, 0.05);
    /* Follow the district's mood. The store already eases these, so this is
       a copy, not a lerp. */
    const mood = moodStore.current;
    uniforms.uDeep.value.copy(mood.oceanDeep);
    uniforms.uShallow.value.copy(mood.oceanShallow);
    uniforms.uEnergy.value.copy(mood.energy);
    uniforms.uFog.value.copy(mood.fog);
    uniforms.uFogDensity.value = mood.fogDensity;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, level, 0]} frustumCulled={false}>
      <planeGeometry args={[900, 900, 96, 96]} />
      <shaderMaterial
        ref={material}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        fog={false}
      />
    </mesh>
  );
}
