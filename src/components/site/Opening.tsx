import Image from "next/image";
import Link from "next/link";
import { ARACIMGO, DPPANO, MEETZY, OYUNDAL } from "@/data/screens";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";

/** What the studio does, what to do about it, and the work itself as the picture. */
export function Opening({ locale, copy }: { locale: Locale; copy: Copy }) {
  const wall = [
    { screen: MEETZY.plan!, className: "hero-wall__phone" },
    { screen: ARACIMGO.appDiscover!, className: "hero-wall__phone hero-wall__phone--tall" },
    { screen: OYUNDAL.site!, className: "hero-wall__screen" },
    { screen: ARACIMGO.appToday!, className: "hero-wall__phone" },
    { screen: OYUNDAL.home!, className: "hero-wall__phone hero-wall__phone--tall" },
    { screen: DPPANO.board!, className: "hero-wall__screen hidden lg:block" },
  ];

  return (
    <section data-hero data-scheme="black" aria-labelledby="hero-heading" className="hero forge">
      <div className="frame pt-[clamp(2.25rem,5vw,5rem)] pb-[clamp(2.25rem,4vw,4rem)]">
        <h1 id="hero-heading" className="text-display max-w-[19ch]">
          {copy.hero.lead} <span className="text-[var(--color-orange)]">{copy.hero.leadAccent}</span>
        </h1>
        <div className="mt-8 grid gap-8 md:grid-cols-12 md:items-end">
          <p className="max-w-[46ch] text-lead text-[var(--fg-dim)] md:col-span-7">{copy.hero.standfirst}</p>
          <div className="flex flex-wrap gap-3 md:col-span-5 md:justify-end">
            <Link href={localePath(locale, "/contact")} className="btn-raised">
              {copy.hero.ctaContact}
            </Link>
            <a href="#projects" className="btn-raised btn-ghost">
              {copy.hero.ctaWork}
            </a>
          </div>
        </div>
      </div>
      <div className="hero-wall">
        {wall.map(({ screen, className }, i) => (
          <figure key={i} className={className}>
            <Image
              src={screen.image}
              alt={t(screen.caption, locale)}
              priority={i < 4}
              sizes={className.includes("screen") ? "47vw" : "(min-width: 768px) 17vw, 136px"}
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
