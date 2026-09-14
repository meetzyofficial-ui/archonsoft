import Link from "next/link";
import { Clock } from "@/components/chrome/Clock";
import { ArchonIcon } from "@/components/chrome/Wordmark";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import { WorldNavLink } from "@/components/world/WorldInvite";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";
import { CONTACT_EMAIL, SITE, SOCIALS } from "@/lib/site";

/**
 * The close.
 *
 * The site is daylight for its whole length and then the light goes at the
 * end — the last screen darkens out of the paper into ink, one sentence is set
 * across it, and under that there is a single rule of links and a colophon at
 * ten pixels. That is the entire footer: no three columns of headings, no
 * newsletter box, no sitemap, no wordmark blown up to the width of the page.
 *
 * On the home page this dusk begins one section earlier, in the world entry,
 * and the two run together as one continuous descent — the rule below turns
 * this gradient off whenever the band above is already dark, so the ending
 * never flickers back to daylight for a hundred pixels in between.
 *
 * The three-word legend stays. It is what makes the vocabulary on the rest of
 * the site true — SHIPPED means shipped, ARCHON LABS means a concept nobody
 * paid for — and it appears wherever a page ends so nothing on this site has
 * to be qualified twice. It is set as one line of fine print, because honesty
 * does not have to be loud.
 */
export function StudioClosing({ locale, copy }: { locale: Locale; copy: Copy }) {
  const year = new Date().getFullYear();

  const items = [
    { label: copy.nav.work, href: "/projects" },
    { label: copy.nav.capabilities, href: "/capabilities" },
    { label: copy.nav.labs, href: "/labs" },
    { label: copy.nav.about, href: "/about" },
    { label: copy.nav.contact, href: "/contact" },
  ];

  return (
    <footer
      data-scheme="paper"
      data-band="paper"
      className="relative overflow-hidden"
    >
      {/* The dusk. Suppressed by the rule in globals.css when the section
          above is already ink. */}
      <div
        aria-hidden="true"
        className="site-dusk pointer-events-none absolute inset-x-0 top-0 h-[34svh]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, color-mix(in oklab, #000000 45%, transparent) 100%)",
        }}
      />

      <div className="frame relative pt-[24svh]">
        <ScrollFrame enter={0.5}>
          <p className="text-section rise-copy max-w-[16ch]">{copy.footer.closing}</p>
        </ScrollFrame>

        {/* The one thing to do about it, as a line. */}
        <div className="mt-12 flex flex-wrap items-end justify-between gap-x-12 gap-y-8 md:mt-16">
          {CONTACT_EMAIL ? (
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-sub group -my-2 inline-flex items-baseline gap-5 py-2"
            >
              {CONTACT_EMAIL}
              <span
                aria-hidden="true"
                className="relative block h-px w-12 self-center bg-current transition-[width] duration-[700ms] ease-[var(--ease-out-expo)] group-hover:w-20"
              >
                <span className="absolute -top-[3px] right-0 block size-[7px] rotate-45 border-t border-r border-current" />
              </span>
            </a>
          ) : (
            <Link
              href={localePath(locale, "/contact")}
              className="text-sub group -my-2 inline-flex items-baseline gap-5 py-2"
            >
              {copy.nav.start}
              <span
                aria-hidden="true"
                className="relative block h-px w-12 self-center bg-current transition-[width] duration-[700ms] ease-[var(--ease-out-expo)] group-hover:w-20"
              >
                <span className="absolute -top-[3px] right-0 block size-[7px] rotate-45 border-t border-r border-current" />
              </span>
            </Link>
          )}

          <div className="flex flex-col items-start gap-2 md:items-end">
            <span className="mono-micro text-[var(--fg-mute)]">{copy.hero.location}</span>
            <Clock className="mono-micro tabular-nums text-[var(--fg-mute)]" />
          </div>
        </div>

        {/* The index, on one rule. */}
        <nav
          aria-label={copy.footer.index}
          className="hairline-t mt-20 flex flex-wrap items-center gap-x-8 gap-y-3 py-5 md:mt-28"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={localePath(locale, item.href)}
              className="mono-label link-rule text-[var(--fg-mute)] transition-colors duration-300 hover:text-[var(--fg)]"
            >
              {item.label}
            </Link>
          ))}
          <WorldNavLink
            locale={locale}
            label={copy.world.nav}
            className="mono-label link-rule text-[var(--fg-mute)] transition-colors duration-300 hover:text-[var(--fg)]"
          />
          {SOCIALS.length > 0 ? (
            <span className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mono-label link-rule text-[var(--fg-mute)] transition-colors duration-300 hover:text-[var(--fg)]"
                >
                  {social.label}
                </a>
              ))}
            </span>
          ) : null}
        </nav>

        {/* How to read this site. */}
        <div className="hairline-t py-5">
          <h2 className="mono-micro text-[var(--fg-mute)]">{copy.provenance.legend}</h2>
          <dl className="mono-micro mt-4 grid gap-x-10 gap-y-3 text-[var(--fg-mute)] md:grid-cols-3">
            {(
              [
                [copy.provenance.shipped, copy.provenance.shippedNote],
                [copy.provenance.concept, copy.provenance.conceptNote],
                [copy.provenance.capability, copy.provenance.capabilityNote],
              ] as const
            ).map(([term, note]) => (
              <div key={term} className="flex gap-3">
                <dt className="shrink-0 text-[var(--fg-dim)]">{term}</dt>
                <dd className="max-w-[30ch] normal-case tracking-normal">{note}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The extra bottom room is for the world's re-entry control, which
            is fixed to this corner on every page. */}
        <div className="hairline-t flex flex-wrap items-center justify-between gap-4 pt-5 pb-16">
          <span className="mono-micro flex items-center gap-3 text-[var(--fg-mute)]">
            <ArchonIcon className="h-3 text-[var(--fg-dim)]" />
            {SITE.name} © {year}
          </span>
          <span className="mono-micro flex items-center gap-4 text-[var(--fg-mute)]">
            {/* A small line of type, but a full-size target: the padding is
                the tap area, the negative margin keeps the line where it was. */}
            <Link href={localePath(locale, "/privacy")} className="-my-3 inline-flex min-h-[44px] items-center px-1 transition-colors hover:text-[var(--fg)]">
              {copy.nav.privacy}
            </Link>
            {copy.footer.rights}
          </span>
        </div>
      </div>
    </footer>
  );
}
