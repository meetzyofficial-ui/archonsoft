/**
 * Where the explorer's body is.
 *
 * The walking loop owns position, heading and speed; the robot that renders
 * the body reads them here every frame and the camera follows them. Nothing
 * in this file renders and nothing subscribes — it is a shared, mutable
 * reading between two frame loops, which is the one situation where a plain
 * object beats a store.
 */
export type Body = {
  x: number;
  z: number;
  /** Height of the floor underfoot. */
  floor: number;
  /** Heading the body is moving in (or last moved in), radians about Y. */
  facing: number;
  /** Where the camera looks, radians about Y. Movement is relative to this. */
  yaw: number;
  /** 0 standing, 1 flat out. */
  pace: number;
  /** Metres walked, cumulative. Drives the stride. */
  walked: number;
  /** World position of whatever is in focus, for the head to turn to. */
  lookAt: [number, number, number] | null;
  /** Height of the feet above the floor: the jump. */
  lift: number;
  /** Vertical speed, for the pose in the air. */
  vy: number;
  /** Seconds since the last landing, while it still shows; 0 when it does not. */
  landing: number;
  /** The wind-up before a jump, 0..1. */
  crouch: number;
  /** Teleporting: how luminous the body is, 0..1, and whether it is there at all. */
  glow: number;
  hidden: boolean;
};

export const body: Body = {
  x: 0,
  z: 24,
  floor: 0,
  facing: 0,
  yaw: 0,
  pace: 0,
  walked: 0,
  lookAt: null,
  lift: 0,
  vy: 0,
  landing: 0,
  crouch: 0,
  glow: 0,
  hidden: false,
};

/** Eye height of the robot, above its feet. Taller than a person. */
export const ROBOT_EYE = 1.92;

/** Strides per metre. A tall frame takes a long step. */
export const STRIDE = 1.2;
