import Image from "next/image";
import type { Screen } from "@/data/screens";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A real product screen, mounted.
 *
 * Deliberately not a photorealistic phone mockup: a hairline bezel and a
 * caption rail, so the thing you are looking at is unmistakably the software
 * rather than a rendering of a handset. The screenshots are 942px wide, so the
 * component never invites a size past that — the `sizes` hint keeps the
 * browser from fetching more than it can use, and nothing in the layout
 * enlarges these beyond device scale.
 */
export function ProductPlane({
  screen,
  locale,
  index,
  priority = false,
  showCaption = true,
  showRedaction = true,
  className,
  sizes = "(min-width: 1024px) 30vw, 70vw",
}: {
  screen: Screen;
  locale: Locale;
  /** Mono index printed on the caption rail, e.g. "M/02". */
  index?: string;
  priority?: boolean;
  showCaption?: boolean;
  showRedaction?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <figure className={cn("flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-[1.6rem] border border-[var(--line-strong)] bg-[var(--bg-raise)] p-[3px] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
        <Image
          src={screen.image}
          alt={t(screen.caption, locale)}
          placeholder="blur"
          priority={priority}
          sizes={sizes}
          className="h-auto w-full rounded-[1.42rem]"
        />
      </div>

      {showCaption ? (
        <figcaption className="mt-3 flex items-baseline gap-3">
          {index ? <span className="mono-label text-[var(--accent)]">{index}</span> : null}
          <span className="mono-label truncate text-[var(--fg-mute)]">
            {t(screen.caption, locale)}
          </span>
          {screen.redacted && showRedaction ? (
            <span className="mono-label ml-auto shrink-0 text-[var(--fg-mute)] opacity-70">
              {locale === "tr" ? "Veri maskeli" : "Data masked"}
            </span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
