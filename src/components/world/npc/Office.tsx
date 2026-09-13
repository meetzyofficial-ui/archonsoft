"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { animateFace, newFaceState, type FaceState } from "@/components/world/npc/face";
import { FRAMES, guideStore, HAIRS, Person, SKINS, WARDROBE } from "@/components/world/npc/Guides";
import { screenTexture, SCREEN_ASPECT } from "@/components/world/npc/screens";
import { Backlight, Glow, MATERIAL } from "@/components/world/pieces/Kit";
import { useMerged, type Part } from "@/components/world/pieces/merge";
import { body } from "@/components/world/systems/body";
import { worldEvents } from "@/components/world/systems/events";
import { interactables } from "@/components/world/systems/focus";
import { journeyStore } from "@/components/world/systems/journey";
import { DESK, deskSlots, officeFacing, type Office as OfficeSpec } from "@/data/departments";

/**
 * An office.
 *
 * A working room set on the deck. Three layouts from the same kit: rows of
 * desks with monitors, keyboards, lamps and the small things people keep
 * near them; a meeting table with chairs round it and a strategy board on
 * the wall; a lab bench with a prototype turning on a plinth. Behind every
 * room a glass partition carries a board showing the department's screen
 * large and backlit; glass runs along the sides; a light beam and two
 * ceiling bars run over it; a plant stands at each end; a sign names it.
 *
 * The people in it work — type in bursts, read, reach for a mug, glance at
 * a colleague — on their own rhythms, so no two move alike; the attentive
 * ones look up when the visitor comes near, and when spoken to the first
 * swivels round, smiles and explains. Built from the same data the walking
 * loop collides with. Everything that does not move is merged by material;
 * the whole room is culled beyond a distance so a phone never draws an
 * office it cannot see into.
 */

const NEAR_AT = 14;
const MID_AT = 40;
const NOTICE_AT = 7.5;
const TALK_AT = 5.6;
/* Beyond this the room is not drawn at all. */
const CULL_AT = { compact: 70, desktop: 130 };

const CLOTHES = ["navy", "charcoal", "denim", "teal", "olive", "camel", "cream", "sand", "plum"] as const;
const V3 = (x: number, y: number, z: number): [number, number, number] => [x, y, z];

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function seatedPose(fig: THREE.Object3D, k: number) {
  for (const side of ["L", "R"]) {
    const leg = fig.getObjectByName(`leg${side}`);
    const shin = fig.getObjectByName(`shin${side}`);
    if (leg) leg.rotation.x = -Math.PI / 2 + 0.12;
    if (shin) shin.rotation.x = Math.PI / 2 - 0.05;
  }
  fig.position.y = 0.5 - 0.96 * k;
}

type Worker = {
  role: string;
  x: number;
  z: number;
  /** Which way the chair faces, in the office's frame. */
  yaw: number;
  frame: (typeof FRAMES)[number];
  skin: string;
  hair: string;
  wardrobe: (typeof WARDROBE)[string];
  rhythm: number;
  offset: number;
  attentive: boolean;
  face: FaceState;
  typing: number;
  /** The length of this one's own cycle of glances and sips. */
  sip: number;
  /** Which colleague this one glances at. */
  glanceAt: number;
};

export function Office({
  id,
  office,
  label,
  action,
  onTalk,
  compact = false,
}: {
  id: string;
  office: OfficeSpec;
  label: string;
  action: string;
  onTalk: (id: string) => void;
  /** A phone seats fewer people: four at the lobby, two in a department. */
  compact?: boolean;
}) {
  const gl = useThree((state) => state.gl);
  const root = useRef<THREE.Group>(null);
  const figures = useRef<(THREE.Group | null)[]>([]);
  const prototype = useRef<THREE.Group>(null);
  const tier = useRef(-2);
  const time = useRef(Math.random() * 10);
  const posed = useRef(false);
  const thanked = useRef(0);
  const facing = officeFacing(office);
  const layout = office.layout ?? "desks";
  const roles = useMemo(() => (compact ? office.roles.slice(0, id === "lobby" ? 4 : 2) : office.roles), [compact, id, office.roles]);
  const slots = useMemo(() => (layout === "table" ? [] : deskSlots(roles.length)), [layout, roles.length]);
  const rows = layout === "table" ? 1 : Math.ceil(roles.length / 3);
  const span = layout === "table" ? 6 : Math.min(roles.length, 3) * (DESK.width + DESK.gap) + 1.2;
  const backZ = -rows * 1.2 - 1.9;
  const depth = rows * 2.4 + 3.6;
  const boardW = Math.min(span - 0.6, 4.4);
  const boardH = boardW / SCREEN_ASPECT;

  const workers = useMemo<Worker[]>(
    () =>
      roles.map((role, i) => {
        const h = hash(`${id}:${role}:${i}`);
        let x: number;
        let z: number;
        let yaw = 0;
        if (layout === "table") {
          /* Round the table, leaving the front open toward the visitor. */
          const a = Math.PI + ((i - (roles.length - 1) / 2) / Math.max(1, roles.length)) * Math.PI * 1.1;
          x = Math.sin(a) * 1.55;
          z = -0.6 + Math.cos(a) * 1.55;
          yaw = Math.atan2(-x, -0.6 - z);
        } else {
          x = slots[i]!.x;
          z = slots[i]!.z - 0.62;
        }
        return {
          role,
          x,
          z,
          yaw,
          frame: FRAMES[h % FRAMES.length]!,
          skin: SKINS[(h >>> 3) % SKINS.length]!,
          hair: HAIRS[(h >>> 6) % HAIRS.length]!,
          wardrobe: WARDROBE[CLOTHES[(h >>> 9) % CLOTHES.length]!]!,
          rhythm: 0.7 + ((h >>> 12) % 100) / 200,
          offset: ((h >>> 15) % 628) / 100,
          attentive: i === 0 || (h >>> 20) % 3 !== 0,
          face: newFaceState(((h >>> 4) % 1000) / 1000),
          typing: 0.5 + ((h >>> 7) % 100) / 200,
          sip: 9 + ((h >>> 11) % 100) / 8,
          glanceAt: (i + 1 + ((h >>> 5) % Math.max(1, roles.length - 1))) % Math.max(1, roles.length),
        };
      }),
    [id, layout, roles, slots],
  );

  const screen = useMemo(
    () => screenTexture(office.screen, office.accent, Math.min(8, gl.capabilities.getMaxAnisotropy())),
    [gl, office.accent, office.screen],
  );

  /* ---------------------------------------------------------- furniture */

  const wood = useMerged(
    () =>
      layout === "table"
        ? [
            { geometry: new THREE.CylinderGeometry(1.25, 1.25, 0.06, 28), at: V3(0, DESK.height, -0.6) },
            { geometry: new THREE.CylinderGeometry(0.12, 0.3, DESK.height - 0.06, 12), at: V3(0, (DESK.height - 0.06) / 2, -0.6) },
          ]
        : slots.flatMap((s) => [
            { geometry: new THREE.BoxGeometry(DESK.width, 0.05, DESK.depth), at: V3(s.x, DESK.height, s.z) },
            { geometry: new THREE.BoxGeometry(DESK.width - 0.1, 0.55, 0.04), at: V3(s.x, DESK.height - 0.32, s.z + DESK.depth / 2 - 0.05) },
          ]),
    [layout, slots],
  );
  const metal = useMerged(
    () => [
      ...slots.flatMap((s) => [
        ...[-1, 1].map((side) => ({ geometry: new THREE.BoxGeometry(0.05, DESK.height, DESK.depth - 0.1), at: V3(s.x + side * (DESK.width / 2 - 0.06), DESK.height / 2, s.z) })),
        { geometry: new THREE.CylinderGeometry(0.11, 0.13, 0.02, 12), at: V3(s.x, DESK.height + 0.035, s.z + 0.16) },
        { geometry: new THREE.BoxGeometry(0.05, 0.22, 0.03), at: V3(s.x, DESK.height + 0.15, s.z + 0.2) },
        /* The desk lamp: arm and foot, on the right. */
        { geometry: new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), at: V3(s.x + 0.62, DESK.height + 0.2, s.z + 0.22), turn: V3(0.3, 0, -0.25) },
        { geometry: new THREE.CylinderGeometry(0.05, 0.03, 0.02, 10), at: V3(s.x + 0.62, DESK.height + 0.04, s.z + 0.22) },
      ]),
      /* Chairs: post and base. */
      ...workers.flatMap((w) => [
        { geometry: new THREE.CylinderGeometry(0.025, 0.025, 0.36, 8), at: V3(w.x, 0.26, w.z) },
        { geometry: new THREE.CylinderGeometry(0.26, 0.26, 0.025, 10), at: V3(w.x, 0.04, w.z) },
      ]),
      /* The lab plinth's ring. */
      ...(layout === "lab" ? [{ geometry: new THREE.TorusGeometry(0.55, 0.03, 8, 32), at: V3(0, 0.98, 1.9), turn: V3(Math.PI / 2, 0, 0) }] : []),
    ],
    [layout, slots, workers],
  );
  const dark = useMerged(
    () => [
      ...slots.flatMap((s, i) => [
        { geometry: new THREE.BoxGeometry(0.64, 0.4, 0.03), at: V3(s.x, DESK.height + 0.42, s.z + 0.2) },
        { geometry: new THREE.BoxGeometry(0.42, 0.02, 0.14), at: V3(s.x - 0.04, DESK.height + 0.035, s.z - 0.12) },
        { geometry: new THREE.BoxGeometry(0.06, 0.02, 0.1), at: V3(s.x + 0.3, DESK.height + 0.035, s.z - 0.12) },
        { geometry: new THREE.BoxGeometry(0.4, 0.56, 0.6), at: V3(s.x + 0.55, 0.3, s.z) },
        /* The lamp shade. */
        { geometry: new THREE.ConeGeometry(0.08, 0.1, 10, 1, true), at: V3(s.x + 0.55, DESK.height + 0.36, s.z + 0.16), turn: V3(0.5, 0, -0.3) },
        /* Cables: monitor to desk edge, desk to floor. */
        { geometry: new THREE.CylinderGeometry(0.008, 0.008, 0.5, 5), at: V3(s.x + 0.1, DESK.height + 0.2, s.z + 0.3), turn: V3(0.35, 0, 0.2) },
        { geometry: new THREE.CylinderGeometry(0.008, 0.008, DESK.height, 5), at: V3(s.x + 0.3, DESK.height / 2, s.z + 0.38), turn: V3(0.08, 0, 0.05) },
        /* A notebook and a phone. */
        { geometry: new THREE.BoxGeometry(0.16, 0.012, 0.22), at: V3(s.x - 0.5, DESK.height + 0.03, s.z - 0.05), turn: V3(0, 0.3 + i * 0.4, 0) },
        { geometry: new THREE.BoxGeometry(0.07, 0.008, 0.14), at: V3(s.x + 0.42, DESK.height + 0.03, s.z - 0.2), turn: V3(0, -0.4, 0) },
        ...(i % 2 === 1
          ? [
              { geometry: new THREE.BoxGeometry(0.32, 0.015, 0.22), at: V3(s.x + 0.52, DESK.height + 0.033, s.z - 0.05), turn: V3(0, -0.3, 0) },
              { geometry: new THREE.BoxGeometry(0.32, 0.21, 0.012), at: V3(s.x + 0.55, DESK.height + 0.13, s.z + 0.06), turn: V3(-0.2, -0.3, 0) },
            ]
          : []),
      ]),
      /* Chairs: seat and back, turned with the worker. */
      ...workers.flatMap((w) => [
        { geometry: new THREE.BoxGeometry(0.46, 0.06, 0.46), at: V3(w.x, 0.47, w.z), turn: V3(0, w.yaw, 0) },
        { geometry: new THREE.BoxGeometry(0.44, 0.52, 0.05), at: V3(w.x - Math.sin(w.yaw) * 0.23, 0.78, w.z - Math.cos(w.yaw) * 0.23), turn: V3(-0.08, w.yaw, 0) },
      ]),
      /* The meeting table: laptops and a speakerphone. */
      ...(layout === "table"
        ? [
            { geometry: new THREE.CylinderGeometry(0.09, 0.09, 0.03, 12), at: V3(0, DESK.height + 0.045, -0.6) },
            ...workers.map((w) => ({ geometry: new THREE.BoxGeometry(0.3, 0.015, 0.2), at: V3(w.x * 0.55, DESK.height + 0.04, -0.6 + (w.z + 0.6) * 0.55), turn: V3(0, w.yaw, 0) })),
            ...workers.map((w) => ({
              geometry: new THREE.BoxGeometry(0.3, 0.2, 0.012),
              at: V3(w.x * 0.55 - Math.sin(w.yaw) * 0.09, DESK.height + 0.13, -0.6 + (w.z + 0.6) * 0.55 - Math.cos(w.yaw) * 0.09),
              turn: V3(-0.2, w.yaw, 0),
            })),
          ]
        : []),
      /* The lab: the prototype's plinth. */
      ...(layout === "lab" ? [{ geometry: new THREE.CylinderGeometry(0.5, 0.6, 0.96, 16), at: V3(0, 0.48, 1.9) }] : []),
    ],
    [layout, slots, workers],
  );
  const screens = useMerged(
    () => [
      ...slots.flatMap((s, i) => [
        { geometry: new THREE.PlaneGeometry(0.6, 0.6 / SCREEN_ASPECT), at: V3(s.x, DESK.height + 0.42, s.z + 0.183), turn: V3(0, Math.PI, 0) },
        ...(i % 2 === 1 ? [{ geometry: new THREE.PlaneGeometry(0.29, 0.29 / SCREEN_ASPECT), at: V3(s.x + 0.548, DESK.height + 0.13, s.z + 0.052), turn: V3(-0.2, Math.PI - 0.3, 0) }] : []),
      ]),
      ...(layout === "table"
        ? workers.map((w) => ({
            geometry: new THREE.PlaneGeometry(0.28, 0.28 / SCREEN_ASPECT),
            at: V3(w.x * 0.55 - Math.sin(w.yaw) * 0.083, DESK.height + 0.13, -0.6 + (w.z + 0.6) * 0.55 - Math.cos(w.yaw) * 0.083),
            turn: V3(-0.2, w.yaw + Math.PI, 0),
          }))
        : []),
    ],
    [layout, slots, workers],
  );
  const ceramics = useMerged(
    () => [
      ...slots.flatMap((s, i) =>
        i % 3 !== 2
          ? [
              { geometry: new THREE.CylinderGeometry(0.045, 0.04, 0.09, 10), at: V3(s.x - 0.55, DESK.height + 0.07, s.z - 0.1) },
              { geometry: new THREE.TorusGeometry(0.035, 0.008, 6, 10), at: V3(s.x - 0.5, DESK.height + 0.07, s.z - 0.1) },
            ]
          : [],
      ),
      ...(layout === "table" ? workers.map((w) => ({ geometry: new THREE.CylinderGeometry(0.04, 0.036, 0.08, 10), at: V3(w.x * 0.42 + 0.2, DESK.height + 0.065, -0.6 + (w.z + 0.6) * 0.42) })) : []),
    ],
    [layout, slots, workers],
  );
  const pots = useMerged(() => [-1, 1].map((side) => ({ geometry: new THREE.CylinderGeometry(0.26, 0.2, 0.5, 10), at: V3(side * (span / 2 - 0.3), 0.25, backZ + 0.8) })), [span, backZ]);
  const leaves = useMerged(
    () =>
      [-1, 1].flatMap((side) =>
        [0, 1, 2, 3].map((k) => ({
          geometry: new THREE.IcosahedronGeometry(0.22 + (k % 2) * 0.08, 1),
          at: V3(side * (span / 2 - 0.3) + Math.cos(k * 1.7) * 0.18, 0.72 + k * 0.16, backZ + 0.8 + Math.sin(k * 1.7) * 0.18),
        })),
      ),
    [span, backZ],
  );
  const frame = useMerged(
    () => [
      { geometry: new THREE.BoxGeometry(span, 0.08, 0.16), at: V3(0, 3.0, backZ) },
      { geometry: new THREE.BoxGeometry(span, 0.06, 0.16), at: V3(0, 0.03, backZ) },
      ...[-1, 1].map((side) => ({ geometry: new THREE.BoxGeometry(0.12, 3.0, 0.16), at: V3((side * span) / 2, 1.5, backZ) })),
      ...[-1, 1].map((side) => ({ geometry: new THREE.BoxGeometry(0.12, 3.2, 0.12), at: V3((side * span) / 2, 1.6, backZ + depth - 0.6) })),
      ...[-1, 1].map((side) => ({ geometry: new THREE.BoxGeometry(0.1, 0.1, depth - 0.5), at: V3((side * span) / 2, 3.2, backZ + (depth - 0.5) / 2) })),
      { geometry: new THREE.BoxGeometry(span, 0.1, 0.1), at: V3(0, 3.2, backZ + depth - 0.6) },
      /* Two ceiling light housings across the room. */
      ...[0.3, 0.7].map((k) => ({ geometry: new THREE.BoxGeometry(span - 0.8, 0.05, 0.14), at: V3(0, 3.18, backZ + (depth - 0.5) * k) })),
      /* The sign's bracket. */
      { geometry: new THREE.BoxGeometry(0.06, 0.5, 0.06), at: V3(-span / 2 + 0.7, 2.75, backZ + depth - 0.6) },
    ],
    [span, backZ, depth],
  );
  const lightStrips = useMerged(
    () => [
      ...[-1, 1].map((side) => ({ geometry: new THREE.PlaneGeometry(0.04, depth - 0.6), at: V3(side * (span / 2 - 0.02), 3.14, backZ + (depth - 0.5) / 2), turn: V3(Math.PI / 2, 0, 0) })),
      { geometry: new THREE.PlaneGeometry(span + 1.6, 0.04), at: V3(0, 0.018, backZ + depth - 0.2), turn: V3(-Math.PI / 2, 0, 0) },
      ...[-1, 1].map((side) => ({ geometry: new THREE.PlaneGeometry(0.04, depth), at: V3(side * (span / 2 + 0.8), 0.018, backZ + depth / 2 - 0.2), turn: V3(-Math.PI / 2, 0, 0) })),
    ],
    [span, backZ, depth],
  );
  const ceilingLights = useMerged(
    () => [0.3, 0.7].map((k) => ({ geometry: new THREE.PlaneGeometry(span - 0.9, 0.08), at: V3(0, 3.15, backZ + (depth - 0.5) * k), turn: V3(Math.PI / 2, 0, 0) })),
    [span, backZ, depth],
  );
  const lampLight = useMerged(() => slots.map((s) => ({ geometry: new THREE.CircleGeometry(0.24, 12), at: V3(s.x + 0.5, DESK.height + 0.028, s.z + 0.06), turn: V3(-Math.PI / 2, 0, 0) })), [slots]);
  const glowTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => () => glowTexture.dispose(), [glowTexture]);
  const prototypeParts = useMerged((): Part[] => [{ geometry: new THREE.IcosahedronGeometry(0.36, 1), at: V3(0, 0, 0) }], []);

  useEffect(
    () =>
      interactables.add({
        id: `office:${id}`,
        at: [office.at[0] + Math.sin(facing) * 3.4, office.at[1] + 1.3, office.at[2] + Math.cos(facing) * 3.4],
        reach: TALK_AT,
        label,
        action,
        activate: () => {
          worldEvents.emit("npc:talk", { id: `office:${id}` });
          onTalk(id);
        },
        priority: 5,
      }),
    [action, facing, id, label, office.at, onTalk],
  );

  /* A sent brief: the speaker thanks the visitor with a nod and a small wave. */
  useEffect(() => {
    const unsubscribe = journeyStore.subscribe(() => {
      const steps = journeyStore.get().steps;
      if (steps[steps.length - 1] === "sent" && guideStore.talking === `office:${id}`) thanked.current = 1;
    });
    return () => {
      unsubscribe();
    };
  }, [id]);

  const local = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, raw) => {
    const node = root.current;
    if (!node) return;
    const delta = Math.min(raw, 0.05);
    time.current += delta;
    const t = time.current;

    local.set(body.x, body.floor, body.z);
    node.worldToLocal(local);
    const distance = Math.hypot(local.x, local.z - (backZ + depth / 2));
    /* The whole room, culled by distance: nothing to draw, nothing to animate. */
    const shown = distance < (compact ? CULL_AT.compact : CULL_AT.desktop);
    if (node.visible !== shown) node.visible = shown;
    if (!shown) return;
    const talking = guideStore.talking === `office:${id}`;
    if (thanked.current > 0) thanked.current = Math.max(0, thanked.current - delta / 2.6);

    /* On a phone the people are drawn only within forty metres; beyond
       that the room stands with its desks and its board, which is what a
       phone can see of it anyway. */
    const wantTier = distance < (compact ? 6 : NEAR_AT) ? 2 : distance < (compact ? 22 : MID_AT) ? 1 : compact ? -1 : 0;
    if (wantTier !== tier.current) {
      tier.current = wantTier;
      for (const fig of figures.current) {
        if (!fig) continue;
        fig.visible = wantTier >= 0;
        fig.traverse((part) => {
          const lod = part.userData.lod as number | undefined;
          if (lod) part.visible = lod <= wantTier;
        });
      }
    }
    if (wantTier < 0) {
      posed.current = true;
      return;
    }

    if (prototype.current) {
      prototype.current.rotation.y = t * 0.5;
      prototype.current.position.y = 1.5 + Math.sin(t * 1.1) * 0.05;
      const ring = prototype.current.children[1];
      if (ring) ring.rotation.x = t * 0.8;
    }

    workers.forEach((worker, i) => {
      const fig = figures.current[i];
      if (!fig) return;
      const k = worker.frame.height / 1.78;
      if (!posed.current) seatedPose(fig, k);

      const dx = local.x - worker.x;
      const dz = local.z - worker.z;
      const near = Math.hypot(dx, dz);
      const toward = Math.atan2(dx, dz);
      const speaker = talking && i === 0;
      const noticing = worker.attentive && near < NOTICE_AT ? THREE.MathUtils.clamp(1 - (near - 2) / (NOTICE_AT - 2), 0.35, 1) : 0;
      /* The speaker swivels the chair to the visitor; the others keep their seats. */
      const swivel = speaker ? worker.yaw + THREE.MathUtils.clamp(toward - worker.yaw, -1.2, 1.2) : worker.yaw;
      let diff = swivel - fig.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      fig.rotation.y += diff * Math.min(1, 3 * delta);

      /* Every so often a glance at a colleague; every so often a sip. */
      const cycle = (t + worker.offset * 4) % worker.sip;
      const glancing = cycle > worker.sip - 2.4 && cycle < worker.sip - 0.6 ? 1 : 0;
      const sipping = cycle > 3 && cycle < 5.2 ? Math.sin(((cycle - 3) / 2.2) * Math.PI) : 0;
      const other = workers[worker.glanceAt];

      const head = fig.getObjectByName("head");
      if (head) {
        let look: number;
        if (noticing > 0 || speaker) look = THREE.MathUtils.clamp(toward - fig.rotation.y, -1.05, 1.05) * (0.75 + noticing * 0.25);
        else if (glancing && other && other !== worker) look = THREE.MathUtils.clamp(Math.atan2(other.x - worker.x, other.z - worker.z) - fig.rotation.y, -1.1, 1.1);
        else look = Math.sin(t * 0.4 * worker.rhythm + worker.offset) * 0.12;
        head.rotation.y += (look - head.rotation.y) * Math.min(1, 3.5 * delta);
        const pitch = noticing > 0 || speaker || glancing ? 0.02 : 0.22 + Math.sin(t * 0.9 + worker.offset) * 0.03;
        const nod = speaker && thanked.current > 0 ? Math.sin(thanked.current * Math.PI * 4) * 0.12 : 0;
        head.rotation.x += (pitch + nod - head.rotation.x) * Math.min(1, 3 * delta);
      }

      const armR = fig.getObjectByName("armR");
      const armL = fig.getObjectByName("armL");
      const foreR = fig.getObjectByName("foreR");
      const foreL = fig.getObjectByName("foreL");
      const burst = Math.max(0, Math.sin(t * 0.5 * worker.rhythm + worker.offset)) > 0.2 ? 1 : 0;
      const type = burst * Math.sin(t * 13 * worker.typing + worker.offset) * 0.05;
      const ease = Math.min(1, 5 * delta);
      if (armR && armL && foreR && foreL) {
        const gesture = speaker ? 0.7 + Math.sin(t * 1.8) * 0.18 : 0;
        const wave = speaker && thanked.current > 0.3 ? 0.9 + Math.sin(t * 6) * 0.25 : 0;
        armR.rotation.x += (-0.55 - gesture * 0.4 - wave * 1.2 - armR.rotation.x) * ease;
        armR.rotation.z += (-0.12 - gesture * 0.25 - wave * 0.4 - armR.rotation.z) * ease;
        foreR.rotation.x += (-1.05 - gesture * 0.6 - wave * 0.6 + (speaker ? 0 : type) - foreR.rotation.x) * ease;
        /* The left hand brings the mug up and back. */
        armL.rotation.x += (-0.55 - sipping * 0.5 - armL.rotation.x) * ease;
        armL.rotation.z += (0.12 + sipping * 0.15 - armL.rotation.z) * ease;
        foreL.rotation.x += (-1.05 - sipping * 1.1 - (speaker ? 0 : type * 0.8) - foreL.rotation.x) * ease;
      }
      fig.position.y = 0.5 - 0.96 * k + Math.sin(t * 1.3 * worker.rhythm + worker.offset) * 0.006;

      if (head) {
        animateFace(fig, worker.face, {
          t,
          dt: delta,
          smile: speaker ? 0.6 + thanked.current * 0.4 : noticing > 0 && near < TALK_AT ? 0.5 : glancing ? 0.2 : 0.08,
          curious: noticing > 0 && !speaker ? 0.4 : 0,
          talking: speaker && thanked.current <= 0 ? 1 : 0,
          gazeYaw: noticing > 0 ? THREE.MathUtils.clamp(toward - fig.rotation.y, -0.8, 0.8) - head.rotation.y : 0,
          gazePitch: noticing > 0 ? -0.05 : -0.2,
        });
      }
    });
    posed.current = true;
  });

  return (
    <group ref={root} position={office.at} rotation={[0, facing, 0]} name={`office:${id}`}>
      <mesh position={[0, 0.02, backZ + depth / 2 - 0.2]}>
        <boxGeometry args={[span + 1.8, 0.04, depth + 0.4]} />
        <meshStandardMaterial color="#101a30" roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh geometry={lightStrips}>
        <Glow colour={office.accent} opacity={0.8} />
      </mesh>
      {!compact ? (
        <mesh geometry={ceilingLights}>
          <Glow colour={MATERIAL.warmWhite} opacity={0.9} />
        </mesh>
      ) : null}

      <mesh geometry={wood}>
        <meshStandardMaterial color="#d9cdb8" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh geometry={metal}>
        <meshStandardMaterial color="#8d97a6" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh geometry={dark}>
        <meshStandardMaterial color="#161a22" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh geometry={screens}>
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      <mesh geometry={ceramics}>
        <meshStandardMaterial color="#f1ede6" roughness={0.4} />
      </mesh>
      {slots.length && !compact ? (
        <mesh geometry={lampLight}>
          <meshBasicMaterial map={glowTexture} color="#ffd9a8" transparent opacity={0.35} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ) : null}
      {!compact ? (
        <>
          <mesh geometry={pots}>
            <meshStandardMaterial color="#2a2f3a" roughness={0.8} />
          </mesh>
          <mesh geometry={leaves}>
            <meshStandardMaterial color={MATERIAL.green} roughness={0.95} flatShading />
          </mesh>
        </>
      ) : null}

      <mesh geometry={frame}>
        <meshStandardMaterial color="#b3bcc8" roughness={0.35} metalness={0.85} />
      </mesh>
      <mesh position={[0, 1.5, backZ]}>
        <boxGeometry args={[span - 0.12, 2.92, 0.04]} />
        <meshPhysicalMaterial color="#1a2a48" transparent opacity={0.42} roughness={0.08} metalness={0.3} envMapIntensity={1.4} depthWrite={false} />
      </mesh>
      <group position={[0, 1.2 + boardH / 2 + 0.2, backZ + 0.1]}>
        <Backlight size={[boardW, boardH]} strength={0.75} inset={0.06} />
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[boardW + 0.14, boardH + 0.14, 0.05]} />
          <meshStandardMaterial color="#0e1524" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh>
          <planeGeometry args={[boardW, boardH]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
        <mesh position={[0, -boardH / 2 - 0.12, 0]}>
          <planeGeometry args={[boardW, 0.03]} />
          <Glow colour={office.accent} opacity={0.9} />
        </mesh>
      </group>
      {/* Side glass and the canopy: a desktop's room; a phone keeps the frame. */}
      {!compact
        ? [-1, 1].map((side) => (
            <mesh key={side} position={[side * (span / 2), 1.5, backZ + (depth - 0.5) / 2]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[depth - 0.7, 2.92, 0.04]} />
              <meshPhysicalMaterial color="#1a2a48" transparent opacity={0.28} roughness={0.08} metalness={0.3} envMapIntensity={1.4} depthWrite={false} />
            </mesh>
          ))
        : null}
      {!compact ? (
        <mesh position={[0, 3.26, backZ + (depth - 0.5) / 2]}>
          <boxGeometry args={[span + 0.1, 0.05, depth - 0.5]} />
          <meshPhysicalMaterial color="#223a66" transparent opacity={0.22} roughness={0.1} metalness={0.4} envMapIntensity={1.2} depthWrite={false} />
        </mesh>
      ) : null}
      {/* The sign: a small lit plate in the department's colour at the front corner. */}
      <mesh position={[-span / 2 + 0.7, 2.5, backZ + depth - 0.56]}>
        <boxGeometry args={[0.7, 0.16, 0.03]} />
        <Glow colour={office.accent} opacity={0.85} />
      </mesh>

      {layout === "lab" ? (
        <group ref={prototype} position={[0, 1.5, 1.9]}>
          <mesh geometry={prototypeParts}>
            <meshBasicMaterial color={office.accent} wireframe transparent opacity={0.85} toneMapped={false} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.5, 0.012, 6, 40]} />
            <Glow colour="#5ee6ff" opacity={0.8} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.12, 12, 10]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} toneMapped={false} />
          </mesh>
        </group>
      ) : null}

      {workers.map((worker, i) => (
        <group
          key={worker.role + i}
          ref={(node) => {
            figures.current[i] = node;
          }}
          position={[worker.x, 0, worker.z]}
          rotation={[0, worker.yaw, 0]}
        >
          <Person frame={worker.frame} wardrobe={worker.wardrobe} skin={worker.skin} hair={worker.hair} projectId={id} />
        </group>
      ))}
    </group>
  );
}
