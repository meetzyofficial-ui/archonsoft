import { cn, hashString, q, seededRandom } from "@/lib/utils";

/**
 * The diagram set.
 *
 * One drawing per idea, in the same hairline-and-annotation language as the
 * hero construction and the project plates. Used by the capabilities index,
 * the in-the-works previews and the lab, so the whole site draws from a single
 * visual vocabulary instead of three unrelated illustration styles.
 *
 * Every drawing is deterministic and server-renderable. No images, no canvas,
 * no runtime cost beyond the markup.
 */

export type DiagramKind =
  | "stack"
  | "viewport"
  | "device"
  | "nodes"
  | "flow"
  | "planes"
  | "field"
  | "composer"
  | "cadence";

const W = 640;
const H = 480;
const A = "var(--accent)";

function Frame() {
  return (
    <g stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" fill="none">
      <path d="M24 52V24h28M588 24h28v28M616 428v28h-28M52 456H24v-28" />
    </g>
  );
}

function Grid() {
  return (
    <g stroke="currentColor" strokeOpacity="0.07" strokeWidth="1">
      {Array.from({ length: 9 }, (_, i) => (
        <line key={`v${i}`} x1={64 + i * 64} y1="40" x2={64 + i * 64} y2={H - 40} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`h${i}`} x1="40" y1={64 + i * 64} x2={W - 40} y2={64 + i * 64} />
      ))}
    </g>
  );
}

/** Custom software / systems: modules resolved into a load-bearing stack. */
function Stack() {
  const rows = [
    { w: 300, hot: false },
    { w: 264, hot: false },
    { w: 228, hot: true },
    { w: 192, hot: false },
  ];
  return (
    <g>
      {rows.map((row, i) => (
        <g key={i}>
          <rect
            x={320 - row.w / 2}
            y={126 + i * 62}
            width={row.w}
            height={48}
            fill={row.hot ? A : "none"}
            fillOpacity={row.hot ? 0.14 : 0}
            stroke={row.hot ? A : "currentColor"}
            strokeOpacity={row.hot ? 0.9 : 0.5}
          />
          {Array.from({ length: 3 }, (_, c) => (
            <line
              key={c}
              x1={320 - row.w / 2 + ((c + 1) * row.w) / 4}
              y1={126 + i * 62}
              x2={320 - row.w / 2 + ((c + 1) * row.w) / 4}
              y2={174 + i * 62}
              stroke="currentColor"
              strokeOpacity="0.18"
            />
          ))}
        </g>
      ))}
      <line x1="150" y1="112" x2="490" y2="112" stroke="currentColor" strokeOpacity="0.35" />
      <line x1="150" y1="386" x2="490" y2="386" stroke="currentColor" strokeOpacity="0.35" />
    </g>
  );
}

/** Web: a page divided by a real layout grid. */
function Viewport() {
  return (
    <g>
      <rect x="104" y="104" width="432" height="272" fill="none" stroke="currentColor" strokeOpacity="0.55" />
      <line x1="104" y1="140" x2="536" y2="140" stroke="currentColor" strokeOpacity="0.35" />
      <circle cx="122" cy="122" r="4" fill="currentColor" fillOpacity="0.4" />
      <circle cx="138" cy="122" r="4" fill="currentColor" fillOpacity="0.4" />
      <rect x="128" y="164" width="192" height="14" fill={A} fillOpacity="0.85" />
      <rect x="128" y="190" width="264" height="8" fill="currentColor" fillOpacity="0.3" />
      <rect x="128" y="206" width="228" height="8" fill="currentColor" fillOpacity="0.3" />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={128 + i * 136}
          y={244}
          width={112}
          height={104}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.3"
        />
      ))}
      <line x1="104" y1="396" x2="536" y2="396" stroke="currentColor" strokeOpacity="0.25" strokeDasharray="2 6" />
    </g>
  );
}

/** Mobile: two devices, one hand-sized target highlighted. */
function Device() {
  return (
    <g>
      <rect x="196" y="88" width="150" height="304" rx="10" fill="none" stroke="currentColor" strokeOpacity="0.3" />
      <rect x="286" y="112" width="160" height="256" rx="12" fill="var(--bg-raise)" stroke="currentColor" strokeOpacity="0.6" />
      <rect x="336" y="126" width="60" height="5" rx="2.5" fill="currentColor" fillOpacity="0.4" />
      <rect x="304" y="152" width="94" height="11" fill={A} fillOpacity="0.85" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={304} y={182 + i * 42} width={124} height={30} fill="none" stroke="currentColor" strokeOpacity="0.28" />
      ))}
      <circle cx="366" cy="332" r="26" fill="none" stroke={A} strokeOpacity="0.8" strokeDasharray="4 5" />
      <text x="366" y="376" textAnchor="middle" fill="currentColor" fillOpacity="0.45" fontFamily="var(--font-mono)" fontSize="13" letterSpacing="1.6">
        THUMB REACH
      </text>
    </g>
  );
}

/** Applied intelligence: retrieval before generation. */
function Nodes() {
  const rand = seededRandom(hashString("nodes"));
  const points = Array.from({ length: 22 }, () => ({
    x: q(96 + rand() * 220),
    y: q(108 + rand() * 264),
    r: q(2 + rand() * 3),
    hit: rand() > 0.74,
  }));
  return (
    <g>
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.hit ? A : "currentColor"} fillOpacity={p.hit ? 1 : 0.35} />
      ))}
      {points.filter((p) => p.hit).map((p, i) => (
        <line key={i} x1={p.x} y1={p.y} x2="404" y2="240" stroke={A} strokeOpacity="0.4" />
      ))}
      <rect x="404" y="192" width="140" height="96" fill="none" stroke="currentColor" strokeOpacity="0.55" />
      <line x1="420" y1="220" x2="528" y2="220" stroke="currentColor" strokeOpacity="0.35" />
      <line x1="420" y1="240" x2="512" y2="240" stroke="currentColor" strokeOpacity="0.35" />
      <line x1="420" y1="260" x2="496" y2="260" stroke={A} strokeOpacity="0.9" />
      <text x="96" y="404" fill="currentColor" fillOpacity="0.45" fontFamily="var(--font-mono)" fontSize="13" letterSpacing="1.6">
        SOURCE
      </text>
      <text x="404" y="404" fill="currentColor" fillOpacity="0.45" fontFamily="var(--font-mono)" fontSize="13" letterSpacing="1.6">
        GROUNDED ANSWER
      </text>
    </g>
  );
}

/** Automation: a process with a readable trail. */
function Flow() {
  const steps = [0, 1, 2, 3];
  return (
    <g>
      {steps.map((i) => (
        <g key={i}>
          <rect
            x={72 + i * 128}
            y={186}
            width={96}
            height={72}
            fill="none"
            stroke={i === 2 ? A : "currentColor"}
            strokeOpacity={i === 2 ? 0.9 : 0.5}
          />
          {i < 3 ? (
            <g stroke="currentColor" strokeOpacity="0.35">
              <line x1={168 + i * 128} y1="222" x2={200 + i * 128} y2="222" />
              <path d={`M${194 + i * 128} 217l6 5-6 5`} fill="none" />
            </g>
          ) : null}
          <text
            x={120 + i * 128}
            y={278}
            textAnchor="middle"
            fill="currentColor"
            fillOpacity="0.4"
            fontFamily="var(--font-mono)"
            fontSize="13"
          >
            {`0${i + 1}`}
          </text>
        </g>
      ))}
      <line x1="72" y1="316" x2="568" y2="316" stroke="currentColor" strokeOpacity="0.25" strokeDasharray="2 6" />
      <text x="72" y="344" fill={A} fontFamily="var(--font-mono)" fontSize="13" letterSpacing="1.6">
        AUDIT TRAIL
      </text>
    </g>
  );
}

/** Products: layered planes resolving into one surface. */
function Planes() {
  return (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={150 + i * 30}
          y={112 + i * 34}
          width={280}
          height={180}
          fill="var(--bg-raise)"
          fillOpacity={i === 3 ? 1 : 0.35}
          stroke={i === 3 ? A : "currentColor"}
          strokeOpacity={i === 3 ? 0.9 : 0.28}
        />
      ))}
      <line x1="256" y1="292" x2="386" y2="292" stroke={A} strokeOpacity="0.85" strokeWidth="2" />
      <text x="150" y="424" fill="currentColor" fillOpacity="0.45" fontFamily="var(--font-mono)" fontSize="13" letterSpacing="1.6">
        STRATEGY / DESIGN / BUILD / RELEASE
      </text>
    </g>
  );
}

/** Lab 001: a displacement field, drawn at rest. */
function Field() {
  const cols = 20;
  const rows = 14;
  return (
    <g>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const x = 72 + c * 26;
          const y = 88 + r * 22;
          const d = q(Math.hypot(x - 380, y - 240) / 150);
          const push = q(Math.max(0, 1 - d) * 16);
          const angle = Math.atan2(y - 240, x - 380);
          return (
            <circle
              key={`${r}-${c}`}
              cx={q(x + Math.cos(angle) * push)}
              cy={q(y + Math.sin(angle) * push)}
              r={q(1.4 + Math.max(0, 1 - d) * 1.8)}
              fill={d < 0.34 ? A : "currentColor"}
              fillOpacity={d < 0.34 ? 0.95 : 0.3}
            />
          );
        }),
      )}
    </g>
  );
}

/** Lab 002: a generated composition, one frame of it. */
function Composer() {
  const rand = seededRandom(hashString("composer"));
  const blocks = Array.from({ length: 9 }, () => ({
    x: 72 + Math.floor(rand() * 8) * 60,
    y: 96 + Math.floor(rand() * 5) * 58,
    w: 60 * (1 + Math.floor(rand() * 3)),
    h: 58 * (1 + Math.floor(rand() * 2)),
    hot: rand() > 0.78,
  }));
  return (
    <g>
      <Grid />
      {blocks.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill={b.hot ? A : "currentColor"}
          fillOpacity={b.hot ? 0.16 : 0.05}
          stroke={b.hot ? A : "currentColor"}
          strokeOpacity={b.hot ? 0.8 : 0.35}
        />
      ))}
    </g>
  );
}

/** Lab 003: type responding to scroll velocity. */
function Cadence() {
  const bars = Array.from({ length: 26 }, (_, i) => {
    const t = i / 25;
    return { x: 72 + i * 19, h: q(20 + Math.sin(t * Math.PI * 2.2) ** 2 * 190) };
  });
  return (
    <g>
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={q(330 - b.h)}
          width={9}
          height={b.h}
          fill={i === 12 || i === 13 ? A : "currentColor"}
          fillOpacity={i === 12 || i === 13 ? 0.95 : 0.22}
        />
      ))}
      <line x1="72" y1="340" x2="568" y2="340" stroke="currentColor" strokeOpacity="0.35" />
      <text x="72" y="372" fill="currentColor" fillOpacity="0.45" fontFamily="var(--font-mono)" fontSize="13" letterSpacing="1.6">
        VELOCITY
      </text>
    </g>
  );
}

const DRAWINGS: Record<DiagramKind, () => React.ReactElement> = {
  stack: Stack,
  viewport: Viewport,
  device: Device,
  nodes: Nodes,
  flow: Flow,
  planes: Planes,
  field: Field,
  composer: Composer,
  cadence: Cadence,
};

export function Diagram({
  kind,
  label,
  className,
  showGrid = true,
}: {
  kind: DiagramKind;
  /** Announced to assistive technology; the drawing is otherwise decorative. */
  label: string;
  className?: string;
  showGrid?: boolean;
}) {
  const Drawing = DRAWINGS[kind];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
      className={cn("[&_*]:[vector-effect:non-scaling-stroke] h-full w-full text-[var(--fg)]", className)}
    >
      {showGrid && kind !== "composer" ? <Grid /> : null}
      <Frame />
      <Drawing />
    </svg>
  );
}
