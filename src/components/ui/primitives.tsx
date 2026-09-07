import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * The recurring chapter head: a hairline spanning the frame, a two-digit index
 * and a mono title in the margin. Every major band on the site opens this way,
 * which is most of what makes the pacing feel like one document.
 */
export function ChapterHead({
  index,
  title,
  aside,
  className,
}: {
  index: string;
  title: string;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal
      variant="none"
      className={cn(
        "hairline-t flex flex-wrap items-baseline gap-x-6 gap-y-2 pt-4 md:pt-5",
        className,
      )}
    >
      <span className="mono-label reveal-fade text-[var(--accent)]">{index}</span>
      <span className="mono-label reveal-fade text-[var(--fg-dim)]" style={{ transitionDelay: "70ms" }}>
        {title}
      </span>
      {aside ? (
        <span
          className="mono-label reveal-fade ml-auto text-right text-[var(--fg-mute)]"
          style={{ transitionDelay: "140ms" }}
        >
          {aside}
        </span>
      ) : null}
    </Reveal>
  );
}

/** A section wrapper that owns vertical rhythm and the optional scheme flip. */
export function Band({
  children,
  scheme,
  id,
  className,
  size = "regular",
  as: Tag = "section",
}: {
  children: ReactNode;
  scheme?: "dark" | "light";
  id?: string;
  className?: string;
  size?: "tight" | "regular" | "loose";
  as?: "section" | "div" | "footer" | "header";
}) {
  const padding = {
    tight: "py-16 md:py-24",
    regular: "py-24 md:py-36 lg:py-44",
    loose: "py-32 md:py-48 lg:py-56",
  }[size];

  return (
    <Tag
      id={id}
      data-scheme={scheme}
      data-band={scheme ?? "inherit"}
      className={cn(scheme && "scheme-surface", padding, className)}
    >
      {children}
    </Tag>
  );
}
