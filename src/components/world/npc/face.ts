import * as THREE from "three";

/**
 * Expression.
 *
 * Every person in the world carries the same small face rig — two lids,
 * two gazes, two brows, a mouth with a lower lip — and this drives it. Not
 * a performance: a blink every few seconds, eyes that go where the head is
 * looking a beat before it gets there, brows that lift a little when someone
 * is curious, a mouth that widens into a smile and that moves while the
 * person is speaking. All of it is small, because faces at this scale that
 * move a lot look wrong, and faces that never move look dead.
 */
export type FaceState = {
  blinkAt: number;
  blink: number;
  smile: number;
  curious: number;
  talk: number;
  rig: FaceRig | null;
};

type FaceRig = {
  lidL: THREE.Object3D | null;
  lidR: THREE.Object3D | null;
  gazeL: THREE.Object3D | null;
  gazeR: THREE.Object3D | null;
  browL: THREE.Object3D | null;
  browR: THREE.Object3D | null;
  mouth: THREE.Object3D | null;
  lip: THREE.Object3D | null;
  face: THREE.Object3D | null;
};

export function newFaceState(seed = Math.random()): FaceState {
  return { blinkAt: 2 + seed * 4, blink: 0, smile: 0, curious: 0, talk: 0, rig: null };
}

function rigOf(fig: THREE.Object3D): FaceRig {
  return {
    lidL: fig.getObjectByName("lidL") ?? null,
    lidR: fig.getObjectByName("lidR") ?? null,
    gazeL: fig.getObjectByName("gazeL") ?? null,
    gazeR: fig.getObjectByName("gazeR") ?? null,
    browL: fig.getObjectByName("browL") ?? null,
    browR: fig.getObjectByName("browR") ?? null,
    mouth: fig.getObjectByName("mouth") ?? null,
    lip: fig.getObjectByName("lipLower") ?? null,
    face: fig.getObjectByName("face") ?? null,
  };
}

const LID_OPEN = -0.35;
const LID_SHUT = 0.6;

export function animateFace(
  fig: THREE.Object3D,
  st: FaceState,
  input: {
    t: number;
    dt: number;
    /** 0..1: how much of a smile. */
    smile: number;
    /** 0..1: brows up, eyes a little wider. */
    curious: number;
    /** 0..1: the mouth moves as if speaking. */
    talking: number;
    /** Where the eyes look, relative to the head, radians. */
    gazeYaw: number;
    gazePitch: number;
  },
) {
  const rig = st.rig ?? (st.rig = rigOf(fig));
  /* Nothing to do for a face that is not being drawn. */
  if (rig.face && !rig.face.visible) return;
  const { t, dt } = input;
  const ease = Math.min(1, 6 * dt);
  st.smile += (input.smile - st.smile) * ease;
  st.curious += (input.curious - st.curious) * ease;
  st.talk += (input.talking - st.talk) * ease;

  /* Blink: a fast close and a slightly slower open, every three to seven
     seconds; a curious person blinks a little more. */
  if (t > st.blinkAt) {
    st.blink = 1;
    st.blinkAt = t + 3 + Math.random() * 4 - st.curious;
  }
  if (st.blink > 0) st.blink = Math.max(0, st.blink - dt * 7);
  const shut = st.blink > 0.5 ? (1 - st.blink) * 2 : st.blink * 2;
  const lid = THREE.MathUtils.lerp(LID_OPEN - st.curious * 0.12, LID_SHUT, shut);
  if (rig.lidL) rig.lidL.rotation.x = lid;
  if (rig.lidR) rig.lidR.rotation.x = lid;

  /* Gaze. */
  const gy = THREE.MathUtils.clamp(input.gazeYaw, -0.35, 0.35);
  const gp = THREE.MathUtils.clamp(input.gazePitch, -0.25, 0.25);
  if (rig.gazeL) {
    rig.gazeL.rotation.y += (gy - rig.gazeL.rotation.y) * Math.min(1, 10 * dt);
    rig.gazeL.rotation.x += (gp - rig.gazeL.rotation.x) * Math.min(1, 10 * dt);
  }
  if (rig.gazeR) {
    rig.gazeR.rotation.y += (gy - rig.gazeR.rotation.y) * Math.min(1, 10 * dt);
    rig.gazeR.rotation.x += (gp - rig.gazeR.rotation.x) * Math.min(1, 10 * dt);
  }

  /* Brows: up with curiosity, and a flicker while talking. */
  const browUp = st.curious * 0.007 + (st.talk > 0.1 ? Math.max(0, Math.sin(t * 2.3)) * 0.003 * st.talk : 0);
  if (rig.browL) rig.browL.position.y = 0.026 + browUp;
  if (rig.browR) rig.browR.position.y = 0.026 + browUp;

  /* The mouth: wider and a touch higher for a smile; the lower lip drops and
     lifts while speaking, in a pattern that is not a metronome. */
  if (rig.mouth) {
    rig.mouth.scale.x = 1 + st.smile * 0.28;
    rig.mouth.position.y = -0.058 + st.smile * 0.004;
    rig.mouth.rotation.z = 0;
  }
  if (rig.lip) {
    const speech = st.talk > 0.05 ? Math.max(0, Math.sin(t * 9.5) * 0.6 + Math.sin(t * 13.7) * 0.4) * st.talk : 0;
    rig.lip.position.y = -0.004 - speech * 0.009 - st.smile * 0.001;
    rig.lip.scale.x = 0.9 + st.smile * 0.2 - speech * 0.15;
  }
}
