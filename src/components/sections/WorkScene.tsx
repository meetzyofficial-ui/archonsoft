import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ProductBoard } from "@/components/product/ProductBoard";
import { ProductPlane } from "@/components/product/ProductPlane";
import { Provenance } from "@/components/ui/Provenance";
import type { Project } from "@/data/projects";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";

/**
 * One product, as a world rather than a card.
 *
 * The screens dock onto a board while a pinned column holds the name, the
 * verified facts and the way in. Each project chapter carries its own product
 * colour on its marks — Archon stays monochrome and the products bring the
 * colour, which is what keeps two very different visual worlds from fighting.
 */
export function WorkScene({
  project,
  position,
  locale,
  copy,
}: {
  project: Project;
  position: number;
  locale: Locale;
  copy: Copy;
}) {
  const index = String(position).padStart(2, "0");
  const href = localePath(locale, `/work/${project.slug}`);
  const screens = project.screens.slice(0, 3);

  return (
    <section
      aria-labelledby={`work-${project.slug}`}
      style={{ ["--accent" as string]: project.accent }}
    >
      <div className="frame pt-16 md:pt-24">
        <Reveal variant="none" className="hairline-t flex flex-wrap items-baseline gap-x-6 gap-y-2 pt-4">
          <span className="mono-label reveal-fade text-[var(--accent)]">{index}</span>
          <span className="mono-label reveal-fade text-[var(--fg-dim)]">
            {t(project.category, locale)}
          </span>
          <span className="reveal-fade ml-auto">
            <Provenance kind="shipped" copy={copy} />
          </span>
        </Reveal>

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <h2 id={`work-${project.slug}`} className="text-d1 md:col-span-7">
            <SplitReveal text={project.name} lineHeight="0.92em" stagger={38} />
          </h2>
          <Reveal className="md:col-span-4 md:col-start-9">
            <p className="text-lead text-[var(--fg-dim)]">{t(project.summary, locale)}</p>
          </Reveal>
        </div>
      </div>

      <ProductBoard
        count={screens.length}
        counterLabel={
          screens.some((screen) => screen.redacted)
            ? `${copy.work.screensNote} — ${copy.work.maskNote}`
            : copy.work.screensNote
        }
        aside={
          <div className="max-w-[22ch]">
            <p className="mono-label text-[var(--accent)]">{project.name}</p>
            <dl className="mt-6">
              {project.facts.map((fact) => (
                <div key={fact.label.en} className="hairline-t py-3">
                  <dt className="mono-label text-[var(--fg-mute)]">{t(fact.label, locale)}</dt>
                  <dd className="mt-1">{t(fact.value, locale)}</dd>
                </div>
              ))}
            </dl>
            <Link
              href={href}
              data-cursor-label={copy.work.open}
              className="mono-label link-rule mt-7 inline-flex items-center gap-3"
            >
              {copy.work.read}
              <span aria-hidden="true" className="block h-px w-8 bg-current" />
            </Link>
          </div>
        }
      >
        {screens.map((screen, i) => (
          <ProductPlane
            key={i}
            screen={screen}
            locale={locale}
            index={`${project.name.slice(0, 1).toUpperCase()}/${String(i + 1).padStart(2, "0")}`}
            showRedaction={false}
            sizes="(min-width: 1024px) 340px, 74vw"
          />
        ))}
      </ProductBoard>

      {/* On narrow screens the pinned column has nowhere to live, so the way
          in is repeated under the board where a thumb can reach it. */}
      <div className="frame lg:hidden">
        <Reveal className="hairline-t pt-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            {project.facts.map((fact) => (
              <div key={fact.label.en}>
                <dt className="mono-label text-[var(--fg-mute)]">{t(fact.label, locale)}</dt>
                <dd className="mt-1">{t(fact.value, locale)}</dd>
              </div>
            ))}
          </dl>
          <Link
            href={href}
            className="mono-label link-rule mt-8 inline-flex items-center gap-3"
          >
            {copy.work.read}
            <span aria-hidden="true" className="block h-px w-8 bg-current" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
