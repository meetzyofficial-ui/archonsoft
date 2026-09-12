import Link from "next/link";
import { ProjectEditorial } from "@/components/work/ProjectEditorial";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import { PROJECTS } from "@/data/projects";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * Selected work.
 *
 * A title, three projects, and a line out to the rest. The projects are the
 * three that actually shipped — DP Pano, Meetzy, Erden Davetiye — and nothing
 * on this page claims anything about them that is not either stated in their
 * case studies or visible in the photographs.
 *
 * The spacing is the section's whole design. Between one project and the next
 * there is close to a screen of nothing, which is what lets a 40vh photograph
 * read as large. The previous version made each project fill the viewport and
 * the sequence had no air in it at all.
 */
export function SelectedWork({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <section
      id="work"
      data-scheme="paper"
      data-band="paper"
      className="relative pt-28 pb-24 md:pt-40 md:pb-36"
    >
      <div className="frame">
        <ScrollFrame enter={0.45}>
          <div className="hairline-t flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 pt-3">
            <span className="mono-micro rise-copy text-[var(--fg-mute)]">
              {copy.work.indexLabel}
            </span>
            <span className="mono-micro rise-copy text-[var(--fg-mute)]">
              {copy.work.indexAside}
            </span>
          </div>
          <h2 className="text-section rise-copy mt-8 max-w-[16ch] md:mt-10">
            {copy.work.indexStatement}{" "}
            <span className="text-[var(--fg-mute)]">{copy.work.indexAccent}</span>
          </h2>
        </ScrollFrame>
      </div>

      <div className="mt-24 flex flex-col gap-28 md:mt-32 md:gap-40">
        {PROJECTS.map((project, index) => (
          <ProjectEditorial
            key={project.slug}
            project={project}
            index={index}
            locale={locale}
            copy={copy}
            priority={index === 0}
          />
        ))}
      </div>

      <div className="frame mt-20 md:mt-28">
        <ScrollFrame enter={0.5}>
          <Link
            href={localePath(locale, "/work")}
            data-cursor-label={copy.work.open}
            className="hairline-t group flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 pt-4"
          >
            <span className="text-sub rise-copy">{copy.work.indexLabel}</span>
            <span className="mono-micro rise-copy flex items-center gap-4 text-[var(--fg-mute)]">
              {copy.work.indexAside}
              <span
                aria-hidden="true"
                className="relative block h-px w-10 bg-current transition-[width] duration-[700ms] ease-[var(--ease-out-expo)] group-hover:w-16"
              >
                <span className="absolute -top-[3px] right-0 block size-[7px] rotate-45 border-t border-r border-current" />
              </span>
            </span>
          </Link>
        </ScrollFrame>
      </div>
    </section>
  );
}
