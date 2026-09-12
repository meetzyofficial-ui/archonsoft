/**
 * Touch input.
 *
 * What a thumb on glass says, for the walking loop to read once a frame: a
 * joystick vector (x right, y forward, each −1..1), the look deltas the
 * camera should turn by since the last frame, and a jump request. Written
 * by the on-screen controls, read and consumed by the explorer; nothing here
 * is React state.
 */
export const touchInput = {
  /** Joystick: right is +x, forward is +y. Magnitude up to 1. */
  x: 0,
  y: 0,
  /** Accumulated look deltas in CSS pixels; the explorer takes and zeroes them. */
  lookDx: 0,
  lookDy: 0,
  /** One jump, taken by the explorer. */
  jump: false,
  /** Whether a touch overlay is driving the world at all. */
  active: false,
  takeLook(): [number, number] {
    const out: [number, number] = [this.lookDx, this.lookDy];
    this.lookDx = 0;
    this.lookDy = 0;
    return out;
  },
};
