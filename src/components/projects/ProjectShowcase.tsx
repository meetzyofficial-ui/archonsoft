import Image from "next/image";
import Link from "next/link";
import { WorldEnterButton } from "@/components/world/WorldInvite";
import { panelStyle } from "@/data/panels";
import { SHOWCASE, projectPath, type ShowcaseProject } from "@/data/showcase";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The work, each product on its own colour.
 *
 * One full-width panel each, in the order of the showcase. The world has its own section on the home page and only joins
 * this list on the projects page.
 */
export function ProjectShowcase({
  locale,
  copy,
  heading = true,
  id = "projects",
}: {
  locale: Locale;
  copy: Copy;
  heading?: boolean;
  id?: string;
}) {
  const c = copy.showcase;
  const list = SHOWCASE.filter((one) => !one.world);
  const world = SHOWCASE.find((one) => one.world);

  return (
    <section id={id} data-products>
      {heading ? (
        <div className="frame grid gap-6 py-16 md:grid-cols-12 md:items-end md:py-24">
          <h2 className="text-section md:col-span-8">{c.statement}</h2>
          <p className="text-lead text-[var(--fg-dim)] md:col-span-4">{c.body}</p>
        </div>
      ) : null}
      {list.map((project, i) => (
        <Panel key={project.slug} project={project} locale={locale} copy={copy} wide flip={i % 2 === 1} />
      ))}
      {!heading && world ? <Panel project={world} locale={locale} copy={copy} wide /> : null}
    </section>
  );
}

function Panel({
  project,
  locale,
  copy,
  wide = false,
  flip = false,
}: {
  project: ShowcaseProject;
  locale: Locale;
  copy: Copy;
  wide?: boolean;
  flip?: boolean;
}) {
  const c = copy.showcase;
  const screen = project.hero.find((one) => one.kind !== "phone");
  const phone = project.hero.find((one) => one.kind === "phone");

  return (
    <article
      id={`project-${project.slug}`}
      data-product={project.slug}
      aria-labelledby={`project-title-${project.slug}`}
      className={cn("work-panel", wide && "work-panel--wide", flip && "work-panel--flip")}
      style={panelStyle(project.slug)}
    >
      <div className="work-panel__copy">
        <h3 id={`project-title-${project.slug}`} className={wide ? "text-project" : "text-section"}>
          <Link href={localePath(locale, projectPath(project.slug))}>{project.title}</Link>
        </h3>
        <p className="mt-5 max-w-[30ch] text-sub">{t(project.tagline, locale)}</p>
        <p className="mt-4 max-w-[46ch]">{t(project.shortDescription, locale)}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={localePath(locale, projectPath(project.slug))} className="btn-raised btn-panel">
            {c.explore}
          </Link>
          {project.link ? (
            <a href={project.link.href} target="_blank" rel="noopener noreferrer" className="btn-raised btn-ghost">
              {project.link.label} <span aria-hidden="true">↗</span>
            </a>
          ) : null}
          {project.world ? <WorldEnterButton locale={locale} label={c.enterWorld} /> : null}
        </div>
      </div>
      <div className="work-panel__art">
        {screen ? (
          <figure className={cn("panel-window", ["meetzy", "dppano", "erden"].includes(project.slug) && "panel-window--alone")}>
            <Image src={screen.image} alt={t(screen.alt, locale)} placeholder="blur" sizes="(min-width: 900px) 64vw, 118vw" />
          </figure>
        ) : null}
        {!screen ? (
          <div className="panel-phones">
            {project.hero.map((one, i) => (
              <figure key={i}>
                <Image src={one.image} alt={t(one.alt, locale)} placeholder="blur" sizes="(min-width: 900px) 14vw, 30vw" />
              </figure>
            ))}
          </div>
        ) : phone && !["meetzy", "dppano", "erden"].includes(project.slug) ? (
          <figure className="panel-phone">
            <Image src={phone.image} alt={t(phone.alt, locale)} placeholder="blur" sizes="(min-width: 900px) 16vw, 33vw" />
          </figure>
        ) : null}
      </div>
    </article>
  );
}
