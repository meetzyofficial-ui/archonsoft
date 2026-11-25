import { DOMAINS, LABS } from "@/data/labs";
import type { IconName } from "@/components/labs/Icon";
import { PROJECTS } from "@/data/projects";
import type { Screen } from "@/data/screens";
import { CONCEPT_TITLES } from "@/data/labs/titles";
import { getShowcase, projectPath } from "@/data/showcase";
import type { Localized } from "@/lib/i18n";

/**
 * Everything Archon has built, as one body of work.
 *
 * The site used to keep shipped products and Archon Labs in separate rooms,
 * which is honest but unhelpful: a visitor deciding whether this studio can
 * build their thing wants to see the whole range and then narrow it, not pick
 * a menu first. So the two live here as one list with one vocabulary — the
 * same eight domains the capability pages use — and the one thing that is
 * never merged is the provenance.
 *
 * That distinction is the whole reason this file can exist at all. Four of
 * these shipped and ten did not, every entry carries which it is, and the
 * index prints it on the row rather than in a footnote. Blur that and the
 * range stops being an argument and becomes a claim.
 */

export type Provenance = "shipped" | "concept";

export type Piece = {
  slug: string;
  /** What a visitor reads: a shipped product's name, a concept's title. */
  name: Localized;
  index: string;
  provenance: Provenance;
  /** What kind of thing it is, in its own words. */
  sector: Localized;
  /** One line. The argument of the work. */
  statement: Localized;
  accent: string;
  /** Keyed to DOMAINS. What a filter narrows on. */
  domains: string[];
  /** Where the full account of it lives. */
  path: string;
  /**
   * Real captures of shipped software. Concepts have none and never will:
   * they run as interfaces on their own pages, and a photograph of one would
   * be a picture of something that is not a photograph.
   */
  screens: Screen[];
  /** Verified figures. Shipped work only. */
  facts?: { label: Localized; value: Localized }[];
  /** Concepts carry a mark instead of a photograph. */
  icon?: IconName;
  /** The named layers a concept demonstrates. */
  layers?: Localized[];
};

const SHIPPED: Piece[] = PROJECTS.map((project) => ({
  slug: project.slug,
  name: { en: project.name, tr: project.name },
  index: "",
  provenance: "shipped" as const,
  sector: project.category,
  statement: project.summary,
  accent: project.accent,
  domains: project.domains,
  path: projectPath(project.slug),
  screens: project.screens.slice(0, 3),
  facts: project.facts.slice(0, 3),
}));

/* Archon Soft World is shipped work too, and its captures are frames it
   rendered itself. */
const world = getShowcase("archon-soft-world")!;
const WORLD: Piece = {
  slug: world.slug,
  name: { en: world.title, tr: world.title },
  index: "",
  provenance: "shipped",
  sector: world.category,
  statement: world.tagline,
  accent: world.accent,
  domains: ["products"],
  path: projectPath(world.slug),
  screens: world.gallery.slice(0, 1).map((media) => ({ image: media.image, caption: media.alt })),
  facts: world.facts.slice(0, 3),
};

const CONCEPTS: Piece[] = LABS.map((lab) => ({
  slug: lab.slug,
  name: CONCEPT_TITLES[lab.slug] ?? { en: lab.name, tr: lab.name },
  index: "",
  provenance: "concept" as const,
  sector: lab.sector,
  statement: lab.statement,
  accent: lab.accent,
  domains: lab.domains,
  path: `/labs/${lab.slug}`,
  screens: [],
  icon: lab.icon,
  layers: lab.system.slice(0, 3).map((layer) => layer.label),
}));

/** Shipped first. What is live outranks what is possible, always. */
export const COLLECTION: Piece[] = [...SHIPPED, WORLD, ...CONCEPTS].map((piece, i) => ({
  ...piece,
  index: String(i + 1).padStart(2, "0"),
}));

/* ----------------------------------------------------------------- facets */

export type Facet = {
  id: string;
  label: Localized;
  /** How many pieces it holds. Printed, so a filter is never a dead end. */
  count: number;
};

/**
 * The filters, built from the work rather than declared beside it.
 *
 * A domain with nothing in it never appears, which is the only way a facet
 * list stays true as the work changes: add a concept tagged `commerce` and
 * the commerce filter counts it the same day.
 */
export const PROVENANCE_FACETS: Facet[] = (
  [
    { id: "shipped", label: { en: "Shipped", tr: "Yayında" } },
    { id: "concept", label: { en: "Archon Labs", tr: "Archon Labs" } },
  ] as const
)
  .map((facet) => ({
    ...facet,
    count: COLLECTION.filter((piece) => piece.provenance === facet.id).length,
  }))
  .filter((facet) => facet.count > 0);

export const DOMAIN_FACETS: Facet[] = DOMAINS.map((domain) => ({
  id: domain.id,
  label: domain.title,
  count: COLLECTION.filter((piece) => piece.domains.includes(domain.id)).length,
})).filter((facet) => facet.count > 0);

export function filterCollection(
  pieces: Piece[],
  provenance: string | null,
  domain: string | null,
): Piece[] {
  return pieces.filter(
    (piece) =>
      (!provenance || piece.provenance === provenance) &&
      (!domain || piece.domains.includes(domain)),
  );
}
