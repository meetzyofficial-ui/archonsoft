import Link from "next/link";
import { Wordmark } from "@/components/chrome/Wordmark";
import { WorldNavLink } from "@/components/world/WorldInvite";
import { SHOWCASE, projectPath } from "@/data/showcase";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";
import { SERVICE_PAGES } from "@/data/servicePages";
import { CONTACT_EMAIL, PHONE, PHONE_E164, SITE, SOCIALS, whatsappLink } from "@/lib/site";

/** The close: the one thing to do, how to reach the studio, and the index. */
export function StudioClosing({ locale, copy }: { locale: Locale; copy: Copy }) {
  const items = [
    { label: copy.nav.work, href: "/projects" },
    { label: copy.nav.services, href: "/hizmetler" },
    { label: copy.nav.process, href: "/process" },
    { label: copy.nav.about, href: "/about" },
    { label: copy.nav.contact, href: "/contact" },
    { label: copy.nav.privacy, href: "/privacy" },
  ];
  const link = "link-rule text-[var(--fg-dim)] hover:text-[var(--fg)]";

  return (
    <footer>
      <div className="bg-[var(--color-orange)] text-[var(--color-black)]">
        <div className="frame flex flex-wrap items-end justify-between gap-8 py-14 md:py-24" style={{ ["--fg" as string]: "#0c0c0d" }}>
          <p className="text-section max-w-[16ch]">{copy.footer.closing}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href={localePath(locale, "/contact")}
              className="btn-raised !bg-[var(--color-black)] !text-white hover:!bg-white hover:!text-[var(--color-black)]"
            >
              {copy.footer.start}
            </Link>
            {CONTACT_EMAIL ? (
              <a href={whatsappLink(copy.wa.text)} target="_blank" rel="noopener noreferrer" className="link-rule text-sub">
                WhatsApp {PHONE}
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div data-scheme="black" className="bg-[var(--color-black)] text-[var(--fg)]">
        <div className="frame grid gap-12 py-14 sm:grid-cols-2 md:grid-cols-12 md:py-20">
          <div className="md:col-span-4">
            <Wordmark className="text-[1.75rem]" />
            <p className="mt-6 text-[var(--fg-dim)]">{copy.hero.location}</p>
            <ul className="mt-4 grid gap-1">
              <li>
                <a href={`tel:${PHONE_E164}`} className={link}>
                  {PHONE}
                </a>
              </li>
              {CONTACT_EMAIL ? (
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
                    {CONTACT_EMAIL}
                  </a>
                </li>
              ) : null}
              {SOCIALS.map((social) => (
                <li key={social.href}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer" className={link}>
                    {social.label}: archondijital.co
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <ul className="grid content-start gap-1 md:col-span-2">
            {SHOWCASE.map((project) => (
              <li key={project.slug}>
                <Link href={localePath(locale, projectPath(project.slug))} className={link}>
                  {project.title}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="grid content-start gap-1 md:col-span-3">
            {SERVICE_PAGES.map((page) => (
              <li key={page.slug}>
                <Link href={localePath(locale, `/hizmetler/${page.slug}`)} className={link}>
                  {page[locale].name}
                </Link>
              </li>
            ))}
          </ul>
          <nav aria-label={copy.footer.index} className="md:col-span-3">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
              {items.map((item) => (
                <li key={item.href}>
                  <Link href={localePath(locale, item.href)} className={link}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <WorldNavLink locale={locale} label={copy.world.nav} className={link} />
              </li>
            </ul>
          </nav>
        </div>
        <div className="frame pb-8 text-[0.875rem] text-[var(--fg-mute)]">
          {SITE.name} © {new Date().getFullYear()}. {copy.footer.rights}.
        </div>
      </div>
    </footer>
  );
}
