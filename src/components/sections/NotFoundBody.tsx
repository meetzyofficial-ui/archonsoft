import Link from "next/link";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Diagram } from "@/components/system/Diagram";
import { ActionLink } from "@/components/ui/Action";
import { SectionRule } from "@/components/ui/primitives";
import { dict } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * The 404 page, as a component two boundaries can share.
 *
 * It exists in its own file because the root layout lives under `[locale]`.
 * That means a path matching no route at all never enters the locale tree, so
 * the only boundary Next will use is `app/not-found.tsx` at the root — which
 * has to render its own document. Keeping the content here means the two
 * entry points cannot drift apart.
 */
export function NotFoundBody({ locale }: { locale: Locale }) {
  const copy = dict(locale);

  const items = [
    { label: copy.nav.work, href: "/projects", index: "01" },
    { label: copy.nav.labs, href: "/labs", index: "02" },
    { label: copy.nav.capabilities, href: "/capabilities", index: "03" },
    { label: copy.nav.process, href: "/process", index: "04" },
    { label: copy.nav.about, href: "/about", index: "05" },
    { label: copy.nav.contact, href: "/contact", index: "06" },
  ];

  return (
    <section
      data-scheme="paper"
      data-band="paper"
      className="scheme-surface relative flex min-h-[100svh] flex-col overflow-hidden"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.22]">
        <Diagram kind="composer" label="" showGrid={false} />
      </div>

      <div className="frame relative flex flex-1 flex-col justify-center py-20">
        {/* The status code is information, not decoration: it is the one
            thing on this page that tells a visitor what actually happened. */}
        <SectionRule label={`404 — ${copy.notFound.label}`} aside={copy.notFound.aside} />

        <h1 className="mt-12 text-head">
          <SplitReveal
            text={copy.notFound.lead}
            immediate
            lineHeight="0.86em"
            stagger={40}
            delay={120}
          />
          <SplitReveal
            text={[{ text: copy.notFound.leadAccent, accent: true }]}
            immediate
            lineHeight="0.86em"
            delay={240}
          />
        </h1>

        <p className="mt-10 max-w-[46ch] text-lead text-[var(--fg-dim)]">{copy.notFound.body}</p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <ActionLink href={localePath(locale)} variant="solid">
            {copy.notFound.home}
          </ActionLink>
          <ActionLink href={localePath(locale, "/projects")} variant="line">
            {copy.notFound.work}
          </ActionLink>
        </div>
      </div>

      <div className="frame relative pb-10">
        <nav
          aria-label={copy.notFound.siteIndex}
          className="hairline-t flex flex-wrap gap-x-8 gap-y-2 pt-4"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={localePath(locale, item.href)}
              className="mono-label link-rule text-[var(--fg-mute)] hover:text-[var(--fg)]"
            >
              {item.index} {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
