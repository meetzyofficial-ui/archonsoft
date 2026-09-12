/**
 * What the visitor has found.
 *
 * A world you can walk through once and have seen all of is a corridor. The
 * difference between a corridor and a place is that a place keeps a count of
 * what you have not looked at yet — not as a score, and never as a game, but
 * because knowing there are twenty-eight things here and that you have read
 * nine of them is the whole reason to turn left instead of leaving.
 *
 * It lives outside React for the same reason focus does: the frame loop asks
 * it questions sixty times a second, and the interface only needs to hear
 * about it when a number actually changes.
 *
 * Nothing here is persisted beyond the session. A visitor who comes back
 * tomorrow gets the world fresh, which is the honest default for something
 * whose only reward is the looking.
 */

const KEY = "archon:world:found";

let found = new Set<string>();
let total = 0;
/** Ids seen at close range but not yet inspected. Drives the "there is
    something here" cue without giving the thing away from across a room. */
const noticed = new Set<string>();

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/* A snapshot the interface can compare by reference. Rebuilt only when a
   number changes, so `useSyncExternalStore` does not see a new object every
   time it reads and loop for ever. */
let snapshot = { found: 0, noticed: 0, total: 0, complete: false };
const rebuild = () => {
  snapshot = {
    found: found.size,
    noticed: noticed.size,
    total,
    complete: total > 0 && found.size >= total,
  };
};

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) found = new Set(JSON.parse(raw) as string[]);
  } catch {
    /* Private mode, or storage refused. The world simply starts empty. */
  }
  rebuild();
}

function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...found]));
  } catch {
    /* Not worth a broken world. */
  }
}

let loaded = false;

export const discovery = {
  subscribe(listener: () => void) {
    if (!loaded) {
      loaded = true;
      load();
    }
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => snapshot,
  /** The server-rendered payload knows how many there are; the scene does not. */
  setTotal(next: number) {
    if (next === total) return;
    total = next;
    rebuild();
    emit();
  },
  /** Called when a panel is actually opened and read. */
  find(id: string) {
    if (found.has(id)) return;
    found.add(id);
    save();
    rebuild();
    emit();
  },
  /** Called from the frame loop when something comes within reach. */
  notice(id: string) {
    if (noticed.has(id) || found.has(id)) return;
    noticed.add(id);
    rebuild();
    emit();
  },
  has: (id: string) => found.has(id),
};
