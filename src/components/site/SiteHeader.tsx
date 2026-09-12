"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/chrome/Wordmark";
import { LanguageSwitch } from "@/components/chrome/LanguageSwitch";
import { SiteMenu, MenuTrigger } from "@/components/site/SiteMenu";
import { WorldNavLink } from "@/components/world/WorldInvite";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const HEADER_HEIGHT = 64;

/**
 * Which scheme is under the header line, so the chrome inverts when the page
 * passes into the one dark chapter on the site. The observer root is collapsed
 * to a one-pixel strip at the header's baseline, which turns "what is under
 * the header" into a plain intersection test.
 */
function useBandScheme(): "paper" | "ink" {
  const [scheme, setScheme] = useState<"paper" | "ink">("paper");
  const pathname = usePathname();

  useEffect(() => {
    setScheme("paper");

    const bands = Array.from(document.querySelectorAll<HTMLElement>("[data-band]"));
    if (bands.length === 0) return;

    let observer: IntersectionObserver | null = null;

    const attach = () => {
      observer?.disconnect();
      const bottom = Math.max(window.innerHeight - HEADER_HEIGHT - 1, 0);
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            setScheme((entry.target as HTMLElement).dataset.band === "ink" ? "ink" : "paper");
          }
        },
        { rootMargin: `-${HEADER_HEIGHT}px 0px -${bottom}px 0px`, threshold: 0 },
      );
      bands.forEach((band) => observer?.observe(band));
    };

    attach();
    window.addEventListener("resize", attach);
    return () => {
      window.removeEventListener("resize", attach);
      observer?.disconnect();
    };
  }, [pathname]);

  return scheme;
}

/**
 * The header.
 *
 * A mark, four words and a way in — set at eleven pixels, floating on the
 * atmosphere with nothing behind it. There is no bar: no border, no fill, no
 * blur panel, no pill, no button. Once the page has moved past the opening a
 * very faint wash of the paper colour comes up behind it so the words stay
 * readable over a photograph, and that is the entire scroll behaviour.
 *
 * Four destinations are named because those are the four questions a visitor
 * to a studio actually has — what have you made, what is this world thing,
 * who are you, how do I reach you. Everything else is in the index behind
 * MENU, which opens as a page of its own rather than a dropdown.
 */
export function SiteHeader({ locale, copy }: { locale: Locale; copy: Copy }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scheme = useBandScheme();

  /* The full index, for the menu. */
  const items = [
    { label: copy.nav.work, href: "/work", index: "01" },
    { label: copy.nav.labs, href: "/labs", index: "02" },
    { label: copy.nav.capabilities, href: "/capabilities", index: "03" },
    { label: copy.nav.process, href: "/process", index: "04" },
    { label: copy.nav.about, href: "/about", index: "05" },
    { label: copy.nav.contact, href: "/contact", index: "06" },
  ];

  /* The header itself: work, about, contact. The world sits between them as
     a control rather than a route — it forgets the dismissal and asks the
     gate to open. */
  const named = [
    { label: copy.nav.work, href: "/work" },
    { label: copy.nav.about, href: "/about" },
    { label: copy.nav.contact, href: "/contact" },
  ];

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 80);
        frame = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only mono-label focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[var(--color-ink)] focus:px-4 focus:py-3 focus:text-[var(--color-paper)]"
      >
        {copy.nav.skip}
      </a>

      <header
        data-scheme={scheme}
        className="pointer-events-none fixed inset-x-0 top-0 z-[90] text-[var(--fg)]"
      >
        {/* Not a bar — a wash. It has no edge, and it only exists at all so
            eleven-pixel type survives passing over a photograph. */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-0 h-28 transition-opacity duration-[900ms]",
            scrolled ? "opacity-100" : "opacity-0",
          )}
          style={{
            /* Opaque for the height of the bar, then gone. A wash that starts
               fading at the top leaves a paragraph legible directly behind
               the navigation, which is what it was doing. */
            background:
              "linear-gradient(to bottom, var(--bg) 0%, var(--bg) 54%, transparent 100%)",
          }}
        />

        <nav
          aria-label={copy.nav.primary}
          className="frame pointer-events-auto relative flex h-16 items-center justify-between gap-6"
        >
          <Link
            href={localePath(locale)}
            aria-label={`Archon Soft — ${copy.nav.home}`}
            className="shrink-0 text-[var(--fg)]"
          >
            <Wordmark compact={scrolled} />
          </Link>

          <div className="flex items-center gap-5 sm:gap-7">
            <ul className="hidden items-center gap-7 md:flex">
              {named.map((item) => {
                const href = localePath(locale, item.href);
                const active = pathname.startsWith(href);
                return (
                  <li key={item.href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "mono-label link-rule transition-colors duration-[200ms]",
                        active ? "text-[var(--fg)]" : "text-[var(--fg-mute)] hover:text-[var(--fg)]",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <WorldNavLink
                  locale={locale}
                  label={copy.world.nav}
                  className="mono-label link-rule text-[var(--fg-mute)] transition-colors duration-[200ms] hover:text-[var(--fg)]"
                />
              </li>
            </ul>

            <LanguageSwitch locale={locale} label={copy.nav.language} />
            <MenuTrigger
              open={menuOpen}
              copy={copy}
              onToggle={() => setMenuOpen((value) => !value)}
            />
          </div>
        </nav>

        <SiteMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          locale={locale}
          copy={copy}
          items={items}
        />
      </header>
    </>
  );
}
