"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { body, ROBOT_EYE } from "@/components/world/systems/body";
import { BODY_RADIUS, buildRects, slide } from "@/components/world/systems/collision";
import { discovery } from "@/components/world/systems/discovery";
import { focusStore, interactables, poseStore, zoneStore } from "@/components/world/systems/focus";
import { guideStore } from "@/components/world/npc/Guides";
import { teleportStore } from "@/components/world/systems/teleport";
import { destinationByKey, WORLD_DESTINATIONS } from "@/data/world-destinations";
import { COLLIDERS, SPAWN, floorAt, zoneAt } from "@/data/world-map";
import { WORLD_OBSTACLES } from "@/data/world-obstacles";

/**
 * Walking.
 *
 * The movement is exactly what it was: input sets a target velocity and the
 * body accelerates toward it and damps back, walls are slid along by resolving
 * each axis on its own, the floor under the visitor is asked from where they
 * already are so a walkway nine metres up is scenery until the ramp has been
 * climbed. None of that changed and none of it needed to.
 *
 * What changed is the camera. It used to *be* the visitor — a first-person
 * eye at 1.7m. Now the visitor is a body in the world, the Archon explorer,
 * and the camera hangs behind and above it, over the right shoulder, and
 * follows with a little damping. The mouse still turns the view, and the body
 * still moves relative to where the view points, so the controls feel the
 * same; the difference is that you can see who you are and how far your feet
 * are from the edge of the platform.
 */

const WALK = 4.2;
const RUN = 7.4;
/* The jump: a wind-up, a push, gravity. Standing it clears about a metre
   and a half; running, two. Nothing floats — the gravity is stiff and the
   descent is quicker than the rise. */
const JUMP_WINDUP = 0.1;
const JUMP_STANDING = 7.9;
const JUMP_RUNNING = 9.1;
const GRAVITY = 19;
/* The teleport: out, then in. */
const TELEPORT_OUT = 0.38;
const TELEPORT_IN = 0.46;
const ACCELERATION = 34;
const DAMPING = 11;
const LOOK = 0.0021;
const PITCH_MIN = -0.55;
const PITCH_MAX = 0.62;

/** How far off centre something can be and still be what you are looking at. */
const CONE = 0.62;
/** Approach is felt this many times further out than the thing can be used. */
const NOTICE = 2.6;

/* The follow camera. Far enough back that the explorer is a fifth of the
   frame and the world is the rest of it. */
const CAM_BACK = 8.4;
const CAM_UP = 2.9;
const CAM_SHOULDER = 0.9;
const CAM_LOOK_AHEAD = 3.2;
const CAM_EASE = 7;
/* Approaching a station the camera eases a little further out and higher,
   so the guides, the dais and the screens come into one frame together. */
const CAM_REVEAL = 1.6;

const FORWARD = new THREE.Vector3();
const STEP = new THREE.Vector3();
const PROBE = new THREE.Vector3();

/** Camera radius against walls. */
const CAM_RADIUS = 0.35;

function insideAny(
  point: THREE.Vector3,
  rects: ReturnType<typeof buildRects>,
): boolean {
  for (const rect of rects) {
    if (point.y < rect.minY || point.y > rect.maxY) continue;
    if (
      point.x + CAM_RADIUS > rect.minX &&
      point.x - CAM_RADIUS < rect.maxX &&
      point.z + CAM_RADIUS > rect.minZ &&
      point.z - CAM_RADIUS < rect.maxZ
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Walk `want` back toward `from` until it is clear of every collider.
 * Sixteen steps along the ray is finer than a camera needs and costs
 * nothing next to the render.
 */
function pullCameraClear(
  from: THREE.Vector3,
  want: THREE.Vector3,
  rects: ReturnType<typeof buildRects>,
) {
  if (!insideAny(want, rects)) return;
  STEP.copy(want).sub(from).multiplyScalar(1 / 16);
  PROBE.copy(from);
  for (let i = 1; i <= 16; i += 1) {
    PROBE.add(STEP);
    if (insideAny(PROBE, rects)) {
      PROBE.sub(STEP);
      break;
    }
  }
  want.copy(PROBE);
}
const RIGHT = new THREE.Vector3();
const TO_ITEM = new THREE.Vector3();
const HEAD = new THREE.Vector3();
const WANT = new THREE.Vector3();
const AIM = new THREE.Vector3();
const AIMED = new THREE.Vector3();
const OFFSET = new THREE.Vector3();
const ORBIT = new THREE.Euler(0, 0, 0, "YXZ");

export function Explorer({ active }: { active: boolean }) {
  const { camera, gl } = useThree();
  const rects = useMemo(() => buildRects([...COLLIDERS, ...WORLD_OBSTACLES]), []);

  const state = useRef({
    x: SPAWN.at[0],
    z: SPAWN.at[2],
    yaw: SPAWN.yaw,
    pitch: -0.1,
    vx: 0,
    vz: 0,
    floor: 0,
    walked: 0,
    keys: new Set<string>(),
    locked: false,
    /* The camera's eased position and aim. */
    camReady: false,
    reveal: 0,
    /* Seconds since the camera was handed to the explorer; the ease starts
       slow so the arrival is a move and not a cut. */
    settle: 0,
    /* The jump. */
    lift: 0,
    vy: 0,
    windup: 0,
    airborne: false,
    landing: 0,
    /* The teleport in progress, if any. */
    teleport: null as null | { to: (typeof WORLD_DESTINATIONS)[number]; t: number; moved: boolean },
    /* QA only: a closer camera, for looking at a character. */
    camBack: CAM_BACK,
    camUp: CAM_UP,
  });

  /* Looking. Pointer lock is requested by the canvas. */
  useEffect(() => {
    if (!active) return;
    const canvas = gl.domElement;
    const here = state.current;

    const onMove = (event: MouseEvent) => {
      if (!here.locked) return;
      here.yaw -= event.movementX * LOOK;
      here.pitch = THREE.MathUtils.clamp(here.pitch + event.movementY * LOOK, PITCH_MIN, PITCH_MAX);
    };
    const onLock = () => {
      here.locked = document.pointerLockElement === canvas;
      if (!here.locked) here.keys.clear();
    };
    const onClick = () => {
      if (!here.locked) canvas.requestPointerLock?.();
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("pointerlockchange", onLock);
    canvas.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("pointerlockchange", onLock);
      canvas.removeEventListener("click", onClick);
      if (document.pointerLockElement === canvas) document.exitPointerLock?.();
    };
  }, [active, gl]);

  /* Walking, and the one key that does something. */
  useEffect(() => {
    if (!active) return;
    const here = state.current;

    const activate = () => {
      const focus = focusStore.get();
      if (!focus) return;
      interactables.get(focus.id)?.activate();
    };

    const onDown = (event: KeyboardEvent) => {
      /* Typing somewhere — a form under the world, say — is not walking. */
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const key = event.key.toLowerCase();
      here.keys.add(key);
      if (key === "e" || key === "enter") {
        event.preventDefault();
        activate();
      }
      /* Space: one jump, from the ground, never from the air. */
      if (key === " " && !event.repeat) {
        event.preventDefault();
        if (!here.airborne && here.windup <= 0 && !here.teleport) here.windup = JUMP_WINDUP;
      }
      /* The number keys are the destinations. */
      if (!event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const dest = destinationByKey(event.key);
        if (dest) {
          event.preventDefault();
          teleportStore.request(dest.id);
        }
      }
    };
    const onUp = (event: KeyboardEvent) => here.keys.delete(event.key.toLowerCase());
    const onBlur = () => here.keys.clear();
    const onPointerDown = (event: MouseEvent) => {
      if (here.locked && event.button === 0) activate();
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    gl.domElement.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      gl.domElement.removeEventListener("mousedown", onPointerDown);
    };
  }, [active, gl]);

  /* A test hook: turn the view without a pointer lock. Only ever read by the
     headless QA harness, which has no mouse to lock. */
  useEffect(() => {
    if (!active) return;
    const here = state.current;
    (window as unknown as { __archonTurn?: (deg: number, pitch?: number) => void }).__archonTurn = (
      deg,
      pitch,
    ) => {
      here.yaw -= (deg * Math.PI) / 180;
      if (pitch !== undefined) here.pitch = THREE.MathUtils.clamp((pitch * Math.PI) / 180, PITCH_MIN, PITCH_MAX);
    };
    (window as unknown as { __archonBody?: () => unknown }).__archonBody = () => ({ ...body });
    (window as unknown as { __archonZoom?: (back: number, up?: number) => void }).__archonZoom = (back, up) => {
      here.camBack = back;
      here.camUp = up ?? CAM_UP;
    };
    return () => {
      delete (window as unknown as { __archonTurn?: unknown }).__archonTurn;
      delete (window as unknown as { __archonBody?: unknown }).__archonBody;
    };
  }, [active]);

  useFrame((_, raw) => {
    if (!active) return;
    const here = state.current;
    const delta = Math.min(raw, 0.1);
    const keys = here.keys;

    const forward =
      (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
    const strafe =
      (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
    const running = keys.has("shift");

    FORWARD.set(-Math.sin(here.yaw), 0, -Math.cos(here.yaw));
    RIGHT.set(Math.cos(here.yaw), 0, -Math.sin(here.yaw));

    let targetX = FORWARD.x * forward + RIGHT.x * strafe;
    let targetZ = FORWARD.z * forward + RIGHT.z * strafe;
    const length = Math.hypot(targetX, targetZ);
    if (length > 0) {
      const speed = running ? RUN : WALK;
      targetX = (targetX / length) * speed;
      targetZ = (targetZ / length) * speed;
    }

    const rate = length > 0 ? ACCELERATION : DAMPING;
    here.vx += (targetX - here.vx) * Math.min(1, rate * delta);
    here.vz += (targetZ - here.vz) * Math.min(1, rate * delta);
    if (Math.abs(here.vx) < 0.004) here.vx = 0;
    if (Math.abs(here.vz) < 0.004) here.vz = 0;

    const [nextX, nextZ] = slide(
      here.x,
      here.z,
      here.x + here.vx * delta,
      here.z + here.vz * delta,
      rects,
      here.floor,
    );
    if (Math.abs(nextX - (here.x + here.vx * delta)) > 0.001) here.vx = 0;
    if (Math.abs(nextZ - (here.z + here.vz * delta)) > 0.001) here.vz = 0;

    const moved = Math.hypot(nextX - here.x, nextZ - here.z);
    here.walked += moved * (here.airborne ? 0 : 1);
    here.x = nextX;
    here.z = nextZ;
    here.floor = floorAt(nextX, nextZ, here.floor);

    /* The jump. The wind-up compresses the body, then the push; in the air
       the horizontal speed is kept and gravity does the rest; the landing
       leaves a mark that fades. */
    if (here.windup > 0) {
      here.windup -= delta;
      if (here.windup <= 0) {
        here.windup = 0;
        here.airborne = true;
        const running = keys.has("shift") && Math.hypot(here.vx, here.vz) > WALK * 0.8;
        here.vy = running ? JUMP_RUNNING : JUMP_STANDING;
      }
    }
    if (here.airborne) {
      here.vy -= GRAVITY * delta * (here.vy < 0 ? 1.25 : 1);
      here.lift += here.vy * delta;
      if (here.lift <= 0) {
        here.lift = 0;
        here.airborne = false;
        here.landing = 1;
        here.vy = 0;
      }
    } else if (here.landing > 0) {
      here.landing = Math.max(0, here.landing - delta * 2.2);
    }

    /* The teleport. Out: the body slows and brightens. At the turn: it is
       set down at the destination, facing what the place is for, and the
       camera is put straight behind it. In: it settles. */
    const asked = teleportStore.take();
    if (asked && !here.airborne) {
      if (!here.teleport) here.teleport = { to: asked, t: 0, moved: false };
      else if (!here.teleport.moved) here.teleport.to = asked;
      /* Already arrived somewhere and asked again: leave again from here. */
      else here.teleport = { to: asked, t: TELEPORT_OUT * (1 - body.glow), moved: false };
    }
    if (here.teleport) {
      const tp = here.teleport;
      tp.t += delta;
      here.vx *= 0.8;
      here.vz *= 0.8;
      if (!tp.moved && tp.t >= TELEPORT_OUT) {
        tp.moved = true;
        here.x = tp.to.at[0];
        here.z = tp.to.at[2];
        here.floor = tp.to.at[1];
        here.floor = floorAt(here.x, here.z, here.floor);
        here.yaw = tp.to.yaw;
        here.pitch = -0.04;
        here.vx = 0;
        here.vz = 0;
        body.floor = here.floor;
        body.facing = here.yaw;
        here.camReady = false;
        here.settle = 3;
        teleportStore.set({ current: tp.to.id, phase: 0, direction: "in" });
      }
      if (!tp.moved) {
        const k = tp.t / TELEPORT_OUT;
        body.glow = Math.min(1, k * 1.2);
        body.hidden = false;
        teleportStore.set({ phase: k, direction: "out" });
      } else {
        const k = (tp.t - TELEPORT_OUT) / TELEPORT_IN;
        body.hidden = k < 0.18;
        body.glow = Math.max(0, 1 - k);
        teleportStore.set({ phase: Math.min(1, k), direction: "in" });
        if (k >= 1) {
          here.teleport = null;
          body.glow = 0;
          body.hidden = false;
          teleportStore.set({ phase: 0, direction: null });
        }
      }
    } else {
      /* Which destination the visitor is standing in, for the rail. */
      let nearest: string | null = null;
      let best = Infinity;
      for (const dest of WORLD_DESTINATIONS) {
        const d = Math.hypot(dest.at[0] - here.x, dest.at[2] - here.z) + Math.abs(dest.at[1] - here.floor) * 3;
        if (d < best) {
          best = d;
          nearest = dest.id;
        }
      }
      if (best < 34) teleportStore.set({ current: nearest });
      else teleportStore.set({ current: null });
    }

    const speed = Math.hypot(here.vx, here.vz);
    const pace = speed / RUN;

    /* The body. It faces the way it is moving; standing still it keeps the
       last heading, so stopping does not spin it round to face the camera. */
    body.x = here.x;
    body.z = here.z;
    body.floor += (here.floor - body.floor) * Math.min(1, 16 * delta);
    body.yaw = here.yaw;
    body.pace = pace;
    body.walked = here.walked;
    body.lift = here.lift;
    body.vy = here.vy;
    body.landing = here.landing;
    body.crouch = here.windup > 0 ? 1 - here.windup / JUMP_WINDUP : 0;
    if (speed > 0.3) {
      const heading = Math.atan2(-here.vx, -here.vz);
      let diff = heading - body.facing;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      body.facing += diff * Math.min(1, 12 * delta);
    }

    /* The camera. Behind, above and over the shoulder of the body, eased
       toward where it should be so a turn is a swing rather than a snap. */
    HEAD.set(here.x, body.floor + ROBOT_EYE + here.lift * 0.35, here.z);
    /* Project-aware framing: the reveal factor rises as a guide group comes
       within notice and settles back when the visitor walks on. */
    const reveal = guideStore.get().id ? 1 : 0;
    here.reveal += (reveal - here.reveal) * Math.min(1, 1.6 * delta);
    ORBIT.set(-here.pitch * 0.55, here.yaw, 0);
    OFFSET.set(CAM_SHOULDER, here.camUp + here.reveal * 0.6, here.camBack + here.reveal * CAM_REVEAL).applyEuler(ORBIT);
    WANT.copy(HEAD).add(OFFSET);
    /* Never below the deck it is standing over. */
    WANT.y = Math.max(WANT.y, body.floor + 0.9);
    /* And never inside a wall. The camera is marched out from the head
       toward where it wants to be and stopped at the first collider it would
       enter — so standing with your back to a pylon brings the camera in
       over your shoulder instead of putting a slab of it across the frame. */
    pullCameraClear(HEAD, WANT, rects);

    /* How much of its distance the camera kept. Pulled in against a wall it
       aims flatter and closer, so a tight spot reads as a tight spot rather
       than as the floor tilting up at you. */
    const kept = Math.min(1, WANT.distanceTo(HEAD) / CAM_BACK);
    AIM.copy(HEAD).addScaledVector(FORWARD, CAM_LOOK_AHEAD * (0.4 + 0.6 * kept));
    AIM.y += (-here.pitch * 3.2 + 0.9) * kept;

    if (!here.camReady) {
      /* Handed over from the opening sweep, the camera is somewhere out over
         the plaza: keep it there and glide in. Anywhere else, snap. */
      if (camera.position.distanceTo(WANT) > 4 && !here.teleport) {
        AIMED.set(0, 6, 0);
      } else {
        camera.position.copy(WANT);
        AIMED.copy(AIM);
      }
      here.camReady = true;
    } else {
      here.settle += delta;
      const ease = THREE.MathUtils.lerp(1.4, CAM_EASE, Math.min(1, here.settle / 3));
      const k = 1 - Math.exp(-ease * delta);
      camera.position.lerp(WANT, k);
      AIMED.lerp(AIM, k * 1.4 > 1 ? 1 : k * 1.4);
    }
    camera.lookAt(AIMED);

    /* What is in front of you — measured from the body, not the camera, so
       reach means arm's reach and not five metres of lens behind you. */
    let best: { id: string; label: string; action: string; at: [number, number, number] } | null = null;
    let bestScore = Infinity;
    for (const item of interactables.all().values()) {
      TO_ITEM.set(item.at[0] - HEAD.x, item.at[1] - HEAD.y, item.at[2] - HEAD.z);
      const distance = TO_ITEM.length();
      if (item.onNear) {
        const band = item.reach * NOTICE;
        item.onNear(distance >= band ? 0 : 1 - distance / band);
      }
      if (distance > item.reach) continue;
      discovery.notice(item.id);
      TO_ITEM.normalize();
      const facing = TO_ITEM.x * -Math.sin(here.yaw) + TO_ITEM.z * -Math.cos(here.yaw);
      if (facing < CONE) continue;
      const score = distance / facing / (item.priority ?? 1);
      if (score < bestScore) {
        bestScore = score;
        best = { id: item.id, label: item.label, action: item.action, at: item.at };
      }
    }
    focusStore.set(best ? { id: best.id, label: best.label, action: best.action } : null);
    body.lookAt = best ? best.at : null;

    const zone = zoneAt(here.x, here.z, here.floor);
    zoneStore.set(zone ? zone.id : "between");
    poseStore.set(here.x, here.z, here.floor, here.yaw);
  });

  useEffect(() => {
    body.x = SPAWN.at[0];
    body.z = SPAWN.at[2];
    body.facing = SPAWN.yaw;
    body.yaw = SPAWN.yaw;
  }, []);

  return null;
}

export { BODY_RADIUS };
