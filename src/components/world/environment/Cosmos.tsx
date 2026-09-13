"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { moodStore } from "@/components/world/environment/mood";
import { MATERIAL } from "@/components/world/pieces/Kit";
import { worldEvents } from "@/components/world/systems/events";
import { zoneStore } from "@/components/world/systems/focus";

/**
 * Everything above and beyond the islands.
 *
 * Night space, as it is: black, with stars in it. The sky is near-black with
 * only the faintest trace of deep blue down at the horizon, where the sea
 * lights the air; the stars are many and small, at a natural spread of
 * brightness — most barely there, a few clearly bright, a handful with a
 * soft halo — a little warmer or cooler each, and only some of them
 * shimmering. There are no nebulae, no planets, no rings in the sky and no
 * skyline on the horizon: the campus is the only architecture, and it
 * stands out against the dark because nothing competes with it.
 *
 * What moves: dust in the air near the visitor, on a desktop, and now and
 * then a comet — an event, green at its core, that crosses the view and is
 * gone without colouring the sky. Two draws, and a third while a comet passes.
 */

/* ------------------------------------------------------------------ sky */

const SKY_VERTEX = /* glsl */ `
  precision mediump float;
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform vec3 uHorizon;
  varying vec3 vDir;

  void main() {
    vec3 d = normalize(vDir);
    // Black overhead. Toward the horizon the faintest deep blue, the sea's
    // light in the lowest air, and nothing above a few degrees.
    vec3 colour = vec3(0.0035, 0.004, 0.007);
    float low = exp(-pow(max(d.y, 0.0) * 5.5, 2.0));
    colour += uHorizon * low * 0.55;
    // Below the sea line the sky is never seen, but keep it dark.
    colour *= smoothstep(-0.35, 0.0, d.y) * 0.6 + 0.4;
    gl_FragColor = vec4(colour, 1.0);
  }
`;

function Sky() {
  const uniforms = useMemo(() => ({ uHorizon: { value: new THREE.Color("#0a1224") } }), []);
  useFrame(() => {
    /* The district's fog, much darker: the horizon keeps a trace of the
       place without ever becoming a coloured band. */
    uniforms.uHorizon.value.copy(moodStore.current.fog).multiplyScalar(0.7);
  });
  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[640, 32, 16]} />
      <shaderMaterial vertexShader={SKY_VERTEX} fragmentShader={SKY_FRAGMENT} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

/* ---------------------------------------------------------------- stars */

/**
 * The stars: one draw. Positions over the whole sky down to the sea line;
 * brightness from a steep power law so the sky is mostly faint points with
 * a few that stand out; colour a small step either side of white; one in
 * six shimmers, slowly. Sizes are in device pixels and follow the pixel
 * ratio, so a phone's stars are as fine as a desktop's.
 */
function Stars({ count, reduced }: { count: number; reduced: boolean }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const bright = new Float32Array(count);
    const tint = new Float32Array(count);
    const twinkle = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 1.08 - 0.08);
      const r = 380;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      bright[i] = Math.pow(Math.random(), 5.5);
      tint[i] = Math.random() * 2 - 1;
      twinkle[i] = Math.random() < 0.16 ? 1 : 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aBright", new THREE.BufferAttribute(bright, 1));
    g.setAttribute("aTint", new THREE.BufferAttribute(tint, 1));
    g.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkle, 1));
    return g;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPixel: { value: 1 } },
        vertexShader: /* glsl */ `
          precision mediump float;
          attribute float aBright;
          attribute float aTint;
          attribute float aTwinkle;
          uniform float uTime;
          uniform float uPixel;
          varying float vLight;
          varying vec3 vColour;
          varying float vHalo;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            float seed = position.x * 0.013 + position.z * 0.017;
            float shimmer = 1.0 - aTwinkle * 0.35 * (0.5 + 0.5 * sin(uTime * (0.6 + fract(seed) * 1.4) + seed * 40.0));
            vLight = (0.28 + aBright * 1.6) * shimmer;
            vHalo = smoothstep(0.55, 1.0, aBright);
            vColour = aTint > 0.0 ? mix(vec3(1.0), vec3(0.78, 0.86, 1.0), aTint) : mix(vec3(1.0), vec3(1.0, 0.9, 0.78), -aTint * 0.8);
            gl_PointSize = (1.1 + aBright * 2.6 + vHalo * 3.5) * uPixel;
          }
        `,
        fragmentShader: /* glsl */ `
          precision mediump float;
          varying float vLight;
          varying vec3 vColour;
          varying float vHalo;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            // A sharp core; for the brightest few, a faint soft halo round it.
            float core = smoothstep(0.5, 0.0, d * (1.0 + vHalo * 2.2));
            float halo = vHalo * 0.22 * smoothstep(0.5, 0.0, d);
            float a = (core + halo) * vLight;
            if (a < 0.01) discard;
            gl_FragColor = vec4(vColour * a, 1.0);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [],
  );

  useFrame(({ gl }, delta) => {
    if (!reduced) material.uniforms.uTime!.value += Math.min(delta, 0.05);
    material.uniforms.uPixel!.value = gl.getPixelRatio();
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-9} name="cosmos:stars" userData={{ noReflect: true }} />;
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
        /* Fine motes, not bokeh: small and faint, so nothing near the lens
           reads as a blur. */
        size: 0.035,
        transparent: true,
        opacity: 0.32,
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

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} userData={{ noReflect: true }} />;
}

/* -------------------------------------------------------------- floaters */

/**
 * Loose platforms drifting between the islands and the horizon: fragments
 * of the same architecture, unreachable, at fifty to a hundred and forty
 * metres out and anywhere from below the sea line to high overhead. They are

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
const AHEAD = new THREE.Vector3();
const ACROSS = new THREE.Vector3();
const SCREEN = new THREE.Vector3();
const view = { visible: false, inView: false, x: 0, y: 0, height: 0 };

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
    /* QA: where the pass is on screen — normalised device coordinates. */
    (window as unknown as { __archonCometView?: () => unknown }).__archonCometView = () => ({ ...view });
    return () => {
      delete (window as unknown as { __archonComet?: unknown }).__archonComet;
      delete (window as unknown as { __archonCometView?: unknown }).__archonCometView;
    };
  }, []);

  useFrame(({ camera }, raw) => {
    const delta = Math.min(raw, 0.05);
    const st = state.current;
    st.clock += delta;
    const node = group.current;
    if (!node) return;
    if (st.t < 0) {
      node.visible = false;
      view.visible = false;
      if (st.clock >= st.next) {
        /* A new pass: high, far, on a line that falls a little. */
        const side = Math.random() < 0.5 ? -1 : 1;
        /* Low over the campus and in front of the skyline, and in front of
           the visitor: it enters at one side of whatever they are facing,
           crosses the middle of their view on a falling diagonal a hundred
           and sixty metres out, and leaves at the other — the whole pass in
           view from the ground, wherever they happen to be looking. */
        camera.getWorldDirection(AHEAD);
        AHEAD.y = 0;
        if (AHEAD.lengthSq() < 1e-4) AHEAD.set(0, 0, -1);
        AHEAD.normalize();
        ACROSS.set(-AHEAD.z, 0, AHEAD.x);
        /* A tall phone sees a narrow slice of sky: the pass is shortened to
           it, so it crosses the screen rather than flashing through. */
        const aspect = (camera as THREE.PerspectiveCamera).aspect ?? 1.6;
        const half = 250 * THREE.MathUtils.clamp(aspect / 1.6, 0.4, 1);
        const cx = camera.position.x + AHEAD.x * 160;
        const cz = camera.position.z + AHEAD.z * 160;
        st.from.set(cx + ACROSS.x * side * half - AHEAD.x * 20, camera.position.y + 34 + Math.random() * 6, cz + ACROSS.z * side * half - AHEAD.z * 20);
        st.to.set(cx - ACROSS.x * side * half + AHEAD.x * 20, camera.position.y + 16 + Math.random() * 5, cz - ACROSS.z * side * half + AHEAD.z * 20);
        worldEvents.emit("comet");
        view.inView = false;
        st.t = 0;
      }
      return;
    }
    st.t += delta;
    const k = Math.min(1, st.t / DURATION);
    node.visible = true;
    node.position.lerpVectors(st.from, st.to, k);
    SCREEN.copy(node.position).project(camera);
    view.visible = true;
    view.x = SCREEN.x;
    view.y = SCREEN.y;
    view.height = node.position.y;
    if (Math.abs(SCREEN.x) < 1 && Math.abs(SCREEN.y) < 1 && SCREEN.z < 1) view.inView = true;
    dir.subVectors(st.to, st.from).normalize();
    /* The tail points back along the way it came. */
    node.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
    const fade = Math.sin(Math.min(1, k) * Math.PI);
    if (head.current) {
      (head.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * fade;
      head.current.scale.setScalar(1 + Math.sin(st.clock * 30) * 0.08);
    }
    if (tail.current) (tail.current.material as THREE.MeshBasicMaterial).opacity = fade;
    if (k >= 1) {
      st.t = -1;
      st.next = st.clock + 90 + Math.random() * 90;
    }
  });

  return (
    <group ref={group} visible={false} name="cosmos:comet" userData={{ noReflect: true }}>
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
      <Sky />
      <Stars count={compact ? 3600 : 7000} reduced={reduced} />
      {!reduced ? <Comet /> : null}
      {!compact ? <Dust count={reduced ? 200 : 700} reduced={reduced} /> : null}
    </group>
  );
}
