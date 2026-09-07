import { notFound } from "next/navigation";

/**
 * The reason the designed 404 page ever renders.
 *
 * The root layout lives inside `[locale]`, so a path that matches no route at
 * all never enters that subtree and Next serves its own built-in 404 instead —
 * a bare white page with no navigation, in English, on every mistyped URL and
 * every stale inbound link. This catch-all pulls those paths into the locale
 * tree so `[locale]/not-found.tsx` is the nearest boundary and answers them.
 *
 * More specific segments always win over a catch-all, so no real route is
 * shadowed by this file.
 */
export default function CatchAll() {
  notFound();
}
