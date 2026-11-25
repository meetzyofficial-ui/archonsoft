import Image from "next/image";
import Link from "next/link";
import { ARACIMGO, DPPANO, ERDEN, MEETZY, OYUNDAL } from "@/data/screens";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";

/** What the studio does, what to do about it, and one poster from each product. */
export function Opening({ locale, copy }: { locale: Locale; copy: Copy }) {
  const posters = [
    { slug: "meetzy", name: "Meetzy", screen: MEETZY.problem! },
    { slug: "oyundal", name: "Oyundal", screen: OYUNDAL.plate1! },
    { slug: "aracimgo", name: "AracımGo", screen: ARACIMGO.history! },
    { slug: "dppano", name: "DP Pano", screen: DPPANO.plate1! },
    { slug: "erden", name: "Erden Davetiye", screen: ERDEN.plate2! },
  ];

  return (
    <section data-hero data-scheme="black" aria-labelledby="hero-heading" className="hero forge">
      <div className="frame pt-[clamp(2.25rem,4.6vw,4.5rem)]">
        <h1 id="hero-heading" className="text-display max-w-[19ch]">
          {copy.hero.lead} <span className="text-[var(--color-orange)]">{copy.hero.leadAccent}</span>
        </h1>
        <div className="mt-7 grid gap-7 md:grid-cols-12 md:items-end">
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
      <ul className="hero-posters scroll-row">
        {posters.map(({ slug, name, screen }, i) => (
          <li key={slug}>
            <a href={`#project-${slug}`} className="hero-poster" aria-label={name}>
              <Image
                src={screen.image}
                alt={t(screen.caption, locale)}
                priority={i < 3}
                sizes="(min-width: 1024px) 15vw, (min-width: 640px) 26vw, 42vw"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
