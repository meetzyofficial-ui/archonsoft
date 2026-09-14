"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The mark, in the room.
 *
 * The supplied Archon Soft symbol — three left-aligned bars, 34 / 24.5 / 15
 * wide, 7.4 high on an 11-unit pitch — extruded into dark titanium and hung
 * off to the right of the page, far larger than anything else on the screen
 * and nearly the colour of the night behind it. What makes it visible is
 * light, not colour: a slow key that sweeps across the faces, a cyan fresnel
 * at the silhouette the robot's eye would throw, and every few seconds one
 * band of light that runs along the bars like a scan. It is meant to be
 * noticed late.
 *
 * Nothing here loads anything. There is no texture, no environment map and
 * no model file: three extrusions, one shader, one additive halo and a few
 * hundred points whose motion lives in the vertex shader. A phone gets fewer
 * points, a smaller mark, device-pixel-ratio 1 and thirty frames a second.
 */

export type LogoTier = "desktop" | "compact";

/* ------------------------------------------------------------------ mark */

const MARK_VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec3 vLocal;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vLocal = position;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const MARK_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform vec3 uKey;
  uniform float uSweep;
  uniform float uFade;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec3 vLocal;

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vWorld);
    vec3 l = normalize(uKey);
    vec3 h = normalize(l + v);

    /* Titanium, nearly the night: a brushed gradient across each face. */
    vec3 base = mix(vec3(0.046, 0.056, 0.074), vec3(0.086, 0.100, 0.124), clamp(vLocal.y * 0.35 + 0.5, 0.0, 1.0));
    float diffuse = max(dot(n, l), 0.0);
    float spec = pow(max(dot(n, h), 0.0), 48.0);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);

    vec3 colour = base * (0.55 + diffuse * 0.9);
    colour += vec3(0.62, 0.78, 0.90) * spec * 0.72;
    colour += vec3(0.24, 0.78, 1.0) * fres * 0.58;

    /* The scan: one soft band travelling along the bars. */
    float band = uSweep - (vWorld.x * 0.22 + vWorld.y * 0.08);
    float scan = exp(-band * band * 38.0);
    colour += vec3(0.38, 0.85, 1.0) * scan * (0.14 + 0.55 * fres);

    /* Not a solid: the faces let most of the night through and the light is
       what carries the shape — edges, the moving highlight, the scan. A
       solid dark slab read as a hole cut in the page. */
    float body = 0.34 + fres * 0.6 + spec * 0.75 + scan * 0.4 + diffuse * 0.1;
    gl_FragColor = vec4(colour, clamp(body, 0.0, 1.0) * uFade);
  }
`;

/** One bar, with its silhouette exactly the bar's: the bevel is taken from inside. */
function bar(width: number, height: number, depth: number, bevel: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(bevel, bevel);
  shape.lineTo(width - bevel, bevel);
  shape.lineTo(width - bevel, height - bevel);
  shape.lineTo(bevel, height - bevel);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geometry.translate(0, 0, -depth / 2 + bevel);
  return geometry;
}

function Mark({ tier }: { tier: LogoTier }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  /* Units: the supplied drawing divided by ten. */
  const geometries = useMemo(() => {
    const depth = 0.62;
    const bevel = 0.035;
    const parts = [
      { w: 3.4, y: 2.2 },
      { w: 2.45, y: 1.1 },
      { w: 1.5, y: 0 },
    ];
    return parts.map((part) => {
      const g = bar(part.w, 0.74, depth, bevel);
      g.translate(-1.7, part.y - 1.47 + 0.0, 0);
      return g;
    });
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: MARK_VERTEX,
        fragmentShader: MARK_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uKey: { value: new THREE.Vector3(-0.6, 0.8, 0.9) },
          uSweep: { value: -4 },
          uFade: { value: 1 },
        },
        transparent: true,
        depthWrite: true,
      }),
    [],
  );

  useEffect(
    () => () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
    },
    [geometries, material],
  );

  const smooth = useRef({ x: 0, y: 0, scroll: 0, fade: 1 });
  /* Shared with the halo, so the two dim together. */
  const fade = useMemo(() => ({ value: 1 }), []);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;
    const step = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    const u = material.uniforms;
    u.uTime!.value = t;
    /* The key walks a slow ellipse, so the light moves across the faces
       rather than the faces moving under a fixed light. */
    (u.uKey!.value as THREE.Vector3).set(Math.cos(t * 0.21) * 0.9 - 0.2, 0.7 + Math.sin(t * 0.17) * 0.3, 0.9);
    /* A scan every nine seconds, crossing in about two. */
    const cycle = (t % 9) / 9;
    u.uSweep!.value = cycle < 0.24 ? -1.4 + (cycle / 0.24) * 3.2 : 4;

    const scroll =
      window.scrollY / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    /* Present in the opening; a presence, not a picture, after it. */
    const past = Math.min(1, window.scrollY / Math.max(window.innerHeight, 1));
    const pointer = tier === "desktop" ? state.pointer : { x: 0, y: 0 };
    const k = 1 - Math.pow(0.02, step);
    smooth.current.x += (pointer.y * 0.09 - smooth.current.x) * k;
    smooth.current.y += (pointer.x * 0.16 - smooth.current.y) * k;
    smooth.current.scroll += (scroll - smooth.current.scroll) * k;
    smooth.current.fade += (1 - past * 0.5 - smooth.current.fade) * k;
    u.uFade!.value = smooth.current.fade;
    fade.value = smooth.current.fade;

    node.rotation.x = 0.1 + smooth.current.x + Math.sin(t * 0.23) * 0.03;
    node.rotation.y = -0.52 + smooth.current.y + Math.sin(t * 0.11) * 0.16 + smooth.current.scroll * 0.7;
    node.rotation.z = Math.sin(t * 0.07) * 0.012;
    const float = Math.sin(t * 0.38) * 0.06;
    if (tier === "desktop") {
      node.position.x = viewport.width * 0.28;
      node.position.y = viewport.height * 0.04 + float + smooth.current.scroll * viewport.height * 0.3;
    } else {
      node.position.x = viewport.width * 0.14;
      node.position.y = viewport.height * 0.26 + float + smooth.current.scroll * viewport.height * 0.2;
    }
  });

  /* Held against the viewport's height on a desktop and its width on a phone,
     so it is always too big to be a logo and never so big it is a wall. */
  const scale =
    tier === "desktop"
      ? Math.min((viewport.height * 0.43) / 2.94, (viewport.width * 0.32) / 3.4)
      : Math.min((viewport.width * 0.48) / 3.4, (viewport.height * 0.24) / 2.94);

  return (
    <group ref={group} scale={scale}>
      {geometries.map((geometry, i) => (
        <mesh key={i} geometry={geometry} material={material} />
      ))}
      <Halo fade={fade} />
    </group>
  );
}

/* ------------------------------------------------------------------ halo */

/** The cold light behind the mark: one additive quad, a radial falloff. */
function Halo({ fade }: { fade: { value: number } }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uFade: fade },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          precision mediump float;
          uniform float uTime;
          uniform float uFade;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv - 0.5;
            float d = length(p * vec2(1.0, 1.25));
            float glow = exp(-d * d * 9.0) * (0.13 + 0.025 * sin(uTime * 0.6)) * uFade;
            /* Alpha is the light's own amount: writing 1 here made the canvas
               opaque over the whole quad and cut a dark rectangle in the page. */
            gl_FragColor = vec4(vec3(0.22, 0.62, 0.95), glow);
          }
        `,
      }),
    [fade],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state) => {
    material.uniforms.uTime!.value = state.clock.elapsedTime;
  });
  return (
    <mesh position={[0, 0, -1.2]} material={material}>
      <planeGeometry args={[11, 9]} />
    </mesh>
  );
}

/* ------------------------------------------------------------- particles */

function Motes({ count }: { count: number }) {
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const position = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      position[i * 3] = (Math.random() - 0.5) * 22;
      position[i * 3 + 1] = (Math.random() - 0.5) * 14;
      position[i * 3 + 2] = -2 - Math.random() * 8;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -6), 20);
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixel: { value: 1 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uPixel;
        attribute float seed;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          /* A slow rise with a sideways breath; wraps top to bottom. */
          p.y = mod(p.y + 7.0 + uTime * (0.05 + seed * 0.08), 14.0) - 7.0;
          p.x += sin(uTime * 0.2 + seed * 40.0) * 0.25;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.2 + seed * 2.2) * uPixel * (10.0 / -mv.z);
          vAlpha = (0.18 + 0.32 * seed) * (0.6 + 0.4 * sin(uTime * (0.6 + seed) + seed * 20.0));
        }
      `,
      fragmentShader: /* glsl */ `
        precision mediump float;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vAlpha;
          gl_FragColor = vec4(vec3(0.62, 0.86, 1.0), a);
        }
      `,
    });
    return { geometry: g, material: m };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state) => {
    material.uniforms.uTime!.value = state.clock.elapsedTime;
    material.uniforms.uPixel!.value = state.gl.getPixelRatio();
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/* ---------------------------------------------------------------- driver */

/**
 * The clock. The canvas renders on demand and this asks for frames at the
 * tier's rate, so a phone draws thirty a second rather than sixty, and a
 * hidden tab draws none.
 */
function Driver({ fps, onFirstFrame }: { fps: number; onFirstFrame: () => void }) {
  const invalidate = useThree((state) => state.invalidate);
  const told = useRef(false);
  useFrame(() => {
    if (!told.current) {
      told.current = true;
      onFirstFrame();
    }
  });
  useEffect(() => {
    let frame = 0;
    let last = 0;
    const interval = 1000 / fps;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden) return;
      if (now - last >= interval - 2) {
        last = now;
        invalidate();
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [fps, invalidate]);
  return null;
}

export default function LogoFieldScene({
  tier,
  onReady,
}: {
  tier: LogoTier;
  onReady: () => void;
}) {
  const desktop = tier === "desktop";
  return (
    <Canvas
      frameloop="demand"
      dpr={desktop ? [1, 1.25] : 1}
      gl={{
        /* No multisampling: the mark's edges are lit by the fresnel term, and
           a 4× buffer the size of the screen was most of the layer's memory. */
        antialias: false,
        alpha: true,
        powerPreference: desktop ? "default" : "low-power",
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0, 0, 10], fov: 34 }}
      style={{ pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.setClearAlpha(0);
        gl.toneMapping = THREE.NoToneMapping;
      }}
    >
      <Driver fps={desktop ? 60 : 30} onFirstFrame={onReady} />
      <Mark tier={tier} />
      <Motes count={desktop ? 260 : 70} />
    </Canvas>
  );
}
