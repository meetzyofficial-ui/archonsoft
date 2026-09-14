import Image from "next/image";
import type { CSSProperties } from "react";
import { TiltFrame } from "@/components/projects/TiltFrame";
import type { ShowcaseMedia, ShowcaseProject } from "@/data/showcase";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A project, staged.
 *
 * One frame, composed from the material the project actually has rather than
 * from a template: handset captures stand as three devices fanned in depth,
 * browser captures overlap as windows, and a rendered world fills the frame
 * edge to edge. The frame is dark graphite with the product's own colour as
 * a faint light behind the work — the only place that colour is allowed.
 *
 * Every picture is a real capture. Nothing below the first project on a page
 * loads before it is near the viewport, and each image asks for the width it
 * is drawn at, not the width of the file.
 */
export function ProjectStage({
  project,
  locale,
  priority = false,
  size = "index",
  className,
}: {
  project: ShowcaseProject;
  locale: Locale;
  priority?: boolean;
  /** `index` is a row on a list; `hero` opens a case study. */
  size?: "index" | "hero";
  className?: string;
}) {
  const [lead, ...rest] = project.hero;
  if (!lead) return null;
  const glow = { "--stage-glow": project.accent } as CSSProperties;

  return (
    <TiltFrame
      className={cn(
        "project-stage group/stage relative isolate overflow-hidden",
        size === "hero" ? "project-stage--hero" : null,
        `project-stage--${lead.kind}`,
        className,
      )}
      style={glow}
    >
      <div aria-hidden="true" className="project-stage__light" />
      {lead.kind === "scene" ? (
        <Scene media={lead} locale={locale} priority={priority} size={size} />
      ) : lead.kind === "phone" ? (
        <Phones items={[lead, ...rest]} locale={locale} priority={priority} size={size} />
      ) : (
        <Screens items={[lead, ...rest]} locale={locale} priority={priority} size={size} />
      )}
      <div aria-hidden="true" className="project-stage__edge" />
    </TiltFrame>
  );
}

function Scene({
  media,
  locale,
  priority,
  size,
}: {
  media: ShowcaseMedia;
  locale: Locale;
  priority: boolean;
  size: "index" | "hero";
}) {
  return (
    <div className="project-stage__scene absolute inset-0">
      <Image
        src={media.image}
        alt={t(media.alt, locale)}
        fill
        priority={priority}
        placeholder="blur"
        sizes={size === "hero" ? "100vw" : "(min-width: 1024px) 64vw, 100vw"}
        className="object-cover"
      />
      <div aria-hidden="true" className="project-stage__vignette" />
    </div>
  );
}

/**
 * Three handsets in depth. The centre one is the lead and stands forward;
 * the other two sit back and turned, and each layer answers the pointer at
 * its own depth.
 */
function Phones({
  items,
  locale,
  priority,
  size,
}: {
  items: ShowcaseMedia[];
  locale: Locale;
  priority: boolean;
  size: "index" | "hero";
}) {
  const [front, left, right] = items;
  const sizes = size === "hero" ? "(min-width: 1024px) 20vw, 42vw" : "(min-width: 1024px) 16vw, 36vw";
  return (
    <div className="project-stage__phones absolute inset-0">
      {left ? (
        <Device media={left} locale={locale} sizes={sizes} className="project-stage__device project-stage__device--left" />
      ) : null}
      {right ? (
        <Device media={right} locale={locale} sizes={sizes} className="project-stage__device project-stage__device--right" />
      ) : null}
      {front ? (
        <Device
          media={front}
          locale={locale}
          sizes={sizes}
          priority={priority}
          className="project-stage__device project-stage__device--front"
        />
      ) : null}
    </div>
  );
}

function Device({
  media,
  locale,
  sizes,
  priority = false,
  className,
}: {
  media: ShowcaseMedia;
  locale: Locale;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={className} style={{ aspectRatio: `${media.image.width} / ${media.image.height}` }}>
      <div className="project-stage__glass">
        <Image
          src={media.image}
          alt={t(media.alt, locale)}
          fill
          priority={priority}
          placeholder="blur"
          sizes={sizes}
          className="object-cover object-top"
        />
      </div>
    </figure>
  );
}

/** Browser captures, as overlapping windows: the lead large, two behind it. */
function Screens({
  items,
  locale,
  priority,
  size,
}: {
  items: ShowcaseMedia[];
  locale: Locale;
  priority: boolean;
  size: "index" | "hero";
}) {
  const [front, back, side] = items;
  return (
    <div className="project-stage__screens absolute inset-0">
      {back ? (
        <Window media={back} locale={locale} className="project-stage__window project-stage__window--back" sizes="(min-width: 1024px) 34vw, 60vw" />
      ) : null}
      {side ? (
        <Window media={side} locale={locale} className="project-stage__window project-stage__window--side" sizes="(min-width: 1024px) 30vw, 54vw" />
      ) : null}
      {front ? (
        <Window
          media={front}
          locale={locale}
          priority={priority}
          className="project-stage__window project-stage__window--front"
          sizes={size === "hero" ? "(min-width: 1024px) 62vw, 90vw" : "(min-width: 1024px) 46vw, 84vw"}
        />
      ) : null}
    </div>
  );
}

function Window({
  media,
  locale,
  sizes,
  priority = false,
  className,
}: {
  media: ShowcaseMedia;
  locale: Locale;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div aria-hidden="true" className="project-stage__chrome">
        <span />
        <span />
        <span />
      </div>
      <div className="relative" style={{ aspectRatio: `${media.image.width} / ${Math.min(media.image.height, media.image.width * 0.68)}` }}>
        <Image
          src={media.image}
          alt={t(media.alt, locale)}
          fill
          priority={priority}
          placeholder="blur"
          sizes={sizes}
          className="object-cover object-top"
        />
      </div>
    </figure>
  );
}
