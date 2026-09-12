"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Robot } from "@/components/world/avatar/Robot";
import {
  Archive,
  Boards,
  Bridges,
  Gallery,
  Hub,
  Labs,
  Lighting,
  Shipped,
  Systems,
  Walls,
} from "@/components/world/districts/Districts";
import { Display } from "@/components/world/displays/Display";
import { Cosmos } from "@/components/world/environment/Cosmos";
import { Ocean } from "@/components/world/environment/Ocean";
import { Reflections } from "@/components/world/environment/Reflections";
import { Animals } from "@/components/world/npc/Animals";
import { Crowd } from "@/components/world/npc/Crowd";
import { Guides } from "@/components/world/npc/Guides";
import { Host } from "@/components/world/npc/Host";
import { useContactTexture } from "@/components/world/pieces/Kit";
import { Explorer } from "@/components/world/systems/Explorer";
import { EYE, VIEWPOINTS, type ZoneId } from "@/data/world-map";
import type { PreparedDisplay, PreparedGuide, WorldPayload } from "@/lib/worldPayload";

/**
 * Archon World.
 *
 * The Canvas, the systems and the districts, and nothing else. Everything that
 * has a shape is in `districts`, everything beyond them is in `environment`,
 * everything that has words in it was resolved on the server, and everything
 * that moves is in `systems`, `avatar` or `npc` — so this file stays the one
 * place you can read to find out what the world is made of.
 */

export type WorldMode = "explore" | "tour" | "overture";

export function WorldScene({
  payload,
  mode,
  compact,
  tourZone,
  reduced,
  onOpen,
  onTalk,
  onHost,
  host,
  onReady,
}: {
  payload: WorldPayload;
  mode: WorldMode;
  /** The smaller scene, for a phone or a narrow window. */
  compact: boolean;
  /** Which district the guided tour is standing in. Ignored while exploring. */
  tourZone: ZoneId;
  reduced: boolean;
  onOpen: (display: PreparedDisplay) => void;
  onTalk: (guide: PreparedGuide) => void;
  onHost: () => void;
  host: { label: string; action: string };
  onReady?: () => void;
}) {
  /* A phone gets the guided tour, fewer particles and no dust. */
  /* The pixel ratio follows the device: a phone with four cores and little
     memory renders at 1×, a strong one at 1.25×, a desktop up to 1.5×. */
  const dpr = useMemo<[number, number]>(() => {
    if (!compact) return [1, 1.5];
    if (typeof navigator === "undefined") return [1, 1];
    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
    return cores >= 6 && memory >= 6 ? [1, 1.25] : [1, 1];
  }, [compact]);
  return (
    <Canvas
      /* Capped so a high-density display does not render four times the pixels
         a scene made mostly of flat surfaces needs. */
      dpr={dpr}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      /* A long lens. Wide angles exaggerate convergence and make a large room
         look like a small one seen from close up; architecture is photographed
         long, and the whole job of this world is believable scale. */
      camera={{ fov: 58, near: 0.1, far: 900, position: [0, EYE, 24] }}
      onCreated={({ gl, scene, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        /* Where the draw calls go: visible, in-frustum objects tallied under
           the nearest named ancestor. A QA hook, not a runtime cost. */
        (window as unknown as { __archonBreakdown?: () => Record<string, number> }).__archonBreakdown = () => {
          const frustum = new THREE.Frustum();
          camera.updateMatrixWorld();
          frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
          );
          const out: Record<string, number> = {};
          scene.traverseVisible((object) => {
            const mesh = object as THREE.Mesh;
            if (!mesh.isMesh && !(object as THREE.Points).isPoints) return;
            if (mesh.frustumCulled && mesh.geometry && !frustum.intersectsObject(mesh)) return;
            let owner: THREE.Object3D | null = object;
            while (owner && !owner.name) owner = owner.parent;
            const key = owner?.name ?? "unnamed";
            out[key] = (out[key] ?? 0) + 1;
          });
          return out;
        };
        gl.toneMappingExposure = 1.55;
        /* The frame budget, readable from the console and the QA harness:
           draw calls and triangles for the last rendered frame. */
        (window as unknown as { __archonInfo?: () => unknown }).__archonInfo = () => ({
          calls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          points: gl.info.render.points,
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
        });
        (window as unknown as { __archonLod?: () => unknown }).__archonLod = () => {
          let tagged = 0;
          let shown = 0;
          const faces: string[] = [];
          const v = new THREE.Vector3();
          scene.traverse((object) => {
            if (object.userData.lod) {
              tagged += 1;
              if (object.visible) shown += 1;
            }
          });
          scene.traverseVisible((object) => {
            if (object.name === "face") {
              object.getWorldPosition(v);
              let owner: THREE.Object3D | null = object;
              while (owner && !["npc", "host", "crowd"].includes(owner.name)) owner = owner.parent;
              let root: THREE.Object3D | null = owner;
              while (root && root.parent && !["crowd", "host", "guides"].includes(root.parent.name ?? "")) root = root.parent;
              faces.push(`${root?.parent?.name ?? "?"}:${v.x.toFixed(0)},${v.z.toFixed(0)}`);
            }
          });
          return { tagged, shown, faces };
        };
        onReady?.();
      }}
      frameloop={reduced && mode === "tour" ? "demand" : "always"}
    >
      <World
        payload={payload}
        mode={mode}
        tourZone={tourZone}
        reduced={reduced}
        compact={compact}
        onOpen={onOpen}
        onTalk={onTalk}
        onHost={onHost}
        host={host}
      />
    </Canvas>
  );
}

function World({
  payload,
  mode,
  tourZone,
  reduced,
  compact,
  onOpen,
  onTalk,
  onHost,
  host,
}: {
  payload: WorldPayload;
  mode: WorldMode;
  tourZone: ZoneId;
  reduced: boolean;
  compact: boolean;
  onOpen: (display: PreparedDisplay) => void;
  onTalk: (guide: PreparedGuide) => void;
  onHost: () => void;
  host: { label: string; action: string };
}) {
  const texture = useContactTexture();
  useEffect(() => () => texture.dispose(), [texture]);

  const open = useCallback((display: PreparedDisplay) => onOpen(display), [onOpen]);
  const talk = useCallback((guide: PreparedGuide) => onTalk(guide), [onTalk]);

  return (
    <>
      <Cosmos reduced={reduced} compact={compact} />
      <Ocean reduced={reduced} />
      <Lighting />
      <Reflections compact={compact} />

      {mode === "explore" ? (
        <>
          <Explorer active />
          <Robot />
        </>
      ) : mode === "tour" ? (
        <>
          <Tour zone={tourZone} reduced={reduced} />
          {/* The explorer stands at the arrival, so the tour has a figure
              in it and the plaza a scale. */}
          <Robot />
        </>
      ) : (
        <>
          <Overture reduced={reduced} />
          <Robot />
        </>
      )}

      <Walls />
      <Bridges texture={texture} />
      <Hub texture={texture} locale={payload.locale} />
      <Gallery texture={texture} />
      <Shipped texture={texture} installations={payload.installations} />
      {/* The far districts a frame or two after the hub, so the first frame
          carries the plaza, the landmark and the people at the arrival. */}
      <Staged frames={compact ? 2 : 1}>
        <Boards
          texture={texture}
          installation={payload.installations.find((one) => one.id === "dppano")}
        />
        <Labs texture={texture} />
        <Systems texture={texture} />
        <Archive texture={texture} />
      </Staged>

      {payload.displays.map((display) => (
        <Display key={display.id} display={display} texture={texture} onOpen={open} />
      ))}

      {/* The people. On a phone only the first two of each group, and the
          guides still register so the tour can talk to them. */}
      <Guides
        guides={compact ? payload.guides.map((g) => ({ ...g, npcCount: 2 as const })) : payload.guides}
        onTalk={talk}
      />
      {/* The host by the arrival, at once; the population and the animals a
          few frames later, so the first frame is not held up building them. */}
      <Host label={host.label} action={host.action} onTalk={onHost} />
      <Staged frames={compact ? 5 : 3}>
        <Crowd compact={compact} />
      </Staged>
      <Staged frames={compact ? 8 : 6}>
        <Animals compact={compact} />
      </Staged>
    </>
  );
}

/* ---------------------------------------------------------------- staged */

/**
 * Mount after `frames` frames have rendered.
 *
 * The world's heaviest constructions — thirty-eight people, eight animals,
 * the campus facades — are built a few frames after the critical scene, so
 * the first frame is the islands, the landmark, the guides and the host,
 * and the population arrives over the next hundred milliseconds instead of
 * holding the first frame hostage.
 */
function Staged({ frames, children }: { frames: number; children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const count = useRef(0);
  useFrame(() => {
    if (ready) return;
    count.current += 1;
    if (count.current >= frames) setReady(true);
  });
  return ready ? <>{children}</> : null;
}

/* -------------------------------------------------------------- overture */

const OVERTURE_FROM = new THREE.Vector3(34, 46, 118);
const OVERTURE_TO = new THREE.Vector3(0.9, 5.4, 38);
const OVERTURE_LOOK_FROM = new THREE.Vector3(-110, 170, -320);
const OVERTURE_LOOK_TO = new THREE.Vector3(0, 6, 0);
const OV_POS = new THREE.Vector3();
const OV_LOOK = new THREE.Vector3();

/**
 * The opening sweep.
 *
 * Before the visitor has chosen anything the camera comes down out of the
 * sky: it begins high and far to the south-east, looking up at the planet,
 * and over a dozen seconds descends toward the plaza, its gaze falling from
 * the planet to the landmark, across the islands and the sea, to the
 * explorer standing at the arrival. Then it holds there, drifting, until the
 * visitor enters and the explorer's own camera takes over — from wherever
 * this one left it, so the hand-over is a move and not a cut.
 */
function Overture({ reduced }: { reduced: boolean }) {
  const { camera } = useThree();
  const time = useRef(0);
  useFrame((_, raw) => {
    time.current += Math.min(raw, 0.05);
    const t = reduced ? 1 : Math.min(1, time.current / 10);
    /* Ease out: fast to begin, slow to settle. */
    const k = 1 - Math.pow(1 - t, 3);
    OV_POS.lerpVectors(OVERTURE_FROM, OVERTURE_TO, k);
    /* A slow drift once settled, so the frame is never dead. */
    const drift = Math.max(0, time.current - 10);
    OV_POS.x += Math.sin(drift * 0.12) * 0.6;
    OV_POS.y += Math.sin(drift * 0.09) * 0.25;
    camera.position.copy(OV_POS);
    OV_LOOK.lerpVectors(OVERTURE_LOOK_FROM, OVERTURE_LOOK_TO, 1 - Math.pow(1 - t, 2.2));
    camera.lookAt(OV_LOOK);
  });
  return null;
}

/* ------------------------------------------------------------------ tour */

const TARGET = new THREE.Vector3();
const LOOK = new THREE.Vector3();

/**
 * The guided tour.
 *
 * What a touch device gets instead of a keyboard. The camera moves between
 * authored viewpoints and the visitor drags to look around from wherever it
 * lands. It is a smaller experience on purpose — a world you walk is a world
 * you walk, and putting a virtual joystick on a phone would make it worse than
 * both the walking version and the ordinary site.
 */
/**
 * A phone held upright sees a tall, narrow slice of the world, and from the
 * authored hub viewpoint the top bar of the mark leaves the frame. In
 * portrait the tour stands further back at the gate, looks higher, and opens
 * the lens a little; landscape keeps the authored views exactly.
 */
const PORTRAIT_VIEWS: Partial<Record<ZoneId, { at: [number, number, number]; look: [number, number, number] }>> = {
  hub: { at: [0, 6.4, 41], look: [0, 10.2, -16] },
};
const TOUR_FOV = 58;
const PORTRAIT_FOV = 66;

function Tour({ zone, reduced }: { zone: ZoneId; reduced: boolean }) {
  const { camera, gl, size } = useThree();
  const portrait = size.height > size.width;
  const view = (portrait && PORTRAIT_VIEWS[zone]) || VIEWPOINTS[zone];

  useEffect(() => {
    const lens = camera as THREE.PerspectiveCamera;
    if (!lens.isPerspectiveCamera) return;
    lens.fov = portrait ? PORTRAIT_FOV : TOUR_FOV;
    lens.updateProjectionMatrix();
    return () => {
      lens.fov = TOUR_FOV;
      lens.updateProjectionMatrix();
    };
  }, [camera, portrait]);
  const drag = useRef({ yaw: 0, pitch: 0, active: false, x: 0, y: 0 });
  const settled = useRef(new THREE.Vector3(...view.at));

  /* Dragging to look. The offsets are additive to the authored aim, so the
     visitor can look around without ever losing what they were brought to
     see. */
  useEffect(() => {
    const canvas = gl.domElement;
    const state = drag.current;
    const start = (event: PointerEvent) => {
      state.active = true;
      state.x = event.clientX;
      state.y = event.clientY;
    };
    const move = (event: PointerEvent) => {
      if (!state.active) return;
      state.yaw -= (event.clientX - state.x) * 0.0038;
      state.pitch = THREE.MathUtils.clamp(
        state.pitch - (event.clientY - state.y) * 0.0032,
        -0.6,
        0.5,
      );
      state.yaw = THREE.MathUtils.clamp(state.yaw, -0.85, 0.85);
      state.x = event.clientX;
      state.y = event.clientY;
    };
    const end = () => {
      state.active = false;
    };
    canvas.addEventListener("pointerdown", start);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      canvas.removeEventListener("pointerdown", start);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [gl]);

  /* A new district resets the look offsets, or the visitor arrives somewhere
     new already facing a wall. */
  useEffect(() => {
    drag.current.yaw = 0;
    drag.current.pitch = 0;
  }, [zone]);

  useFrame((_, raw) => {
    const delta = Math.min(raw, 0.05);
    const ease = reduced ? 14 : 2.6;
    TARGET.set(...view.at);
    settled.current.lerp(TARGET, 1 - Math.exp(-ease * delta));
    camera.position.copy(settled.current);

    LOOK.set(...view.look);
    camera.lookAt(LOOK);
    camera.rotateY(drag.current.yaw);
    camera.rotateX(drag.current.pitch);
  });

  return null;
}

export type { PreparedDisplay };
