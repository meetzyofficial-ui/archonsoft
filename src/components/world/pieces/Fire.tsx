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
/* 0 flame, 1 sparks, 2 smoke. */
uniform int sparks;
attribute float seed;
attribute float emitter;
attribute float span;
attribute float grain;
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
  bool spark = sparks == 1;
  bool smoke = sparks == 2;
  /* Each particle lives on its own clock: short for sparks, long for smoke. */
  float life = smoke ? 1.4 + hash(seed) * 1.2 : spark ? 0.35 + hash(seed) * 0.4 : 0.4 + hash(seed) * 0.55;
  float phase = fract(time / life + seed);
  vAge = phase;
  float a1 = hash(seed + 1.0) * 6.2831;
  float a2 = hash(seed + 2.0) * 6.2831;
  float r = (spark ? 0.04 : 0.05) * span * (0.4 + 0.6 * hash(seed + 6.0));
  vec3 start = origin + vec3(cos(a1) * r, (hash(seed + 3.0) - 0.5) * 0.04 + (smoke ? 0.3 * span : 0.0), sin(a1) * r);
  /* Rise, buoyant — hotter flame rises faster; turbulence in two frequencies
     and a slow curl; smoke rises slower and spreads; a little of the body's
     motion is left behind, more the faster it goes. */
  float rise = (spark ? 1.6 + hash(seed + 4.0) * 1.4 : smoke ? 0.5 + hash(seed + 4.0) * 0.3 : 0.32 + hash(seed + 4.0) * 0.4) * span;
  vec3 p = start;
  p.y += phase * rise * (0.6 + 0.4 * s);
  float swirl = (spark ? 0.03 : smoke ? 0.09 : 0.045) * span;
  float curl = phase * phase;
  p.x += sin(phase * 7.0 + a2 + time * 1.3) * swirl * phase + sin(phase * 13.0 + seed * 9.0 + time * 2.3) * 0.018 * span * curl + cos(a2) * phase * 0.03;
  p.z += cos(phase * 6.0 + a1 - time * 1.1) * swirl * phase + cos(phase * 11.0 + seed * 7.0 - time * 1.9) * 0.018 * span * curl + sin(a2) * phase * 0.03;
  if (spark) {
    p.y -= phase * phase * 0.9;
    p += vec3(cos(a2), 0.0, sin(a2)) * phase * 0.35 * hash(seed + 5.0);
  }
  p -= velocity * phase * (spark ? 0.5 : smoke ? 0.6 : 0.32);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  /* Flames swell then thin; sparks stay small; smoke keeps growing. Every
     particle has its own grain of size. */
  float grow = spark ? 0.35 : smoke ? 1.2 + phase * 1.6 : (0.85 + phase * 0.7) * (1.0 - phase * 0.6);
  float size = scale * span * grow * grain * (0.55 + 0.45 * s) * (spark ? 0.35 : 1.0);
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
  if (sparks == 2) {
    /* Smoke: dark, thin, fading as it spreads. */
    float a = body * (1.0 - vAge) * vAge * 0.55 * clamp(vHeat, 0.0, 1.2);
    gl_FragColor = vec4(vec3(0.05, 0.045, 0.045), a);
    return;
  }
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

function makeMaterial(sparks: boolean | 2): THREE.ShaderMaterial {
  const uniforms: FlameUniforms = {
    time: { value: 0 },
    heat: { value: 1 },
    pixelRatio: { value: 1 },
    scale: { value: 1 },
    velocity: { value: new THREE.Vector3() },
    emitters: { value: Array.from({ length: MAX_EMITTERS }, () => new THREE.Vector3(0, -100, 0)) },
    strength: { value: Array.from({ length: MAX_EMITTERS }, () => 0) },
    sparks: { value: sparks === 2 ? 2 : sparks ? 1 : 0 },
  };
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: sparks === 2 ? THREE.NormalBlending : THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function makeGeometry(count: number, emitterCount: number, spans: number[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const emitter = new Float32Array(count);
  const span = new Float32Array(count);
  const grain = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    seed[i] = Math.random();
    const e = i % Math.max(1, emitterCount);
    emitter[i] = e;
    span[i] = spans[e] ?? 1;
    /* Sizes in a spread: many small, a few large. */
    grain[i] = 0.6 + Math.pow(Math.random(), 1.6) * 1.1;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute("emitter", new THREE.BufferAttribute(emitter, 1));
  geometry.setAttribute("span", new THREE.BufferAttribute(span, 1));
  geometry.setAttribute("grain", new THREE.BufferAttribute(grain, 1));
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
  smokeRatio = 0,
  lod,
}: {
  count: number;
  read: (emitters: Emitter[], state: { heat: number; velocity: THREE.Vector3 }) => void;
  scale?: number;
  sparkRatio?: number;
  /** A share of the count as smoke over the flames; none on a phone. */
  smokeRatio?: number;
  /**
   * World fire, by distance from the camera: full inside a fifth of `far`,
   * thinning to a third of its particles toward `far`, and not drawn past
   * it. The particles are in random order, so a shorter draw range is an
   * even thinning — the flame keeps its shape. The robot's fire has none.
   */
  lod?: { center: THREE.Vector3; far: number };
}) {
  const flames = useRef<THREE.Points>(null);
  const sparks = useRef<THREE.Points>(null);
  const smoke = useRef<THREE.Points>(null);
  const emitters = useMemo<Emitter[]>(() => [], []);
  const state = useMemo(() => ({ heat: 1, velocity: new THREE.Vector3() }), []);
  const materials = useMemo(() => [makeMaterial(false), makeMaterial(true), makeMaterial(2)], []);
  const geometries = useRef<THREE.BufferGeometry[] | null>(null);
  const built = useRef(0);
  const root = useRef<THREE.Group>(null);

  useEffect(
    () => () => {
      materials.forEach((m) => m.dispose());
      geometries.current?.forEach((g) => g.dispose());
    },
    [materials],
  );

  useFrame(({ gl, clock, camera }) => {
    if (lod && root.current) {
      const distance = camera.position.distanceTo(lod.center);
      const shown = distance < lod.far;
      if (root.current.visible !== shown) root.current.visible = shown;
      if (!shown) return;
      const keep = THREE.MathUtils.clamp(1 - ((distance - lod.far * 0.2) / (lod.far * 0.8)) * 0.67, 0.33, 1);
      geometries.current?.forEach((g, i) => g.setDrawRange(0, Math.ceil((i === 0 ? count : i === 1 ? count * sparkRatio : count * smokeRatio) * keep)));
    }
    emitters.length = 0;
    read(emitters, state);
    const n = Math.min(MAX_EMITTERS, emitters.length);
    if (n === 0) return;
    /* Geometry once the emitters are known, and again if their number changes. */
    if (built.current !== n) {
      geometries.current?.forEach((g) => g.dispose());
      const spans = emitters.map((e) => e.span);
      geometries.current = [
        makeGeometry(count, n, spans),
        makeGeometry(Math.round(count * sparkRatio), n, spans),
        makeGeometry(Math.max(1, Math.round(count * smokeRatio)), n, spans),
      ];
      if (flames.current) flames.current.geometry = geometries.current[0]!;
      if (sparks.current) sparks.current.geometry = geometries.current[1]!;
      if (smoke.current) smoke.current.geometry = geometries.current[2]!;
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
    <group name="fire" ref={root}>
      {smokeRatio > 0 ? <points ref={smoke} material={materials[2]} frustumCulled={false} renderOrder={2} /> : null}
      <points ref={flames} material={materials[0]} frustumCulled={false} renderOrder={3} />
      {sparkRatio > 0 ? <points ref={sparks} material={materials[1]} frustumCulled={false} renderOrder={3} /> : null}
    </group>
  );
}

/** How hot the robot burns right now, for the light that follows it. */
export const fireStore = { heat: 1, flicker: 0 };
