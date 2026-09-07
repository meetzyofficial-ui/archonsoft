"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EXPERIMENTS } from "@/data/lab";
import { useHasPointer, usePrefersReducedMotion } from "@/lib/hooks";
import { t, type Locale } from "@/lib/i18n";
import { cn, hashString, q, seededRandom } from "@/lib/utils";

/**
 * Three working experiments.
 *
 * These are not descriptions of things we might build - they run, on this page,
 * and you can use them. Each one is deliberately small: the point is to answer
 * one question about interface behaviour, not to be a demo reel.
 *
 * All three idle at zero cost: the loops only run while the element is on
 * screen and something is actually moving, and none of them start at all when
 * the visitor has asked for reduced motion.
 */

function Shell({
  id,
  number,
  title,
  field,
  note,
  action,
  children,
}: {
  id: string;
  number: string;
  title: string;
  field: string;
  note: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="hairline-t scroll-mt-24 pt-8 md:pt-10">
      <div className="grid gap-8 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-4">
          <div className="flex items-baseline gap-4">
            <span className="mono-label text-[var(--accent)]">{`EXP ${number}`}</span>
            <span className="mono-label text-[var(--fg-mute)]">{field}</span>
          </div>
          <h2 className="mt-5 text-d3 font-medium">{title}</h2>
          <p className="mt-4 max-w-[38ch] text-[var(--fg-dim)]">{note}</p>
          {action ? <div className="mt-6">{action}</div> : null}
        </div>

        <div className="md:col-span-7 md:col-start-6">{children}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  001 — Displacement field                                           */
/* ------------------------------------------------------------------ */

export function FieldExperiment({ locale }: { locale: Locale }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const hasPointer = useHasPointer();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    type Point = { x: number; y: number; ox: number; oy: number };
    let points: Point[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;

    const pointer = { x: -9999, y: -9999, on: false };
    let frame = 0;
    let visible = false;

    const build = () => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const gap = width < 480 ? 22 : 26;
      const cols = Math.max(6, Math.floor((width - 32) / gap));
      const rows = Math.max(4, Math.floor((height - 32) / gap));
      const offsetX = (width - (cols - 1) * gap) / 2;
      const offsetY = (height - (rows - 1) * gap) / 2;

      points = [];
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          points.push({ x: offsetX + c * gap, y: offsetY + r * gap, ox: 0, oy: 0 });
        }
      }
    };

    const styles = getComputedStyle(document.documentElement);
    const draw = () => {
      const base = styles.getPropertyValue("--color-paper").trim() || "#ffffff";
      const accent = styles.getPropertyValue("--color-blue").trim() || "#4f86ff";
      context.clearRect(0, 0, width, height);

      let moving = false;
      for (const p of points) {
        const dx = p.x + p.ox - pointer.x;
        const dy = p.y + p.oy - pointer.y;
        const distance = Math.hypot(dx, dy);
        const radius = 130;

        if (pointer.on && distance < radius && distance > 0.001) {
          const force = (1 - distance / radius) ** 2 * 34;
          p.ox += (dx / distance) * force * 0.22;
          p.oy += (dy / distance) * force * 0.22;
        }

        p.ox *= 0.9;
        p.oy *= 0.9;
        if (Math.abs(p.ox) > 0.05 || Math.abs(p.oy) > 0.05) moving = true;

        const push = Math.min(1, Math.hypot(p.ox, p.oy) / 16);
        context.fillStyle = push > 0.35 ? accent : base;
        context.globalAlpha = 0.28 + push * 0.72;
        const size = 1.4 + push * 2.6;
        context.beginPath();
        context.arc(p.x + p.ox, p.y + p.oy, size, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      return moving;
    };

    const tick = () => {
      const moving = draw();
      frame = visible && (moving || pointer.on) ? requestAnimationFrame(tick) : 0;
    };

    const wake = () => {
      if (!frame && visible) frame = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.on = true;
      wake();
    };

    const onLeave = () => {
      pointer.on = false;
      wake();
    };

    build();
    draw();

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) wake();
    });
    observer.observe(host);

    const onResize = () => {
      build();
      draw();
    };

    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <Shell
      id="exp-001"
      number="001"
      title={t(EXPERIMENTS[0]!.title, locale)}
      field={t(EXPERIMENTS[0]!.field, locale)}
      note={t(EXPERIMENTS[0]!.note, locale)}
    >
      <div
        ref={hostRef}
        className="relative aspect-[4/3] touch-none border border-[var(--line)] bg-[var(--bg-raise)] md:aspect-[16/10]"
      >
        <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
        <span className="mono-label absolute bottom-3 left-3 text-[var(--fg-mute)]">
          {reduced
            ? locale === "tr"
              ? "Hareket azaltıldı — alan sabit"
              : "Motion reduced — field at rest"
            : hasPointer
              ? locale === "tr"
                ? "İmleci gezdir"
                : "Move the pointer"
              : locale === "tr"
                ? "Alanın üstünde sürükle"
                : "Drag across the field"}
        </span>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/*  002 — Generative composition                                       */
/* ------------------------------------------------------------------ */

function Composition({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const cols = 12;
  const rows = 8;
  const cell = 640 / cols;
  const rowH = 400 / rows;

  const blocks = Array.from({ length: 14 }, () => {
    const w = 1 + Math.floor(rand() * 4);
    const h = 1 + Math.floor(rand() * 3);
    return {
      x: q(Math.floor(rand() * (cols - w)) * cell),
      y: q(Math.floor(rand() * (rows - h)) * rowH),
      w: q(w * cell),
      h: q(h * rowH),
      hot: rand() > 0.8,
      filled: rand() > 0.55,
    };
  });

  return (
    <svg
      viewBox="0 0 640 400"
      role="img"
      aria-label={`Generated composition from seed ${seed}`}
      className="[&_*]:[vector-effect:non-scaling-stroke] h-full w-full text-[var(--fg)]"
      preserveAspectRatio="none"
    >
      <g stroke="currentColor" strokeOpacity="0.08">
        {Array.from({ length: cols - 1 }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * cell} y1="0" x2={(i + 1) * cell} y2="400" />
        ))}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={(i + 1) * rowH} x2="640" y2={(i + 1) * rowH} />
        ))}
      </g>
      {blocks.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill={b.hot ? "var(--accent)" : "currentColor"}
          fillOpacity={b.filled ? (b.hot ? 0.22 : 0.06) : 0}
          stroke={b.hot ? "var(--accent)" : "currentColor"}
          strokeOpacity={b.hot ? 0.9 : 0.38}
        />
      ))}
    </svg>
  );
}

export function ComposerExperiment({ locale }: { locale: Locale }) {
  const [seed, setSeed] = useState(() => hashString("archon/002"));

  const regenerate = useCallback(() => {
    setSeed((current) => (current * 1664525 + 1013904223) >>> 0);
  }, []);

  return (
    <Shell
      id="exp-002"
      number="002"
      title={t(EXPERIMENTS[1]!.title, locale)}
      field={t(EXPERIMENTS[1]!.field, locale)}
      note={t(EXPERIMENTS[1]!.note, locale)}
      action={
        <button
          type="button"
          onClick={regenerate}
          className="mono-label inline-flex h-11 items-center gap-3 border border-[var(--line-strong)] px-5 transition-colors duration-500 hover:bg-[var(--fg)] hover:text-[var(--bg)]"
        >
          {locale === "tr" ? "Bir tane daha çiz" : "Draw another"}
          <span aria-hidden="true" className="tabular-nums opacity-60">
            {seed.toString(16).slice(0, 6)}
          </span>
        </button>
      }
    >
      <div className="relative aspect-[16/10] border border-[var(--line)] bg-[var(--bg-raise)]">
        <Composition seed={seed} />
        <span className="mono-label absolute bottom-3 left-3 tabular-nums text-[var(--fg-mute)]">
          {`SEED ${seed}`}
        </span>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/*  003 — Scroll cadence                                               */
/* ------------------------------------------------------------------ */

export function CadenceExperiment({ locale }: { locale: Locale }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host || reduced) return;

    let last = window.scrollY;
    let velocity = 0;
    let smooth = 0;
    let frame = 0;
    let visible = false;

    const tick = () => {
      smooth += (velocity - smooth) * 0.12;
      velocity *= 0.86;
      const level = Math.min(1, Math.abs(smooth) / 60);
      host.style.setProperty("--v", level.toFixed(3));
      host.style.setProperty("--dir", smooth < 0 ? "-1" : "1");
      if (readoutRef.current) {
        readoutRef.current.textContent = `${Math.round(Math.abs(smooth)).toString().padStart(3, "0")} PX/F`;
      }
      frame = visible && (Math.abs(smooth) > 0.4 || Math.abs(velocity) > 0.4)
        ? requestAnimationFrame(tick)
        : 0;
    };

    const onScroll = () => {
      const now = window.scrollY;
      velocity = now - last;
      last = now;
      if (!frame && visible) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible && !frame) frame = requestAnimationFrame(tick);
    });
    observer.observe(host);

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <Shell
      id="exp-003"
      number="003"
      title={t(EXPERIMENTS[2]!.title, locale)}
      field={t(EXPERIMENTS[2]!.field, locale)}
      note={t(EXPERIMENTS[2]!.note, locale)}
    >
      <div
        ref={hostRef}
        className="relative flex aspect-[16/10] flex-col justify-center overflow-hidden border border-[var(--line)] bg-[var(--bg-raise)] px-6"
        style={{ ["--v" as string]: 0, ["--dir" as string]: 1 }}
      >
        {/* Fixed-height row, bars scaled rather than resized: animating the
            height here reflowed everything below it on every scroll frame. */}
        <div
          aria-hidden="true"
          className="flex h-[26%] items-end gap-[2px]"
          style={{ transform: "translateX(calc(var(--v) * var(--dir) * -18px))" }}
        >
          {Array.from({ length: 28 }, (_, i) => (
            <span
              key={i}
              className="block h-full w-full origin-bottom bg-[var(--fg)]"
              style={{
                transform: `scaleY(calc(0.06 + var(--v) * ${(0.2 + ((i * 37) % 60) / 75).toFixed(3)}))`,
                opacity: 0.2 + ((i % 7) / 7) * 0.5,
              }}
            />
          ))}
        </div>

        <p
          className="mt-8 text-d2 font-medium"
          style={{
            letterSpacing: "calc(-0.04em + var(--v) * 0.09em)",
            transform: "translateX(calc(var(--v) * var(--dir) * 12px))",
          }}
        >
          Cadence
        </p>

        <span
          ref={readoutRef}
          className="mono-label absolute bottom-3 left-6 tabular-nums text-[var(--accent)]"
        >
          000 PX/F
        </span>
      </div>
    </Shell>
  );
}

export function Experiments({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <div className={cn("space-y-16 md:space-y-24", className)}>
      <FieldExperiment locale={locale} />
      <ComposerExperiment locale={locale} />
      <CadenceExperiment locale={locale} />
    </div>
  );
}
