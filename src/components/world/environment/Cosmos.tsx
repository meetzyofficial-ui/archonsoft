"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { moodStore } from "@/components/world/environment/mood";
import { MATERIAL, useWaterTexture } from "@/components/world/pieces/Kit";
import { worldEvents } from "@/components/world/systems/events";
import { zoneStore } from "@/components/world/systems/focus";

/**
 * Everything above and beyond the islands.
 *
 * A world whose sky is empty is a stage set, so this file is the horizon:
 * a nebula overhead, three thousand stars, a ring of distant structures that
 * never come closer, a belt of asteroids, dust drifting through the air, and
 * a few lights crossing the sky slowly enough to be mistaken for ships. None
 * of it is reachable and all of it is cheap — each family is a single draw
 * call, and the total is well under ten.
 *
 * The rule for all of it is that it must never compete with the foreground.
 * Every element here is dim, slow and far. It exists so that whichever way
 * the visitor turns, something is there — not so that anything demands to be
 * looked at.
 */

/* ------------------------------------------------------------------ sky */

const SKY_VERTEX = /* glsl */ `
  precision mediump float;
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p;
  }
`;

const SKY_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform vec3 uHorizon;
  uniform vec3 uZenith;
  uniform vec3 uNebula;
  uniform vec3 uWarm;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
    return n;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, -0.2, 1.0);
    // Dark at the zenith, a band of colour at the horizon: a night sky lit
    // from below by the sea.
    vec3 colour = mix(uHorizon, uZenith, smoothstep(-0.05, 0.6, h));

    // The nebula, in layers. A broad blue-violet body over the whole sky,
    // denser in a band above the horizon; a magenta-violet veil high up; a
    // warm peach glow low on the west, where the light is coming from; and
    // a few brighter cores where the clouds knot.
    float n1 = noise(d * 3.0 + vec3(uTime * 0.008, 0.0, 0.0));
    float n2 = noise(d * 6.0 - vec3(0.0, uTime * 0.006, 0.0));
    float n4 = noise(d * 1.4 + vec3(11.0, 2.0, uTime * 0.003));
    float cloud = smoothstep(0.38, 0.85, n1 * 0.7 + n2 * 0.3);
    float body = smoothstep(0.3, 0.8, n4);
    float band = exp(-pow((d.y - 0.26) * 2.6, 2.0)) * (0.6 + 0.4 * sin(d.x * 2.0 + 1.0));
    colour += uNebula * cloud * band * 1.3;
    colour += vec3(0.22, 0.16, 0.5) * body * smoothstep(-0.1, 0.5, d.y) * 0.85;
    // Overhead the nebula thins to a violet haze rather than to nothing.
    colour += vec3(0.16, 0.12, 0.34) * smoothstep(0.35, 1.0, d.y) * (0.35 + 0.4 * n4);

    float n3 = noise(d * 2.2 + vec3(3.0, uTime * 0.004, 9.0));
    float veil = smoothstep(0.45, 0.9, n3) * exp(-pow((d.y - 0.62) * 2.0, 2.0));
    colour += vec3(0.5, 0.24, 0.66) * veil * 0.75;
    // Magenta knots.
    float knots = smoothstep(0.72, 0.95, noise(d * 5.0 + vec3(5.0, 1.0, uTime * 0.004))) * body;
    colour += vec3(0.75, 0.3, 0.7) * knots * 0.5;

    float warmCloud = smoothstep(0.45, 0.9, noise(d * 4.0 + vec3(7.0, uTime * 0.005, 3.0)));
    float warmBand = exp(-pow((d.y - 0.12) * 3.6, 2.0)) * smoothstep(-0.95, -0.1, d.x);
    colour += uWarm * warmCloud * warmBand * 0.8;
    colour += uWarm * exp(-pow((d.y - 0.02) * 6.0, 2.0)) * smoothstep(-1.0, -0.3, d.x) * 0.35;

    // The horizon itself: a thin brighter line where sea meets sky.
    colour += uHorizon * exp(-pow(d.y * 14.0, 2.0)) * 0.9;

    gl_FragColor = vec4(colour, 1.0);
  }
`;

function Sky({ reduced }: { reduced: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uHorizon: { value: new THREE.Color("#0d1a38") },
      uZenith: { value: new THREE.Color("#07091c") },
      uNebula: { value: new THREE.Color("#1a3a72") },
      uWarm: { value: new THREE.Color("#d9825a") },
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!reduced) uniforms.uTime.value += Math.min(delta, 0.05);
    uniforms.uNebula.value.copy(moodStore.current.sky);
    uniforms.uHorizon.value.copy(moodStore.current.fog).multiplyScalar(2.2);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[640, 32, 16]} />
      <shaderMaterial
        ref={material}
        vertexShader={SKY_VERTEX}
        fragmentShader={SKY_FRAGMENT}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------------- stars */

function Stars({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      /* On a hemisphere and a little below it, so stars sit right down to
         the sea line. */
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 1.1 - 0.1);
      const r = 380;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = 0.6 + Math.random() * Math.random() * 2.6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          precision mediump float;
          attribute float aSize;
          uniform float uTime;
          varying float vBlink;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            float seed = position.x * 0.013 + position.z * 0.017;
            vBlink = 0.55 + 0.45 * sin(uTime * (0.4 + fract(seed) * 1.2) + seed * 50.0);
            gl_PointSize = aSize * (1.0 + 0.3 * vBlink);
          }
        `,
        fragmentShader: /* glsl */ `
          precision mediump float;
          varying float vBlink;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.1, d) * vBlink;
            gl_FragColor = vec4(vec3(0.82, 0.9, 1.0), a);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [],
  );

  useFrame((_, delta) => {
    material.uniforms.uTime!.value += Math.min(delta, 0.05);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-9} />;
}

/* ----------------------------------------------------- distant structures */

/**
 * A ring of far-off buildings and floating slabs.
 *
 * They are the horizon of the settlement: other islands, other structures,
 * nobody's district. Two instanced meshes — tall blades and flat platforms —
 * placed on a ring between 220 and 380 metres out, turning about their own
 * centres so slowly that a visitor who stands still for a minute will notice
 * one has moved.
 */
function DistantStructures({ reduced }: { reduced: boolean }) {
  const towers = useRef<THREE.InstancedMesh>(null);
  const edges = useRef<THREE.InstancedMesh>(null);
  const bases = useRef<THREE.InstancedMesh>(null);
  const bridges = useRef<THREE.InstancedMesh>(null);
  const COUNT = 48;
  const BRIDGES = 12;

  /* Clusters, not a ring: five groups of towers around the horizon, each a
     skyline of its own, with one tall tower and its lesser neighbours. */
  const seeds = useMemo(() => {
    const out: { x: number; z: number; y: number; h: number; w: number; spin: number; drift: number; rot: number; warm: boolean }[] = [];
    const clusters = [
      { a: 0.35, r: 360, n: 12, tall: 200 },
      { a: 1.35, r: 400, n: 8, tall: 150 },
      { a: 2.55, r: 350, n: 11, tall: 180 },
      { a: 3.9, r: 390, n: 7, tall: 130 },
      { a: 5.1, r: 370, n: 10, tall: 170 },
    ];
    clusters.forEach((c) => {
      for (let i = 0; i < c.n; i += 1) {
        const a = c.a + (Math.random() - 0.5) * 0.5;
        const r = c.r + (Math.random() - 0.5) * 90;
        const lead = i === 0;
        out.push({
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          y: -30 + Math.random() * 20,
          h: lead ? c.tall : 40 + Math.random() * (c.tall * 0.7),
          w: lead ? 26 : 9 + Math.random() * 14,
          spin: (Math.random() - 0.5) * 0.004,
          drift: Math.random() * Math.PI * 2,
          rot: Math.random() * Math.PI,
          warm: Math.random() < 0.3,
        });
      }
    });
    return out.slice(0, COUNT);
  }, []);
  const links = useMemo(
    () =>
      Array.from({ length: BRIDGES }, (_, i) => {
        const a = seeds[(i * 5) % seeds.length]!;
        const b = seeds[(i * 5 + 1) % seeds.length]!;
        return { a, b, y: Math.min(a.h, b.h) * (0.4 + Math.random() * 0.4) };
      }),
    [seeds],
  );

  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const from = useMemo(() => new THREE.Vector3(), []);
  const to = useMemo(() => new THREE.Vector3(), []);
  const time = useRef(0);

  useFrame((_, delta) => {
    if (!reduced) time.current += Math.min(delta, 0.05);
    const t = time.current;
    seeds.forEach((seed, i) => {
      const bob = Math.sin(t * 0.1 + seed.drift) * 1.2;
      e.set(0, seed.rot + t * seed.spin, 0);
      q.setFromEuler(e);
      /* The tower: a tapered shaft. */
      p.set(seed.x, seed.y + seed.h / 2 + bob, seed.z);
      s.set(seed.w, seed.h, seed.w);
      towers.current?.setMatrixAt(i, matrix.compose(p, q, s));
      /* Its lit edge, one face. */
      p.set(seed.x, seed.y + seed.h * 0.55 + bob, seed.z);
      s.set(seed.w * 0.12, seed.h * 0.8, seed.w * 1.02);
      edges.current?.setMatrixAt(i, matrix.compose(p, q, s));
      /* The lights at its foot, a wide low glow. */
      p.set(seed.x, seed.y + 1.5 + bob, seed.z);
      s.set(seed.w * 4, 3, seed.w * 4);
      bases.current?.setMatrixAt(i, matrix.compose(p, q, s));
    });
    links.forEach((link, i) => {
      from.set(link.a.x, link.a.y + link.y, link.a.z);
      to.set(link.b.x, link.b.y + link.y, link.b.z);
      const len = from.distanceTo(to);
      if (len > 160) {
        bridges.current?.setMatrixAt(i, matrix.makeScale(0, 0, 0));
        return;
      }
      p.lerpVectors(from, to, 0.5);
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), to.clone().sub(from).normalize());
      s.set(1.2, 0.8, len);
      bridges.current?.setMatrixAt(i, matrix.compose(p, q, s));
    });
    for (const ref of [towers, edges, bases, bridges]) {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group name="cosmos:distantstructures">
      <instancedMesh ref={towers} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <cylinderGeometry args={[0.3, 0.5, 1, 6]} />
        <meshLambertMaterial color="#141d33" />
      </instancedMesh>
      <instancedMesh ref={edges} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffe6cf" toneMapped={false} transparent opacity={0.45} />
      </instancedMesh>
      <instancedMesh ref={bases} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <sphereGeometry args={[0.5, 8, 6]} />
        <meshBasicMaterial color="#6fb8ff" toneMapped={false} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>
      <instancedMesh ref={bridges} args={[undefined, undefined, BRIDGES]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#9ad6ff" toneMapped={false} transparent opacity={0.35} />
      </instancedMesh>
    </group>
  );
}

/* ------------------------------------------------------------- asteroids */

function Asteroids({ reduced }: { reduced: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const COUNT = 60;
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, () => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 150 + Math.random() * 200;
        return {
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          y: 30 + Math.random() * 120,
          size: 1.5 + Math.random() * 6,
          rot: new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3),
          spin: (Math.random() - 0.5) * 0.08,
          drift: Math.random() * Math.PI * 2,
        };
      }),
    [],
  );
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const time = useRef(0);

  useFrame((_, delta) => {
    if (!reduced) time.current += Math.min(delta, 0.05);
    const t = time.current;
    seeds.forEach((seed, i) => {
      seed.rot.y += seed.spin * delta;
      p.set(seed.x, seed.y + Math.sin(t * 0.09 + seed.drift) * 2.5, seed.z);
      q.setFromEuler(seed.rot);
      s.setScalar(seed.size);
      matrix.compose(p, q, s);
      mesh.current?.setMatrixAt(i, matrix);
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshLambertMaterial color="#1a2436" />
    </instancedMesh>
  );
}

/* ---------------------------------------------------------------- dust */

/**
 * Atmospheric particles: a cloud of very small points that drifts around
 * the visitor and wraps, so there is always dust in the air wherever they
 * stand and never a visible edge to it.
 */
function Dust({ count, reduced }: { count: number; reduced: boolean }) {
  const { camera } = useThree();
  const points = useRef<THREE.Points>(null);
  const RANGE = 46;

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * RANGE * 2;
      positions[i * 3 + 1] = Math.random() * 18 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * RANGE * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color(MATERIAL.glow),
        size: 0.09,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [],
  );

  useFrame((_, raw) => {
    const node = points.current;
    if (!node || reduced) return;
    const delta = Math.min(raw, 0.05);
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const array = pos.array as Float32Array;
    const cx = camera.position.x;
    const cz = camera.position.z;
    for (let i = 0; i < count; i += 1) {
      let x = array[i * 3]! + delta * 0.35;
      let y = array[i * 3 + 1]! + Math.sin(i + x * 0.1) * delta * 0.12;
      let z = array[i * 3 + 2]! + delta * 0.18;
      /* Wrap around the visitor. */
      if (x - cx > RANGE) x -= RANGE * 2;
      if (x - cx < -RANGE) x += RANGE * 2;
      if (z - cz > RANGE) z -= RANGE * 2;
      if (z - cz < -RANGE) z += RANGE * 2;
      if (y > 16) y = -2;
      array[i * 3] = x;
      array[i * 3 + 1] = y;
      array[i * 3 + 2] = z;
    }
    pos.needsUpdate = true;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}

/* -------------------------------------------------------------- floaters */

/**
 * Loose platforms drifting between the islands and the horizon: fragments
 * of the same architecture, unreachable, at fifty to a hundred and forty
 * metres out and anywhere from below the sea line to high overhead. They are
 * the middle distance the world was missing — near enough to have edges and
 * lit rims, far enough that nobody wonders how to get to them.
 */
function Floaters({ reduced }: { reduced: boolean }) {
  const rocks = useRef<THREE.InstancedMesh>(null);
  const turfs = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const greens = useRef<THREE.InstancedMesh>(null);
  const pinks = useRef<THREE.InstancedMesh>(null);
  const falls = useRef<THREE.InstancedMesh>(null);
  const lamps = useRef<THREE.InstancedMesh>(null);
  const water = useWaterTexture();
  const COUNT = 26;
  const TREES = 3;
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.4;
        const radius = 70 + Math.random() * 110;
        const w = 6 + Math.random() * 16;
        return {
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          y: -4 + Math.random() * 34,
          w,
          rot: Math.random() * Math.PI,
          drift: Math.random() * Math.PI * 2,
          speed: 0.04 + Math.random() * 0.06,
          depth: w * (0.6 + Math.random() * 0.6),
          fall: Math.random() < 0.75,
          fallSide: Math.random() * Math.PI * 2,
          trees: Array.from({ length: TREES }, () => ({
            ox: (Math.random() - 0.5) * w * 0.7,
            oz: (Math.random() - 0.5) * w * 0.7,
            h: 1.6 + Math.random() * 2.4,
            r: 1.2 + Math.random() * 1.6,
            pink: Math.random() < 0.3,
          })),
        };
      }),
    [],
  );
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const time = useRef(0);
  const ZERO = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);

  useFrame((_, delta) => {
    if (!reduced) time.current += Math.min(delta, 0.05);
    const t = time.current;
    water.offset.y -= Math.min(delta, 0.05) * 0.22;
    seeds.forEach((seed, i) => {
      const bob = Math.sin(t * seed.speed * 2 + seed.drift) * 1.1;
      const yaw = seed.rot + t * seed.speed * 0.08;
      e.set(0, yaw, Math.sin(t * seed.speed + seed.drift) * 0.015);
      q.setFromEuler(e);
      const top = seed.y + bob;
      /* The rock: an inverted faceted cone hanging under the turf. */
      p.set(seed.x, top - seed.depth / 2, seed.z);
      s.set(seed.w, seed.depth, seed.w * 0.85);
      rocks.current?.setMatrixAt(i, matrix.compose(p, q, s));
      /* The turf on top. */
      p.set(seed.x, top, seed.z);
      s.set(seed.w * 1.02, 0.6, seed.w * 0.87);
      turfs.current?.setMatrixAt(i, matrix.compose(p, q, s));
      /* Trees. */
      seed.trees.forEach((tree, k) => {
        const idx = i * TREES + k;
        const cx = seed.x + Math.cos(yaw) * tree.ox - Math.sin(yaw) * tree.oz;
        const cz = seed.z + Math.sin(yaw) * tree.ox + Math.cos(yaw) * tree.oz;
        p.set(cx, top + tree.h / 2, cz);
        s.set(0.18, tree.h, 0.18);
        trunks.current?.setMatrixAt(idx, matrix.compose(p, q, s));
        p.set(cx, top + tree.h + tree.r * 0.5, cz);
        s.set(tree.r, tree.r * 0.9, tree.r);
        (tree.pink ? pinks : greens).current?.setMatrixAt(idx, matrix.compose(p, q, s));
        (tree.pink ? greens : pinks).current?.setMatrixAt(idx, ZERO);
      });
      /* A waterfall off one edge, falling into the sea. */
      if (seed.fall) {
        const fx = seed.x + Math.cos(seed.fallSide + yaw) * seed.w * 0.46;
        const fz = seed.z + Math.sin(seed.fallSide + yaw) * seed.w * 0.46;
        const h = Math.max(8, top + 2.6 + 6);
        e.set(0, -(seed.fallSide + yaw) + Math.PI / 2, 0);
        q.setFromEuler(e);
        p.set(fx, top - h / 2 + 0.2, fz);
        s.set(2 + seed.w * 0.12, h, 1);
        falls.current?.setMatrixAt(i, matrix.compose(p, q, s));
      } else {
        falls.current?.setMatrixAt(i, ZERO);
      }
      /* A light somewhere on the turf. */
      p.set(seed.x + seed.w * 0.2, top + 0.9, seed.z - seed.w * 0.15);
      s.set(1, 1, 1);
      lamps.current?.setMatrixAt(i, matrix.compose(p, q, s));
    });
    for (const ref of [rocks, turfs, trunks, greens, pinks, falls, lamps]) {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group name="cosmos:floaters">
      <instancedMesh ref={rocks} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.06, 1, 7, 1]} />
        <meshLambertMaterial color="#1c2030" flatShading />
      </instancedMesh>
      <instancedMesh ref={turfs} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.52, 1, 9]} />
        <meshLambertMaterial color="#3f6047" flatShading />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, COUNT * TREES]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.7, 1, 5]} />
        <meshLambertMaterial color="#1f1a1a" />
      </instancedMesh>
      <instancedMesh ref={greens} args={[undefined, undefined, COUNT * TREES]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshLambertMaterial color="#496b50" flatShading />
      </instancedMesh>
      <instancedMesh ref={pinks} args={[undefined, undefined, COUNT * TREES]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#f2a7c7" emissive="#f2a7c7" emissiveIntensity={0.25} roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={falls} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={water} color="#cfeeff" transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={lamps} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <sphereGeometry args={[0.35, 8, 6]} />
        <meshBasicMaterial color="#ffe6cf" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* --------------------------------------------------------------- ships */

/** Six lights crossing the sky on long slow arcs. Read as distant traffic. */
function Ships({ reduced }: { reduced: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const COUNT = 6;
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        radius: 120 + i * 32,
        height: 40 + i * 14,
        speed: 0.018 + Math.random() * 0.012,
        phase: (i / COUNT) * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 0.3,
      })),
    [],
  );
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const time = useRef(0);

  useFrame((_, delta) => {
    if (!reduced) time.current += Math.min(delta, 0.05);
    const t = time.current;
    seeds.forEach((seed, i) => {
      const a = seed.phase + t * seed.speed;
      const x = Math.cos(a) * seed.radius;
      const z = Math.sin(a) * seed.radius;
      const y = seed.height + Math.sin(a * 3) * 4 * seed.tilt;
      matrix.makeRotationY(-a);
      matrix.setPosition(x, y, z);
      mesh.current?.setMatrixAt(i, matrix);
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      {/* A long thin streak: the light and its trail in one box. */}
      <boxGeometry args={[0.5, 0.35, 9]} />
      <meshBasicMaterial color="#cfe6ff" toneMapped={false} transparent opacity={0.8} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------ the whole */

/* --------------------------------------------------------------- planet */

const PLANET_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }

  void main() {
    vec3 n = normalize(vNormal);
    // Lit from the upper left, with a soft terminator and a blue limb.
    float light = clamp(dot(n, normalize(vec3(-0.5, 0.6, 0.7))), 0.0, 1.0);
    float limb = pow(1.0 - clamp(dot(n, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.5);

    // Cloud bands that drift.
    float bands = noise(vec2(vUv.x * 9.0 + uTime * 0.01, vUv.y * 22.0));
    float detail = noise(vec2(vUv.x * 30.0 - uTime * 0.02, vUv.y * 60.0));
    vec3 sea = vec3(0.07, 0.26, 0.6);
    vec3 cloud = vec3(0.78, 0.88, 1.0);
    // Continents: a low-frequency mass with a coast, dun and green.
    float land = noise(vec2(vUv.x * 5.0 + 3.1, vUv.y * 4.0 + 1.7)) * 0.65 + noise(vec2(vUv.x * 13.0, vUv.y * 11.0)) * 0.35;
    float coast = smoothstep(0.52, 0.6, land);
    vec3 ground = mix(vec3(0.24, 0.32, 0.2), vec3(0.42, 0.36, 0.26), noise(vec2(vUv.x * 40.0, vUv.y * 40.0)));
    vec3 surface = mix(sea, ground, coast);
    surface = mix(surface, cloud, smoothstep(0.5, 0.82, bands * 0.7 + detail * 0.3));

    // The mark: three left-aligned bars, lit, on the face that looks at the
    // settlement. Measured proportions: widths 34 / 24.5 / 15 on an 11 pitch.
    vec2 m = (vUv - vec2(0.5, 0.5)) * vec2(6.0, 6.0);
    float bar = 0.0;
    for (int i = 0; i < 3; i++) {
      float w = (i == 0) ? 1.0 : (i == 1) ? 0.72 : 0.44;
      float y0 = 0.33 - float(i) * 0.323;
      float inX = step(-0.5, m.x) * step(m.x, -0.5 + w);
      float inY = step(y0 - 0.108, m.y) * step(m.y, y0 + 0.108);
      bar = max(bar, inX * inY);
    }
    float onFace = smoothstep(0.55, 0.85, dot(n, vec3(0.0, 0.0, 1.0)));
    vec3 colour = surface * (0.16 + light * 1.05);
    // The night side keeps a faint city glow along the terminator.
    colour += vec3(0.9, 0.7, 0.45) * coast * (1.0 - light) * 0.08;
    colour += vec3(0.45, 0.72, 1.0) * limb * 1.1;
    colour = mix(colour, vec3(0.92, 0.97, 1.0), bar * onFace * 0.92);
    gl_FragColor = vec4(colour, 1.0);
  }
`;

const PLANET_VERTEX = /* glsl */ `
  precision mediump float;
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * The planet.
 *
 * A world hanging in the sky to the north, behind the hub and the gate, with
 * the Archon mark lit across the face that looks back at the settlement. It
 * is the far end of the world's main axis — the thing every sightline down
 * the plaza ends on — and the one object in the sky big enough to be a
 * destination the visitor cannot reach.
 */
function Planet({ reduced }: { reduced: boolean }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const moon = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (reduced) return;
    uniforms.uTime.value += Math.min(delta, 0.05);
    if (moon.current) moon.current.rotation.y += Math.min(delta, 0.05) * 0.01;
  });
  return (
    <group name="cosmos:planet" position={[-150, 195, -470]}>
      <mesh rotation={[0.1, 0, 0.12]}>
        <sphereGeometry args={[108, 64, 40]} />
        <shaderMaterial vertexShader={PLANET_VERTEX} fragmentShader={PLANET_FRAGMENT} uniforms={uniforms} fog={false} />
      </mesh>
      {/* Atmosphere: two additive shells that only show at the limb — the
          scattering, and a wider softer bloom. */}
      <mesh>
        <sphereGeometry args={[114, 40, 28]} />
        <meshBasicMaterial color="#5fb0ff" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} toneMapped={false} fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[126, 40, 28]} />
        <meshBasicMaterial color="#3d7fe0" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} toneMapped={false} fog={false} />
      </mesh>
      {/* A small moon, up and to the right, in orbit. */}
      <group ref={moon}>
        <mesh position={[168, 92, -30]}>
          <sphereGeometry args={[16, 24, 16]} />
          <meshStandardMaterial color="#8e97a8" roughness={1} metalness={0} fog={false} />
        </mesh>
        <mesh position={[168, 92, -30]}>
          <sphereGeometry args={[17.5, 20, 14]} />
          <meshBasicMaterial color="#9ec7ff" transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} toneMapped={false} fog={false} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Two great rings of light around the hub, tilted, turning slowly — the
 * orbital architecture that says the plaza is the centre of somewhere.
 */
function Halo({ reduced }: { reduced: boolean }) {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (reduced) return;
    const d = Math.min(delta, 0.05);
    if (a.current) a.current.rotation.z += d * 0.012;
    if (b.current) b.current.rotation.z -= d * 0.008;
  });
  return (
    <group name="cosmos:halo" position={[0, 66, -10]}>
      <mesh ref={a} rotation={[Math.PI / 2 + 0.16, 0, 0]}>
        <torusGeometry args={[72, 0.45, 8, 180]} />
        <meshBasicMaterial color="#ffe9d5" transparent opacity={0.45} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={b} rotation={[Math.PI / 2 - 0.3, 0.4, 0]} position={[0, 14, 0]}>
        <torusGeometry args={[98, 0.4, 8, 200]} />
        <meshBasicMaterial color="#b49cff" transparent opacity={0.38} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[Math.PI / 2 + 0.08, -0.5, 0]} position={[0, 30, 0]}>
        <torusGeometry args={[132, 0.3, 8, 220]} />
        <meshBasicMaterial color="#8fd0ff" transparent opacity={0.28} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/**
 * Crystal spires: tall luminous shards standing on the further islands, the
 * vertical light the reference world is full of. Instanced.
 */
function Spires({ reduced }: { reduced: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const glow = useRef<THREE.InstancedMesh>(null);
  const COUNT = 18;
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const angle = (i / COUNT) * Math.PI * 2 + 0.3;
        const radius = 120 + (i % 3) * 45;
        return {
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          y: -4 + (i % 4) * 6,
          h: 26 + (i % 5) * 9,
          r: 2.2 + (i % 3) * 0.9,
          tilt: ((i % 5) - 2) * 0.04,
          drift: i * 0.7,
          violet: i % 3 === 0,
        };
      }),
    [],
  );
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const time = useRef(0);
  useFrame((_, delta) => {
    if (!reduced) time.current += Math.min(delta, 0.05);
    const t = time.current;
    seeds.forEach((seed, i) => {
      const bob = Math.sin(t * 0.15 + seed.drift) * 1.4;
      e.set(seed.tilt, t * 0.03 + seed.drift, 0);
      q.setFromEuler(e);
      p.set(seed.x, seed.y + seed.h / 2 + bob, seed.z);
      s.set(seed.r, seed.h, seed.r);
      mesh.current?.setMatrixAt(i, matrix.compose(p, q, s));
      s.set(seed.r * 1.35, seed.h * 1.04, seed.r * 1.35);
      glow.current?.setMatrixAt(i, matrix.compose(p, q, s));
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
    if (glow.current) glow.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group name="cosmos:spires">
      <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color="#c9ecff" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={glow} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color="#6fb8ff" transparent opacity={0.28} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>
    </group>
  );
}

/* ----------------------------------------------------------------- comet */

let cometTexture: THREE.CanvasTexture | null = null;
function useCometTexture() {
  return useMemo(() => {
    if (cometTexture) return cometTexture;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      /* The tail: brightest at the head, fading along its length and
         across its width, green with a white core. */
      const along = ctx.createLinearGradient(0, 0, 512, 0);
      along.addColorStop(0, "rgba(120,255,190,0)");
      along.addColorStop(0.5, "rgba(110,245,175,0.55)");
      along.addColorStop(0.9, "rgba(200,255,225,1)");
      along.addColorStop(1, "rgba(255,255,255,1)");
      ctx.fillStyle = along;
      ctx.fillRect(0, 0, 512, 64);
      /* A cyan edge either side of the green, then soft to nothing. */
      const edge = ctx.createLinearGradient(0, 0, 0, 64);
      edge.addColorStop(0, "rgba(94,230,255,0)");
      edge.addColorStop(0.2, "rgba(94,230,255,0.5)");
      edge.addColorStop(0.5, "rgba(94,230,255,0)");
      edge.addColorStop(0.8, "rgba(94,230,255,0.5)");
      edge.addColorStop(1, "rgba(94,230,255,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, 512, 64);
      const across = ctx.createLinearGradient(0, 0, 0, 64);
      across.addColorStop(0, "rgba(0,0,0,1)");
      across.addColorStop(0.5, "rgba(0,0,0,0)");
      across.addColorStop(1, "rgba(0,0,0,1)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = across;
      ctx.fillRect(0, 0, 512, 64);
    }
    cometTexture = new THREE.CanvasTexture(canvas);
    cometTexture.colorSpace = THREE.SRGBColorSpace;
    return cometTexture;
  }, []);
}

/**
 * A green comet.
 *
 * Every few minutes — the first about half a minute in — a bright green
 * head with a long, thin tail crosses the sky over the world in five or six
 * seconds, high, from one side to the other on a slightly falling line, and
 * the sky lifts a little green while it passes. It never comes near the
 * ground; it is a thing to catch sight of, not an event to survive.
 */
function Comet() {
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const tail = useRef<THREE.Mesh>(null);
  const texture = useCometTexture();
  const state = useRef({ next: 28 + Math.random() * 20, t: -1, from: new THREE.Vector3(), to: new THREE.Vector3(), clock: 0 });
  const DURATION = 6.2;
  const dir = useMemo(() => new THREE.Vector3(), []);

  /* QA: call the next comet now. */
  useEffect(() => {
    (window as unknown as { __archonComet?: () => void }).__archonComet = () => {
      state.current.next = state.current.clock;
    };
    return () => {
      delete (window as unknown as { __archonComet?: unknown }).__archonComet;
    };
  }, []);

  useFrame((_, raw) => {
    const delta = Math.min(raw, 0.05);
    const st = state.current;
    st.clock += delta;
    const node = group.current;
    if (!node) return;
    if (st.t < 0) {
      node.visible = false;
      if (st.clock >= st.next) {
        /* A new pass: high, far, on a line that falls a little. */
        const side = Math.random() < 0.5 ? -1 : 1;
        /* Low over the campus and in front of the skyline: it enters at one
           side of the sky, crosses above the plaza on a falling diagonal, and
           leaves at the other — the whole pass in view from the ground. */
        st.from.set(side * 270, 46 + Math.random() * 8, -36 - Math.random() * 10);
        st.to.set(-side * 270, 24 + Math.random() * 6, 10 + Math.random() * 12);
        worldEvents.emit("comet");
        st.t = 0;
      }
      return;
    }
    st.t += delta;
    const k = Math.min(1, st.t / DURATION);
    node.visible = true;
    node.position.lerpVectors(st.from, st.to, k);
    dir.subVectors(st.to, st.from).normalize();
    /* The tail points back along the way it came. */
    node.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
    const fade = Math.sin(Math.min(1, k) * Math.PI);
    if (head.current) {
      (head.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * fade;
      head.current.scale.setScalar(1 + Math.sin(st.clock * 30) * 0.08);
    }
    if (tail.current) (tail.current.material as THREE.MeshBasicMaterial).opacity = fade;
    /* A breath of green in the sky while it passes. */
    moodStore.tint(0.012 * fade, "#5ef0a8");
    if (k >= 1) {
      st.t = -1;
      st.next = st.clock + 90 + Math.random() * 90;
    }
  });

  return (
    <group ref={group} visible={false} name="cosmos:comet">
      <mesh ref={tail} position={[-46, 0, 0]}>
        <planeGeometry args={[92, 5]} />
        <meshBasicMaterial map={texture} transparent opacity={0} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} fog={false} />
      </mesh>
      <mesh ref={head}>
        <sphereGeometry args={[1.6, 12, 10]} />
        <meshBasicMaterial color="#1fd37a" transparent opacity={0} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[3.4, 12, 10]} />
        <meshBasicMaterial color="#3fe39a" transparent opacity={0.4} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[5.2, 12, 10]} />
        <meshBasicMaterial color="#5ee6ff" transparent opacity={0.1} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
    </group>
  );
}

export function Cosmos({ reduced, compact }: { reduced: boolean; compact: boolean }) {
  const { scene } = useThree();
  const fog = useMemo(() => new THREE.FogExp2("#070c1a", 0.0042), []);

  useEffect(() => {
    scene.fog = fog;
    scene.background = null;
    return () => {
      scene.fog = null;
    };
  }, [fog, scene]);

  /* The one place the mood is stepped and the fog written. */
  useFrame((_, delta) => {
    moodStore.set(zoneStore.get());
    moodStore.step(Math.min(delta, 0.05));
    fog.color.copy(moodStore.current.fog);
    fog.density = moodStore.current.fogDensity;
  });

  return (
    <group name="cosmos:cosmos">
      <Sky reduced={reduced} />
      <Stars count={compact ? 1400 : 3200} />
      <Planet reduced={reduced} />
      <Halo reduced={reduced} />
      <Spires reduced={reduced} />
      <DistantStructures reduced={reduced} />
      <Floaters reduced={reduced} />
      <Asteroids reduced={reduced} />
      {!reduced ? <Comet /> : null}
      {!compact ? <Dust count={reduced ? 200 : 900} reduced={reduced} /> : null}
      <Ships reduced={reduced} />
    </group>
  );
}
