import { WORLD_DESTINATIONS, type Destination } from "@/data/world-destinations";

/**
 * Asking to be somewhere else.
 *
 * The rail, the number keys and the wayfinding installation all end up here;
 * the walking loop reads the request once a frame and performs the move.
 * `current` is the destination the visitor is standing in, for the rail to
 * mark; `phase` is the effect in progress, for the robot and the interface.
 */
type Reading = {
  current: string | null;
  /** 0 when nothing is happening; otherwise the effect progress, 0..1. */
  phase: number;
  /** "out" while leaving, "in" while arriving. */
  direction: "out" | "in" | null;
};

let reading: Reading = { current: "hub", phase: 0, direction: null };
let pending: Destination | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const teleportStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => reading,
  /** The latest request wins, even while an earlier one is in flight. */
  request(id: string) {
    const dest = WORLD_DESTINATIONS.find((one) => one.id === id);
    if (!dest) return;
    pending = dest;
  },
  /** The walking loop takes the request; nobody else. */
  take(): Destination | null {
    const next = pending;
    pending = null;
    return next;
  },
  set(next: Partial<Reading>) {
    const merged = { ...reading, ...next };
    if (merged.current === reading.current && merged.phase === reading.phase && merged.direction === reading.direction) return;
    reading = merged;
    emit();
  },
};
