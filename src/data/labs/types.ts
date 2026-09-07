import type { IconName } from "@/components/labs/Icon";
import type { Relation, StackNotes, Story } from "@/data/labs/stories";
import type { Localized, LocalizedList } from "@/lib/i18n";

/**
 * Archon Labs — the shape of a concept product.
 *
 * These are not client work and they are not shipped products. They are
 * complete product concepts designed and built here so that a capability can
 * be shown rather than claimed, and every surface on the site labels them that
 * way without exception. The rule that governs the rest of this codebase —
 * never present something as real when it is not — is the reason this section
 * exists in the first place: the alternative to inventing a portfolio is
 * building one honestly.
 *
 * A few conventions keep the sample data from ever being mistaken for a fact:
 *
 * - No figure in here describes Archon. Every number belongs to the fictional
 *   company inside the prototype, and the surface says so.
 * - No people. Records carry initials and role labels, never faces, and never
 *   a real person's name.
 * - Chrome is localised, sample rows are not. A product built for a Turkish
 *   business runs its interface in Turkish and its data stays as data, which
 *   is also how the real ones work.
 */

export type Tone = "good" | "warn" | "risk" | "idle" | "accent";

/** A cell that may carry a status colour. */
export type Cell = { text: string; tone?: Tone } | string;

export type StatSpec = {
  label: Localized;
  value: string;
  delta?: string;
  tone?: Tone;
};

export type ChartSpec = {
  type: "area" | "bar";
  values: number[];
  labels: string[];
  peak?: string;
  caption?: Localized;
};

export type TimelineItem = { at: string; actor?: string; text: Localized };

export type RecordRow = {
  id: string;
  cells: Record<string, Cell>;
  detail: {
    title: string;
    eyebrow: Localized;
    fields: { label: Localized; value: string }[];
    note?: Localized;
  };
};

export type BoardCard = {
  id: string;
  title: string;
  meta: string;
  tag?: Localized;
  tone?: Tone;
};

export type Message = {
  from: "customer" | "agent" | "assistant";
  text: Localized;
  at: string;
  /** Rendered as a citation strip under an assistant answer. */
  sources?: string[];
};

export type Conversation = {
  id: string;
  subject: string;
  who: string;
  meta: Localized;
  tone?: Tone;
  messages: Message[];
  context: { label: Localized; value: string }[];
};

export type CatalogItem = {
  id: string;
  title: string;
  meta: string;
  price: string;
  tag?: Localized;
  tone?: Tone;
};

/** The archetypes every real product screen falls into. */
export type ViewBody =
  | {
      kind: "dashboard";
      stats: StatSpec[];
      chart: ChartSpec;
      /** Range chips actually re-derive the series. */
      ranges?: { id: string; label: string; values: number[] }[];
      breakdown?: { label: Localized; value: number; note?: string }[];
      breakdownUnit?: string;
      timeline?: TimelineItem[];
    }
  | {
      kind: "records";
      columns: { key: string; label: Localized; align?: "end"; hideNarrow?: boolean }[];
      rows: RecordRow[];
      filters?: { id: string; label: Localized }[];
    }
  | { kind: "board"; columns: { title: Localized; cards: BoardCard[] }[] }
  | { kind: "thread"; conversations: Conversation[]; composer?: Localized }
  | {
      kind: "catalog";
      items: CatalogItem[];
      cartLabel: Localized;
      addLabel: Localized;
      emptyLabel: Localized;
    }
  | {
      kind: "search";
      placeholder: Localized;
      queries: {
        id: string;
        query: Localized;
        answer: Localized;
        sources: { title: string; meta: Localized }[];
      }[];
    }
  | {
      kind: "command";
      placeholder: Localized;
      hint: Localized;
      groups: {
        label: Localized;
        items: { icon: IconName; label: Localized; meta?: string; shortcut?: string }[];
      }[];
    }
  | {
      kind: "states";
      /** Empty, loading and error, side by side. The states nobody demos. */
      cases: {
        id: string;
        label: Localized;
        kind: "empty" | "loading" | "error" | "success";
        title: Localized;
        body: Localized;
        action?: Localized;
      }[];
    }
  | {
      kind: "settings";
      groups: {
        label: Localized;
        rows: {
          label: Localized;
          detail: Localized;
          control: "toggle" | "select" | "text";
          value: string;
          on?: boolean;
        }[];
      }[];
    }
  | {
      kind: "mobile";
      screenTitle: Localized;
      /** Rows inside the phone. */
      rows: { title: string; meta: string; tag?: Localized; tone?: Tone }[];
      /** The desk-side companion, so both halves of the product are visible. */
      aside: { title: Localized; fields: { label: Localized; value: string }[] };
      deviceLabel: Localized;
    };

export type LabView = {
  id: string;
  label: Localized;
  icon: IconName;
  badge?: string;
  /** The header line inside the application, above the content. */
  title: Localized;
  meta?: Localized;
  body: ViewBody;
};

/** A concept with its story, its layer notes and its links, merged in. */
export type Lab = LabBase & {
  story: Story;
  stack: StackNotes;
  relations: Relation[];
};

export type LabBase = {
  slug: string;
  /** The concept product's own name. Never an Archon product. */
  name: string;
  index: string;
  sector: Localized;
  accent: string;
  icon: IconName;
  /** One line, set large. The argument of the concept. */
  statement: Localized;
  /** Why this concept exists and what problem it answers. */
  premise: LocalizedList;
  /** What building it demonstrates. This is the actual point of the section. */
  proves: LocalizedList;
  /** The architecture, as named layers. */
  system: { label: Localized; detail: Localized }[];
  /** Domains this concept belongs to, keyed to DOMAINS. */
  domains: string[];
  views: LabView[];
};
