"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MediaStage } from "@/components/projects/ProjectStage";
import { ContactForm } from "@/components/sections/ContactForm";
import { ServiceGallery } from "@/components/services/ServiceGallery";
import { useWebGL } from "@/components/world/WorldInvite";
import { pageForService } from "@/data/servicePages";
import { SERVICES, getService, type Service } from "@/data/services";
import type { ServiceId } from "@/data/serviceIds";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { openWorldAtDepartment } from "@/lib/worldLink";
import { cn } from "@/lib/utils";

export type ProjectName = { slug: string; title: string; category: string };

/**
 * "What do you want to build?"
 *
 * The first thing under the opening, and the answer to what Archon Soft does
 * — shown, not listed. The visitor picks a kind of software; the panel beside
 * the list turns into that thing: one sentence that names the need, what can
 * be built under it, a stage of real pictures (a shipped product's screens,
 * a frame rendered by Archon World, or an Archon Labs concept, always marked
 * as one), the work where it was actually done, and then the one step left —
 * tell us about yours. That step opens the site's own contact form in place,
 * with the choice already made, and a way back to change it that keeps
 * everything already typed.
 *
 * Structure is ARIA tabs with manual activation: arrow keys move along the
 * list, Enter or Space opens a service, a pointer that can hover dims the
 * others while it considers one. Every service's name and text is in the
 * server markup; without JavaScript every panel is simply shown in turn and
 * the call to action is a link to the contact page carrying the service.
 *
 * Nothing is loaded for a service until it is opened: only the open panel
 * renders its stage, and the gallery requests one picture at a time.
 */
export function ServiceExplorer({
  locale,
  copy,
  projects,
}: {
  locale: Locale;
  copy: Copy;
  projects: ProjectName[];
}) {
  const c = copy.explorer;
  const [active, setActive] = useState<ServiceId>(SERVICES[0]!.id);
  const [mode, setMode] = useState<"detail" | "brief">("detail");
  const [briefed, setBriefed] = useState(false);
  const [gallery, setGallery] = useState<number | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelTop = useRef<HTMLDivElement>(null);
  const briefTop = useRef<HTMLDivElement>(null);
  const webgl = useWebGL();

  const service = getService(active) ?? SERVICES[0]!;

  /* A link can ask for a service: /?service=ai#services. Anything unknown
     falls back to the first one. */
  useEffect(() => {
    try {
      const asked = new URLSearchParams(window.location.search).get("service");
      if (getService(asked)) setActive(asked as ServiceId);
    } catch {
      /* Nothing to read. */
    }
  }, []);

  const select = useCallback((id: ServiceId) => {
    setActive(id);
    setMode("detail");
    setGallery(null);
    /* On a phone the list is a row: bring the chosen one fully into it. */
    const index = SERVICES.findIndex((one) => one.id === id);
    tabs.current[index]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, []);

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = SERVICES.length - 1;
    const move = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    let next: number | null = null;
    if (move) next = (index + move + SERVICES.length) % SERVICES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    tabs.current[next]?.focus();
  };

  const openBrief = () => {
    setMode("brief");
    setBriefed(true);
    requestAnimationFrame(() => {
      briefTop.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      briefTop.current?.focus({ preventScroll: true });
    });
  };

  const backToService = () => {
    setMode("detail");
    requestAnimationFrame(() => {
      panelTop.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      tabs.current[SERVICES.findIndex((one) => one.id === active)]?.focus({ preventScroll: true });
    });
  };

  return (
    <section
      id="services"
      data-track-section="hizmet-secici"
      data-band="paper"
      aria-labelledby="services-title"
      className="relative scroll-mt-16 py-16 md:py-28"
    >
      <div className="frame">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <h2 id="services-title" className="text-section md:col-span-8">
            {c.title}
          </h2>
          <p className="text-lead text-[var(--fg-dim)] md:col-span-4">{c.body}</p>
        </div>

        <div className="mt-12 grid gap-8 md:mt-20 md:grid-cols-12 md:gap-10">
          {/* The list. A column on a desktop, a row that scrolls on a phone. */}
          <div className="md:col-span-4">
            <div
              role="tablist"
              aria-label={c.listLabel}
              className="service-tabs scroll-row -mx-[var(--spacing-gutter)] flex gap-2 overflow-x-auto px-[var(--spacing-gutter)] pb-1 md:sticky md:top-24 md:mx-0 md:flex-col md:gap-0 md:overflow-visible md:px-0 md:pb-0"
            >
              {SERVICES.map((one, index) => {
                const selected = one.id === active;
                return (
                  <button
                    key={one.id}
                    ref={(node) => {
                      tabs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`service-tab-${one.id}`}
                    aria-selected={selected}
                    aria-controls={`service-panel-${one.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => select(one.id)}
                    onKeyDown={(event) => onTabKey(event, index)}
                    data-service={one.id}
                    className="service-tab group"
                  >
                    <span className="service-tab__body">
                      <span className="service-tab__title">{t(one.title, locale)}</span>
                      <span className="service-tab__eyebrow mono-micro">{t(one.eyebrow, locale)}</span>
                    </span>
                    <span aria-hidden="true" className="service-tab__mark" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* The panel. */}
          <div ref={panelTop} className="scroll-mt-24 md:col-span-8">
            {SERVICES.map((one) => (
              <ServicePanel
                key={one.id}
                service={one}
                open={one.id === active && mode === "detail"}
                current={one.id === active}
                locale={locale}
                copy={copy}
                projects={projects}
                webgl={webgl}
                onExplore={(start) => setGallery(start)}
                onBrief={openBrief}
              />
            ))}

            {/* The brief: the site's own contact form, mounted once and kept,
                so changing the service never loses what was typed. */}
            {briefed ? (
              <div
                ref={briefTop}
                tabIndex={-1}
                hidden={mode !== "brief"}
                data-service-brief=""
                className="service-brief scroll-mt-24 outline-none"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button type="button" onClick={backToService} className="btn-raised btn-ghost">
                    <span aria-hidden="true">←</span> {c.back}
                  </button>
                  <span className="mono-micro text-[var(--fg-mute)]">
                    {c.selected}: <span className="text-[var(--fg)]">{t(service.title, locale)}</span>
                  </span>
                </div>
                <h3 className="text-head mt-10">{c.formTitle}</h3>
                <p className="mt-4 max-w-[52ch] text-[var(--fg-dim)]">{c.formBody}</p>
                <div className="mt-6">
                  <ContactForm
                    locale={locale}
                    copy={copy}
                    preset={{ service: service.id, projectType: service.projectType }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {gallery !== null ? (
        <ServiceGallery
          title={t(service.title, locale)}
          media={service.gallery}
          start={gallery}
          locale={locale}
          copy={copy}
          onClose={() => setGallery(null)}
        />
      ) : null}
    </section>
  );
}

function ServicePanel({
  service,
  open,
  current,
  locale,
  copy,
  projects,
  webgl,
  onExplore,
  onBrief,
}: {
  service: Service;
  /** Shown now. */
  open: boolean;
  /** The chosen service, even while the brief is on screen. */
  current: boolean;
  locale: Locale;
  copy: Copy;
  projects: ProjectName[];
  webgl: boolean;
  onExplore: (start: number) => void;
  onBrief: () => void;
}) {
  const c = copy.explorer;
  const related = service.projects
    .map((slug) => projects.find((one) => one.slug === slug))
    .filter((one): one is ProjectName => Boolean(one));
  const contactHref = `${localePath(locale, "/contact")}?service=${service.id}`;

  return (
    <div
      role="tabpanel"
      id={`service-panel-${service.id}`}
      aria-labelledby={`service-tab-${service.id}`}
      data-service-panel={service.id}
      data-open={open ? "true" : "false"}
      tabIndex={open ? 0 : -1}
      className="service-panel outline-none"
    >
      <div key={open ? "open" : "closed"} className={cn(open && "service-enter")}>
        <h3 className="text-head max-w-[26ch]">{t(service.headline, locale)}</h3>
        <p className="mt-5 max-w-[56ch] text-lead text-[var(--fg-dim)]">{t(service.description, locale)}</p>

        <div className="mt-9">
          <p className="mono-micro text-[var(--fg-mute)]">{c.capabilities}</p>
          <ul className="service-capabilities mt-4">
            {service.capabilities.map((capability) => (
              <li key={capability.en} className="service-capability">
                <span>{t(capability, locale)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* The stage only exists for the open service: nothing else loads. */}
        {open && service.hero.length > 0 ? (
          <div className="service-stage mt-10">
            <MediaStage media={service.hero} accent={service.accent} locale={locale} size="hero" />
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={localePath(locale, `/hizmetler/${pageForService(service.id).slug}`)} className="btn-raised btn-ghost">
            {copy.servicePage.details}
          </Link>
          {open && service.gallery.length > 1 ? (
            <button
              type="button"
              onClick={() => onExplore(0)}
              className="btn-raised btn-ghost"
              data-service-explore=""
            >
              {c.explore}
              <span className="text-[var(--fg-mute)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {service.gallery.length}
              </span>
            </button>
          ) : null}
          {open && service.id === "webgl" && webgl ? (
            <button
              type="button"
              onClick={() => openWorldAtDepartment(service.world.department, service.world.service)}
              className="btn-raised btn-world"
              data-world-trigger=""
            >
              {c.worldCta}
            </button>
          ) : null}
        </div>

        {related.length > 0 || service.technologies ? (
          <dl className="service-evidence mt-10">
            {related.length > 0 ? (
              <div className="service-evidence__row">
                <dt className="mono-micro text-[var(--fg-mute)]">{c.realWork}</dt>
                <dd className="flex flex-wrap gap-x-6 gap-y-2">
                  {related.map((project) => (
                    <Link
                      key={project.slug}
                      href={localePath(locale, `/projects/${project.slug}`)}
                      className="group inline-flex min-h-11 items-center gap-3 text-[var(--fg)]"
                      data-service-project={project.slug}
                    >
                      <span className="font-medium">{project.title}</span>
                      <span className="mono-micro text-[var(--fg-mute)]">{project.category}</span>
                      <span aria-hidden="true" className="arrow-rule" />
                    </Link>
                  ))}
                </dd>
              </div>
            ) : null}
            {service.technologies ? (
              <div className="service-evidence__row">
                <dt className="mono-micro text-[var(--fg-mute)]">{c.technology}</dt>
                <dd className="flex flex-col gap-1 text-[var(--fg-dim)]">
                  {service.technologies.map((row) => (
                    <span key={row.value}>
                      <span className="text-[var(--fg-mute)]">{t(row.label, locale)}: </span>
                      {row.value}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <div className="service-cta mt-12">
          <p className="text-sub max-w-[26ch]">{c.leadIntro}</p>
          <a
            href={contactHref}
            onClick={(event) => {
              if (!current) return;
              event.preventDefault();
              onBrief();
            }}
            className="btn-raised"
            data-service-lead={service.id}
          >
            {c.cta}
            <span aria-hidden="true" className="arrow-rule" />
          </a>
        </div>
      </div>
    </div>
  );
}
