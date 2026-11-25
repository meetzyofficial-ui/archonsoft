import type { CSSProperties } from "react";

/**
 * The colour each product is shown on: its own, taken from its own site.
 * `accent` is the control on the panel and `on` the type on that control.
 */
type Panel = { bg: string; fg: string; accent: string; on: string };

const PANELS: Record<string, Panel> = {
  aracimgo: { bg: "#0b2f25", fg: "#ffffff", accent: "#d4ff3a", on: "#0b2f25" },
  oyundal: { bg: "#2416c9", fg: "#fff8ef", accent: "#c8f031", on: "#1a1140" },
  meetzy: { bg: "#b30d19", fg: "#ffffff", accent: "#ffffff", on: "#7d0710" },
  dppano: { bg: "#12306e", fg: "#ffffff", accent: "#ffffff", on: "#12306e" },
  erden: { bg: "#e9dfcf", fg: "#2b2318", accent: "#2b2318", on: "#fff8ee" },
  "archon-soft-world": { bg: "#17181a", fg: "#f4f4f3", accent: "#ff7300", on: "#0c0c0d" },
};

export function panelStyle(slug: string): CSSProperties {
  const panel = PANELS[slug] ?? PANELS["archon-soft-world"]!;
  return {
    "--panel-bg": panel.bg,
    "--panel-fg": panel.fg,
    "--panel-accent": panel.accent,
    "--panel-on": panel.on,
  } as CSSProperties;
}
