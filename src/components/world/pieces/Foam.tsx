"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeParts } from "@/components/world/pieces/merge";

/**
 * Cosmic foam: where an island meets the sea.
 *
 * The islands do not float clear of the water; their structure sits in it,
 * and the reference worlds put a soft luminous disturbance along that line —
 * not surf, but vapour: the sea reacting to the energy of the thing standing
 * in it. Here it is two draws per island. A skirt of four shader planes
 * standing on the waterline, additive, whose alpha is a vertical fade cut by
 * slow rising streaks so it reads as mist lifting off the water and as light
 * falling into it. And a ring of points drifting up out of the line and
 * fading, the tiny sparks of a digital sea. Both are cyan, both are subtle,
 * and both are cheap: no lights, no geometry beyond a few quads, one uniform
 * a frame.
 */

export const SEA = -2.6;

const SKIRT_VERTEX = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SKIRT_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform vec3 uColour;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vWorld;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    /* Brightest a little above the waterline, gone at the top and just under. */
    float band = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.22, 1.0, vUv.y));
    /* Rising streaks: columns of vapour that drift upward and wander. */
    float along = vWorld.x * 0.9 + vWorld.z * 0.9;
    float s1 = sin(along * 1.7 - uTime * 0.6 + vUv.y * 6.0);
    float s2 = sin(along * 0.6 + uTime * 0.35 - vUv.y * 3.0);
    float streaks = 0.55 + 0.45 * s1 * s2;
    /* Distortion of the edge: a slow ripple along the line. */
    float ripple = 0.85 + 0.15 * sin(along * 0.35 + uTime * 0.9);
    /* Falling threads of light, sparse. */
    float thread = smoothstep(0.985, 1.0, sin(along * 4.0 + hash(floor(along)) * 6.0)) * (1.0 - vUv.y);
    float a = band * streaks * ripple * uOpacity + thread * 0.35 * band;
    gl_FragColor = vec4(uColour * (0.7 + 0.3 * vUv.y), a);
  }
`;

const SPARK_VERTEX = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  attribute float aSeed;
  varying float vLife;
  void main() {
    /* Each spark rises on its own clock and starts over at the waterline. */
    float life = fract(uTime * (0.08 + aSeed * 0.08) + aSeed * 7.0);
    vLife = life;
    vec3 p = position;
    p.y += life * (1.6 + aSeed * 1.4);
    p.x += sin(uTime * 0.7 + aSeed * 20.0) * 0.25 * life;
    p.z += cos(uTime * 0.6 + aSeed * 13.0) * 0.25 * life;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.0 + aSeed * 3.0) * (1.0 - life * 0.6) * (140.0 / max(1.0, -mv.z));
  }
`;

const SPARK_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform vec3 uColour;
  varying float vLife;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = (1.0 - smoothstep(0.2, 1.0, d)) * (1.0 - vLife) * smoothstep(0.0, 0.15, vLife);
    gl_FragColor = vec4(uColour, a * 0.85);
  }
`;

export function Foam({
  width,
  depth,
  y,
  colour,
  height = 2.6,
}: {
  width: number;
  depth: number;
  /** The island's structural underside, in the island's frame. */
  y: number;
  colour: string;
  height?: number;
}) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: Math.random() * 100 },
      uColour: { value: new THREE.Color(colour) },
      uOpacity: { value: 0.5 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    uniforms.uColour.value.set(colour).lerp(new THREE.Color("#7fe6ff"), 0.45);
  }, [colour, uniforms]);

  /* The waterline is where the sea is, unless the island sits above it —
     then the vapour gathers under the structure instead. */
  const line = Math.min(SEA, y) + 0.05;
  const w = width - 0.2;
  const d = depth - 0.2;

  const skirt = useMemo(
    () =>
      mergeParts([
        { geometry: new THREE.PlaneGeometry(w + 1.2, height), at: [0, line + height / 2 - 0.5, -d / 2 - 0.6] },
        { geometry: new THREE.PlaneGeometry(w + 1.2, height), at: [0, line + height / 2 - 0.5, d / 2 + 0.6], turn: [0, Math.PI, 0] },
        { geometry: new THREE.PlaneGeometry(d + 1.2, height), at: [-w / 2 - 0.6, line + height / 2 - 0.5, 0], turn: [0, -Math.PI / 2, 0] },
        { geometry: new THREE.PlaneGeometry(d + 1.2, height), at: [w / 2 + 0.6, line + height / 2 - 0.5, 0], turn: [0, Math.PI / 2, 0] },
      ]),
    [w, d, height, line],
  );

  const sparks = useMemo(() => {
    const perimeter = 2 * (w + d);
    const count = Math.min(420, Math.max(80, Math.round(perimeter * 2.2)));
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      /* Along the perimeter, a little outside the structure. */
      const u = Math.random() * perimeter;
      let x: number;
      let z: number;
      const out = 0.3 + Math.random() * 1.6;
      if (u < w) {
        x = -w / 2 + u;
        z = -d / 2 - out;
      } else if (u < w + d) {
        x = w / 2 + out;
        z = -d / 2 + (u - w);
      } else if (u < 2 * w + d) {
        x = w / 2 - (u - w - d);
        z = d / 2 + out;
      } else {
        x = -w / 2 - out;
        z = d / 2 - (u - 2 * w - d);
      }
      positions[i * 3] = x;
      positions[i * 3 + 1] = line - 0.2;
      positions[i * 3 + 2] = z;
      seeds[i] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geometry;
  }, [w, d, line]);

  useEffect(
    () => () => {
      skirt.dispose();
      sparks.dispose();
    },
    [skirt, sparks],
  );

  const time = useRef(0);
  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.05);
    uniforms.uTime.value = time.current;
  });

  return (
    <group name="island:foam">
      <mesh geometry={skirt}>
        <shaderMaterial
          vertexShader={SKIRT_VERTEX}
          fragmentShader={SKIRT_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <points geometry={sparks} frustumCulled={false}>
        <shaderMaterial
          vertexShader={SPARK_VERTEX}
          fragmentShader={SPARK_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
