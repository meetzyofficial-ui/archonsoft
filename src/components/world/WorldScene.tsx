"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { AracimGoHub } from "@/components/world/districts/AracimGo";
import { Display } from "@/components/world/displays/Display";
import { Cosmos } from "@/components/world/environment/Cosmos";
import { Ocean } from "@/components/world/environment/Ocean";
import { createReflections } from "@/components/world/environment/Reflections";
import { Animals } from "@/components/world/npc/Animals";
import { Crowd } from "@/components/world/npc/Crowd";
import { Guides } from "@/components/world/npc/Guides";
import { Host } from "@/components/world/npc/Host";
import { Office } from "@/components/world/npc/Office";
import { NpcShadows } from "@/components/world/npc/shadows";
import { Trees, useContactTexture } from "@/components/world/pieces/Kit";
import { Explorer } from "@/components/world/systems/Explorer";
import { bootGuard, detectTier, GOVERNOR, QUALITY, qualityStore, type Tier } from "@/components/world/systems/quality";
import { EYE, VIEWPOINTS, ZONES, type ZoneId } from "@/data/world-map";
import { CAMPUS, TREES } from "@/data/world-campus";
import { OFFICES, DEPARTMENTS } from "@/data/departments";
import { t } from "@/lib/i18n";
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

export const WorldScene = memo(function WorldScene({
  payload,
  mode,
  compact,
  tourZone,
  reduced,
  onOpen,
  onTalk,
  onHost,
  host,
  onOffice,
  office,
  onReady,
  safe = false,
  onContextLost,
  onContextRestored,
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
  onOffice: (id: string) => void;
  office: { label: string; action: string };
  onReady?: () => void;
  /** Start in the safe tier: the world failed to start here before. */
  safe?: boolean;
  /** The graphics context was lost, and (perhaps) given back. */
  onContextLost?: () => void;
  onContextRestored?: () => void;
}) {
  /* The quality tier decides the pixel ratio the world opens at; the
     governor inside the scene steps it from there, and only on evidence. */
  const tier = useMemo(() => {
    const found = detectTier(compact, safe);
    /* Published before the scene renders, so the panels paint at the tier's
       scale the first time rather than repainting later. */
    qualityStore.tier = found;
    qualityStore.safe = safe;
    return found;
  }, [compact, safe]);
  /* The renderer forces its own context loss when the scene unmounts — on
     leaving the world, or when a lost scene is replaced — and that is not
     a failure; only a loss while this scene is mounted is reported. */
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const start = Math.min(QUALITY[tier].dpr.start, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
  return (
    <Canvas
      /* Capped so a high-density display does not render four times the pixels
         a scene made mostly of flat surfaces needs. */
      dpr={start}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      /* A long lens. Wide angles exaggerate convergence and make a large room
         look like a small one seen from close up; architecture is photographed
         long, and the whole job of this world is believable scale. */
      camera={{ fov: 58, near: 0.1, far: 900, position: [0, EYE, 24] }}
      onCreated={({ gl, scene, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        /* A lost context — the GPU process restarted, or the system took the
           memory back — is reported up rather than rendered into: the
           renderer stops drawing by itself, and the world above decides
           whether to build the scene again or say it cannot. */
        gl.domElement.addEventListener("webglcontextlost", () => {
          if (mounted.current) onContextLost?.();
        });
        gl.domElement.addEventListener("webglcontextrestored", () => {
          if (mounted.current) onContextRestored?.();
        });
        /* QA: lose the context on purpose, and ask for it back. The extension
           is looked up now: a lost context answers no extensions. */
        const extension = gl.getContext().getExtension("WEBGL_lose_context");
        (window as unknown as { __archonContext?: (lose: boolean) => void }).__archonContext = (lose) => {
          if (lose) extension?.loseContext();
          else extension?.restoreContext();
        };
        try {
          const context = gl.getContext();
          const info = context.getExtension("WEBGL_debug_renderer_info");
          const renderer = String(info ? context.getParameter(info.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER));
          qualityStore.software = /swiftshader|llvmpipe|softpipe|software/i.test(renderer);
        } catch {
          qualityStore.software = false;
        }
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
          programs: gl.info.programs?.length ?? 0,
          calls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          points: gl.info.render.points,
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
        });
        (window as unknown as { __archonLod?: () => unknown }).__archonLod = () => {
          /* People: how many there are, how many are drawn, and at which tier. */
          let tagged = 0;
          let shown = 0;
          const tiers = [0, 0, 0];
          const faces: string[] = [];
          const v = new THREE.Vector3();
          scene.traverse((object) => {
            const person = object.userData.person as { tier: number } | undefined;
            if (person) {
              tagged += 1;
              let drawn = true;
              for (let up: THREE.Object3D | null = object; up; up = up.parent) if (!up.visible) drawn = false;
              if (drawn && person.tier >= 0) {
                shown += 1;
                tiers[person.tier] = (tiers[person.tier] ?? 0) + 1;
              }
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
          return { tagged, shown, tiers, faces };
        };
        (window as unknown as { __archonQuality?: () => unknown }).__archonQuality = () => ({ ...qualityStore });
        /* The data the world is built from, for the QA harness to compare the
           scene against: departments, the campus plan, the walkable zones. */
        (window as unknown as { __archonPlan?: () => unknown }).__archonPlan = () => ({
          departments: DEPARTMENTS.map((one) => ({ id: one.id, name: one.name, tagline: one.tagline, services: one.services })),
          offices: OFFICES.map((one) => ({ id: one.id, department: one.department, at: one.office.at, arrival: one.office.arrival })),
          campus: CAMPUS,
          trees: TREES.length,
          zones: ZONES.map((zone) => ({ id: zone.id, bounds: zone.bounds })),
        });
        /* How large an office's sign is on screen right now, in CSS pixels. */
        (window as unknown as { __archonSignView?: (id: string) => unknown }).__archonSignView = (id) => {
          const sign = scene.getObjectByName(`office:${id}`)?.getObjectByName("office-sign") as THREE.Mesh | undefined;
          if (!sign) return null;
          sign.updateWorldMatrix(true, false);
          camera.updateMatrixWorld();
          const box = new THREE.Box3().setFromObject(sign);
          const size = gl.domElement.getBoundingClientRect();
          const corners = [0, 1].flatMap((a) => [0, 1].flatMap((b) => [0, 1].map((c) => new THREE.Vector3(a ? box.max.x : box.min.x, b ? box.max.y : box.min.y, c ? box.max.z : box.min.z))));
          const screen = corners.map((v) => v.project(camera));
          const xs = screen.map((v) => ((v.x + 1) / 2) * size.width);
          const ys = screen.map((v) => ((1 - v.y) / 2) * size.height);
          const inFront = screen.every((v) => v.z < 1);
          let shown = true;
          for (let up: THREE.Object3D | null = sign; up; up = up.parent) if (!up.visible) shown = false;
          return {
            text: sign.userData.text,
            cap: sign.userData.cap,
            shown,
            inFront,
            height: Math.max(...ys) - Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            centre: [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2],
            viewport: [size.width, size.height],
          };
        };
        /* The scene graph itself, for the QA harness to inspect, and a pick:
           what is under a point of the frame, in normalised device
           coordinates. */
        (window as unknown as { __archonScene?: () => THREE.Scene }).__archonScene = () => scene;
        (window as unknown as { __archonPick?: (x: number, y: number) => unknown }).__archonPick = (x, y) => {
          const caster = new THREE.Raycaster();
          caster.setFromCamera(new THREE.Vector2(x, y), camera);
          return caster.intersectObjects(scene.children, true).slice(0, 4).map((hit) => {
            const names: string[] = [];
            let owner: THREE.Object3D | null = hit.object;
            while (owner) {
              if (owner.name) names.push(owner.name);
              owner = owner.parent;
            }
            const mesh = hit.object as THREE.Mesh;
            const material = mesh.material as THREE.MeshBasicMaterial;
            return {
              names,
              geometry: mesh.geometry?.type,
              params: (mesh.geometry as unknown as { parameters?: unknown })?.parameters,
              material: material?.type,
              color: material?.color?.getHexString?.(),
              map: Boolean(material?.map),
              opacity: material?.opacity,
              distance: Math.round(hit.distance * 10) / 10,
            };
          });
        };
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
        onOffice={onOffice}
        office={office}
        tier={tier}
        onReady={onReady}
      />
    </Canvas>
  );
});

/**
 * The frame each part of the world is mounted on. Two frames between the
 * department offices, whose signs, boards and people are the heaviest thing
 * built; the boot waits for the last of them before it compiles.
 */
const STAGE = {
  host: 1,
  gallery: 2,
  trees: 3,
  lobby: 4,
  shipped: 5,
  guides: 6,
  boards: 7,
  aracimgo: 7,
  labs: 8,
  systems: 9,
  archive: 10,
  displays: 11,
  offices: 13,
  crowd: 35,
  animals: 37,
} as const;
const LAST_STAGE = Math.max(STAGE.animals, STAGE.displays + 24, STAGE.offices + 2 * 10) + 2;

type WorldProps = {
  payload: WorldPayload;
  mode: WorldMode;
  tourZone: ZoneId;
  reduced: boolean;
  compact: boolean;
  onOpen: (display: PreparedDisplay) => void;
  onTalk: (guide: PreparedGuide) => void;
  onHost: () => void;
  host: { label: string; action: string };
  onOffice: (id: string) => void;
  office: { label: string; action: string };
  tier: Tier;
  onReady?: () => void;
};

/**
 * The lights, the governor and whatever drives the camera — the only things
 * that change when the visitor enters — and the world itself, memoised
 * apart, so entering does not re-render thousands of objects.
 */
function World({ mode, tourZone, ...rest }: WorldProps) {
  return (
    <>
      <Lighting />
      <Governor tier={rest.tier} />
      {mode === "explore" ? <Explorer active /> : mode === "tour" ? <Tour zone={tourZone} reduced={rest.reduced} /> : <Overture reduced={rest.reduced} />}
      <WorldBody {...rest} />
    </>
  );
}

const WorldBody = memo(function WorldBody({
  payload,
  reduced,
  compact,
  onOpen,
  onTalk,
  onHost,
  host,
  onOffice,
  office,
  tier,
  onReady,
}: {
  payload: WorldPayload;
  reduced: boolean;
  compact: boolean;
  onOpen: (display: PreparedDisplay) => void;
  onTalk: (guide: PreparedGuide) => void;
  onHost: () => void;
  host: { label: string; action: string };
  onOffice: (id: string) => void;
  office: { label: string; action: string };
  tier: Tier;
  onReady?: () => void;
}) {
  const texture = useContactTexture();
  useEffect(() => () => texture.dispose(), [texture]);

  const open = useCallback((display: PreparedDisplay) => onOpen(display), [onOpen]);
  const talk = useCallback((guide: PreparedGuide) => onTalk(guide), [onTalk]);
  /* Everything with a shape, so the boot can hide it while it compiles.
     The lights stay outside: the compiler reads them from the scene. */
  const world = useRef<THREE.Group>(null);

  return (
    <>
      {/* What drives the camera changes with the mode (see World); the robot
          does not, so entering the world never builds it a second time. */}
      <group ref={world}>
      {/* Mounted over frames, one heavy construction to a frame: the scene is
          hidden while it builds (see Boot), so the order is about spreading
          the work, and the plaza, the mark and the robot come first. */}
      <Cosmos reduced={reduced} compact={compact} />
      <Ocean reduced={reduced} />
      <Robot />
      <Walls />
      <NpcShadows />
      <Hub texture={texture} locale={payload.locale} />
      <Staged frames={STAGE.host}>
        <Host label={host.label} action={host.action} onTalk={onHost} />
        <Bridges texture={texture} />
      </Staged>
      <Staged frames={STAGE.gallery}>
        <Gallery texture={texture} />
      </Staged>
      <Staged frames={STAGE.trees}>
        <Trees spots={TREES} />
      </Staged>
      {OFFICES.map((one) =>
        one.department === null ? (
          <Staged key={one.id} frames={STAGE.lobby}>
            <Office id={one.id} office={one.office} label={office.label} action={office.action} onTalk={onOffice} locale={payload.locale} compact={compact} />
          </Staged>
        ) : null,
      )}
      <Staged frames={STAGE.shipped}>
        <Shipped texture={texture} installations={payload.installations} />
      </Staged>
      <Staged frames={STAGE.guides}>
        {/* The people. On a phone only the first two of each group, and the
            guides still register so the tour can talk to them. */}
        <Guides guides={compact ? payload.guides.map((g) => ({ ...g, npcCount: 2 as const })) : payload.guides} onTalk={talk} />
      </Staged>
      <Staged frames={STAGE.boards}>
        <Boards texture={texture} installation={payload.installations.find((one) => one.id === "dppano")} />
      </Staged>
      <Staged frames={STAGE.aracimgo}>
        <AracimGoHub texture={texture} installation={payload.installations.find((one) => one.id === "aracimgo")} locale={payload.locale} />
      </Staged>
      <Staged frames={STAGE.labs}>
        <Labs texture={texture} />
      </Staged>
      <Staged frames={STAGE.systems}>
        <Systems texture={texture} />
      </Staged>
      <Staged frames={STAGE.archive}>
        <Archive texture={texture} />
      </Staged>
      {/* The panels, one a frame: the ones at the arrival first. */}
      {[...payload.displays]
        .sort((a, b) => Number(b.zone === "hub") - Number(a.zone === "hub"))
        .map((display, i) => (
          <Staged key={display.id} frames={STAGE.displays + i}>
            <Display display={display} texture={texture} onOpen={open} />
          </Staged>
        ))}
      {/* One department a frame, then the population, then the animals. */}
      {OFFICES.filter((one) => one.department !== null).map((one, i) => (
        <Staged key={one.id} frames={STAGE.offices + i * 2}>
          <Office
            id={one.id}
            office={one.office}
            label={t(DEPARTMENTS.find((d) => d.id === one.department)!.name, payload.locale)}
            action={office.action}
            onTalk={onOffice}
            locale={payload.locale}
            compact={compact}
          />
        </Staged>
      ))}
      <Staged frames={STAGE.crowd}>
        <Crowd compact={compact} />
      </Staged>
      <Staged frames={STAGE.animals}>
        <Animals compact={compact} />
      </Staged>
      </group>
      {/* After the group, not before it: refs are attached and layout effects
          run in tree order, so only here is the group there to be hidden
          before the first frame is drawn. */}
      <Boot tier={tier} compact={compact} world={world} onReady={onReady} />
    </>
  );
});

/* ------------------------------------------------------------------ boot */

/** Resolve after `count` animation frames. */
const frames = (count: number) =>
  new Promise<void>((resolve) => {
    let left = count;
    const tick = () => (left-- <= 0 ? resolve() : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  });

/**
 * The boot.
 *
 * The world is mounted behind the opening screen, and what it does in
 * those first seconds decides whether the sweep, and the first steps after
 * it, stutter. Measured on a throttled phone, three things did: every
 * shader compiled synchronously the first time its object was drawn, in
 * lumps of a second as the staged districts, the crowd and the animals
 * arrived; the environment map, set a few seconds in, changed every lit
 * material's shader and recompiled the lot in the middle of the sweep; and
 * each panel texture was uploaded the first time the camera turned to it.
 *
 * So, in order, while the scene is hidden: wait for the staged parts to
 * mount; prime the environment with a placeholder of the right type; have
 * every material in the scene compiled against it — in parallel on the
 * GPU's own threads where the driver allows, and either way before anything
 * is on screen; upload every texture a few per frame; show the scene and
 * take the real environment photograph, which now costs no compiles; then
 * tell the opening it may begin. A failsafe reports ready after twelve
 * seconds regardless — the chain runs on and the photograph is still taken
 * — so a very slow driver still gets a world.
 */
function Boot({
  tier,
  compact,
  world,
  onReady,
}: {
  tier: Tier;
  compact: boolean;
  world: React.RefObject<THREE.Group | null>;
  onReady?: () => void;
}) {
  const { gl, scene, camera } = useThree();
  const done = useRef(false);

  /* Hidden in the commit that mounts it, before the first frame is drawn: a
     passive effect runs after that frame, and a world drawn once visible
     links every shader it has on the spot. */
  useLayoutEffect(() => {
    if (world.current) world.current.visible = false;
  }, [world]);

  useEffect(() => {
    let cancelled = false;
    let settled = 0;
    /* The start is noted until the world has been on screen a few seconds:
       a phone that runs out of memory kills the page without a word, and
       the note is how the next load knows (see bootGuard). */
    bootGuard.begin();
    const leave = () => bootGuard.leave();
    window.addEventListener("pagehide", leave);
    const ready = () => {
      if (done.current || cancelled) return;
      done.current = true;
      onReady?.();
      settled = window.setTimeout(() => bootGuard.succeed(), 6000);
    };
    const rig = createReflections(gl, scene, QUALITY[tier].reflections);
    const group = world.current;
    if (group) group.visible = false;
    const failsafe = window.setTimeout(() => {
      if (group) group.visible = true;
      ready();
    }, 12000);
    let later = 0;

    /* Named steps for the boot profiler, when one is listening. */
    const mark = (name: string) => (window as unknown as { __mark?: (name: string) => void }).__mark?.(name);
    (async () => {
      /* The staged constructions land over the first frames. */
      await frames(LAST_STAGE);
      if (cancelled) return;
      mark("boot:compile");
      rig.prime();
      try {
        /* In parallel on the driver's threads where the extension exists;
           otherwise in one go, now, which is still before anything shows.
           Asked directly, because the renderer warns to the console when
           it is asked for the parallel path on a driver without it. */
        /* A part of the world at a time, a frame apart: preparing every
           material's program is main-thread work (parameters, uniforms, the
           shader source) even when the driver links in parallel, and done
           for the whole world at once it was the longest frame of the boot.
           Each part is compiled twice — for the screen, and for the
           reflection capture, which renders untoned into a float target. */
        const parts = group ? [...group.children] : [scene];
        const parallel = gl.extensions.has("KHR_parallel_shader_compile");
        const pending: Promise<unknown>[] = [];
        for (const part of parts) {
          if (parallel) {
            pending.push(gl.compileAsync(part, camera, scene));
            pending.push(rig.prewarm(() => gl.compileAsync(part, camera, scene)) as Promise<unknown>);
          } else {
            gl.compile(part, camera, scene);
            rig.prewarm(() => gl.compile(part, camera, scene));
          }
          await frames(1);
          if (cancelled) return;
        }
        await Promise.all(pending);
      } catch {
        /* A context that cannot compile ahead still renders; it just compiles on sight. */
      }
      if (cancelled) return;
      /* Textures: everything a material holds, uploaded a few per frame so
         no one frame carries them all — before the capture, which would
         otherwise upload the lot in one go. */
      const textures = new Set<THREE.Texture>();
      scene.traverse((object) => {
        const material = (object as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        for (const one of Array.isArray(material) ? material : material ? [material] : []) {
          const maps = one as unknown as Record<string, unknown>;
          for (const key of ["map", "alphaMap", "emissiveMap", "roughnessMap", "normalMap"]) {
            const map = maps[key];
            if (map && (map as THREE.Texture).isTexture) textures.add(map as THREE.Texture);
          }
        }
      });
      /* By pixels, not by count: a frame uploads about two million texels
         and its mipmaps, so a handful of small maps share a frame and a
         large panel has one to itself. */
      mark("boot:textures");
      let texels = 0;
      for (const one of textures) {
        const image = one.image as { width?: number; height?: number } | undefined;
        const size = (image?.width ?? 256) * (image?.height ?? 256);
        if (texels > 0 && texels + size > 2_000_000) {
          await frames(1);
          if (cancelled) return;
          texels = 0;
        }
        gl.initTexture(one);
        texels += size;
      }
      await frames(1);
      if (cancelled) return;
      mark("boot:visible");
      if (group) group.visible = true;
      await frames(2);
      if (cancelled) return;
      mark("boot:capture");
      await rig.captureStaged(() => frames(1), () => cancelled);
      if (cancelled) return;
      mark("boot:ready");
      ready();
      /* A desktop photographs the world once more when the captures on the
         screens have had time to land; the shaders do not change for it. */
      if (!compact) later = window.setTimeout(() => void rig.captureStaged(() => frames(1), () => cancelled), 3500);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
      window.clearTimeout(settled);
      window.removeEventListener("pagehide", leave);
      bootGuard.leave();
      if (later) window.clearTimeout(later);
      if (group) group.visible = true;
      rig.dispose();
    };
    // Boots once per scene; the tier and the callbacks are fixed for its life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene]);

  return null;
}

/* -------------------------------------------------------------- governor */

/**
 * The pixel-ratio governor.
 *
 * The world opens at the tier's sharpest ratio and stays there unless the
 * frame time says otherwise: a smoothed frame over the slow threshold for a
 * second and a half steps the ratio down by a tenth; under the fast
 * threshold for six seconds steps it back up. One step at a time, four
 * seconds apart at least, applied between frames by the renderer's own
 * resize — never a jump the eye would read as the picture changing.
 */
function Governor({ tier }: { tier: Tier }) {
  const { setDpr, viewport } = useThree();
  const state = useRef({ slow: 0, fast: 0, since: 0, dpr: 0 });
  const profile = QUALITY[tier];

  useEffect(() => {
    qualityStore.tier = tier;
    qualityStore.dpr = viewport.dpr;
    state.current.dpr = viewport.dpr;
  }, [tier, viewport.dpr]);

  useFrame((_, raw) => {
    const here = state.current;
    const ms = Math.min(raw, 0.25) * 1000;
    /* A slow exponential average: one bad frame is not a slow phone. */
    qualityStore.frame += (ms - qualityStore.frame) * 0.08;
    here.since += raw;
    if (qualityStore.frame > GOVERNOR.slowMs) {
      here.slow += raw;
      here.fast = 0;
    } else if (qualityStore.frame < GOVERNOR.fastMs) {
      here.fast += raw;
      here.slow = 0;
    } else {
      here.slow = 0;
      here.fast = 0;
    }
    if (here.since < GOVERNOR.cooldown) return;
    const ceiling = Math.min(profile.dpr.max, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
    let next = here.dpr;
    if (here.slow > GOVERNOR.slowFor && here.dpr - GOVERNOR.step >= profile.dpr.min - 1e-6) next = here.dpr - GOVERNOR.step;
    else if (here.fast > GOVERNOR.fastFor && here.dpr + GOVERNOR.step <= ceiling + 1e-6) next = here.dpr + GOVERNOR.step;
    if (next === here.dpr) return;
    next = Math.round(next * 100) / 100;
    here.dpr = next;
    here.since = 0;
    here.slow = 0;
    here.fast = 0;
    qualityStore.dpr = next;
    qualityStore.steps += 1;
    setDpr(next);
  });

  return null;
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
