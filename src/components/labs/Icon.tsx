/**
 * The icon set the Archon Labs interfaces are drawn with.
 *
 * One stroke weight, one 24-unit grid, one component. Product UI lives or dies
 * on whether its icons look like they came from the same hand as its type, so
 * these are drawn here rather than pulled from a library — and a library would
 * also be dead weight for twenty-eight glyphs.
 */

const PATHS: Record<string, string> = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8",
  pipeline: "M4 5h5v14H4zM10.5 5h5v9h-5zM17 5h3v5h-3z",
  chart: "M4 20V10M9.5 20V4M15 20v-7M20.5 20V7",
  spark: "M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  message: "M4 5h16v11H9l-5 4z",
  flow: "M5 4h5v4H5zM14 10h5v4h-5zM5 16h5v4H5zM10 6h2a2 2 0 0 1 2 2v2M10 18h2a2 2 0 0 0 2-2v-2",
  book: "M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3zM5 4v19M17 7h2v13h-2",
  box: "M12 3l8 4.2v9.6L12 21l-8-4.2V7.2zM4 7.2L12 11.5l8-4.3M12 11.5V21",
  cart: "M3 4h2.4l2.3 10.4h9.7L20 7H6M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  tag: "M3 11.5V4h7.5l9.5 9.5-7.5 7.5zM7.2 7.2h.01",
  truck: "M2 6h11v10H2zM13 9h4l3 3.2V16h-7zM6.5 19a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zM17 19a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z",
  calendar: "M4 6h16v15H4zM4 11h16M8.5 3v4M15.5 3v4",
  pin: "M12 21c4.2-4.6 6.3-7.9 6.3-10.4A6.3 6.3 0 0 0 5.7 10.6C5.7 13.1 7.8 16.4 12 21zM12 12.2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  ticket: "M3 7h18v3.2a1.8 1.8 0 0 0 0 3.6V17H3v-3.2a1.8 1.8 0 0 0 0-3.6zM10 7v10",
  shield: "M12 3l7 2.6v5.6c0 4.3-2.8 7.6-7 9.8-4.2-2.2-7-5.5-7-9.8V5.6zM9 12l2.2 2.2L15.5 10",
  database: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  folder: "M3 6h6l2 2.5h10V19H3z",
  file: "M6 3h8l4 4.2V21H6zM14 3v4.5h4M9 12h6M9 16h6",
  bell: "M12 3a6 6 0 0 0-6 6c0 4.5-2 5.7-2 5.7h16S18 13.5 18 9a6 6 0 0 0-6-6zM10 18.5a2.2 2.2 0 0 0 4 0",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2",
  search: "M11 18.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM16.6 16.6L21 21",
  settings: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.5 12l1.7-2-1.6-2.8-2.5.6-1.9-1.4L14.6 3h-3.2L10.8 6.4 8.9 7.8l-2.5-.6L4.8 10l1.7 2-1.7 2 1.6 2.8 2.5-.6 1.9 1.4.6 3.4h3.2l.6-3.4 1.9-1.4 2.5.6 1.6-2.8z",
  plug: "M9 3v5M15 3v5M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0zM12 17v4",
  key: "M15.5 3a5.5 5.5 0 0 1 0 11 5.6 5.6 0 0 1-2.1-.4L11 16H9v2H7v2H3v-4l6.4-6.4A5.5 5.5 0 0 1 15.5 3zM16.8 7.2h.01",
  card: "M3 6h18v12H3zM3 10h18M6.5 14.5h3",
  layers: "M12 3l9 4.5-9 4.5-9-4.5zM3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M13 6l6 6-6 6",
  play: "M7 4.5l12 7.5-12 7.5z",
  chevron: "M9 6l6 6-6 6",
  filter: "M3 5h18l-7 8v6l-4 2v-8z",
  download: "M12 3v12M7.5 10.5L12 15l4.5-4.5M4 20h16",
  eye: "M12 5c5 0 9 7 9 7s-4 7-9 7-9-7-9-7 4-7 9-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  lock: "M6 10h12v11H6zM8.5 10V7a3.5 3.5 0 0 1 7 0v3",
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 16,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
