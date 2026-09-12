/**
 * Asking for the world back.
 *
 * The world opens once per session and remembers being dismissed, which is
 * right — nobody wants a building thrown at them every time they come back to
 * the home page. But that memory also has to be revocable, or the invitation
 * on the ordinary site is a button that does nothing for anyone who has
 * already been in once.
 *
 * So there are two halves: forget the dismissal, and tell whoever is listening.
 * The event matters because the visitor may already be standing on the home
 * page, where there is no navigation for React to react to.
 */
export const WORLD_DISMISSED_KEY = "archon-world-dismissed";
export const OPEN_WORLD_EVENT = "archon:open-world";

export function openWorld() {
  try {
    window.sessionStorage.removeItem(WORLD_DISMISSED_KEY);
  } catch {
    /* A private window never remembered the dismissal in the first place. */
  }
  /* The pre-paint script in the layout hides the overlay off this attribute,
     so it has to be cleared too or the world opens invisibly. */
  document.documentElement.removeAttribute("data-world");
  window.dispatchEvent(new CustomEvent(OPEN_WORLD_EVENT));
}
