"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { Copy } from "@/i18n/dictionary";
import { useEscape, useFocusTrap, useScrollLock } from "@/lib/hooks";
import { localePath, type Locale } from "@/lib/i18n";
import { pauseScroll, resumeScroll } from "@/lib/lenis";
import { CONTACT_EMAIL } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Touch navigation, designed for touch rather than shrunk from the desktop bar.
 *
 * Trigger and panel are separate components because the header bar retracts on
 * scroll with a transform, and a transformed ancestor becomes the containing
 * block for fixed descendants — which would trap this full-screen panel inside
 * a 72px header.
 */

export function MobileNavTrigger({
  open,
  onToggle,
  copy,
}: {
  open: boolean;
  onToggle: () => void;
  copy: Copy;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="mobile-nav"
      className="mono-label relative z-[95] flex h-9 items-center gap-3 border border-[var(--line-strong)] px-4 lg:hidden"
    >
      <span className="text-left">{open ? copy.nav.close : copy.nav.menu}</span>
      <span aria-hidden="true" className="flex h-3 w-3.5 flex-col justify-center gap-[3px]">
        <span
          className={cn(
            "block h-px w-full bg-current transition-transform duration-[500ms] ease-[var(--ease-out-expo)]",
            open && "translate-y-[2px] rotate-45",
          )}
        />
        <span
          className={cn(
            "block h-px w-full bg-current transition-transform duration-[500ms] ease-[var(--ease-out-expo)]",
            open && "-translate-y-[2px] -rotate-45",
          )}
        />
      </span>
    </button>
  );
}

export function MobileNavPanel({
  open,
  onClose,
  locale,
  copy,
  items,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  copy: Copy;
  items: { label: string; href: string; index: string }[];
}) {
  const pathname = usePathname();

  useScrollLock(open);
  useEscape(onClose, open);
  const panelRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (open) pauseScroll();
    else resumeScroll();
    return () => resumeScroll();
  }, [open]);

  return (
    <div
      id="mobile-nav"
      ref={panelRef}
      data-scheme="dark"
      aria-hidden={!open}
      className={cn(
        "scheme-surface fixed inset-0 z-[88] flex flex-col lg:hidden",
        "transition-[clip-path,opacity] duration-[750ms] ease-[var(--ease-in-out-quart)]",
        open
          ? "pointer-events-auto opacity-100 [clip-path:inset(0_0_0%_0)]"
          : "pointer-events-none opacity-0 [clip-path:inset(0_0_100%_0)]",
      )}
    >
      <div className="frame h-[72px] shrink-0" />

      <nav aria-label={copy.nav.mobile} className="frame flex flex-1 flex-col justify-center">
        <ul>
          {items.map((item, index) => {
            const href = localePath(locale, item.href);
            const active = pathname.startsWith(href);
            return (
              <li key={item.href} className="hairline-b last:border-b">
                <Link
                  href={href}
                  tabIndex={open ? 0 : -1}
                  aria-current={active ? "page" : undefined}
                  onClick={onClose}
                  className="flex items-baseline gap-5 py-5 text-d3"
                  style={{
                    transitionDelay: `${index * 55 + 120}ms`,
                    transform: open ? "none" : "translateY(1.25rem)",
                    opacity: open ? 1 : 0,
                    transitionProperty: "transform, opacity",
                    transitionDuration: "700ms",
                    transitionTimingFunction: "var(--ease-out-expo)",
                  }}
                >
                  <span
                    className={cn(
                      "mono-label",
                      active ? "text-[var(--accent)]" : "text-[var(--fg-mute)]",
                    )}
                  >
                    {item.index}
                  </span>
                  <span className={cn(active ? "text-[var(--accent)]" : "text-[var(--fg)]")}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="frame hairline-t flex flex-wrap items-center justify-between gap-4 py-6">
        {CONTACT_EMAIL ? (
          <a href={`mailto:${CONTACT_EMAIL}`} tabIndex={open ? 0 : -1} className="link-rule text-lead">
            {CONTACT_EMAIL}
          </a>
        ) : (
          <Link
            href={localePath(locale, "/contact")}
            tabIndex={open ? 0 : -1}
            onClick={onClose}
            className="link-rule text-lead"
          >
            {copy.nav.start}
          </Link>
        )}
        <span className="mono-label text-[var(--fg-mute)]">{copy.hero.location}</span>
      </div>
    </div>
  );
}
