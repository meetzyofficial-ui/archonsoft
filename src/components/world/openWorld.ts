/** Anything on the site can ask for the world; the gate listens. */
export const OPEN_WORLD_EVENT = "archon:open-world";

export function openWorld() {
  window.dispatchEvent(new CustomEvent(OPEN_WORLD_EVENT));
}
