"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Fire.
 *
 * Living flame on the GPU: a cloud of soft points, each born at one of a
 * few emitters, rising, drifting, swelling and dying over a second or so on
 * its own clock, coloured from white-yellow through orange and red to dark
 * ember as it ages, drawn additively so where flames overlap they are
 * brighter and where they thin they fade — which is what fire looks like
 * and what a textured sprite of a flame does not. A second, smaller cloud
 * is the sparks: hot points that leap and fall. Nothing here is simulated
 * on the CPU; the shader has the time, the emitters and a heat, and finds
 * every particle's place from those.
 *
 * The same piece burns on the robot and in the bowls along the paths; the
 * robot moves its emitters every frame and hands the cloud its velocity so
 * the flames trail behind at a run.
 */

export const MAX_EMITTERS = 16;

const VERTEX = /* glsl */ `
uniform float time;
uniform float heat;
uniform float pixelRatio;
uniform float scale;
uniform vec3 velocity;
uniform vec3 emitters[${MAX_EMITTERS}];
uniform float strength[${MAX_EMITTERS}];
uniform int sparks;
attribute float seed;
attribute float emitter;
attribute float span;
varying float vAge;
varying float vHeat;
varying float vSeed;

float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }

void main() {
  int e = int(emitter);
  vec3 origin = emitters[e];
  float s = strength[e] * heat;
  vHeat = s;
  vSeed = seed;
  /* Each particle lives on its own clock. */
  float life = (sparks == 1 ? 0.35 : 0.45) + hash(seed) * (sparks == 1 ? 0.4 : 0.5);
  float phase = fract(time / life + seed);
  vAge = phase;
  float a1 = hash(seed + 1.0) * 6.2831;
  float a2 = hash(seed + 2.0) * 6.2831;
  float r = (sparks == 1 ? 0.04 : 0.05) * span * (0.4 + 0.6 * hash(seed + 6.0));
  vec3 start = origin + vec3(cos(a1) * r, (hash(seed + 3.0) - 0.5) * 0.04, sin(a1) * r);
  /* Rise, buoyant; swirl as it goes; a little of the body's motion left behind. */
  float rise = (sparks == 1 ? 1.6 + hash(seed + 4.0) * 1.4 : 0.32 + hash(seed + 4.0) * 0.4) * span;
  vec3 p = start;
  p.y += phase * rise * (0.6 + 0.4 * s);
  float swirl = (sparks == 1 ? 0.03 : 0.045) * span;
  p.x += sin(phase * 7.0 + a2 + time * 1.3) * swirl * phase + cos(a2) * phase * 0.03;
  p.z += cos(phase * 6.0 + a1 - time * 1.1) * swirl * phase + sin(a2) * phase * 0.03;
  if (sparks == 1) {
    p.y -= phase * phase * 0.9;
    p += vec3(cos(a2), 0.0, sin(a2)) * phase * 0.35 * hash(seed + 5.0);
  }
  p -= velocity * phase * (sparks == 1 ? 0.5 : 0.32);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  /* Flames swell then thin; sparks stay small. */
  float grow = sparks == 1 ? 0.35 : (0.85 + phase * 0.7) * (1.0 - phase * 0.6);
  float size = scale * span * grow * (0.55 + 0.45 * s) * (sparks == 1 ? 0.35 : 1.0);
  gl_PointSize = size * pixelRatio * (300.0 / -mv.z);
}
`;

const FRAGMENT = /* glsl */ `
uniform int sparks;
varying float vAge;
varying float vHeat;
varying float vSeed;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv) * 2.0;
  /* A soft body with a ragged edge that changes with the particle. */
  float angle = atan(uv.y, uv.x);
  float edge = 0.9 + 0.07 * sin(angle * 3.0 + vSeed * 20.0 + vAge * 6.0) + 0.04 * sin(angle * 7.0 - vSeed * 9.0);
  float body = smoothstep(edge, 0.0, d);
  body = body * body;
  if (body <= 0.001) discard;
  /* White-yellow, orange, red, ember: by age. */
  vec3 hot = vec3(1.0, 0.86, 0.5);
  vec3 orange = vec3(1.0, 0.42, 0.08);
  vec3 red = vec3(0.78, 0.12, 0.02);
  vec3 ember = vec3(0.22, 0.03, 0.0);
  vec3 c = vAge < 0.25 ? mix(hot, orange, vAge / 0.25) : vAge < 0.6 ? mix(orange, red, (vAge - 0.25) / 0.35) : mix(red, ember, (vAge - 0.6) / 0.4);
  if (sparks == 1) c = mix(vec3(1.0, 0.95, 0.75), orange, vAge);
  /* Brightest young, fading out; the core hotter than the rim. */
  float core = smoothstep(0.6, 0.0, d);
  float alpha = body * (1.0 - pow(vAge, 1.6)) * (sparks == 1 ? 0.9 : 0.14 + 0.3 * core) * clamp(vHeat, 0.0, 1.6);
  gl_FragColor = vec4(c * (1.0 + core * 0.9), alpha);
}
`;

export type FlameUniforms = {
  time: { value: number };
  heat: { value: number };
  pixelRatio: { value: number };
  scale: { value: number };
  velocity: { value: THREE.Vector3 };
  emitters: { value: THREE.Vector3[] };
  strength: { value: number[] };
  sparks: { value: number };
};

function makeMaterial(sparks: boolean): THREE.ShaderMaterial {
  const uniforms: FlameUniforms = {
    time: { value: 0 },
    heat: { value: 1 },
    pixelRatio: { value: 1 },
    scale: { value: 1 },
    velocity: { value: new THREE.Vector3() },
    emitters: { value: Array.from({ length: MAX_EMITTERS }, () => new THREE.Vector3(0, -100, 0)) },
    strength: { value: Array.from({ length: MAX_EMITTERS }, () => 0) },
    sparks: { value: sparks ? 1 : 0 },
  };
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function makeGeometry(count: number, emitterCount: number, spans: number[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const emitter = new Float32Array(count);
  const span = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    seed[i] = Math.random();
    const e = i % Math.max(1, emitterCount);
    emitter[i] = e;
    span[i] = spans[e] ?? 1;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute("emitter", new THREE.BufferAttribute(emitter, 1));
  geometry.setAttribute("span", new THREE.BufferAttribute(span, 1));
  /* The points move in the shader; the bounds are set wide so they are never culled away. */
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 6);
  return geometry;
}

export type Emitter = { at: THREE.Vector3; strength: number; span: number };

/**
 * A cloud of flame and a cloud of sparks over a set of emitters.
 *
 * `read` is called once a frame and fills the emitter list in the cloud's
 * own frame; `heat` scales everything; `velocity` (in the same frame) is
 * what the flames trail against.
 */
export function Flames({
  count,
  read,
  scale = 1,
  sparkRatio = 0.25,
}: {
  count: number;
  read: (emitters: Emitter[], state: { heat: number; velocity: THREE.Vector3 }) => void;
  scale?: number;
  sparkRatio?: number;
}) {
  const flames = useRef<THREE.Points>(null);
  const sparks = useRef<THREE.Points>(null);
  const emitters = useMemo<Emitter[]>(() => [], []);
  const state = useMemo(() => ({ heat: 1, velocity: new THREE.Vector3() }), []);
  const materials = useMemo(() => [makeMaterial(false), makeMaterial(true)], []);
  const geometries = useRef<THREE.BufferGeometry[] | null>(null);
  const built = useRef(0);

  useEffect(
    () => () => {
      materials.forEach((m) => m.dispose());
      geometries.current?.forEach((g) => g.dispose());
    },
    [materials],
  );

  useFrame(({ gl, clock }) => {
    emitters.length = 0;
    read(emitters, state);
    const n = Math.min(MAX_EMITTERS, emitters.length);
    if (n === 0) return;
    /* Geometry once the emitters are known, and again if their number changes. */
    if (built.current !== n) {
      geometries.current?.forEach((g) => g.dispose());
      const spans = emitters.map((e) => e.span);
      geometries.current = [makeGeometry(count, n, spans), makeGeometry(Math.round(count * sparkRatio), n, spans)];
      if (flames.current) flames.current.geometry = geometries.current[0]!;
      if (sparks.current) sparks.current.geometry = geometries.current[1]!;
      built.current = n;
    }
    const t = clock.elapsedTime;
    for (const material of materials) {
      const u = material.uniforms as FlameUniforms;
      u.time.value = t;
      u.heat.value = state.heat;
      u.pixelRatio.value = gl.getPixelRatio();
      u.scale.value = scale;
      u.velocity.value.copy(state.velocity);
      for (let i = 0; i < MAX_EMITTERS; i += 1) {
        const e = emitters[i];
        if (e) {
          u.emitters.value[i]!.copy(e.at);
          u.strength.value[i] = e.strength;
        } else {
          u.strength.value[i] = 0;
        }
      }
    }
  });

  return (
    <group name="fire">
      <points ref={flames} material={materials[0]} frustumCulled={false} renderOrder={3} />
      <points ref={sparks} material={materials[1]} frustumCulled={false} renderOrder={3} />
    </group>
  );
}

/** How hot the robot burns right now, for the light that follows it. */
export const fireStore = { heat: 1, flicker: 0 };
