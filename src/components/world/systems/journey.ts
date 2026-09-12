import type { DepartmentId } from "@/data/departments";

/**
 * The client's path through the company.
 *
 * Which department the visitor asked for at the lobby, which office they
 * are on their way to, which service they picked there, and the steps so
 * far — kept outside React so the walking loop, the offices and the cards
 * read the same story. When a teleport to an office lands, the card for
 * that office opens by itself; the visitor is not left hunting for the
 * people they were sent to.
 */
type Journey = {
  department: DepartmentId | null;
  service: string | null;
  /** The office whose card should open when the visitor arrives. */
  awaiting: string | null;
  steps: string[];
};

let state: Journey = { department: null, service: null, awaiting: null, steps: [] };
const listeners = new Set<() => void>();

export const journeyStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,
  set(next: Partial<Journey>) {
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  },
  step(name: string) {
    if (state.steps[state.steps.length - 1] === name) return;
    journeyStore.set({ steps: [...state.steps, name].slice(-12) });
  },
  reset() {
    journeyStore.set({ department: null, service: null, awaiting: null, steps: [] });
  },
};
