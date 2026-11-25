"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/chrome/Wordmark";
import { LanguageSwitch } from "@/components/chrome/LanguageSwitch";
import { SiteMenu, MenuTrigger } from "@/components/site/SiteMenu";
import { WorldHeaderButton } from "@/components/world/WorldInvite";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";


/** The header: a black bar, the index, and the world in orange at the end of it.
 */
export function SiteHeader({ locale, copy }: { locale: Locale; copy: Copy }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  /* The full index, for the menu. */
  const items = [
    { label: copy.nav.work, href: "/projects" },
    { label: copy.nav.labs, href: "/labs" },
    { label: copy.nav.capabilities, href: "/capabilities" },
    { label: copy.nav.process, href: "/process" },
    { label: copy.nav.about, href: "/about" },
    { label: copy.nav.contact, href: "/contact" },
  ];

  const named = [
    { label: copy.nav.work, href: "/projects" },
    { label: copy.nav.capabilities, href: "/capabilities" },
    { label: copy.nav.about, href: "/about" },
    { label: copy.nav.contact, href: "/contact" },
  ];

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <a
        href="#main"
        className="sr-only mono-label focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[var(--color-orange)] focus:px-4 focus:py-3 focus:text-[var(--color-black)]"
      >
        {copy.nav.skip}
      </a>

      <header data-scheme="black" className="site-header fixed inset-x-0 top-0 z-[90] text-[var(--fg)]">
        <nav aria-label={copy.nav.primary} className="relative z-[95] flex h-full items-center justify-between gap-3 bg-[var(--color-black)] pl-[var(--spacing-gutter)] lg:gap-8">
          <Link href={localePath(locale)} aria-label={`Archon Soft — ${copy.nav.home}`} className="shrink-0">
            <Wordmark className="text-[clamp(0.95rem,4.7vw,1.3rem)] sm:text-[1.5rem]" />
          </Link>
          <ul className="ml-auto hidden items-center gap-8 lg:flex">
            {named.map((item) => {
              const href = localePath(locale, item.href);
              const active = pathname.startsWith(href);
              return (
                <li key={item.href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn("mono-label link-rule", active ? "text-[var(--color-orange)]" : "text-white")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex h-full items-center shrink-0 gap-3.5 sm:gap-7">
            <span className="hidden sm:block">
              <LanguageSwitch locale={locale} label={copy.nav.language} />
            </span>
            <MenuTrigger open={menuOpen} copy={copy} onToggle={() => setMenuOpen((value) => !value)} />
            <WorldHeaderButton locale={locale} label={copy.chrome.world} shortLabel={copy.chrome.worldShort} />
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
