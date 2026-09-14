import { DEPARTMENTS } from "@/data/departments";
import { LABS } from "@/data/labs";
import { PROJECTS } from "@/data/projects";
import { PROJECT_GUIDES, type ProjectGuide } from "@/data/world-guides";
import { DISPLAYS, SYSTEM_LAYERS, ZONES, type Display, type PanelContent } from "@/data/world-map";
import { optimizedSrc } from "@/lib/imageSrc";
import { localePath, t, type Locale } from "@/lib/i18n";

/**
 * Everything the world needs to say, resolved on the server.
 *
 * The scene is geometry and nothing else. Every word in it is localised here
 * by the same function that localises the HTML, and every image URL is
 * resolved here through the same optimiser the pages use — so the world and
 * the site cannot drift, and a texture is never a full-size original that
 * happened to be lying around.
 *
 * This also keeps `next/image` and the whole i18n layer out of the client
 * bundle that carries the environment.
 */

export type WorldPhoto = { src: string; width: number; height: number; alt: string };

export type PreparedDisplay = Display & {
  content: PanelContent;
  /** Where activating it goes, already carrying the locale. */
  href?: string;
  /** What the prompt says. */
  action: string;
};

export type PreparedInstallation = {
  id: string;
  /** Real captures of shipped software. Never mockups. */
  photos: WorldPhoto[];
  accent: string;
  name: string;
  eyebrow: string;
  /** What the product is, in the visitor's language: the station's subtitle. */
  category: string;
};

/**
 * A project's guides, with everything they will say.
 *
 * The words are the project's own: its category, its one-sentence statement,
 * its standfirst and its verified facts, in the visitor's language. Nothing
 * here is written for the world — a guide can only repeat what the case
 * study already says.
 */
export type PreparedGuide = ProjectGuide & {
  id: string;
  name: string;
  category: string;
  statement: string;
  body: string;
  facts: { label: string; value: string }[];
  /** What is spoken aloud. The statement, then the standfirst. */
  voiceText: string;
  greetingText: string;
  askText: string;
  href: string;
  accent: string;
};

export type WorldPayload = {
  locale: Locale;
  displays: PreparedDisplay[];
  installations: PreparedInstallation[];
  guides: PreparedGuide[];
  /**
   * How many things there are to find.
   *
   * Every panel, every district, and for every project three moments —
   * being greeted at it, having it explained, and going through to it.
   */
  total: number;
  copy: {
    interact: string;
    open: string;
    read: string;
    back: string;
    look: string;
    move: string;
    exit: string;
    sound: string;
    loading: string;
    enter: string;
    /** The discovery readout: "09 / 28 found". */
    found: string;
    /** Shown once everything in the world has been opened. */
    foundAll: string;
    /* The guides. */
    talk: string;
    voice: string;
    voiceOn: string;
    voiceOff: string;
    play: string;
    pause: string;
    replay: string;
    transcript: string;
    explore: string;
    unsupported: string;
    zoneFound: string;
  };
};

/* Screens are read at a fraction of the size the pages use: a panel in the
   world is a few metres away and never fills the frame, and Next rounds up to
   its own size buckets anyway. */
const PHOTO_WIDTH = 420;
const PHOTO_QUALITY = 62;

const photo = (screen: (typeof PROJECTS)[number]["screens"][number], locale: Locale): WorldPhoto => ({
  src: optimizedSrc(screen.image, PHOTO_WIDTH, PHOTO_QUALITY),
  width: screen.image.width,
  height: screen.image.height,
  alt: t(screen.caption, locale),
});

export function buildWorld(locale: Locale): WorldPayload {
  const displays = DISPLAYS.map((display) => prepare(display, locale));

  const installations: PreparedInstallation[] = PROJECTS.map((project) => ({
    id: project.slug,
    photos: project.screens.slice(0, 4).map((screen) => photo(screen, locale)),
    accent: project.accent,
    name: project.name,
    eyebrow: locale === "tr" ? "CANLI ÜRÜN" : "LIVE PRODUCT",
    category: t(project.category, locale),
  }));

  const guides: PreparedGuide[] = PROJECT_GUIDES.map((guide) => {
    const project = PROJECTS.find((one) => one.slug === guide.projectId)!;
    const statement = t(project.statement, locale);
    const body = t(project.standfirst, locale);
    return {
      ...guide,
      id: `guide:${project.slug}`,
      name: project.name,
      category: t(project.category, locale),
      statement,
      body,
      facts: project.facts.map((fact) => ({
        label: t(fact.label, locale),
        value: t(fact.value, locale),
      })),
      voiceText: `${project.name}. ${statement} ${body}`,
      greetingText: t(guide.greeting, locale),
      askText: t(guide.ask, locale),
      href: localePath(locale, `/projects/${project.slug}`),
      accent: project.accent,
    };
  });

  return {
    locale,
    displays,
    installations,
    guides,
    total: displays.length + guides.length * 3 + ZONES.length,
    copy: {
      interact: locale === "tr" ? "İncele" : "Inspect",
      open: locale === "tr" ? "Projeyi aç" : "Open project",
      read: locale === "tr" ? "Oku" : "Read",
      back: locale === "tr" ? "Dünyaya dön" : "Back to the world",
      look: locale === "tr" ? "Bakmak için tıkla" : "Click to look around",
      move: locale === "tr" ? "W A S D — YÜRÜ · SHIFT — KOŞ · E — İNCELE" : "W A S D — MOVE · SHIFT — RUN · E — INSPECT",
      exit: locale === "tr" ? "Ana site" : "Main site",
      sound: locale === "tr" ? "Ses" : "Sound",
      loading: locale === "tr" ? "Dünya hazırlanıyor" : "Building the world",
      enter: locale === "tr" ? "Archon Dünyası'na gir" : "Enter Archon World",
      found: locale === "tr" ? "bulundu" : "found",
      foundAll: locale === "tr" ? "Hepsi bulundu" : "All found",
      talk: locale === "tr" ? "Konuş" : "Talk",
      voice: locale === "tr" ? "Anlatım" : "Voice",
      voiceOn: locale === "tr" ? "Sesli anlatımı aç" : "Enable voice",
      voiceOff: locale === "tr" ? "Sesli anlatımı kapat" : "Mute voice",
      play: locale === "tr" ? "Anlat" : "Play",
      pause: locale === "tr" ? "Duraklat" : "Pause",
      replay: locale === "tr" ? "Baştan" : "Replay",
      transcript: locale === "tr" ? "Metin" : "Transcript",
      explore: locale === "tr" ? "Projeyi keşfet" : "Explore project",
      unsupported:
        locale === "tr"
          ? "Bu tarayıcı sesli anlatımı desteklemiyor; metin burada."
          : "This browser has no speech synthesis; the transcript is here.",
      zoneFound: locale === "tr" ? "Bölge keşfedildi" : "Zone discovered",
    },
  };
}

function prepare(display: Display, locale: Locale): PreparedDisplay {
  const subject = display.subject;

  if (subject.kind === "project") {
    const project = PROJECTS.find((one) => one.slug === subject.slug)!;
    return {
      ...display,
      content: {
        eyebrow: locale === "tr" ? "Canlı ürün" : "Live product",
        title: project.name,
        body: t(project.summary, locale),
        meta: project.facts.map((fact) => t(fact.value, locale)),
        accent: project.accent,
      },
      href: localePath(locale, `/projects/${project.slug}`),
      action: locale === "tr" ? "Projeyi aç" : "Open project",
    };
  }

  if (subject.kind === "lab") {
    const lab = LABS.find((one) => one.slug === subject.slug)!;
    /* A concept is presented in the world by what it does — its sector —
       not by its codename: a panel that says "Divan" tells the visitor
       nothing, one that says "Business operating system" does. The codename
       stays on the page the panel leads to. */
    return {
      ...display,
      content: {
        eyebrow: locale === "tr" ? `Archon Labs · ${lab.index}` : `Archon Labs · ${lab.index}`,
        title: t(lab.sector, locale),
        body: t(lab.statement, locale),
        layers: lab.system.slice(0, 3).map((layer) => ({
          label: t(layer.label, locale),
          detail: t(layer.detail, locale),
        })),
        accent: lab.accent,
        /* The provenance rule from the rest of the site holds inside the
           world. A concept is labelled a concept on the surface itself, not
           only on the page it leads to. */
        provenance: locale === "tr" ? "Konsept" : "Concept",
      },
      href: localePath(locale, `/labs/${lab.slug}`),
      action: locale === "tr" ? "Konsepti aç" : "Open concept",
    };
  }

  if (subject.kind === "system") {
    const layer = SYSTEM_LAYERS.find((one) => one.id === subject.layer)!;
    const index = SYSTEM_LAYERS.indexOf(layer) + 1;
    return {
      ...display,
      content: {
        eyebrow: String(index).padStart(2, "0"),
        title: t(layer.label, locale),
        body: t(layer.detail, locale),
        accent: "#8fa3c4",
      },
      action: locale === "tr" ? "Oku" : "Read",
    };
  }

  if (subject.kind === "services") {
    return {
      ...display,
      content: {
        eyebrow: "Archon Soft",
        title: locale === "tr" ? "Hizmetlerimiz" : "What we do",
        body:
          locale === "tr"
            ? "Web ve mobil yazılımdan yapay zekaya, tasarımdan 3D dünyalara: bir ürünün ihtiyaç duyduğu her katman, tek stüdyodan. Lobideki ekibe sorun."
            : "From web and mobile software to AI, from design to 3D worlds: every layer a product needs, from one studio. Ask the team in the lobby.",
        layers: DEPARTMENTS.filter((one) => one.office).map((one) => ({ label: t(one.name, locale), detail: t(one.tagline, locale) })),
        accent: "#f2a889",
      },
      action: locale === "tr" ? "Oku" : "Read",
    };
  }

  return {
    ...display,
    content: {
      eyebrow: locale === "tr" ? "Archon" : "Archon",
      title: t(subject.title, locale),
      body: t(subject.body, locale),
      accent: "#8ea6cc",
    },
    action: locale === "tr" ? "Oku" : "Read",
  };
}
