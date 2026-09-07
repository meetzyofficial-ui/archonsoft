import Link from "next/link";
import { Clock } from "@/components/chrome/Clock";
import { ArchonIcon } from "@/components/chrome/Wordmark";
import { Reveal } from "@/components/motion/Reveal";
import { Provenance } from "@/components/ui/Provenance";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";
import { CONTACT_EMAIL, SITE, SOCIALS } from "@/lib/site";

export function Footer({ locale, copy }: { locale: Locale; copy: Copy }) {
  const year = new Date().getFullYear();

  const items = [
    { label: copy.nav.work, href: "/work" },
    { label: copy.nav.capabilities, href: "/capabilities" },
    { label: copy.nav.labs, href: "/labs" },
    { label: copy.nav.process, href: "/process" },
    { label: copy.nav.about, href: "/about" },
    { label: copy.nav.contact, href: "/contact" },
  ];

  const colophon = [
    { label: copy.footer.typefaces, value: "Space Grotesk, Geist, Geist Mono" },
    { label: copy.footer.builtWith, value: "Next.js, TypeScript, Tailwind CSS" },
    { label: copy.footer.motion, value: copy.footer.motionValue },
  ];

  return (
    <footer data-scheme="dark" data-band="dark" className="scheme-surface relative overflow-hidden">
      <div className="frame">
        <div className="hairline-t grid gap-12 py-16 md:grid-cols-[1.2fr_1fr_1fr] md:py-20">
          <div>
            <p className="max-w-[30ch] text-d3">
              {copy.contact.statement}{" "}
              <span className="text-[var(--accent)]">{copy.contact.statementAccent}</span>
            </p>
            {CONTACT_EMAIL ? (
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="link-rule mt-6 inline-block text-lead text-[var(--fg-dim)] hover:text-[var(--fg)]"
              >
                {CONTACT_EMAIL}
              </a>
            ) : (
              <Link
                href={localePath(locale, "/contact")}
                className="link-rule mt-6 inline-block text-lead text-[var(--fg-dim)] hover:text-[var(--fg)]"
              >
                {copy.footer.start}
              </Link>
            )}
            <p className="mono-label mt-6 text-[var(--fg-mute)]">{copy.hero.location}</p>

            {/* Three words are used the same way on every page. Defining them
                once, where every page ends, is cheaper than qualifying them
                each time they appear. */}
            <div className="hairline-t mt-8 pt-5">
              <h2 className="mono-label text-[var(--fg-mute)]">{copy.provenance.legend}</h2>
              <dl className="mt-4 space-y-3">
                {(
                  [
                    ["shipped", copy.provenance.shippedNote],
                    ["concept", copy.provenance.conceptNote],
                    ["capability", copy.provenance.capabilityNote],
                  ] as const
                ).map(([kind, note]) => (
                  <div key={kind} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <dt>
                      <Provenance kind={kind} copy={copy} />
                    </dt>
                    <dd className="max-w-[34ch] text-[var(--fg-mute)]">{note}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <nav aria-label={copy.footer.index}>
            <h2 className="mono-label text-[var(--fg-mute)]">{copy.footer.index}</h2>
            <ul className="mt-5 space-y-2.5">
              <li>
                <Link
                  href={localePath(locale)}
                  className="link-rule text-[var(--fg-dim)] hover:text-[var(--fg)]"
                >
                  {copy.nav.home}
                </Link>
              </li>
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={localePath(locale, item.href)}
                    className="link-rule text-[var(--fg-dim)] hover:text-[var(--fg)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mono-label text-[var(--fg-mute)]">{copy.footer.colophon}</h2>
            <dl className="mt-5 space-y-2.5">
              {colophon.map((item) => (
                <div key={item.label} className="text-[var(--fg-dim)]">
                  <dt className="mono-label text-[var(--fg-mute)]">{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>

            {SOCIALS.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {SOCIALS.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      rel="me noreferrer"
                      target="_blank"
                      className="mono-label link-rule text-[var(--fg-dim)] hover:text-[var(--fg)]"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {/* Final frame: the mark set to the width of the page, cropped at the
            baseline, so the document ends on the wordmark itself. */}
        <Reveal variant="clip" className="hairline-t pt-10">
          <span
            aria-hidden="true"
            className="display block select-none whitespace-nowrap text-[13.5vw] font-bold uppercase leading-[0.8] tracking-[-0.03em] text-[var(--fg)]"
            style={{ marginBottom: "-0.16em" }}
          >
            Archonsoft
          </span>
        </Reveal>

        <div className="hairline-t mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-6">
          <span className="mono-label flex items-center gap-2 text-[var(--fg-mute)]">
            <ArchonIcon id="archon-keystone-footer" className="h-3.5 w-3.5 text-[var(--fg-mute)]" />
            {`© ${year} ${SITE.name}`}
          </span>
          <Clock className="mono-label tabular-nums text-[var(--fg-mute)]" />
          <a href="#main" className="mono-label link-rule text-[var(--fg-mute)] hover:text-[var(--fg)]">
            {copy.footer.backToTop}
          </a>
        </div>
      </div>
    </footer>
  );
}
