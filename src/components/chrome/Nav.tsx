"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/chrome/Wordmark";
import { LanguageSwitch } from "@/components/chrome/LanguageSwitch";
import { MobileNavPanel, MobileNavTrigger } from "@/components/chrome/MobileNav";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const HEADER_HEIGHT = 72;

/**
 * Watches which colour band sits under the header line and returns its scheme,
 * so the navigation inverts as the page passes from dark chapters into light
 * ones. The observer root is collapsed to a one-pixel strip at the header's
 * baseline, which makes "what is under the header" a plain intersection test.
 */
function useBandScheme(): "dark" | "light" {
  const [scheme, setScheme] = useState<"dark" | "light">("dark");
  const pathname = usePathname();

  useEffect(() => {
    setScheme("dark");

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
            setScheme((entry.target as HTMLElement).dataset.band === "light" ? "light" : "dark");
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

export function Nav({ locale, copy }: { locale: Locale; copy: Copy }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [retracted, setRetracted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scheme = useBandScheme();

  const items = [
    { label: copy.nav.work, href: "/work", index: "01" },
    { label: copy.nav.labs, href: "/labs", index: "02" },
    { label: copy.nav.capabilities, href: "/capabilities", index: "03" },
    { label: copy.nav.process, href: "/process", index: "04" },
    { label: copy.nav.about, href: "/about", index: "05" },
    { label: copy.nav.contact, href: "/contact", index: "06" },
  ];

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 24);
        setRetracted(y > 320 && y > last + 4);
        last = y;
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

  const hidden = retracted && !menuOpen;

  return (
    <>
      <a
        href="#main"
        className="sr-only mono-label focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-[var(--color-paper)] focus:px-4 focus:py-3 focus:text-[var(--color-ink)]"
      >
        {copy.nav.skip}
      </a>

      <header data-scheme={scheme} className="fixed inset-x-0 top-0 z-[90] text-[var(--fg)]">
        {/* Only the bar retracts. The panel below must not sit inside a
            transform, or it would inherit this header as its containing
            block and be clipped to the height of the bar. */}
        <div
          className={cn(
            "relative z-[95] transition-transform duration-[600ms] ease-[var(--ease-out-expo)]",
            hidden ? "-translate-y-full" : "translate-y-0",
          )}
        >
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 -z-10 border-b bg-[var(--bg)]/72 backdrop-blur-xl",
              "transition-opacity duration-500",
              scrolled ? "opacity-100" : "opacity-0",
            )}
          />
          <nav
            aria-label={copy.nav.primary}
            className="frame flex h-[72px] items-center justify-between gap-6"
          >
            <Link
              href={localePath(locale)}
              aria-label={`Archon Soft — ${copy.nav.home}`}
              className="link-rule shrink-0 text-[var(--fg)]"
            >
              <Wordmark compact={scrolled} iconId="archon-keystone-nav" />
            </Link>

            <ul className="hidden items-center gap-6 lg:flex xl:gap-9">
              {items.map((item) => {
                const href = localePath(locale, item.href);
                const active = pathname.startsWith(href);
                return (
                  <li key={item.href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "mono-label link-rule transition-colors duration-300",
                        active
                          ? "text-[var(--fg)]"
                          : "text-[var(--fg-mute)] hover:text-[var(--fg)]",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-3">
              <LanguageSwitch locale={locale} label={copy.nav.language} />
              <Link
                href={localePath(locale, "/contact")}
                className="mono-label hidden h-9 items-center border border-[var(--line-strong)] px-4 transition-colors duration-500 hover:bg-[var(--fg)] hover:text-[var(--bg)] sm:inline-flex lg:hidden xl:inline-flex"
              >
                {copy.nav.start}
              </Link>
              <MobileNavTrigger
                open={menuOpen}
                copy={copy}
                onToggle={() => setMenuOpen((value) => !value)}
              />
            </div>
          </nav>
        </div>

        <MobileNavPanel
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
