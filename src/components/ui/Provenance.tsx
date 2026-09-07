import type { Copy } from "@/i18n/dictionary";
import { cn } from "@/lib/utils";

/**
 * Three words, used the same way everywhere.
 *
 * SHIPPED is real production work. ARCHON LABS is a concept or prototype.
 * CAPABILITY is an area of engineering that has been demonstrated. A visitor
 * has to be able to tell those apart at a glance and without reading, so they
 * get one component, one shape and one colour rule — SHIPPED is the only one
 * that ever takes the accent, because it is the only one that earned it.
 */
export type Kind = "shipped" | "concept" | "capability";

export function Provenance({
  kind,
  copy,
  className,
  size = "regular",
}: {
  kind: Kind;
  copy: Copy;
  className?: string;
  size?: "regular" | "large";
}) {
  const label = {
    shipped: copy.provenance.shipped,
    concept: copy.provenance.concept,
    capability: copy.provenance.capability,
  }[kind];

  return (
    <span
      className={cn(
        "mono-label inline-flex shrink-0 items-center gap-2 border whitespace-nowrap",
        size === "large" ? "px-3 py-2" : "px-2 py-1.5",
        kind === "shipped"
          ? "border-[var(--accent)] text-[var(--accent)]"
          : "border-[var(--line-strong)] text-[var(--fg-mute)]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "block size-1.5",
          kind === "shipped" ? "rounded-full bg-current" : kind === "concept" ? "bg-current" : "rotate-45 bg-current",
        )}
      />
      {label}
    </span>
  );
}

/** The same three words as a plain inline label, for dense rows and tables. */
export function ProvenanceText({
  kind,
  copy,
  className,
}: {
  kind: Kind;
  copy: Copy;
  className?: string;
}) {
  const label = {
    shipped: copy.provenance.shipped,
    concept: copy.provenance.concept,
    capability: copy.provenance.capability,
  }[kind];

  return (
    <span
      className={cn(
        "mono-label",
        kind === "shipped" ? "text-[var(--accent)]" : "text-[var(--fg-mute)]",
        className,
      )}
    >
      {label}
    </span>
  );
}
