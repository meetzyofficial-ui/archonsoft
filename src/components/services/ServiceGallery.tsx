"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ServiceMedia } from "@/data/services";
import type { Copy } from "@/i18n/dictionary";
import { useEscape, useFocusTrap, useScrollLock } from "@/lib/hooks";
import { t, type Locale } from "@/lib/i18n";
import { pauseScroll, resumeScroll } from "@/lib/lenis";
import { cn } from "@/lib/utils";

/**
 * The examples, one at a time, as large as the screen allows.
 *
 * A dialog with almost no interface: the picture, what it is, where it came
 * from — a shipped product or an Archon Labs concept, printed every time —
 * and the count. Arrows and the two buttons move through it, a swipe does on
 * a phone, Escape and the close button leave, and focus is held inside while
 * it is open and handed back to whatever opened it.
 *
 * Only the picture on screen is requested; its neighbours are fetched as the
 * visitor arrives at them. Nothing here loads before the dialog opens.
 */
export function ServiceGallery({
  title,
  media,
  start,
  locale,
  copy,
  onClose,
}: {
  title: string;
  media: ServiceMedia[];
  start: number;
  locale: Locale;
  copy: Copy;
  onClose: () => void;
}) {
  const c = copy.explorer;
  const [index, setIndex] = useState(Math.min(Math.max(start, 0), Math.max(media.length - 1, 0)));
  const trap = useFocusTrap<HTMLDivElement>(true);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  useScrollLock(true);
  useEscape(onClose, true);

  useEffect(() => {
    pauseScroll();
    return () => resumeScroll();
  }, []);

  const go = useCallback(
    (step: number) => setIndex((current) => (current + step + media.length) % media.length),
    [media.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const item = media[index];
  if (!item || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={trap}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — ${c.gallery}`}
      data-service-gallery=""
      className="service-gallery fixed inset-0 z-[150] flex flex-col"
      onPointerDown={(event) => {
        swipe.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const from = swipe.current;
        swipe.current = null;
        if (!from) return;
        const dx = event.clientX - from.x;
        const dy = event.clientY - from.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="frame flex h-16 shrink-0 items-center justify-between gap-4">
        <p className="mono-micro text-[var(--fg-mute)]">
          {title} · <span style={{ fontVariantNumeric: "tabular-nums" }}>{index + 1} {c.of} {media.length}</span>
        </p>
        <button type="button" onClick={onClose} className="btn-raised btn-ghost mono-label" aria-label={c.close}>
          {c.close}
        </button>
      </div>

      <div className="relative min-h-0 flex-1 px-4 md:px-20">
        <figure key={index} className="service-gallery__figure relative m-0 h-full w-full">
          <Image
            src={item.image}
            alt={t(item.alt, locale)}
            fill
            priority
            placeholder="blur"
            sizes="(min-width: 768px) 88vw, 100vw"
            className="object-contain"
          />
        </figure>

        {media.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={c.previous}
              className="service-gallery__nav left-3 md:left-6"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={c.next}
              className="service-gallery__nav right-3 md:right-6"
            >
              <span aria-hidden="true">→</span>
            </button>
          </>
        ) : null}
      </div>

      <div className="frame shrink-0 pt-4 pb-6 md:pb-8">
        <div className="hairline-t flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 pt-3">
          <p className="flex flex-wrap items-center gap-3">
            {item.concept ? <span className="chip mono-micro">{c.conceptBadge}</span> : null}
            <span className="text-[var(--fg)]">{t(item.alt, locale)}</span>
          </p>
          <p className="mono-micro text-[var(--fg-mute)]">{t(item.context, locale)}</p>
        </div>
        {media.length > 1 ? (
          <div className="mt-4 flex gap-1.5" aria-hidden="true">
            {media.map((_, i) => (
              <span key={i} className={cn("service-gallery__tick", i === index && "is-current")} />
            ))}
          </div>
        ) : null}
        <p className="mono-micro mt-3 text-[var(--fg-mute)] md:hidden">{c.swipe}</p>
      </div>
    </div>,
    document.body,
  );
}
