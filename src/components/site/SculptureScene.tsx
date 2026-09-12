"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The form behind the site.
 *
 * An abstract mass sitting somewhere off to the side and slightly out of
 * frame, turning about a degree every two seconds and breathing on a much
 * slower cycle than that. It is atmosphere, not an object: it is never
 * centred, it is never fully in view, it never carries a caption, and there
 * is nothing to click on it.
 *
 * Everything about the way it is made is in service of that. The material is
 * a hand-written shader rather than a physical one because a physical
 * material with an environment map would make it *shiny*, and a shiny form on
 * a white page becomes the subject of the page. What this one does instead is
 * lean on fresnel: it is nearly the colour of the paper where it faces you and
 * only picks up the blue and the clay of the atmosphere at its silhouette. It
 * reads as a mass of dense light with an edge, which is what keeps it behind
 * the type instead of competing with it.
 *
 * The geometry is displaced in the vertex shader by three sine fields at
 * different frequencies and drifts, which is enough to keep the surface from
 * ever repeating without any noise texture to upload. Detail is a function of
 * viewport width: a phone renders a quarter of the triangles.
 */

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying float vSwell;

  // Three layered fields. The relative frequencies are deliberately
  // irrational to each other so the surface never settles into a pattern.
  float field(vec3 p, float t) {
    float a = sin(p.x * 1.7 + t * 0.42) * cos(p.y * 1.3 - t * 0.31);
    float b = sin(p.y * 2.6 - t * 0.27) * cos(p.z * 2.1 + t * 0.19);
    float c = sin(p.z * 3.7 + t * 0.23) * cos(p.x * 3.1 + t * 0.35);
    return a * 0.5 + b * 0.32 + c * 0.18;
  }

  void main() {
    vec3 p = position;
    float swell = field(p, uTime);
    vec3 displaced = p + normal * swell * uAmp;

    /* The normal is re-derived from two neighbouring samples rather than
       carried over from the sphere; without this the lighting stays smooth
       while the silhouette deforms, and the form looks like a picture of a
       ball with a wobbly outline. */
    vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0) + 0.001));
    vec3 bitangent = normalize(cross(normal, tangent));
    float e = 0.06;
    vec3 pa = p + tangent * e;
    vec3 pb = p + bitangent * e;
    vec3 da = (pa + normal * field(pa, uTime) * uAmp) - displaced;
    vec3 db = (pb + normal * field(pb, uTime) * uAmp) - displaced;
    vec3 n = normalize(cross(da, db));
    if (dot(n, normal) < 0.0) n = -n;

    vec4 world = modelMatrix * vec4(displaced, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * n);
    vViewW = normalize(cameraPosition - world.xyz);
    vSwell = swell;

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform vec3 uPaper;
  uniform vec3 uSky;
  uniform vec3 uClay;
  uniform vec3 uLight;
  uniform float uOpacity;
  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying float vSwell;

  void main() {
    vec3 n = normalize(vNormalW);
    float facing = clamp(dot(n, normalize(vViewW)), 0.0, 1.0);

    // One soft key from above and behind. No specular anywhere.
    float key = clamp(dot(n, normalize(uLight)) * 0.5 + 0.5, 0.0, 1.0);
    float rim = pow(1.0 - facing, 2.2);

    // Paper where it faces us, sky at the silhouette, and the warm note only
    // where the surface swells away from the light — so the clay is a place
    // on the form rather than a tint over it.
    vec3 colour = mix(uPaper, uSky, rim * 0.9);
    colour = mix(colour, uClay, clamp(-vSwell, 0.0, 1.0) * 0.22 * (1.0 - rim));
    colour *= 0.86 + key * 0.2;

    // It fades out where it turns away. The falloff is deliberately steep
    // and starts low: at 0.34 the interior was solid enough to read as a
    // silhouette with an edge, and an edge makes it an object.
    float alpha = uOpacity * (0.1 + rim * 0.9) * smoothstep(0.0, 0.25, 1.0 - facing);
    gl_FragColor = vec4(colour, alpha);
  }
`;

function Form({ detail }: { detail: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.34 },
      uOpacity: { value: 0.5 },
      uPaper: { value: new THREE.Color("#f4f8ff") },
      uSky: { value: new THREE.Color("#a9d6f7") },
      uClay: { value: new THREE.Color("#e7c7b4") },
      uLight: { value: new THREE.Vector3(-0.4, 1, 0.6) },
    }),
    [],
  );

  /* Scroll and pointer both feed the same two numbers, and both are heavily
     smoothed toward their target in the frame loop rather than written
     directly — so a flick of the wheel turns the form over about a second
     instead of snapping it. */
  const target = useRef({ x: 0, y: 0, scroll: 0 });
  const current = useRef({ x: 0, y: 0, scroll: 0 });

  /* Thirty frames a second, not the display's. Nothing here moves fast
     enough for the difference to be visible, and halving the work halves what
     a background element takes off the main thread of a page someone is
     trying to read. */
  const carry = useRef(0);

  useFrame((state, delta) => {
    const node = mesh.current;
    if (!node) return;

    carry.current += delta;
    if (carry.current < 1 / 30) return;
    const step = Math.min(carry.current, 0.08);
    carry.current = 0;
    uniforms.uTime.value += step * 0.5;

    const pointer = state.pointer;
    target.current.x = pointer.y * 0.16;
    target.current.y = pointer.x * 0.2;
    target.current.scroll =
      typeof window === "undefined"
        ? 0
        : window.scrollY / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

    const k = 1 - Math.pow(0.0015, step);
    current.current.x += (target.current.x - current.current.x) * k;
    current.current.y += (target.current.y - current.current.y) * k;
    current.current.scroll += (target.current.scroll - current.current.scroll) * k;

    node.rotation.x = current.current.x + uniforms.uTime.value * 0.045;
    node.rotation.y = current.current.y + uniforms.uTime.value * 0.075;
    node.rotation.z = current.current.scroll * 0.5;

    /* It sinks and drifts across as the page is read, so the composition is
       not the same at the bottom of the site as at the top. */
    /* Mostly outside the frame, on the right, and sinking as the page is
       read. At no scroll position is the whole form in view — that is what
       keeps it a thing behind the site rather than an illustration on it. */
    node.position.y = 0.2 - current.current.scroll * 2.4;
    node.position.x = viewport.width * 0.44 - current.current.scroll * viewport.width * 0.55;
  });

  const scale = Math.min(Math.max(viewport.width * 0.24, 1.5), 2.8);

  return (
    <mesh ref={mesh} scale={scale}>
      <icosahedronGeometry args={[1, detail]} />
      <shaderMaterial
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

export default function SculptureScene({ compact }: { compact: boolean }) {
  return (
    <Canvas
      /* Rendered at a third of the device resolution and scaled up by the
         compositor. That is not a compromise — it is where the softness comes
         from, and it cuts the fragment cost of a full-viewport canvas by an
         order of magnitude. Antialiasing would be spent on edges this form is
         not allowed to have. */
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      dpr={compact ? 0.25 : 0.34}
      camera={{ position: [0, 0, 6], fov: 42 }}
      style={{ pointerEvents: "none" }}
      frameloop="always"
      onCreated={({ gl }) => {
        gl.setClearAlpha(0);
        gl.toneMapping = THREE.NoToneMapping;
      }}
    >
      <Form detail={compact ? 10 : 20} />
    </Canvas>
  );
}
