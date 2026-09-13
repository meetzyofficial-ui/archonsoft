"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { animateFace, newFaceState } from "@/components/world/npc/face";
import { FRAMES, Person, WARDROBE } from "@/components/world/npc/Guides";
import { IMPORTANCE, npcTier } from "@/components/world/npc/lod";
import { rigIn } from "@/components/world/npc/rig";
import { guideStore } from "@/components/world/npc/Guides";
import { Glow } from "@/components/world/pieces/Kit";
import { body } from "@/components/world/systems/body";
import { qualityStore } from "@/components/world/systems/quality";
import { buildRects, slide } from "@/components/world/systems/collision";
import { interactables, zoneStore } from "@/components/world/systems/focus";
import { COLLIDERS, floorAt, type ZoneId } from "@/data/world-map";
import { WORLD_OBSTACLES } from "@/data/world-obstacles";

/**
 * The host.
 *
 * The first person the visitor meets: she stands a little off the walkway
 * at the arrival, turns as they come in, and offers to show them round.
 * She is one of the people of the world — the same rig, the same rules of
 * proportion — but dressed for the part, in cream and warm white with a
 * breath of peach, and drawn at full detail from further away than anyone
 * else, because she is the one the visitor will look at.
 *
 * Asked, she comes along. Not glued to the heel: she keeps a few metres
 * back and to the side, stops when the visitor stops, walks when they walk
 * and runs a little when she falls behind, goes round the colliders like
 * anyone else, and only ever appears beside the visitor as a last resort
 * when she has been left forty metres behind. When they enter a district
 * she says one thing about it, once, and then lets the place speak.
 */

export type HostReading = {
  following: boolean;
  /** Where the host is standing. */
  at: [number, number, number];
  /** The line she is saying at the moment, and the zone it was about. */
  line: ZoneId | "between" | null;
  /** Bumps each time a new line is said, so the interface can animate. */
  said: number;
};

let reading: HostReading = { following: false, at: [9.5, 0, 20], line: null, said: 0 };
const listeners = new Set<() => void>();
export const hostStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => reading,
  set(next: Partial<HostReading>) {
    reading = { ...reading, ...next };
    listeners.forEach((l) => l());
  },
  /** Whether the visitor has been through the introduction before. */
  seen(): boolean {
    try {
      return window.localStorage.getItem("archonWorldWelcomeSeen") === "1";
    } catch {
      return false;
    }
  },
  markSeen() {
    try {
      window.localStorage.setItem("archonWorldWelcomeSeen", "1");
    } catch {
      /* Not remembered; the introduction simply plays again next time. */
    }
  },
};

export const HOST_ID = "host";
/** Where she waits: beside the arrival ring, off the walkway. */
const HOME: [number, number, number] = [9.5, 0, 20];
const HOME_FACING = Math.atan2(-(0 - HOME[0]), -(24 - HOME[2])) + Math.PI;
const NOTICE = 12;
const KEEP = 2.6;
const CATCH_UP = 4.2;
const LOST = 40;
const WALK = 3.1;
const RUN = 5.4;
const LINE_COOLDOWN = 28;
const LINE_SHOWS = 7;

const FRAME = { height: 1.72, shoulders: 0.235, build: 0.94, hair: "long" } as const;

export function Host({
  label,
  action,
  onTalk,
}: {
  label: string;
  action: string;
  onTalk: () => void;
}) {
  const fig = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Mesh>(null);
  const rects = useMemo(() => buildRects([...COLLIDERS, ...WORLD_OBSTACLES]), []);
  const st = useRef({
    x: HOME[0],
    z: HOME[2],
    floor: HOME[1],
    facing: HOME_FACING,
    leg: 0,
    t: 0,
    lost: 0,
    tier: -1,
    /* Lines. */
    lastZone: null as string | null,
    lineAt: -100,
    lineUntil: 0,
    saidFor: new Set<string>(),
    face: newFaceState(0.4),
    /* How long the visitor has been near: the head turns first, the eyes
       follow, then the body. */
    nearFor: 0,
    /* While following she looks about now and then rather than staring. */
    glanceAway: 0,
  });

  /* A QA hook: where she is. */
  useEffect(() => {
    (window as unknown as { __archonHost?: () => unknown }).__archonHost = () => hostStore.get();
    return () => {
      delete (window as unknown as { __archonHost?: unknown }).__archonHost;
    };
  }, []);

  /* She can be spoken to. Registered at her home; moved as she walks. */
  useEffect(() => {
    const here = st.current;
    return interactables.add({
      id: HOST_ID,
      at: [here.x, here.floor + 1.4, here.z],
      reach: 4.4,
      label,
      action,
      activate: onTalk,
      priority: 8,
    });
  }, [action, label, onTalk]);

  useFrame((_, raw) => {
    const delta = Math.min(raw, 0.05);
    const here = st.current;
    const node = fig.current;
    if (!node) return;
    here.t += delta;
    const following = hostStore.get().following;

    const dx = body.x - here.x;
    const dz = body.z - here.z;
    const distance = Math.hypot(dx, dz);

    /* Detail: she is the one the visitor looks at, so she holds her detail
       further out than anyone, and is never hidden — at worst a silhouette. */
    const speaking = guideStore.talking === "host";
    const wantTier = Math.max(0, npcTier(distance, qualityStore.tier !== "desktop", speaking ? IMPORTANCE.speaking : IMPORTANCE.host * 1.5, HOST_ID));
    if (wantTier !== here.tier) {
      here.tier = wantTier;
      rigIn(node)?.setTier(wantTier);
    }

    /* Following: keep a place behind and to the visitor's right. */
    let moving = 0;
    if (following) {
      const side = 2.4;
      const back = KEEP * 0.45;
      const gx = body.x + Math.sin(body.facing) * back + Math.cos(body.facing) * side;
      const gz = body.z + Math.cos(body.facing) * back - Math.sin(body.facing) * side;
      const tx = gx - here.x;
      const tz = gz - here.z;
      const left = Math.hypot(tx, tz);
      if (distance > LOST) {
        here.lost += delta;
        if (here.lost > 3) {
          /* Last resort: appear beside the visitor. */
          here.x = gx;
          here.z = gz;
          here.floor = body.floor;
          here.lost = 0;
        }
      } else {
        here.lost = 0;
      }
      if (left > 0.6) {
        const speed = left > CATCH_UP * 2 ? RUN : left > 1.2 ? WALK : WALK * 0.5;
        const stepX = (tx / left) * speed * delta;
        const stepZ = (tz / left) * speed * delta;
        const [nx, nz] = slide(here.x, here.z, here.x + stepX, here.z + stepZ, rects, here.floor);
        here.x = nx;
        here.z = nz;
        here.floor = floorAt(nx, nz, here.floor);
        here.leg += speed * delta * 3;
        moving = speed / WALK;
        const heading = Math.atan2(-tx, -tz);
        let diff = heading - here.facing;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        here.facing += diff * Math.min(1, 7 * delta);
      }
    }

    /* Facing when still: the visitor if they are near — the body turns a
       beat after the head — home otherwise. */
    here.nearFor = distance < NOTICE ? here.nearFor + delta : 0;
    if (!moving) {
      const bearing = Math.atan2(-dx, -dz) + Math.PI;
      const want = (distance < NOTICE && here.nearFor > 0.7) || following ? bearing : HOME_FACING;
      let diff = want - here.facing;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      here.facing += diff * Math.min(1, 2.4 * delta);
    }
    /* Following, she glances at the world every so often. */
    if (following && !moving) {
      if (here.glanceAway <= 0 && Math.random() < delta * 0.12) here.glanceAway = 2 + Math.random() * 2;
    }
    if (here.glanceAway > 0) here.glanceAway -= delta;

    node.position.set(here.x, here.floor + Math.sin(here.t * 1.2) * 0.008, here.z);
    node.rotation.y = here.facing;
    node.rotation.z = Math.sin(here.t * 0.5) * 0.012 * (1 - Math.min(1, moving));
    /* Attention: a small lean toward the visitor when they are close. */
    const close = THREE.MathUtils.clamp(1 - (distance - 1.5) / 3, 0, 1);
    node.rotation.x += (close * 0.03 - node.rotation.x) * Math.min(1, 3 * delta);

    /* The rig. */
    const head = node.getObjectByName("head");
    if (head) {
      const bearing = Math.atan2(-dx, -dz) + Math.PI;
      const toward = Math.atan2(Math.sin(bearing - here.facing), Math.cos(bearing - here.facing));
      const away = here.glanceAway > 0 ? Math.sin(here.t * 0.6) * 0.7 : null;
      const look = away !== null ? away : distance < NOTICE * 1.5 ? THREE.MathUtils.clamp(toward, -1, 1) * 0.85 : Math.sin(here.t * 0.5) * 0.3;
      head.rotation.y += (look - head.rotation.y) * Math.min(1, 4 * delta);
      head.rotation.x = Math.sin(here.t * 0.8) * 0.03 + close * 0.05;
      head.rotation.z = close * 0.06;
      /* Her face: a smile when the visitor is near, curiosity as they
         arrive, speech while her card is open. */
      animateFace(node, here.face, {
        t: here.t,
        dt: delta,
        smile: distance < NOTICE ? 0.55 + close * 0.35 : following ? 0.3 : 0.1,
        curious: distance < NOTICE && here.nearFor < 2 ? 0.7 : 0.1,
        talking: speaking ? 1 : 0,
        gazeYaw: THREE.MathUtils.clamp(toward - head.rotation.y, -0.35, 0.35),
        gazePitch: -0.04,
      });
    }
    const swing = Math.sin(here.leg);
    const legL = node.getObjectByName("legL");
    const legR = node.getObjectByName("legR");
    const shinL = node.getObjectByName("shinL");
    const shinR = node.getObjectByName("shinR");
    const m = Math.min(1, moving);
    if (legL && legR && shinL && shinR) {
      legL.rotation.x = swing * 0.55 * m;
      legR.rotation.x = -swing * 0.55 * m;
      shinL.rotation.x = Math.max(0, -swing) * 0.95 * m;
      shinR.rotation.x = Math.max(0, swing) * 0.95 * m;
    }
    const armL = node.getObjectByName("armL");
    const armR = node.getObjectByName("armR");
    const foreL = node.getObjectByName("foreL");
    const foreR = node.getObjectByName("foreR");
    if (armL && armR && foreL && foreR) {
      /* Walking, the arms swing; still, one hand rests over the other at
         the waist, the way a host stands; near the visitor she gestures
         toward the plaza now and then. */
      const beat = here.t % 11;
      const gesture = !m && (following || distance < NOTICE) && beat < 2 ? Math.sin((beat / 2) * Math.PI) : 0;
      const ease = Math.min(1, 5 * delta);
      armR.rotation.x += (swing * 0.45 * m - (1 - m) * 0.2 - gesture * 0.6 - armR.rotation.x) * ease;
      armL.rotation.x += (-swing * 0.45 * m - (1 - m) * 0.2 - armL.rotation.x) * ease;
      armR.rotation.z += (-(1 - m) * 0.12 + gesture * -0.5 - armR.rotation.z) * ease;
      armL.rotation.z += ((1 - m) * 0.12 - armL.rotation.z) * ease;
      foreR.rotation.x += (-(1 - m) * 1.15 - m * 0.3 - gesture * 0.4 - foreR.rotation.x) * ease;
      foreL.rotation.x += (-(1 - m) * 1.2 - m * 0.3 - foreL.rotation.x) * ease;
      foreR.rotation.y += (-(1 - m) * 0.8 * (1 - gesture) - foreR.rotation.y) * ease;
      foreL.rotation.y += ((1 - m) * 0.8 - foreL.rotation.y) * ease;
    }

    /* The marker over her, brighter as the visitor comes near. */
    if (marker.current) {
      const mat = marker.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + THREE.MathUtils.clamp(1 - distance / NOTICE, 0, 1) * 0.55;
      marker.current.position.y = here.floor + 2.35 + Math.sin(here.t * 1.3) * 0.05;
      marker.current.rotation.y = here.t * 0.8;
    }

    /* Where she can be spoken to. */
    const item = interactables.get(HOST_ID);
    if (item) item.at = [here.x, here.floor + 1.4, here.z];

    /* A line about the district, once per district, not too often, and
       only when she is with the visitor or they are near her. */
    const zone = zoneStore.get();
    const near = following || distance < NOTICE;
    if (zone !== here.lastZone) {
      here.lastZone = zone;
      if (near && zone && !here.saidFor.has(zone) && here.t - here.lineAt > LINE_COOLDOWN) {
        here.saidFor.add(zone);
        here.lineAt = here.t;
        here.lineUntil = here.t + LINE_SHOWS;
        hostStore.set({ line: zone as ZoneId, said: hostStore.get().said + 1 });
      }
    }
    if (hostStore.get().line && here.t > here.lineUntil) hostStore.set({ line: null });

    const at = hostStore.get().at;
    if (Math.abs(at[0] - here.x) > 0.05 || Math.abs(at[2] - here.z) > 0.05) {
      hostStore.set({ at: [here.x, here.floor, here.z] });
    }
  });

  return (
    <group>
      <group ref={fig} position={HOME} rotation={[0, HOME_FACING, 0]} name="host">
        <Person frame={FRAME as unknown as (typeof FRAMES)[number]} wardrobe={WARDROBE.host!} skin="#efd3bd" hair="#3b2a1f" projectId="" />
      </group>
      {/* Her marker: warm, like the guides', a little higher. */}
      <mesh ref={marker} position={[HOME[0], 2.35, HOME[2]]}>
        <octahedronGeometry args={[0.11, 0]} />
        <Glow colour="#f2a889" opacity={0.4} />
      </mesh>
    </group>
  );
}
