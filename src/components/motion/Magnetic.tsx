"use client";

import type { ReactNode } from "react";
import { useMagnetic } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** 0 is inert, 1 pins the element to the cursor. Keep it subtle. */
  strength?: number;
};

/**
 * Pulls its child toward the pointer. Inert on touch devices and under
 * reduced motion - the hook returns no handlers in those cases, so nothing is
 * attached and nothing is paid for.
 */
export function Magnetic({ children, className, strength = 0.28 }: MagneticProps) {
  const { ref, enabled, handlers } = useMagnetic<HTMLSpanElement>(strength);

  return (
    <span
      ref={ref}
      {...handlers}
      className={cn(
        "inline-block",
        enabled && "transition-transform duration-[380ms] ease-[var(--ease-out-soft)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
