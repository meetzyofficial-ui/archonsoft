"use client";

import { createElement, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { useInView } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * The tags this component is ever asked to be.
 *
 * It was `ElementType`, which stopped resolving the moment react-three-fiber
 * augmented the global JSX element map: the union of every intrinsic element's
 * props collapses to `never` and every prop below it fails to typecheck. A
 * narrow union is what this component actually needed anyway.
 */
type PolymorphicTag = "div" | "span" | "p" | "li" | "ol" | "ul" | "section" | "h2" | "h3";

/**
 * Renders the chosen tag without going through JSX intrinsic resolution.
 *
 * A polymorphic tag inside JSX makes TypeScript intersect the props — and the
 * refs — of every tag in the union, which no single ref can satisfy. Going
 * through `createElement` keeps the component honestly polymorphic and keeps
 * the ref a plain element ref.
 */
function polymorphic(
  tag: PolymorphicTag,
  props: HTMLAttributes<HTMLElement> & {
    ref?: Ref<HTMLElement>;
    "data-revealed"?: string;
    "aria-label"?: string;
  },
  children: ReactNode,
) {
  return createElement(tag, props, children);
}


type RevealProps = {
  children: ReactNode;
  /**
   * Which CSS primitive to apply. `none` only sets the data attribute, so
   * children can opt in individually with `reveal-fade` / `reveal-clip`.
   * `rise` never leaves the paint, so use it for anything that could be the
   * largest contentful paint - opacity would tie that metric to hydration.
   */
  variant?: "fade" | "rise" | "clip" | "none";
  as?: PolymorphicTag;
  className?: string;
  /** Milliseconds. Applied as a transition-delay on the animated element. */
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  /**
   * Renders already arrived, with no transition at all.
   *
   * For anything in the first viewport. A reveal there is not a reveal — the
   * visitor never saw the "before" — and it is measurably expensive: the
   * element cannot settle until hydration has run and the observer has fired,
   * and Chrome dates the largest contentful paint from where the movement
   * ends. On a throttled connection that was turning a masthead painted at
   * 0.85s into a largest paint reported at 3.6s. Pages open still; motion
   * starts when you scroll.
   */
  priority?: boolean;
};

/**
 * Scroll-reveal wrapper. It only flips `data-revealed`; the transition itself
 * is declared in CSS, which keeps it off the JS thread and lets the
 * reduced-motion media query neutralise every reveal on the site at once.
 *
 * The clip variant deliberately puts `reveal-clip` on a child rather than on
 * the observed element: a clip-path is included when the browser computes an
 * intersection rect, so an element clipped to zero height can never satisfy
 * its own threshold and would stay hidden forever.
 */
export function Reveal({
  children,
  variant = "fade",
  as: Tag = "div",
  className,
  delay = 0,
  threshold,
  rootMargin,
  priority = false,
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold, rootMargin });
  const revealed = priority || inView;
  const style = delay && !priority ? { transitionDelay: `${delay}ms` } : undefined;

  if (variant === "clip") {
    return polymorphic(
      Tag,
      { ref, "data-revealed": revealed ? "true" : "false", className },
      <div className="reveal-clip" style={style}>
        {children}
      </div>,
    );
  }

  return polymorphic(
    Tag,
    {
      ref,
      "data-revealed": revealed ? "true" : "false",
      className: cn(
        !priority && variant === "fade" && "reveal-fade",
        !priority && variant === "rise" && "reveal-rise",
        className,
      ),
      style,
    },
    children,
  );
}
