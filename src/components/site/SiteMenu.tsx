"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { Copy } from "@/i18n/dictionary";
import { useEscape, useFocusTrap, useScrollLock } from "@/lib/hooks";
import { localePath, type Locale } from "@/lib/i18n";
import { pauseScroll, resumeScroll } from "@/lib/lenis";
import { CONTACT_EMAIL } from "@/lib/site";
import { WorldNavLink } from "@/components/world/WorldInvite";
import { cn } from "@/lib/utils";

/**
 * MENU — the word, not a hamburger.
 *
 * Three stacked lines is a phone icon that ended up on desktops, and this site
 * has a real symbol made of stacked bars already; a second one in the corner
 * would read as a smaller version of the logo. So the trigger is the word and
 * one rule under it, which is also the only affordance any other link on this
 * site has.
 */
export function MenuTrigger({
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
      aria-controls="site-menu"
      className="mono-label link-rule relative z-[95] text-[var(--fg)]"
    >
      {open ? copy.nav.close : copy.nav.menu}
    </button>
  );
}

/**
 * The index, as its own page.
 *
 * It opens as a sheet of paper drawn down over the site — the same light, the
 * same faces, the same hairlines — and the names are set in the display serif
 * at a size the header never uses. Six destinations, each on its own rule with
 * its number in the margin; the world last, because it is the one entry that
 * leaves the document.
 *
 * There is no motion in here beyond the sheet arriving and the names settling
 * behind it in sequence. A menu that animates is a menu you have to wait for.
 */
export function SiteMenu({
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

  const settle = (i: number) => ({
    transform: open ? "none" : "translateY(0.9rem)",
    opacity: open ? 1 : 0,
    transitionProperty: "transform, opacity",
    transitionDuration: "760ms",
    transitionTimingFunction: "var(--ease-out-expo)",
    transitionDelay: `${i * 45 + 140}ms`,
  });

  return (
    <div
      id="site-menu"
      ref={panelRef}
      data-scheme="paper"
      aria-hidden={!open}
      className={cn(
        "pointer-events-auto fixed inset-0 z-[88] flex flex-col bg-[var(--color-night)]",
        "transition-[clip-path,opacity] duration-[800ms] ease-[var(--ease-in-out-quart)]",
        open
          ? "pointer-events-auto opacity-100 [clip-path:inset(0_0_0%_0)]"
          : "pointer-events-none opacity-0 [clip-path:inset(0_0_100%_0)]",
      )}
    >
      {/* The menu is a room in the same building: the same atmosphere is
          behind it, just thicker. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 78% 18%, color-mix(in oklab, var(--color-cyan) 10%, transparent), transparent 68%)," +
            "radial-gradient(ellipse 60% 50% at 10% 92%, color-mix(in oklab, #3b5bdb 12%, transparent), transparent 70%)",
        }}
      />

      <div className="frame h-16 shrink-0" />

      <nav
        aria-label={copy.nav.mobile}
        className="frame relative flex flex-1 flex-col justify-center overflow-y-auto py-8"
      >
        <ul className="w-full">
          {items.map((item, index) => {
            const href = localePath(locale, item.href);
            const active = pathname.startsWith(href);
            return (
              <li key={item.href} className="hairline-t">
                <Link
                  href={href}
                  tabIndex={open ? 0 : -1}
                  aria-current={active ? "page" : undefined}
                  onClick={onClose}
                  className="group/nav flex items-baseline gap-6 py-3.5 md:gap-10"
                  style={settle(index)}
                >
                  <span
                    className={cn(
                      "mono-micro w-7 shrink-0 self-start pt-3",
                      active ? "text-[var(--accent)]" : "text-[var(--fg-mute)]",
                    )}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {item.index}
                  </span>
                  <span
                    className={cn(
                      "text-head transition-transform duration-[700ms] ease-[var(--ease-out-expo)] md:group-hover/nav:translate-x-3",
                      active ? "text-[var(--accent)]" : "text-[var(--fg)]",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
          <li className="hairline-t border-b border-[var(--line)]">
            <WorldNavLink
              locale={locale}
              label={copy.world.nav}
              labelClassName="text-head transition-transform duration-[700ms] ease-[var(--ease-out-expo)] md:group-hover/nav:translate-x-3"
              onClick={onClose}
              tabIndex={open ? 0 : -1}
              className="group/nav flex items-baseline gap-6 py-3.5 text-[var(--fg)] md:gap-10"
              style={settle(items.length)}
            />
          </li>
        </ul>
      </nav>

      <div className="frame hairline-t relative flex flex-wrap items-center justify-between gap-4 py-6">
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
