"use client";

import { useId, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/labs/Icon";
import { cn, q } from "@/lib/utils";

/**
 * The interface kit every Archon Labs concept is built from.
 *
 * These are real components, not pictures of components. That is the whole
 * point of the section: a visitor should be able to click a row, change a
 * range, open a record and watch the thing behave, because a studio arguing
 * that it builds software should not make the argument with flat images.
 *
 * The window carries its own colour tokens rather than inheriting the page's,
 * so a Labs surface reads as a separate application sitting inside the site —
 * and so a concept can take an accent of its own without leaking it into the
 * Archon frame around it.
 *
 * Everything is laid out with container queries. The same surface appears at
 * a third of the width on the home page and full width on its own page, and
 * it has to be the same component in both places or it stops being real.
 */

/* ------------------------------------------------------------------ window */

export function LabWindow({
  accent,
  product,
  sector,
  chip,
  children,
  className,
}: {
  accent: string;
  product: string;
  sector: string;
  /** The concept label. Never omitted — these are not shipped products. */
  chip: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      style={{ ["--lab-accent" as string]: accent }}
      className={cn(
        "@container/lab lab-window relative isolate w-full overflow-hidden rounded-xl border",
        "border-[var(--lab-edge)] bg-[var(--lab-bg)] text-[var(--lab-fg)]",
        "shadow-[0_40px_120px_-60px_rgba(0,0,0,0.95)]",
        className,
      )}
    >
      <div className="flex h-9 items-center gap-3 border-b border-[var(--lab-line)] bg-[var(--lab-panel)] px-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-[var(--lab-line-strong)]" />
          <span className="size-2 rounded-full bg-[var(--lab-line-strong)]" />
          <span className="size-2 rounded-full bg-[var(--lab-accent)]" />
        </span>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--lab-dim)]">
          {product}
          <span className="text-[var(--lab-mute)]"> / {sector}</span>
        </span>
        <span className="ml-auto shrink-0 rounded-full border border-[var(--lab-line-strong)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--lab-mute)]">
          {chip}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- shell */

export type NavItem = { id: string; label: string; icon: IconName; badge?: string };

export function LabShell({
  nav,
  active,
  onSelect,
  navLabel,
  children,
}: {
  nav: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  navLabel: string;
  children: ReactNode;
}) {
  const uid = useId();
  const panelId = `${uid}-panel`;

  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = nav.findIndex((item) => item.id === active);
    const last = nav.length - 1;
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    const target = nav[next];
    if (target) onSelect(target.id);
  };

  return (
    <div className="flex min-h-[400px] @[46rem]/lab:min-h-[496px]">
      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label={navLabel}
        onKeyDown={onKeyDown}
        className="w-11 shrink-0 border-r border-[var(--lab-line)] bg-[var(--lab-panel)] py-2 @[46rem]/lab:w-52 @[46rem]/lab:py-3"
      >
        {nav.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(item.id)}
              title={item.label}
              className={cn(
                "relative flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[12px]",
                "transition-colors duration-200 @[46rem]/lab:px-3.5",
                selected
                  ? "text-[var(--lab-fg)]"
                  : "text-[var(--lab-mute)] hover:text-[var(--lab-dim)]",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-y-1 left-0 w-[2px] rounded-r bg-[var(--lab-accent)] transition-transform duration-300",
                  selected ? "scale-y-100" : "scale-y-0",
                )}
              />
              <Icon
                name={item.icon}
                size={15}
                className={cn("shrink-0", selected && "text-[var(--lab-accent)]")}
              />
              <span className="hidden truncate @[46rem]/lab:inline">{item.label}</span>
              {item.badge ? (
                <span className="ml-auto hidden shrink-0 rounded bg-[var(--lab-raise)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--lab-dim)] @[46rem]/lab:inline">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={panelId}
        tabIndex={0}
        className="flex min-w-0 flex-1 flex-col"
      >
        {children}
      </div>
    </div>
  );
}

export function LabHeader({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--lab-line)] px-3 py-2.5 @[46rem]/lab:px-5 @[46rem]/lab:py-3.5">
      <h4 className="font-sans text-[13px] font-medium tracking-[-0.01em] text-[var(--lab-fg)] @[46rem]/lab:text-[15px]">
        {title}
      </h4>
      {meta ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--lab-mute)]">
          {meta}
        </span>
      ) : null}
      {children ? <div className="ml-auto flex items-center gap-2">{children}</div> : null}
    </div>
  );
}

/* ----------------------------------------------------------------- controls */

export function Segmented({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex rounded-md border border-[var(--lab-line)] p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
          className={cn(
            // 24px is the WCAG 2.2 minimum for adjacent targets, and these sit
            // shoulder to shoulder in a segmented control.
            "cursor-pointer rounded px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors duration-200",
            option.id === value
              ? "bg-[var(--lab-raise)] text-[var(--lab-fg)]"
              : "text-[var(--lab-mute)] hover:text-[var(--lab-dim)]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function GhostButton({
  children,
  icon,
  onClick,
  pressed,
  tone = "quiet",
}: {
  children: ReactNode;
  icon?: IconName;
  onClick?: () => void;
  pressed?: boolean;
  tone?: "quiet" | "accent";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] transition-colors duration-200",
        tone === "accent"
          ? "bg-[var(--lab-accent)] font-medium text-[var(--lab-on-accent)] hover:opacity-90"
          : "border border-[var(--lab-line)] text-[var(--lab-dim)] hover:text-[var(--lab-fg)]",
      )}
    >
      {icon ? <Icon name={icon} size={13} /> : null}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------- atoms */

export type Tone = "good" | "warn" | "risk" | "idle" | "accent";

const TONE_CLASS: Record<Tone, string> = {
  good: "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/25",
  warn: "text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/25",
  risk: "text-[#fb7185] bg-[#fb7185]/10 border-[#fb7185]/25",
  idle: "text-[var(--lab-mute)] bg-[var(--lab-raise)] border-[var(--lab-line)]",
  accent:
    "text-[var(--lab-accent)] bg-[color-mix(in_oklab,var(--lab-accent)_16%,transparent)] border-[color-mix(in_oklab,var(--lab-accent)_35%,transparent)]",
};

export function Pill({ children, tone = "idle" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
        TONE_CLASS[tone],
      )}
    >
      {children}
    </span>
  );
}

/**
 * Initials, never a photograph. There are no stock faces anywhere on this
 * site, and a concept product is not a reason to start.
 */
export function Initials({ name, tone = 0 }: { name: string; tone?: number }) {
  const letters = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
  const hues = ["#6b7fa8", "#8a7099", "#5f8f8a", "#9a8262", "#7a6f9c"];
  const hue = hues[tone % hues.length] as string;
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: `${hue}33`, color: hue }}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold tracking-wide"
    >
      {letters}
    </span>
  );
}

export function Stat({
  label,
  value,
  delta,
  tone = "idle",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: Tone;
}) {
  return (
    <div className="border-r border-b border-[var(--lab-line)] px-3 py-3 @[46rem]/lab:border-b-0 @[46rem]/lab:px-4 @[46rem]/lab:py-4">
      <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--lab-mute)]">
        {label}
      </p>
      <p className="mt-1.5 font-sans text-[18px] font-medium tabular-nums tracking-[-0.02em] text-[var(--lab-fg)] @[46rem]/lab:text-[22px]">
        {value}
      </p>
      {delta ? (
        <p
          className={cn(
            "mt-1 font-mono text-[10px] tabular-nums",
            tone === "good"
              ? "text-[#4ade80]"
              : tone === "risk"
                ? "text-[#fb7185]"
                : "text-[var(--lab-mute)]",
          )}
        >
          {delta}
        </p>
      ) : null}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 border-b border-[var(--lab-line)] @[46rem]/lab:grid-cols-4">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- charts */

/** Normalises a series into the drawing box. */
function seriesPath(values: number[], width: number, height: number, pad = 5): string {
  if (values.length < 2) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  return values
    .map((value, i) => {
      const x = q(i * step);
      const y = q(pad + (1 - (value - min) / span) * (height - pad * 2));
      return `${i === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}

export function AreaChart({
  values,
  labels,
  peak,
}: {
  values: number[];
  labels?: string[];
  /** Printed against the emphasised final point. */
  peak?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const width = 600;
  const height = 132;
  const line = seriesPath(values, width, height);
  const last = values[values.length - 1] ?? 0;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const lastY = q(5 + (1 - (last - min) / (max - min || 1)) * (height - 10));

  return (
    <div className="px-3 py-3 @[46rem]/lab:px-5 @[46rem]/lab:py-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Sample series"
        className="h-24 w-full @[46rem]/lab:h-[132px]"
      >
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--lab-accent)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="var(--lab-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((row) => (
          <line
            key={row}
            x1="0"
            x2={width}
            y1={q(height * row)}
            y2={q(height * row)}
            stroke="var(--lab-line)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={`url(#fill-${uid})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--lab-accent)"
          strokeWidth="1.8"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={width - 3} cy={lastY} r="3.5" fill="var(--lab-accent)" />
      </svg>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex flex-1 justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--lab-mute)]">
          {(labels ?? []).map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        {peak ? (
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--lab-accent)]">
            {peak}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function BarChart({
  values,
  labels,
  caption,
}: {
  values: number[];
  labels: string[];
  caption?: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="px-3 py-3 @[46rem]/lab:px-5 @[46rem]/lab:py-4">
      <div className="flex h-24 items-end gap-1.5 @[46rem]/lab:h-32 @[46rem]/lab:gap-2">
        {values.map((value, i) => (
          <div key={i} className="flex h-full flex-1 flex-col justify-end">
            {/* Fixed track, scaled child. Animating a height reflows the page
                on every frame, which is a layout shift the moment it moves. */}
            <span
              style={{ transform: `scaleY(${q(Math.max(value / max, 0.02))})` }}
              className={cn(
                "block h-full origin-bottom rounded-t-[2px] transition-transform duration-[600ms] ease-[var(--ease-out-expo)]",
                i === values.length - 1
                  ? "bg-[var(--lab-accent)]"
                  : "bg-[var(--lab-line-strong)]",
              )}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 @[46rem]/lab:gap-2">
        {labels.map((label, i) => (
          <span
            key={i}
            className="flex-1 truncate text-center font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--lab-mute)]"
          >
            {label}
          </span>
        ))}
      </div>
      {caption ? (
        <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--lab-mute)]">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

/** Horizontal share bars — funnels, segments, sources. */
export function Breakdown({
  rows,
  unit = "",
}: {
  rows: { label: string; value: number; note?: string }[];
  unit?: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="px-3 py-3 @[46rem]/lab:px-5 @[46rem]/lab:py-4">
      {rows.map((row, i) => (
        <div key={row.label} className="py-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[11.5px] text-[var(--lab-dim)]">{row.label}</span>
            <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-[var(--lab-fg)]">
              {row.value.toLocaleString("en-US")}
              {unit}
              {row.note ? <span className="ml-2 text-[var(--lab-mute)]">{row.note}</span> : null}
            </span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--lab-raise)]">
            <span
              style={{ width: `${q((row.value / max) * 100)}%`, opacity: 1 - i * 0.12 }}
              className="block h-full rounded-full bg-[var(--lab-accent)] transition-[width] duration-[700ms] ease-[var(--ease-out-expo)]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------- table */

export type Column = { key: string; label: string; align?: "end"; hideNarrow?: boolean };

export function DataTable({
  columns,
  rows,
  activeId,
  onSelect,
  caption,
}: {
  columns: Column[];
  rows: { id: string; cells: Record<string, ReactNode> }[];
  activeId?: string;
  onSelect?: (id: string) => void;
  caption: string;
}) {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-[var(--lab-line)]">
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={cn(
                "px-3 py-2 font-mono text-[9.5px] font-normal uppercase tracking-[0.14em] text-[var(--lab-mute)] @[46rem]/lab:px-4",
                column.align === "end" && "text-right",
                column.hideNarrow && "hidden @[46rem]/lab:table-cell",
              )}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const selected = row.id === activeId;
          return (
            <tr
              key={row.id}
              onClick={onSelect ? () => onSelect(row.id) : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onKeyDown={
                onSelect
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(row.id);
                      }
                    }
                  : undefined
              }
              className={cn(
                "border-b border-[var(--lab-line)] transition-colors duration-150 last:border-b-0",
                onSelect && "cursor-pointer",
                selected
                  ? "bg-[color-mix(in_oklab,var(--lab-accent)_10%,transparent)]"
                  : onSelect && "hover:bg-[var(--lab-raise)]",
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-3 py-2.5 text-[11.5px] text-[var(--lab-dim)] @[46rem]/lab:px-4 @[46rem]/lab:text-[12.5px]",
                    column.align === "end" && "text-right tabular-nums",
                    column.hideNarrow && "hidden @[46rem]/lab:table-cell",
                  )}
                >
                  {row.cells[column.key]}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* -------------------------------------------------------------------- panel */

export function SidePanel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-lab-panel=""
      className="border-t border-[var(--lab-line)] bg-[var(--lab-panel)] @[52rem]/lab:w-64 @[52rem]/lab:shrink-0 @[52rem]/lab:border-t-0 @[52rem]/lab:border-l"
    >
      <div className="px-4 py-3">
        {eyebrow ? (
          <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--lab-accent)]">
            {eyebrow}
          </p>
        ) : null}
        <p className="mt-1 text-[13px] font-medium text-[var(--lab-fg)]">{title}</p>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-[var(--lab-line)] py-2">
      <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--lab-mute)]">
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-[11.5px] text-[var(--lab-dim)]">
        {value}
      </span>
    </div>
  );
}

/** A vertical event log — the thing that makes a system feel inhabited. */
export function Timeline({
  items,
}: {
  items: { at: string; text: string; actor?: string }[];
}) {
  return (
    <ol className="px-3 py-2 @[46rem]/lab:px-5 @[46rem]/lab:py-3">
      {items.map((item, i) => (
        <li key={i} className="relative flex gap-3 py-2 pl-4">
          <span
            aria-hidden="true"
            className="absolute top-[13px] left-[3px] size-1.5 rounded-full bg-[var(--lab-accent)]"
          />
          {i < items.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute top-[20px] bottom-0 left-[6.5px] w-px bg-[var(--lab-line)]"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] leading-relaxed text-[var(--lab-dim)]">
              {item.actor ? (
                <span className="font-medium text-[var(--lab-fg)]">{item.actor} </span>
              ) : null}
              {item.text}
            </p>
            <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--lab-mute)]">
              {item.at}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------- phone */

/** The mobile half of a product, at device scale. */
export function PhoneShell({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-[208px] shrink-0", className)}>
      <div className="overflow-hidden rounded-[1.6rem] border border-[var(--lab-line-strong)] bg-[var(--lab-bg)] p-[3px]">
        <div className="overflow-hidden rounded-[1.42rem] bg-[var(--lab-panel)]">
          <div className="flex items-center justify-between px-4 pt-2.5 pb-1 font-mono text-[9px] text-[var(--lab-mute)]">
            <span>9:41</span>
            <span
              aria-hidden="true"
              className="block h-1.5 w-3 rounded-[1px] border border-current"
            />
          </div>
          {children}
        </div>
      </div>
      {label ? (
        <p className="mt-2 text-center font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--lab-mute)]">
          {label}
        </p>
      ) : null}
    </div>
  );
}

export { Icon };
