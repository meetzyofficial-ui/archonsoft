"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Magnetic } from "@/components/motion/Magnetic";
import { cn } from "@/lib/utils";

type Variant = "solid" | "line" | "ghost";

const base =
  "group/action relative inline-flex items-center gap-3 overflow-hidden isolate " +
  "mono-label select-none whitespace-nowrap " +
  "h-[3.25rem] pl-6 pr-5 rounded-none border transition-colors duration-500 " +
  "ease-[var(--ease-out-expo)] disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  solid: "border-transparent bg-[var(--fg)] text-[var(--bg)] hover:text-[var(--fg)]",
  line: "border-[var(--line-strong)] text-[var(--fg)] hover:text-[var(--bg)]",
  ghost: "border-transparent text-[var(--fg-dim)] hover:text-[var(--fg)] px-0 h-auto gap-2",
};

/** The wipe that fills the control from the bottom edge on hover. */
function Wipe({ variant }: { variant: Variant }) {
  if (variant === "ghost") return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute inset-0 -z-10 origin-bottom scale-y-0 rounded-none",
        "transition-transform duration-[650ms] ease-[var(--ease-out-expo)]",
        "group-hover/action:scale-y-100 group-focus-visible/action:scale-y-100",
        variant === "solid" ? "bg-[var(--bg)]" : "bg-[var(--fg)]",
      )}
    />
  );
}

function Arrow({ direction = "right" }: { direction?: "right" | "down" }) {
  return (
    <span aria-hidden="true" className="relative block h-3 w-3 overflow-hidden">
      <svg
        viewBox="0 0 12 12"
        fill="none"
        className={cn(
          "absolute inset-0 h-3 w-3 transition-transform duration-[550ms] ease-[var(--ease-out-expo)]",
          direction === "right"
            ? "group-hover/action:translate-x-[130%]"
            : "group-hover/action:translate-y-[130%]",
        )}
      >
        <path d={direction === "right" ? "M1 6h10M6.6 1.6 11 6l-4.4 4.4" : "M6 1v10M1.6 5.6 6 10l4.4-4.4"} stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <svg
        viewBox="0 0 12 12"
        fill="none"
        className={cn(
          "absolute inset-0 h-3 w-3 transition-transform duration-[550ms] ease-[var(--ease-out-expo)]",
          direction === "right"
            ? "-translate-x-[130%] group-hover/action:translate-x-0"
            : "-translate-y-[130%] group-hover/action:translate-y-0",
        )}
      >
        <path d={direction === "right" ? "M1 6h10M6.6 1.6 11 6l-4.4 4.4" : "M6 1v10M1.6 5.6 6 10l4.4-4.4"} stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </span>
  );
}

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  arrow?: "right" | "down" | "none";
  className?: string;
  magnetic?: boolean;
};

export function ActionLink({
  children,
  href,
  variant = "line",
  arrow = "right",
  className,
  magnetic = true,
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  const content = (
    <Link href={href} className={cn(base, variants[variant], className)} {...rest}>
      <Wipe variant={variant} />
      <span className="relative">{children}</span>
      {arrow !== "none" ? <Arrow direction={arrow} /> : null}
    </Link>
  );

  return magnetic ? <Magnetic strength={0.22}>{content}</Magnetic> : content;
}

export function ActionButton({
  children,
  variant = "solid",
  arrow = "right",
  className,
  magnetic = false,
  ...rest
}: CommonProps & ComponentProps<"button">) {
  const content = (
    <button className={cn(base, variants[variant], className)} {...rest}>
      <Wipe variant={variant} />
      <span className="relative">{children}</span>
      {arrow !== "none" ? <Arrow direction={arrow} /> : null}
    </button>
  );

  return magnetic ? <Magnetic strength={0.22}>{content}</Magnetic> : content;
}
