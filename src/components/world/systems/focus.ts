/**
 * What the visitor is standing in front of.
 *
 * The render loop works this out sixty times a second and the interface needs
 * to know about it, which is exactly the situation React state handles badly:
 * setting state from a frame loop re-renders the tree every frame whether
 * anything changed or not. So the answer lives outside React in a value with
 * subscribers, and the interface reads it through `useSyncExternalStore` —
 * which re-renders only when the value it returns actually differs.
 */

export type Focus = {
  id: string;
  /** What the thing is called. */
  label: string;
  /** What pressing the key will do. */
  action: string;
} | null;

let current: Focus = null;
let zone: string = "hub";
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const focusStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => current,
  /** Called from the frame loop. A no-op unless the target actually changed. */
  set(next: Focus) {
    if (next?.id === current?.id) return;
    current = next;
    emit();
  },
};

/**
 * Where the visitor is standing, and which way they face.
 *
 * A world large enough to get lost in owes the visitor a way to say where they
 * are — not a minimap, which would hand them the whole plan and remove the
 * reason to walk it, but the two numbers and the bearing a person actually
 * uses to describe a place they are standing in.
 *
 * Emitted only when one of those readings would print differently, so walking
 * across a room is a handful of renders rather than one per frame.
 */
export type Pose = { x: number; z: number; level: number; bearing: string };

const BEARINGS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

let pose: Pose = { x: 0, z: 24, level: 0, bearing: "N" };

export const poseStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => pose,
  /** Called from the walking loop. Yaw is three.js yaw: 0 looks down −z. */
  set(x: number, z: number, level: number, yaw: number) {
    /* −z is north, and the compass runs clockwise from it. */
    const turns = ((-yaw / (Math.PI * 2)) % 1 + 1) % 1;
    const bearing = BEARINGS[Math.round(turns * 8) % 8]!;
    const next = {
      x: Math.round(x),
      z: Math.round(z),
      level: Math.round(level),
      bearing,
    };
    if (
      next.x === pose.x &&
      next.z === pose.z &&
      next.level === pose.level &&
      next.bearing === pose.bearing
    ) {
      return;
    }
    pose = next;
    emit();
  },
};

export const zoneStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => zone,
  set(next: string) {
    if (next === zone) return;
    zone = next;
    emit();
  },
};

/**
 * Everything in the world that can be walked up to.
 *
 * A plain array rather than a React context: the frame loop reads it every
 * frame and never renders from it, and a context that changes on mount of
 * every display would re-render the whole world each time one registered.
 */
export type Interactable = {
  id: string;
  /** Centre of the thing, in world metres. */
  at: [number, number, number];
  /** How close the visitor has to be. */
  reach: number;
  label: string;
  action: string;
  activate: () => void;
  /**
   * How close the visitor is, from 0 at the edge of reach to 1 on top of it.
   *
   * Called from the walking loop, every frame, for everything in range. It is
   * a callback rather than state because what it drives is a material, and
   * pushing a number through React sixty times a second to change an emissive
   * intensity is how a world made of thirty screens becomes a slideshow. The
   * implementation is expected to mutate three.js objects directly and to do
   * nothing else.
   */
  onNear?: (nearness: number) => void;
  /**
   * How strongly this claims the prompt when several things are in reach.
   * A person standing in front of you outranks a billboard forty metres
   * behind them; without this the billboard won on distance-over-facing.
   */
  priority?: number;
};

const registry = new Map<string, Interactable>();

export const interactables = {
  add(item: Interactable) {
    registry.set(item.id, item);
    return () => {
      registry.delete(item.id);
      if (current?.id === item.id) focusStore.set(null);
    };
  },
  all: () => registry,
  get: (id: string) => registry.get(id),
};
