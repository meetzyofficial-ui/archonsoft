import Image from "next/image";
import type { ShowcaseMedia } from "@/data/showcase";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One capture, framed for what it is.
 *
 * A handset gets a device edge and a handset radius; a browser capture gets a
 * window bar and square-ish corners; a rendered scene gets nothing but a hair
 * of edge, because a frame around a world is a picture of a picture. The
 * caption is what the capture shows, in the visitor's language.
 */
export function MediaPlate({
  media,
  locale,
  index,
  sizes,
  priority = false,
  className,
}: {
  media: ShowcaseMedia;
  locale: Locale;
  index?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const alt = t(media.alt, locale);
  return (
    <figure className={cn("media-plate group/plate", `media-plate--${media.kind}`, className)}>
      <div className="media-plate__frame">
        {media.kind === "screen" ? (
          <div aria-hidden="true" className="project-stage__chrome">
            <span />
            <span />
            <span />
          </div>
        ) : null}
        <div
          className="media-plate__image relative overflow-hidden"
          style={{ aspectRatio: `${media.image.width} / ${media.image.height}` }}
        >
          <Image
            src={media.image}
            alt={alt}
            fill
            priority={priority}
            placeholder="blur"
            sizes={sizes}
            className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] md:group-hover/plate:scale-[1.02]"
          />
        </div>
      </div>
      <figcaption className="mt-3 flex items-baseline gap-3 text-[var(--fg-mute)]">
        {index ? (
          <span className="mono-micro text-[var(--accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>
            {index}
          </span>
        ) : null}
        <span className="text-[0.8125rem] leading-snug">{alt}</span>
      </figcaption>
    </figure>
  );
}
