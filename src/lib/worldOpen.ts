"use client";

import { useEffect, useState } from "react";

/**
 * Whether Archon World is open over the page.
 *
 * The gate stamps `html[data-world-open]` while the world is mounted, and
 * everything on the ordinary site that would compete with it — the robot
 * cursor, the live mark behind the page — reads it here and steps aside.
 * An attribute rather than a context because the gate and those layers are
 * siblings in the layout, and because CSS can read the same flag.
 */
export const WORLD_OPEN_ATTRIBUTE = "data-world-open";

export function useWorldOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setOpen(root.getAttribute(WORLD_OPEN_ATTRIBUTE) === "true");
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: [WORLD_OPEN_ATTRIBUTE] });
    return () => observer.disconnect();
  }, []);
  return open;
}
