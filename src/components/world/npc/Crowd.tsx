"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { animateFace, newFaceState } from "@/components/world/npc/face";
import { FRAMES, HAIRS, Person, SKINS, WARDROBE } from "@/components/world/npc/Guides";
import { IMPORTANCE, npcFocus, npcStride, npcTier } from "@/components/world/npc/lod";
import { rigIn, type PersonRig } from "@/components/world/npc/rig";
import { useMerged } from "@/components/world/pieces/merge";
import { body } from "@/components/world/systems/body";

/**
 * The population.
 *
 * A world with three groups of guides in it is a showroom; a world with
 * people crossing its plaza, sitting on its kerbs, talking in twos and
 * looking up at the work is a place. These are the people who are simply
 * here — not guides, not interactable, but alive: each has a variation
 * (frame, wardrobe, skin, hair) drawn from a dozen, a place, and something
 * they are doing. Nothing is spawned at random: every one of them was put
 * where they stand, off the walkways and out of the teleport arrivals, on a
 * deck the visitor can also stand on.
 *
 * Behaviour is a small state machine evaluated per frame from `body`:
 * standing (weight shifts, glances), talking (turned to a partner, a
 * gesture now and then, a nod), looking (at a display, still), reading a
 * tablet, resting (seated on a kerb, legs hinged), and walking (a path of
 * waypoints, legs and arms swinging, a pause at each end). Anyone within
 * six metres of the visitor looks up at them.
 *
 * Cost is held down three ways: each person is one draw at the tier their
 * distance gives them (`lod.ts`), anyone past the far tier is one instance
 * of a shared silhouette — nobody past GONE is drawn at all — and the
 * animation of people in the middle distance and beyond is stepped.
 */

type Behaviour = "stand" | "talk" | "look" | "tablet" | "rest" | "walk";

export type Citizen = {
  at: [number, number, number];
  /** Yaw, radians; 0 faces −z. */
  facing: number;
  variant: number;
  behaviour: Behaviour;
  /** For walkers: the waypoints, walked back and forth. */
  path?: [number, number][];
  /** For the seated: the height of what they sit on. */
  seat?: number;
};

/** Twelve people, from which everyone else is dressed. */
const VARIANTS = [
  { frame: 0, wardrobe: "denim", skin: 0, hair: 1 },
  { frame: 2, wardrobe: "plum", skin: 1, hair: 0 },
  { frame: 1, wardrobe: "olive", skin: 2, hair: 3 },
  { frame: 3, wardrobe: "sand", skin: 3, hair: 5 },
  { frame: 4, wardrobe: "charcoal", skin: 1, hair: 0 },
  { frame: 5, wardrobe: "teal", skin: 0, hair: 4 },
  { frame: 6, wardrobe: "rust", skin: 4, hair: 3 },
  { frame: 7, wardrobe: "camel", skin: 3, hair: 2 },
  { frame: 0, wardrobe: "navy", skin: 2, hair: 0 },
  { frame: 2, wardrobe: "cream", skin: 0, hair: 5 },
  { frame: 5, wardrobe: "denim", skin: 4, hair: 0 },
  { frame: 3, wardrobe: "charcoal", skin: 3, hair: 1 },
] as const;

const G = 9; // the gallery deck

/** Where everyone is. Authored, not spawned. */
export const POPULATION: Citizen[] = [
  /* The hub: pairs in conversation on the flanks, people looking up at the
     mark, two resting on the kerbs, readers by the wayfinding panels. */
  { at: [-5, 0, 5], facing: -Math.PI / 2 - 0.3, variant: 0, behaviour: "talk" },
  { at: [-6.3, 0, 5.7], facing: Math.PI / 2 - 0.4, variant: 1, behaviour: "talk" },
  { at: [16, 0, 8], facing: Math.PI / 2 + 0.3, variant: 2, behaviour: "talk" },
  { at: [17.2, 0, 8.9], facing: -Math.PI / 2 + 0.2, variant: 3, behaviour: "talk" },
  { at: [-11, 0, 3], facing: 0.45, variant: 4, behaviour: "look" },
  { at: [12.5, 0, 4], facing: -0.5, variant: 5, behaviour: "look" },
  { at: [-29.4, 0, 6], facing: -Math.PI / 2, variant: 6, behaviour: "rest", seat: 0.44 },
  { at: [29.4, 0, -2], facing: Math.PI / 2, variant: 7, behaviour: "rest", seat: 0.44 },
  { at: [20.5, 0, 17], facing: -Math.PI / 2 - 0.2, variant: 8, behaviour: "tablet" },
  { at: [11, 0, 26.5], facing: -Math.PI / 2, variant: 9, behaviour: "look" },
  { at: [-22.5, 0, 22], facing: 0.2, variant: 10, behaviour: "stand" },
  { at: [-8, 0, 28], facing: 0, variant: 11, behaviour: "walk", path: [[-8, 28], [-8, -22]] },
  { at: [12, 0, -22], facing: Math.PI, variant: 0, behaviour: "walk", path: [[12, -22], [12, 26]] },
  { at: [-20, 0, -16], facing: -Math.PI / 2, variant: 2, behaviour: "walk", path: [[-20, -16], [20, -16]] },
  /* The bridges. */
  { at: [4, 0, -20], facing: 0, variant: 4, behaviour: "walk", path: [[4, -20], [4, -34]] },
  { at: [26, 0, 2.5], facing: -Math.PI / 2, variant: 6, behaviour: "walk", path: [[26, 2.5], [40, 2.5]] },
  /* Shipped: around the two stations, off the axis. */
  { at: [-9, 0, -56], facing: -Math.PI / 2 - 0.4, variant: 1, behaviour: "talk" },
  { at: [-10.3, 0, -56.9], facing: Math.PI / 2 - 0.3, variant: 8, behaviour: "talk" },
  { at: [8.5, 0, -50], facing: -Math.PI / 2 + 0.4, variant: 9, behaviour: "look" },
  { at: [22, 0, -56], facing: 0.3, variant: 3, behaviour: "tablet" },
  { at: [-22, 0, -57], facing: -0.6, variant: 5, behaviour: "stand" },
  { at: [-6, 0, -30], facing: 0, variant: 10, behaviour: "walk", path: [[-6, -30], [-6, -66]] },
  /* The hall of screens: DP Pano's visitors. */
  { at: [53.5, 0, -60], facing: -Math.PI / 2, variant: 11, behaviour: "look" },
  { at: [48, 0, -70.5], facing: -Math.PI / 2 + 0.2, variant: 7, behaviour: "look" },
  { at: [72, 0, -58], facing: Math.PI / 2 + 0.3, variant: 0, behaviour: "talk" },
  { at: [73.1, 0, -58.9], facing: -Math.PI / 2 + 0.3, variant: 2, behaviour: "talk" },
  { at: [56, 0, -58], facing: 0.2, variant: 4, behaviour: "tablet" },
  /* The gallery: looking down on the plaza, and along it. */
  { at: [-24.5, G, -10], facing: -Math.PI / 2, variant: 3, behaviour: "look" },
  { at: [24.5, G, 4], facing: Math.PI / 2, variant: 6, behaviour: "look" },
  { at: [-24.5, G, 18], facing: -Math.PI / 2 + 0.5, variant: 8, behaviour: "talk" },
  { at: [-24.5, G, 19.2], facing: Math.PI / 2 + 0.6, variant: 9, behaviour: "talk" },
  { at: [1, G, -24], facing: Math.PI, variant: 1, behaviour: "look" },
  { at: [24.5, G, 20], facing: 0, variant: 5, behaviour: "walk", path: [[24.5, 20], [24.5, -20]] },
  /* Labs, systems, the archive: a few. */
  { at: [52, 0, 10], facing: Math.PI / 2, variant: 7, behaviour: "look" },
  { at: [64, 0, -12], facing: Math.PI / 2 + 0.3, variant: 10, behaviour: "talk" },
  { at: [65.2, 0, -11.2], facing: -Math.PI / 2 + 0.2, variant: 11, behaviour: "talk" },
  { at: [-62, 0, 4], facing: Math.PI / 2, variant: 0, behaviour: "look" },
  { at: [6, 0, 58], facing: 0, variant: 2, behaviour: "stand" },
];

/* Beyond the far tier a person is an instanced silhouette; beyond GONE, nothing. */
const GONE = 110;
const NOTICE = 6;
const WALK_SPEED = 1.35;

type Rig = {
  fig: THREE.Group;
  person: PersonRig | null;
  head: THREE.Object3D | null;
  legL: THREE.Object3D | null;
  legR: THREE.Object3D | null;
  shinL: THREE.Object3D | null;
  shinR: THREE.Object3D | null;
  armL: THREE.Object3D | null;
  armR: THREE.Object3D | null;
  foreL: THREE.Object3D | null;
  foreR: THREE.Object3D | null;
};

function rigOf(fig: THREE.Group): Rig {
  return {
    fig,
    person: rigIn(fig),
    head: fig.getObjectByName("head") ?? null,
    legL: fig.getObjectByName("legL") ?? null,
    legR: fig.getObjectByName("legR") ?? null,
    shinL: fig.getObjectByName("shinL") ?? null,
    shinR: fig.getObjectByName("shinR") ?? null,
    armL: fig.getObjectByName("armL") ?? null,
    armR: fig.getObjectByName("armR") ?? null,
    foreL: fig.getObjectByName("foreL") ?? null,
    foreR: fig.getObjectByName("foreR") ?? null,
  };
}

export function Crowd({ compact }: { compact: boolean }) {
  /* A phone carries fewer people: every third one stays home. */
  const people = useMemo(() => (compact ? POPULATION.filter((_, i) => i % 3 !== 2) : POPULATION), [compact]);
  const figures = useRef<(THREE.Group | null)[]>([]);
  const rigs = useRef<(Rig | null)[]>([]);
  const silhouettes = useRef<THREE.InstancedMesh>(null);
  const state = useRef(
    people.map((c, i) => ({
      /* Unset: -1 is a real tier (the silhouette), so the first frame must
         differ from it or the far people are never hidden. */
      tier: -2,
      t: Math.random() * 20,
      rhythm: 0.7 + Math.random() * 0.5,
      beat: 5 + Math.random() * 7,
      /* Walkers. */
      leg: 0,
      wait: 0,
      dir: 1,
      x: c.at[0],
      z: c.at[2],
      facing: c.facing,
      phase: 0,
      seed: i * 1.37,
      face: newFaceState(Math.random()),
      /* Reaction to the visitor: how long before this one looks up, and
         whether they do at all — a third of the people stay occupied. */
      reactDelay: 0.3 + Math.random() * 1.6,
      reacts: (i * 7) % 3 !== 0 || c.behaviour === "stand",
      nearFor: 0,
      /* Walkers: their own pace, and pauses along the way. */
      pace: 0.85 + Math.random() * 0.4,
      pauseAt: 4 + Math.random() * 9,
    })),
  );
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  const ZERO = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);
  const silhouette = useMerged(
    () => [
      { geometry: new THREE.CapsuleGeometry(0.17, 0.5, 3, 8), at: [0, 1.24, 0] },
      { geometry: new THREE.SphereGeometry(0.11, 8, 6), at: [0, 1.66, 0] },
      { geometry: new THREE.CapsuleGeometry(0.075, 0.72, 3, 6), at: [-0.1, 0.45, 0] },
      { geometry: new THREE.CapsuleGeometry(0.075, 0.72, 3, 6), at: [0.1, 0.45, 0] },
    ],
    [],
  );

  useFrame((_, raw) => {
    const delta = Math.min(raw, 0.05);
    people.forEach((c, i) => {
      const fig = figures.current[i];
      if (!fig) return;
      const st = state.current[i]!;
      const rig = rigs.current[i] ?? (rigs.current[i] = rigOf(fig));
      const k = FRAMES[VARIANTS[c.variant]!.frame]!.height / 1.78;

      const dx = body.x - st.x;
      const dz = body.z - st.z;
      const distance = Math.hypot(dx, dz);

      /* Distance decides how much of them exists this frame; a phone hands
         people to the instanced silhouettes sooner. */
      const wantTier = npcTier(distance, compact, IMPORTANCE.staff, `crowd:${i}`);
      if (wantTier !== st.tier) {
        st.tier = wantTier;
        rig.person?.setTier(wantTier);
      }
      /* Far people are the instanced silhouettes — a body, a head, two
         legs, in one dark piece; beyond GONE, nothing. */
      if (wantTier < 0) {
        if (distance > GONE) {
          silhouettes.current?.setMatrixAt(i, ZERO);
          return;
        }
        p.set(st.x, c.at[1], st.z);
        e.set(0, st.facing, 0);
        q.setFromEuler(e);
        sc.set(k, k, k);
        silhouettes.current?.setMatrixAt(i, matrix.compose(p, q, sc));
        return;
      }
      silhouettes.current?.setMatrixAt(i, ZERO);

      /* Stepped with distance; a walker is never stepped coarser than every
         other frame, or their stride would read as a stutter. */
      const every = c.behaviour === "walk" ? Math.min(2, npcStride(wantTier)) : npcStride(wantTier);
      if (every > 1 && (npcFocus.frame + i) % every !== 0) return;
      const dt = delta * every;
      st.t += dt;
      const t = st.t;

      /* Walkers move; everyone else stands where they were put. */
      let moving = 0;
      if (c.behaviour === "walk" && c.path && c.path.length >= 2) {
        if (st.wait > 0) {
          st.wait -= dt;
        } else {
          const target = c.path[st.dir > 0 ? c.path.length - 1 : 0]!;
          const tx = target[0] - st.x;
          const tz = target[1] - st.z;
          const left = Math.hypot(tx, tz);
          if (left < 0.3) {
            st.dir *= -1;
            st.wait = 2.5 + Math.random() * 3;
          } else if ((t % st.pauseAt) < 1.6 && left > 4) {
            /* A pause along the way, now and then. */
          } else {
            const speed = WALK_SPEED * st.pace;
            st.x += (tx / left) * speed * dt;
            st.z += (tz / left) * speed * dt;
            const heading = Math.atan2(-tx, -tz);
            let diff = heading - st.facing;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            st.facing += diff * Math.min(1, 6 * dt);
            st.leg += speed * dt * 3.1;
            moving = 1;
          }
        }
        fig.position.set(st.x, c.at[1], st.z);
      }

      /* Facing: the way they were put, or toward the visitor when close —
         after a beat, and not everyone; walkers face the way they go. */
      const bearing = Math.atan2(-dx, -dz) + Math.PI;
      st.nearFor = distance < NOTICE ? st.nearFor + dt : 0;
      const near = st.reacts && st.nearFor > st.reactDelay && c.behaviour !== "rest";
      const wantYaw = moving ? st.facing : near ? bearing : c.facing;
      let diff = wantYaw - fig.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      fig.rotation.y += diff * Math.min(1, (moving ? 6 : 2.2) * dt);

      /* Weight shift and breathing. */
      const sway = Math.sin(t * 0.55 * st.rhythm + st.seed) * 0.02;
      fig.rotation.z = sway * (1 - moving);
      fig.position.y = c.at[1] + (c.behaviour === "rest" ? (c.seat ?? 0.44) - 0.96 * k + 0.02 : Math.sin(t * 1.3 * st.rhythm + st.seed) * 0.01);

      /* Heads: glances, partners, the visitor. */
      if (rig.head) {
        const glance = Math.sin(t * 0.6 * st.rhythm + st.seed * 2) * 0.35;
        const toVisitor = Math.atan2(Math.sin(bearing - fig.rotation.y), Math.cos(bearing - fig.rotation.y));
        const look = near || (st.reacts && distance < NOTICE * 1.6 && st.nearFor > st.reactDelay * 0.5) ? THREE.MathUtils.clamp(toVisitor, -1, 1) * 0.8 : glance;
        rig.head.rotation.y += (look - rig.head.rotation.y) * Math.min(1, 3 * dt);
        const down = c.behaviour === "tablet" ? 0.5 : c.behaviour === "look" ? -0.12 : 0;
        const nod = c.behaviour === "talk" ? Math.max(0, Math.sin(t * 1.4 + st.seed)) ** 6 * 0.14 : 0;
        rig.head.rotation.x = down + nod + Math.sin(t * 0.9 + st.seed) * 0.03;
        /* The face, when it is close enough to be drawn. */
        if (wantTier === 2) {
          const partnerTalk = c.behaviour === "talk" ? (Math.sin(t * 0.7 + st.seed) > 0.2 ? 1 : 0) : 0;
          animateFace(fig, st.face, {
            t,
            dt,
            smile: near ? 0.45 : c.behaviour === "talk" ? 0.25 : 0.05,
            curious: near ? 0.5 : 0,
            talking: partnerTalk,
            gazeYaw: near ? THREE.MathUtils.clamp(toVisitor - rig.head.rotation.y, -0.3, 0.3) : Math.sin(t * 0.4 + st.seed) * 0.15,
            gazePitch: c.behaviour === "tablet" ? 0.2 : 0,
          });
        }
      }

      /* Legs: a walk cycle, a seat, or standing. */
      const swing = Math.sin(st.leg);
      const stride = 0.5 * moving;
      if (rig.legL && rig.legR && rig.shinL && rig.shinR) {
        if (c.behaviour === "rest") {
          rig.legL.rotation.x = -1.45;
          rig.legR.rotation.x = -1.35;
          rig.shinL.rotation.x = 1.4;
          rig.shinR.rotation.x = 1.25;
        } else {
          rig.legL.rotation.x = swing * stride;
          rig.legR.rotation.x = -swing * stride;
          rig.shinL.rotation.x = Math.max(0, -swing) * 0.9 * moving;
          rig.shinR.rotation.x = Math.max(0, swing) * 0.9 * moving;
        }
      }

      /* Arms: swing while walking; held up for a tablet; a gesture now and
         then in talk; hanging otherwise. */
      if (rig.armL && rig.armR && rig.foreL && rig.foreR) {
        const beat = (t + st.seed * 3) % st.beat;
        const gesture = c.behaviour === "talk" && beat < 1.8 ? Math.sin((beat / 1.8) * Math.PI) : 0;
        const tablet = c.behaviour === "tablet" ? 1 : 0;
        const ease = Math.min(1, 5 * dt);
        rig.armR.rotation.x += (swing * 0.45 * moving - gesture * 0.5 - tablet * 0.3 - rig.armR.rotation.x) * ease;
        rig.armL.rotation.x += (-swing * 0.45 * moving - tablet * 0.35 - rig.armL.rotation.x) * ease;
        rig.foreR.rotation.x += (-0.3 - gesture * 1.2 - tablet * 1.4 - rig.foreR.rotation.x) * ease;
        rig.foreL.rotation.x += (-0.25 - tablet * 1.5 - rig.foreL.rotation.x) * ease;
        rig.foreR.rotation.y += ((tablet ? -0.35 : 0) - rig.foreR.rotation.y) * ease;
        rig.foreL.rotation.y += ((tablet ? 0.35 : 0) - rig.foreL.rotation.y) * ease;
      }
    });
    if (silhouettes.current) silhouettes.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="crowd">
      {people.map((c, i) => {
        const v = VARIANTS[c.variant]!;
        return (
          <group
            key={i}
            ref={(node) => {
              figures.current[i] = node;
            }}
            position={c.at}
            rotation={[0, c.facing, 0]}
          >
            <Person
              frame={FRAMES[v.frame]!}
              wardrobe={WARDROBE[v.wardrobe]!}
              skin={SKINS[v.skin]!}
              hair={HAIRS[v.hair]!}
              projectId=""
            />
          </group>
        );
      })}
      {/* The far people: one instanced silhouette for the lot. */}
      <instancedMesh ref={silhouettes} args={[silhouette, undefined, people.length]} frustumCulled={false}>
        <meshLambertMaterial color="#2c3450" />
      </instancedMesh>
    </group>
  );
}
