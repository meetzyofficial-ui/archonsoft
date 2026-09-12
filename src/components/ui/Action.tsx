import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one thing you can press.
 *
 * What used to be here was a 52px control with a border, a bottom-up colour
 * wipe on hover, a two-arrow swap animation and a magnetic pull toward the
 * cursor — six behaviours to say "link". On a page whose whole language is
 * hairlines and eleven-pixel type, that object was louder than the work.
 *
 * A navigation action is now a line of small caps with a rule running off it,
 * and the rule grows on hover. That is the entire interaction vocabulary, and
 * it is the same on a project, a case study, the world and the footer, so the
 * site only ever teaches it once.
 *
 * A form control is the one exception: a submit button that looks like a
 * sentence is a submit button people do not press. That keeps a hairline box
 * and a 3px corner — restrained, and unmistakably a control.
 */

type Variant = "solid" | "line" | "ghost";

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  arrow?: "right" | "down" | "none";
  className?: string;
};

/** The rule that runs off the end of an action, with the arrow on it. */
function Rule({ direction = "right" }: { direction?: "right" | "down" }) {
  if (direction === "down") {
    return (
      <span
        aria-hidden="true"
        className="relative block h-8 w-px bg-current transition-[height] duration-[700ms] ease-[var(--ease-out-expo)] group-hover/action:h-12"
      >
        <span className="absolute right-[-3px] bottom-0 block size-[7px] rotate-[135deg] border-t border-r border-current" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="relative block h-px w-10 bg-current transition-[width] duration-[700ms] ease-[var(--ease-out-expo)] group-hover/action:w-20"
    >
      <span className="absolute -top-[3px] right-0 block size-[7px] rotate-45 border-t border-r border-current" />
    </span>
  );
}

const emphasis: Record<Variant, string> = {
  solid: "text-[var(--fg)]",
  line: "text-[var(--fg-dim)] hover:text-[var(--fg)]",
  ghost: "text-[var(--fg-mute)] hover:text-[var(--fg)]",
};

const base =
  "group/action mono-label inline-flex select-none items-center gap-4 whitespace-nowrap " +
  "-my-2 py-2 transition-colors duration-500 ease-[var(--ease-out-expo)]";

export function ActionLink({
  children,
  href,
  variant = "line",
  arrow = "right",
  className,
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={cn(base, emphasis[variant], className)} {...rest}>
      <span>{children}</span>
      {arrow !== "none" ? <Rule direction={arrow} /> : null}
    </Link>
  );
}

export function ActionButton({
  children,
  variant = "solid",
  arrow = "right",
  className,
  ...rest
}: CommonProps & ComponentProps<"button">) {
  /* A real control, because it submits something. */
  if (variant === "solid") {
    return (
      <button
        className={cn(
          "group/action mono-label inline-flex h-12 items-center gap-4 border border-[var(--fg)] px-6",
          "text-[var(--fg)] transition-colors duration-500 ease-[var(--ease-out-expo)]",
          "hover:bg-[var(--fg)] hover:text-[var(--bg)]",
          "disabled:pointer-events-none disabled:opacity-40",
          className,
        )}
        style={{ borderRadius: "var(--radius-hair)" }}
        {...rest}
      >
        <span>{children}</span>
        {arrow !== "none" ? <Rule direction={arrow} /> : null}
      </button>
    );
  }

  return (
    <button
      className={cn(base, emphasis[variant], "disabled:pointer-events-none disabled:opacity-40", className)}
      {...rest}
    >
      <span>{children}</span>
      {arrow !== "none" ? <Rule direction={arrow} /> : null}
    </button>
  );
}
