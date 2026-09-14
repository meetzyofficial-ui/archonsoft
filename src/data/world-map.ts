import { LABS } from "@/data/labs";
import { PROJECTS } from "@/data/projects";
import type { Localized } from "@/lib/i18n";

/**
 * Archon World — the plan.
 *
 * Everything spatial lives here rather than in the components that draw it,
 * for the same reason a building has drawings before it has walls: the shape
 * of the place is a design decision, and design decisions that are scattered
 * through render functions cannot be changed, checked or reasoned about.
 *
 * The world is one building. A hub you arrive in, a gate on its axis, and four
 * districts off that axis — each with its own light, its own architecture and
 * its own kind of work on show. Distances are metres and the visitor's eye is
 * at 1.7 of them, which is the only reason anything in here has a size.
 */

/* ------------------------------------------------------------------ units */

/** Eye height. Every proportion in the world is set against this. */
export const EYE = 1.7;
/** Structural module. Bays, doorways and floor joints are all multiples. */
export const BAY = 6;
/** Clear width of a corridor. Two people, comfortably. */
export const CORRIDOR = 10;
/** Height of the upper walkway above the hub floor. Declared with the other
    units because the displays on it are laid out long before the structure
    that carries them is described. */
export const GALLERY = 9;

/* --------------------------------------------------------------- geometry */

/** An axis-aligned box, in world metres. Used for walls and for collision. */
export type Box = {
  /** Centre. */
  at: [number, number, number];
  /** Full extents. */
  size: [number, number, number];
};

export type Zone = {
  id: ZoneId;
  label: Localized;
  /**
   * Which level the district is on.
   *
   * The gallery stands directly above the hub, so on plan the two occupy the
   * same rectangle and only height tells them apart. Everything else is on the
   * ground and leaves this alone.
   */
  level?: number;
  /** Where the district is centred, for compass bearings and audio zones. */
  at: [number, number, number];
  /** The rectangle the district occupies on plan: [minX, minZ, maxX, maxZ]. */
  bounds: [number, number, number, number];
  /** The colour this district is lit and labelled with. */
  accent: string;
  /** Ambient level. The hub is bright, the archive is not. */
  light: number;
};

export type ZoneId =
  | "hub"
  | "gallery"
  | "shipped"
  | "boards"
  | "labs"
  | "systems"
  | "archive";

/* ------------------------------------------------------------------ zones */

export const ZONES: Zone[] = [
  {
    id: "hub",
    label: { en: "The Gate", tr: "Kapı" },
    at: [0, 0, 0],
    bounds: [-30, -30, 30, 34],
    accent: "#9ad6ff",
    light: 1,
  },
  {
    id: "gallery",
    label: { en: "The Gallery", tr: "Galeri" },
    at: [0, 9, -8],
    bounds: [-30, -30, 30, 34],
    level: 9,
    accent: "#c2e4ff",
    light: 1.05,
  },
  {
    id: "shipped",
    label: { en: "Shipped", tr: "Yayında" },
    at: [0, 0, -46],
    bounds: [-30, -74, 30, -22],
    accent: "#6fd8ff",
    light: 0.9,
  },
  {
    /**
     * DP Pano's own room, and the only district reached through another one.
     *
     * It hangs off the east side of Shipped rather than off the hub, because
     * that is what it is: not a fourth direction out of the plaza but a hall
     * you find once you are already standing among the shipped work. A product
     * whose whole argument is "one panel, many screens" gets a room shaped like
     * that argument — a long hall lined with screens and a single console
     * halfway down it — instead of a sign with its name on.
     */
    id: "boards",
    label: { en: "The Hall of Screens", tr: "Ekranlar Koridoru" },
    at: [58, 0, -66],
    bounds: [34, -78, 84, -54],
    accent: "#4f8dff",
    light: 0.85,
  },
  {
    id: "labs",
    label: { en: "Archon Labs", tr: "Archon Labs" },
    at: [58, 0, 0],
    bounds: [34, -26, 84, 26],
    accent: "#9a7dff",
    light: 0.8,
  },
  {
    id: "systems",
    label: { en: "Systems", tr: "Sistemler" },
    at: [-58, 0, 0],
    bounds: [-84, -24, -34, 24],
    accent: "#3ee6d8",
    light: 0.7,
  },
  {
    id: "archive",
    label: { en: "The Archive", tr: "Arşiv" },
    at: [0, 0, 60],
    bounds: [-24, 40, 24, 82],
    accent: "#6a7cff",
    light: 0.45,
  },
];

export const getZone = (id: ZoneId): Zone => ZONES.find((z) => z.id === id)!;

/**
 * Which district a point stands in.
 *
 * Zones do not overlap, and the corridors between them are deliberately not
 * anybody's zone — walking a corridor should feel like being between places.
 */
export function zoneAt(x: number, z: number, level = 0): Zone | undefined {
  return ZONES.find((zone) => {
    if (Math.abs((zone.level ?? 0) - level) > 2) return false;
    const [minX, minZ, maxX, maxZ] = zone.bounds;
    return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
  });
}

/* -------------------------------------------------------------- displays */

/**
 * The seven kinds of surface work is shown on.
 *
 * They are different because the work is different, and because a world where
 * every screen is the same rectangle is a grid with a camera in front of it.
 * Each kind has its own architecture: a wall display is part of the wall, a
 * terminal stands on the floor and you walk up to it, a billboard is meant to
 * be read from two hundred metres away.
 */
export type DisplayKind =
  /** A — a display set into an architectural wall. */
  | "wall"
  /** B — a freestanding terminal, chest height, angled to the reader. */
  | "terminal"
  /** C — an outdoor-scale billboard, read from across the world. */
  | "billboard"
  /** D — a tall vertical exhibition screen on a plinth. */
  | "vertical"
  /** E — a small kiosk, off the main path, for people who wander. */
  | "kiosk"
  /** F — a grid of panels acting as one installation. */
  | "array"
  /** G — a full-height immersive project wall. */
  | "immersive";

export type DisplaySubject =
  | { kind: "project"; slug: string }
  | { kind: "lab"; slug: string }
  | { kind: "system"; layer: string }
  | { kind: "note"; title: Localized; body: Localized }
  /** The company's services, composed from the departments. */
  | { kind: "services" };

/**
 * What a screen says.
 *
 * Composed on the server from the site's own data so the world and the pages
 * can never drift, and so every word in the environment is localised by the
 * same function that localises the HTML.
 */
export type PanelContent = {
  eyebrow: string;
  title: string;
  body: string;
  /** Short factual lines. Never invented — they come from the data. */
  meta?: string[];
  /** Named layers, drawn as a stack. */
  layers?: { label: string; detail: string }[];
  accent: string;
  /** Set on anything that is a concept rather than shipped work. */
  provenance?: string;
};

export type Display = {
  id: string;
  zone: ZoneId;
  form: DisplayKind;
  /** Centre of the display surface. */
  at: [number, number, number];
  /** Rotation about Y, radians. Zero faces +Z. */
  turn: number;
  /** Surface size in metres. */
  size: [number, number];
  subject: DisplaySubject;
  /** Where the visitor stands to read it, if it is approached from a fixed side. */
  approach?: [number, number, number];
};

/* ---------------------------------------------------------------- shipped */

/* Found by slug, not by position. The order of `PROJECTS` is an editorial
   decision about the home page and it has changed once already; a room in a
   building should not quietly point at different work when it does. */
const MEETZY = PROJECTS.find((one) => one.slug === "meetzy")!;
const ERDEN = PROJECTS.find((one) => one.slug === "erden")!;

/**
 * The shipped district.
 *
 * Two rooms off one axis, facing each other, so that standing on the axis you
 * can see both at once and neither is the front page. The billboard closes the
 * far end: it is the thing you see through the gate from the hub, and it is
 * the reason anybody walks this way.
 */
const SHIPPED_DISPLAYS: Display[] = [
  {
    id: "shipped-billboard",
    zone: "shipped",
    form: "billboard",
    /* Read from the hub across the water, so it is still the largest panel in
       the world — but a panel, not a cinema screen. It was thirty-four metres
       wide and filled the end of the hall. */
    at: [0, 8.6, -72],
    turn: 0,
    size: [16, 7],
    subject: { kind: "note", title: { en: "Shipped", tr: "Yayında" }, body: {
      en: "Three products, live. Two of them here, and one through the east wall.",
      tr: "Üç ürün, canlı. İkisi burada, biri doğu duvarının ardında.",
    } },
  },
  {
    id: "meetzy-immersive",
    zone: "shipped",
    form: "immersive",
    at: [-22.4, 5.4, -44],
    turn: Math.PI / 2,
    size: [11, 6.2],
    subject: { kind: "project", slug: MEETZY.slug },
    approach: [-6, EYE, -44],
  },
  {
    id: "erden-immersive",
    zone: "shipped",
    form: "immersive",
    at: [22.4, 5.4, -44],
    turn: -Math.PI / 2,
    size: [11, 6.2],
    subject: { kind: "project", slug: ERDEN.slug },
    approach: [6, EYE, -44],
  },
  {
    id: "meetzy-terminal",
    zone: "shipped",
    form: "terminal",
    at: [-8.5, 1.15, -34],
    turn: Math.PI / 2 + 0.35,
    size: [1.5, 1],
    subject: { kind: "project", slug: MEETZY.slug },
  },
  {
    id: "erden-terminal",
    zone: "shipped",
    form: "terminal",
    at: [8.5, 1.15, -34],
    turn: -Math.PI / 2 - 0.35,
    size: [1.5, 1],
    subject: { kind: "project", slug: ERDEN.slug },
  },
];

/* ---------------------------------------------------------------- boards */

const DPPANO = PROJECTS.find((one) => one.slug === "dppano")!;

/**
 * The hall of screens.
 *
 * Five things to walk up to, and the room itself makes the product's argument
 * before any of them is read: screens of different sizes set into the two long
 * walls, one console halfway down the hall that feeds all of them, and the
 * project wall closing the far end. Nothing here is a school — it is the shape
 * of the idea, in the same grey stone as the rest of the building.
 */
const BOARDS_DISPLAYS: Display[] = [
  {
    id: "dppano-hall",
    zone: "boards",
    form: "immersive",
    at: [82.4, 5.2, -66],
    turn: -Math.PI / 2,
    size: [13, 6.6],
    subject: { kind: "project", slug: DPPANO.slug },
    approach: [70, EYE, -66],
  },
  {
    /* The console is the panel, not the product. Pointing it at the project
       as well put the same name on two things in one room, which is the one
       thing a hall of screens cannot afford to do. */
    id: "dppano-console",
    zone: "boards",
    form: "terminal",
    at: [52, 1.15, -62.5],
    turn: -Math.PI / 2 - 0.4,
    size: [1.5, 1],
    subject: { kind: "note", title: { en: "The panel", tr: "Panel" }, body: {
      en: "Every screen in this hall is fed from one place. Twenty-six modules, six regions per screen, two rotating slots per region — entered once, and on every board within seconds.",
      tr: "Bu koridordaki her ekran tek bir yerden beslenir. Yirmi altı modül, ekran başına altı bölge, bölge başına iki dönüşümlü slot — bir kez girilir, saniyeler içinde her panoda.",
    } },
  },
  {
    id: "dppano-many",
    zone: "boards",
    form: "wall",
    at: [46, 4.6, -77.1],
    turn: 0,
    size: [9, 4],
    subject: { kind: "note", title: { en: "One school, many boards", tr: "Bir okul, birçok pano" }, body: {
      en: "Entrance hall, staffroom, canteen, corridor. The content is held once at school level; the screens differ only in layout, and an update is pushed from the server to every one of them as it happens.",
      tr: "Giriş holü, öğretmenler odası, kantin, koridor. İçerik okul seviyesinde bir kez tutulur; ekranlar yalnızca düzen olarak ayrışır ve güncelleme sunucudan her birine anında itilir.",
    } },
  },
  {
    id: "dppano-solver",
    zone: "boards",
    form: "wall",
    at: [66, 4.6, -77.1],
    turn: 0,
    size: [9, 4],
    subject: { kind: "note", title: { en: "It calculates, not just displays", tr: "Gösterir değil, hesaplar" }, body: {
      en: "The timetable is produced by a constraint solver — availability, block lessons, rooms and elective pools in one calculation. Duty rotates automatically and prints for the wall, and an absent teacher's lessons are shared out on that day's load plus the last thirty days of cover.",
      tr: "Ders programı bir kısıt çözücüyle üretilir — müsaitlik, blok ders, derslik ve seçmeli havuzları tek hesapta. Nöbet otomatik döner ve duvara asılacak hâlde basılır; gelmeyen öğretmenin dersleri o günkü yük ile son otuz günün ikame sayısına göre dağıtılır.",
    } },
  },
  {
    id: "dppano-safe",
    zone: "boards",
    form: "kiosk",
    at: [58, 1.35, -55.2],
    turn: Math.PI,
    size: [1.7, 1.15],
    subject: { kind: "note", title: { en: "Safe mode is the default", tr: "Varsayılan güvenli mod" }, body: {
      en: "A board goes live with names, photographs and sensitive fields hidden. Screen PIN, school-network restriction, consent records and access logs are part of the product, not a layer added afterwards.",
      tr: "Pano; isim, fotoğraf ve hassas alanlar gizli hâlde yayına girer. Ekran PIN'i, okul ağı kısıtı, rıza kayıtları ve erişim logları sonradan eklenen bir katman değil, ürünün kendisidir.",
    } },
  },
];

/* ------------------------------------------------------------------ labs */

/**
 * Archon Labs.
 *
 * Ten concepts, so ten vertical screens down a long gallery in two facing
 * rows. They are concepts and the world says so on every one of them: the
 * provenance rule from the rest of the site holds here too, because a world
 * that blurs what shipped and what did not is worth nothing.
 */
const LABS_DISPLAYS: Display[] = LABS.map((lab, index) => {
  const side = index % 2 === 0 ? -1 : 1;
  const along = -21 + Math.floor(index / 2) * 10.5;
  return {
    id: `lab-${lab.slug}`,
    zone: "labs" as const,
    form: "vertical" as const,
    at: [58 + side * 11.4, 4.2, along],
    turn: side === -1 ? Math.PI / 2 : -Math.PI / 2,
    size: [4.2, 6.4],
    subject: { kind: "lab" as const, slug: lab.slug },
    approach: [58 + side * 6.5, EYE, along] as [number, number, number],
  };
});

/* --------------------------------------------------------------- systems */

/**
 * The system layers, as the rest of the site names them.
 *
 * Eight panels in one array, read as a single installation rather than eight
 * screens: the whole point of the section is that these are not separate
 * things but one path from a person to a running product.
 */
export const SYSTEM_LAYERS: { id: string; label: Localized; detail: Localized }[] = [
  { id: "user", label: { en: "User", tr: "Kullanıcı" }, detail: {
    en: "A person with something to do.", tr: "Yapacak bir işi olan bir insan." } },
  { id: "interface", label: { en: "Interface", tr: "Arayüz" }, detail: {
    en: "What they touch. The only part most people ever see.",
    tr: "Dokunduğu yer. Çoğu insanın gördüğü tek kısım." } },
  { id: "application", label: { en: "Application", tr: "Uygulama" }, detail: {
    en: "The rules. What may happen, and to whom.",
    tr: "Kurallar. Ne olabilir, kime olabilir." } },
  { id: "api", label: { en: "API", tr: "API" }, detail: {
    en: "The contract between the front and everything behind it.",
    tr: "Ön yüz ile arkasındaki her şey arasındaki sözleşme." } },
  { id: "database", label: { en: "Database", tr: "Veritabanı" }, detail: {
    en: "What is true, and what was true yesterday.",
    tr: "Neyin doğru olduğu, dün neyin doğru olduğu." } },
  { id: "automation", label: { en: "Automation", tr: "Otomasyon" }, detail: {
    en: "The work nobody should have to remember to do.",
    tr: "Kimsenin yapmayı hatırlamak zorunda kalmaması gereken iş." } },
  { id: "analytics", label: { en: "Analytics", tr: "Analitik" }, detail: {
    en: "Whether any of it worked.", tr: "Bunların işe yarayıp yaramadığı." } },
  { id: "production", label: { en: "Production", tr: "Üretim" }, detail: {
    en: "Live, monitored, and someone's responsibility.",
    tr: "Canlı, izleniyor ve birinin sorumluluğunda." } },
];

const SYSTEMS_DISPLAYS: Display[] = SYSTEM_LAYERS.map((layer, index) => {
  const column = index % 4;
  const row = Math.floor(index / 4);
  return {
    id: `system-${layer.id}`,
    zone: "systems" as const,
    form: "array" as const,
    at: [-71.4, 8.6 - row * 4.6, 13.5 - column * 9],
    turn: Math.PI / 2,
    size: [7.6, 4],
    subject: { kind: "system" as const, layer: layer.id },
  };
});

SYSTEMS_DISPLAYS.push({
  id: "systems-wall",
  zone: "systems",
  form: "wall",
  at: [-40.4, 5.4, 0],
  turn: -Math.PI / 2,
  size: [18, 7],
  subject: { kind: "note", title: { en: "The whole system", tr: "Sistemin tamamı" }, body: {
    en: "Interface, application, API, database, automation, analytics, production. One studio, from the first decision to the release.",
    tr: "Arayüz, uygulama, API, veritabanı, otomasyon, analitik, üretim. Tek stüdyo, ilk karardan yayına.",
  } },
});

/* --------------------------------------------------------------- archive */

/**
 * The archive.
 *
 * Deliberately off the axis, behind where you arrive, darker and lower than
 * everywhere else. Nothing here is needed to understand Archon — it is here
 * for the visitor who turns round, and it exists because a world with nothing
 * to find is a corridor with pictures in it.
 */
const ARCHIVE_NOTES: { title: Localized; body: Localized }[] = [
  {
    title: { en: "Ankara", tr: "Ankara" },
    body: {
      en: "The studio is in Ankara, Turkey. Everything on this site was built there.",
      tr: "Stüdyo Ankara'da. Bu sitedeki her şey orada kuruldu.",
    },
  },
  {
    title: { en: "About two years", tr: "Yaklaşık iki yıl" },
    body: {
      en: "How long Archon has been building. Founder-led, and small on purpose.",
      tr: "Archon'un kurduğu süre. Kurucu yürütüyor ve bilerek küçük.",
    },
  },
  {
    title: { en: "Redaction", tr: "Maskeleme" },
    body: {
      en: "Meetzy is a social product. No app capture here shows a user's face, and names in list rows are pixelated before the image ever reaches the site. The faces on its App Store images are stock photography.",
      tr: "Meetzy sosyal bir ürün. Buradaki hiçbir uygulama ekranı bir kullanıcının yüzünü göstermiyor; liste satırlarındaki isimler görsel siteye ulaşmadan önce pikselleniyor. App Store görsellerindeki yüzler stok fotoğraftır.",
    },
  },
  {
    title: { en: "Concepts are labelled", tr: "Konseptler etiketli" },
    body: {
      en: "Ten products in Labs are concepts. They are running interfaces, not client work, and every one of them says so.",
      tr: "Labs'teki on ürün konsepttir. Çalışan arayüzler, müşteri işi değil — ve her biri bunu söylüyor.",
    },
  },
  {
    title: { en: "This world", tr: "Bu dünya" },
    body: {
      en: "Built with three.js on top of the ordinary site. Everything here also exists as a page you can read without any of it.",
      tr: "Sıradan sitenin üstüne three.js ile kuruldu. Buradaki her şey, hiçbirine ihtiyaç duymadan okuyabileceğin bir sayfa olarak da var.",
    },
  },
  {
    title: { en: "Nothing invented", tr: "Uydurma yok" },
    body: {
      en: "No client names, no awards, no team size, no revenue. Where a number is not confirmed, this site leaves the space empty.",
      tr: "Müşteri adı, ödül, ekip büyüklüğü, ciro yok. Doğrulanmamış bir sayı varsa, bu site orayı boş bırakır.",
    },
  },
];

const ARCHIVE_DISPLAYS: Display[] = ARCHIVE_NOTES.map((note, index) => {
  const side = index % 2 === 0 ? -1 : 1;
  const along = 46 + Math.floor(index / 2) * 11;
  return {
    id: `archive-${index}`,
    zone: "archive" as const,
    form: "kiosk" as const,
    at: [side * 8.6, 1.35, along],
    turn: side === -1 ? Math.PI / 2 : -Math.PI / 2,
    size: [1.7, 1.15],
    subject: { kind: "note" as const, ...note },
  };
});

/* ------------------------------------------------------------------- hub */

const HUB_DISPLAYS: Display[] = [
  {
    id: "hub-shipped",
    zone: "hub",
    form: "vertical",
    at: [14.0, 3.0, 32.6],
    turn: -Math.PI / 2 - 0.22,
    size: [5.4, 2.6],
    subject: { kind: "note", title: { en: "Shipped", tr: "Yayında" }, body: {
      en: "Two live products. Through the gate.",
      tr: "İki canlı ürün. Kapıdan geç.",
    } },
  },
  {
    id: "hub-boards",
    zone: "hub",
    form: "vertical",
    at: [16.4, 3.2, 27.6],
    turn: -Math.PI / 2 - 0.12,
    size: [5.4, 2.6],
    subject: { kind: "note", title: { en: "The hall of screens", tr: "Ekranlar koridoru" }, body: {
      en: "DP Pano, off the east side of the shipped hall.",
      tr: "DP Pano, yayın holünün doğu tarafında.",
    } },
  },
  {
    id: "hub-labs",
    zone: "hub",
    form: "vertical",
    at: [18.8, 3.4, 22.6],
    turn: -Math.PI / 2,
    size: [5.4, 2.6],
    subject: { kind: "note", title: { en: "Archon Labs", tr: "Archon Labs" }, body: {
      en: "Ten concept products, running. East.",
      tr: "On konsept ürün, çalışır hâlde. Doğu.",
    } },
  },
  {
    id: "hub-systems",
    zone: "hub",
    form: "vertical",
    at: [21.2, 3.6, 17.6],
    turn: -Math.PI / 2 + 0.1,
    size: [5.4, 2.6],
    subject: { kind: "note", title: { en: "Systems", tr: "Sistemler" }, body: {
      en: "What runs behind an interface. West.",
      tr: "Bir arayüzün arkasında ne çalışır. Batı.",
    } },
  },
  /* What the company does, at the size of a building's face: on the east
     edge of the plaza, high, read from the whole hub. */
  {
    id: "hub-services",
    zone: "hub",
    form: "wall",
    at: [28.6, 12.6, 6],
    turn: -Math.PI / 2,
    size: [9.6, 5.6],
    subject: { kind: "services" },
  },
];

/* --------------------------------------------------------------- gallery */

/**
 * What is up there.
 *
 * Two panels, and both of them say something that can only be said from the
 * walkway. Putting a project up here would make the climb a detour on the way
 * to work the visitor could have reached on the flat; putting the building's
 * own argument up here makes the climb the reason.
 */
const GALLERY_DISPLAYS: Display[] = [
  {
    id: "gallery-mark",
    zone: "gallery",
    form: "wall",
    at: [0, GALLERY + 3.1, -27.9],
    turn: 0,
    size: [9.2, 3.4],
    subject: { kind: "note", title: { en: "The mark", tr: "Amblem" }, body: {
      en: "Look back down the plaza. The gate is the Archon mark at full size: three bars, each shorter than the one above it, held in the air over the way in. Every product on this site is built the same way — a few plain parts, set in order, carrying more than their size.",
      tr: "Meydana geri bak. Kapı, Archon amblemi — gerçek ölçeğinde: her biri üstündekinden kısa üç çubuk, girişin üzerinde havada duruyor. Bu sitedeki her ürün de aynı şekilde kurulu — birkaç sade parça, sırayla dizilmiş, boyutundan fazlasını taşıyor.",
    } },
  },
  {
    id: "gallery-plan",
    zone: "gallery",
    form: "wall",
    at: [-22.6, GALLERY + 2.6, -6],
    turn: Math.PI / 2,
    size: [7.4, 3],
    subject: { kind: "note", title: { en: "The plan", tr: "Plan" }, body: {
      en: "One hub, four districts on its axes, and this walkway above them. Shipped work is north, Labs east, Systems west, and the archive is behind where you arrived — which is why most people never turn round.",
      tr: "Bir merkez, eksenleri üzerinde dört bölge ve üstlerinde bu geçit. Yayındaki işler kuzeyde, Labs doğuda, Sistemler batıda; arşiv ise geldiğin yerin arkasında — çoğu kişinin arkasına dönmemesinin sebebi bu.",
    } },
  },
];

export const DISPLAYS: Display[] = [
  ...HUB_DISPLAYS,
  ...GALLERY_DISPLAYS,
  ...BOARDS_DISPLAYS,
  ...SHIPPED_DISPLAYS,
  ...LABS_DISPLAYS,
  ...SYSTEMS_DISPLAYS,
  ...ARCHIVE_DISPLAYS,
];

/* ---------------------------------------------------------------- walking */

/** Where the visitor arrives, and which way they face. */
export const SPAWN: { at: [number, number, number]; yaw: number } = {
  at: [0, EYE, 24],
  yaw: 0,
};

/**
 * The walls.
 *
 * This list is drawn *and* collided against. Keeping one array for both is the
 * only way a world stays honest: a wall you can see through is a bug and a
 * wall you cannot see but walk into is a worse one, and two lists drift the
 * first time somebody moves a room.
 *
 * Height matters here as architecture, not just as an obstacle — these are the
 * rooms, and the difference between a nine-metre hall and a five-metre one is
 * most of what tells the visitor which district they are standing in.
 */
export const WALLS: Box[] = [
  /* Hub — a square room, open on all four axes. Every district is reached from
     here and every one of them is visible from the middle of the floor, which
     is the whole job of a hub. */
  ...room(-30, -30, 30, 34, CORRIDOR, 14, { north: true, south: true, east: true, west: true }),

  /* Shipped. The tallest room in the world, because what is in it is the
     argument the whole building makes. */
  ...room(-30, -74, 30, -22, CORRIDOR, 17, { south: true, east: true }, { east: -66 }),
  { at: [-25.5, 5.5, -44], size: [7, 11, 30] },
  { at: [25.5, 5.5, -44], size: [7, 11, 30] },

  /* The hall of screens. Long, low and lined on both sides — the room is the
     product's argument before a word of it is read. */
  ...room(34, -78, 84, -54, CORRIDOR, 11, { west: true }),

  /* The passage from Shipped into it. Written out rather than taken from
     `corridor()`, which only ever builds one on an axis through the origin. */
  { at: [32, 4, -71.8], size: [5.6, 8, 1.6] },
  { at: [32, 4, -60.2], size: [5.6, 8, 1.6] },

  /* Labs — a long low gallery, deliberately tighter than Shipped. */
  ...room(34, -26, 84, 26, CORRIDOR, 9, { west: true }),
  { at: [45.4, 4.5, -18], size: [2.4, 9, 16] },
  { at: [45.4, 4.5, 18], size: [2.4, 9, 16] },
  { at: [70.6, 4.5, 0], size: [2.4, 9, 46] },

  /* Systems — one tall chamber facing a single wall of panels. */
  ...room(-84, -24, -34, 24, CORRIDOR, 13, { east: true }),
  { at: [-73.4, 6.5, 0], size: [2.6, 13, 40] },

  /* Archive — low, narrow, and off the axis. */
  ...room(-24, 40, 24, 82, CORRIDOR, 5.5, { north: true }),
  { at: [-12, 2.75, 62], size: [2.4, 5.5, 36] },
  { at: [12, 2.75, 62], size: [2.4, 5.5, 36] },

  /* The corridors between them. */
  ...corridor("z", -30, -22, CORRIDOR, 8),
  ...corridor("z", 34, 40, CORRIDOR, 6),
  ...corridor("x", 30, 34, CORRIDOR, 8),
  ...corridor("x", -34, -30, CORRIDOR, 8),
];

/**
 * Things that block the way but are drawn by something else.
 *
 * The gate legs are the only entries, and they are here because the gate is a
 * piece of architecture with its own component and its own material story —
 * but it is still twenty metres of stone you cannot walk through.
 */
export const OBSTACLES: Box[] = [
  { at: [-7.8, 5, 0], size: [4.9, 10, 7.2] },
  { at: [7.8, 5, 0], size: [4.9, 10, 7.2] },
];


/**
 * Four walls round a rectangle, each split to leave a doorway on the axis.
 *
 * Written as a function because a room is a room, and doing it by hand five
 * times is five chances to leave a gap somebody walks through into the void.
 */
function room(
  minX: number,
  minZ: number,
  maxX: number,
  maxZ: number,
  gap: number,
  height: number,
  open: { north?: boolean; south?: boolean; east?: boolean; west?: boolean } = {},
  /**
   * Where each opening sits, when the middle of the wall is the wrong place.
   *
   * The shipped hall has a bay of standing screens either side of its axis, and
   * a doorway punched halfway along its east wall came out behind one of them:
   * an opening you can see through and cannot walk to. The hall beyond it is
   * reached past the bays instead, which is also the better arrival — you come
   * to it having already walked the length of the work it belongs beside.
   */
  doorAt: { north?: number; south?: number; east?: number; west?: number } = {},
): Box[] {
  const t = 1.6;
  const midX = (minX + maxX) / 2;
  const midZ = (minZ + maxZ) / 2;
  const half = gap / 2;
  const boxes: Box[] = [];

  const run = (
    axis: "x" | "z",
    fixed: number,
    from: number,
    to: number,
    opened: boolean,
    centre: number,
  ) => {
    const segments = opened
      ? [
          [from, centre - half],
          [centre + half, to],
        ]
      : [[from, to]];
    for (const [a, b] of segments) {
      if (b! - a! <= 0.01) continue;
      const mid = (a! + b!) / 2;
      const span = b! - a!;
      boxes.push(
        axis === "x"
          ? { at: [mid, height / 2, fixed], size: [span, height, t] }
          : { at: [fixed, height / 2, mid], size: [t, height, span] },
      );
    }
  };

  run("x", minZ, minX, maxX, Boolean(open.north), doorAt.north ?? midX);
  run("x", maxZ, minX, maxX, Boolean(open.south), doorAt.south ?? midX);
  run("z", minX, minZ, maxZ, Boolean(open.west), doorAt.west ?? midZ);
  run("z", maxX, minZ, maxZ, Boolean(open.east), doorAt.east ?? midZ);

  return boxes;
}

/** The two walls that turn a gap between rooms into a passage. */
function corridor(
  axis: "x" | "z",
  from: number,
  to: number,
  width: number,
  height: number,
): Box[] {
  const t = 1.6;
  const mid = (from + to) / 2;
  const span = Math.abs(to - from) + 0.4;
  const offset = width / 2 + t / 2;
  return [-1, 1].map((side) =>
    axis === "z"
      ? { at: [offset * side, height / 2, mid], size: [t, height, span] }
      : { at: [mid, height / 2, offset * side], size: [span, height, t] },
  );
}

/* ---------------------------------------------------------------- levels */

/**
 * The upper level.
 *
 * A world on one floor is a floor plan you happen to be standing on. The
 * gallery is the answer: a walkway nine metres above the hub, running down
 * both flanks of the plaza and crossing above the gate, reached by a single
 * ramp that climbs the western aisle behind the colonnade.
 *
 * It earns its place three times over. From the floor it is a landmark — you
 * arrive, you look up, and there is somewhere you have not been. Climbing it
 * is the only part of the world that is not on the four axes, so finding it is
 * something the visitor does rather than something they are shown. And from
 * the top the gate below finally reads as what it is: seen from above, the three
 * bars are the Archon mark, which is a thing this world can say and
 * a page cannot.
 */

/** Clear width of the walkway and the ramp that climbs to it. */
const DECK = 4;
/** Centre line of each flank. Between the colonnade and the hub wall. */
const FLANK = 24.5;
/** The ramp climbs the western aisle, from the south end towards the gate. */
const RAMP = { from: 31, to: 11, x: -FLANK };

/**
 * A walkable surface above the ground plane.
 *
 * `rise` makes it a ramp: the height runs from `height` at `from` to
 * `height + rise` at `to`, along z. Everything else is flat.
 */
export type Platform = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  ramp?: { from: number; to: number; rise: number };
};

export const PLATFORMS: Platform[] = [
  /* The climb. */
  {
    minX: RAMP.x - DECK / 2,
    maxX: RAMP.x + DECK / 2,
    minZ: Math.min(RAMP.from, RAMP.to),
    maxZ: Math.max(RAMP.from, RAMP.to),
    height: 0,
    ramp: { from: RAMP.from, to: RAMP.to, rise: GALLERY },
  },
  /* The two flanks, and the crossing above the gate that joins them. */
  { minX: -FLANK - DECK / 2, maxX: -FLANK + DECK / 2, minZ: -26, maxZ: 11.4, height: GALLERY },
  { minX: FLANK - DECK / 2, maxX: FLANK + DECK / 2, minZ: -26, maxZ: 30, height: GALLERY },
  { minX: -FLANK, maxX: FLANK, minZ: -26 - DECK / 2, maxZ: -26 + DECK / 2, height: GALLERY },
];

/** How high a step the visitor can take without a ramp under them. */
const STEP = 0.7;

/**
 * The height of the floor under a point.
 *
 * `from` is where the visitor already is, and it is what stops the gallery
 * being a ceiling that teleports anybody who walks beneath it: a surface only
 * counts as the floor if it is reachable from where they are standing, which
 * on the way up means the ramp and on the way down means the ramp again.
 */
export function floorAt(x: number, z: number, from = 0): number {
  let best = 0;
  for (const platform of PLATFORMS) {
    if (x < platform.minX || x > platform.maxX) continue;
    if (z < platform.minZ || z > platform.maxZ) continue;
    const height = platform.ramp
      ? platform.height +
        platform.ramp.rise *
          clamp01((z - platform.ramp.from) / (platform.ramp.to - platform.ramp.from))
      : platform.height;
    if (height > from + STEP) continue;
    if (height > best) best = height;
  }
  return best;
}

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

/**
 * The walkway's own structure, drawn and collided against like everything else.
 *
 * The decks are boxes the visitor stands on rather than walks into, and they
 * sit below the feet of anybody up there and above the head of anybody below,
 * so the height band in the collider resolves both cases without a special
 * case. The parapets are what actually stop a fall.
 */
const PARAPET = 1.05;

/* Where the climb can be stepped onto, measured from the foot. Everything
   above it is guarded. */
const RAMP_ENTRY = 4;

const RAMP_PARAPET: Box[] = Array.from({ length: 4 }, (_, i) => {
  const span = (Math.abs(RAMP.from - RAMP.to) - RAMP_ENTRY) / 4;
  const near = RAMP.from - RAMP_ENTRY - i * span;
  const mid = near - span / 2;
  const height = GALLERY * ((mid - RAMP.from) / (RAMP.to - RAMP.from));
  return {
    at: [RAMP.x + DECK / 2, height + PARAPET / 2, mid] as [number, number, number],
    size: [0.24, PARAPET, span] as [number, number, number],
  };
});

/* Split because they are different things.
   A deck is walked on and takes the floor's material; a parapet is walked
   into and takes the wall's. Drawn from one list they all came out the colour
   of a wall, which turned the walkway into a black void at the exact moment
   the visitor arrived at the top of the climb. */
export const GALLERY_DECKS: Box[] = [
  /* The ramp is not among them: it is a slope, so it is drawn as one tilted
     slab and never collided against — `floorAt` already carries the visitor up
     it, and a box lying flat at the ramp's mid-height would be a slab hanging
     in the aisle. */
  { at: [-FLANK, GALLERY - 0.15, (-26 + 11.4) / 2], size: [DECK, 0.3, 37.4] },
  { at: [FLANK, GALLERY - 0.15, (-26 + 30) / 2], size: [DECK, 0.3, 56] },
  { at: [0, GALLERY - 0.15, -26], size: [2 * FLANK, 0.3, DECK] },

];

export const GALLERY_RAILS: Box[] = [
  /* Parapets, inboard edge — the side that opens onto the drop. */
  { at: [-FLANK + DECK / 2, GALLERY + PARAPET / 2, (-26 + 11.4) / 2], size: [0.24, PARAPET, 37.4] },
  { at: [FLANK - DECK / 2, GALLERY + PARAPET / 2, (-26 + 30) / 2], size: [0.24, PARAPET, 56] },
  { at: [0, GALLERY + PARAPET / 2, -26 + DECK / 2], size: [2 * FLANK - DECK, PARAPET, 0.24] },
  { at: [0, GALLERY + PARAPET / 2, -26 - DECK / 2], size: [2 * FLANK - DECK, PARAPET, 0.24] },

  /* Ends, so the walkway stops rather than running out. */
  { at: [-FLANK, GALLERY + PARAPET / 2, 11.4], size: [DECK, PARAPET, 0.24] },
  { at: [FLANK, GALLERY + PARAPET / 2, 30], size: [DECK, PARAPET, 0.24] },

  /* The parapet down the open side of the ramp.
     Stepped rather than one tall slab, so it stands a constant height above
     the slope it guards instead of being a ten-metre wall in the aisle — and
     so the bottom of the climb can be left open. That opening is the way in:
     a rail running the full length would seal the lane from the floor and
     make the walkway something you can see and never reach, which is the
     worst thing a landmark can be. */
  ...RAMP_PARAPET,
];

export const GALLERY_STRUCTURE: Box[] = [...GALLERY_DECKS, ...GALLERY_RAILS];

/* Declared here rather than beside the walls: the gallery is part of what the
   visitor can walk into, and a list that names it has to come after it. */
export const COLLIDERS: Box[] = [...WALLS, ...OBSTACLES, ...GALLERY_STRUCTURE];

/** Where the ramp begins, for anything that needs to point at it. */
export const RAMP_FOOT: [number, number, number] = [RAMP.x, 0, RAMP.from];

/** The slope itself, for the component that draws it. */
export const RAMP_RUN = {
  x: RAMP.x,
  width: DECK,
  from: RAMP.from,
  to: RAMP.to,
  rise: GALLERY,
};

/**
 * Where the guided tour stands in each district.
 *
 * A touch device gets these instead of a keyboard: tapping a district moves
 * the camera to its viewpoint and lets the visitor look around from there.
 * They are authored, not derived — a good view of a room is a composition, and
 * the centre of a bounding box is never it.
 */
export const VIEWPOINTS: Record<ZoneId, { at: [number, number, number]; look: [number, number, number] }> = {
  /* Aimed at the gate's opening rather than above it. The view used to climb
     to ten metres, which was fine when there was nothing up there; with the
     walkway crossing overhead it filled the top of the frame with the
     underside of a slab. */
  hub: { at: [0, 5.2, 31], look: [0, 4.2, -16] },
  /* Along the western flank towards the crossing.
     Aimed down the walkway rather than over its edge: pointed at the plaza it
     framed a floor, and a floor seen from ten metres up is just a floor. From
     here the parapet runs away into the frame, the gate stands beside it, and
     the crossing that carries you over the arch is the thing you are walking
     towards. */
  gallery: { at: [-24.5, GALLERY + EYE, 8], look: [-24.5, GALLERY + 0.6, -26] },
  shipped: { at: [0, 5.5, -34], look: [0, 8.5, -72] },
  /* Down the hall, from the passage, with the project wall closing the end. */
  boards: { at: [39, EYE + 1.6, -66], look: [82, 4.6, -66] },
  labs: { at: [58, 3.8, -23], look: [58, 4.2, 24] },
  systems: { at: [-46, 5, 0], look: [-73, 7, 0] },
  archive: { at: [0, 2.6, 49], look: [0, 2.6, 82] },
};

/** Everything the world is built from, for anything that needs the whole list. */
export const WORLD_BOUNDS = { minX: -92, maxX: 92, minZ: -82, maxZ: 90 };
