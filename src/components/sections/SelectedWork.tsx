import { SplitReveal } from "@/components/motion/SplitReveal";
import { Reveal } from "@/components/motion/Reveal";
import { WorkScene } from "@/components/sections/WorkScene";
import { ActionLink } from "@/components/ui/Action";
import { Band, ChapterHead } from "@/components/ui/primitives";
import { PROJECTS } from "@/data/projects";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";

export function SelectedWork({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <Band scheme="dark" size="regular" id="work" className="pb-0">
      <div className="frame">
        <ChapterHead index={copy.work.index} title={copy.work.label} aside={copy.work.aside} />

        <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12 md:items-end md:gap-8">
          <SplitReveal
            as="h2"
            lineHeight="0.98em"
            className="text-d2 md:col-span-7"
            text={[
              { text: copy.work.statement },
              { text: copy.work.statementAccent, accent: true },
            ]}
          />
          <Reveal className="md:col-span-4 md:col-start-9">
            <p className="text-[var(--fg-dim)]">{copy.work.body}</p>
          </Reveal>
        </div>
      </div>

      {PROJECTS.map((project, index) => (
        <WorkScene
          key={project.slug}
          project={project}
          position={index + 1}
          locale={locale}
          copy={copy}
        />
      ))}

      <div className="frame">
        <Reveal className="hairline-t pt-10">
          <ActionLink href={localePath(locale, "/work")} variant="line">
            {copy.work.all}
          </ActionLink>
        </Reveal>
      </div>
    </Band>
  );
}
