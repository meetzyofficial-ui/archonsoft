import type { StaticImageData } from "next/image";
import type { Localized, LocalizedList } from "@/lib/i18n";
import { PROJECTS, type CaseSection, type Fact, type Project } from "@/data/projects";
import { DPPANO, ERDEN, MEETZY, type Screen } from "@/data/screens";

import worldGate from "@/assets/work/world/01-gate.jpg";
import worldMeetzy from "@/assets/work/world/02-meetzy-station.jpg";
import worldDpPano from "@/assets/work/world/03-dppano-hall.jpg";
import worldErden from "@/assets/work/world/04-erden-station.jpg";

/**
 * The work, as one model.
 *
 * Everything the projects index, the home page and a case study need is read
 * from here, so no surface has to know how a project happens to be stored.
 * Three of the four entries are adapted from `projects.ts`, which stays the
 * source of truth for their verified facts and chapters; nothing below adds a
 * claim to them. The fourth is Archon Soft World — this site's own world —
 * and every line about it is something the repository itself shows.
 *
 * Rules the model enforces by shape rather than by comment:
 *
 * - `title` is the product's real name. Never a codename.
 * - Optional fields are absent, not empty. A case study renders a section
 *   only when there is something true to put in it — no year, no result and
 *   no technology list unless someone stated it or the code shows it.
 */

export type MediaKind = "phone" | "screen" | "scene";

export type ShowcaseMedia = {
  image: StaticImageData;
  alt: Localized;
  kind: MediaKind;
  /** Only on captures whose rows were pixelated. */
  redacted?: boolean;
};

export type ShowcaseChapter = {
  index: string;
  title: Localized;
  body: LocalizedList;
};

export type ShowcaseProject = {
  slug: string;
  title: string;
  /** Upper-case discipline line, e.g. MOBILE · SOCIAL PRODUCT. */
  category: Localized;
  /** One sentence: what it is. */
  tagline: Localized;
  /** Two sentences at most: what it is, what was built, why it matters. */
  shortDescription: Localized;
  /** The case study's standfirst. */
  description: Localized;
  /** The sentence the whole case turns on. */
  statement: Localized;
  status: "live";
  year?: string;
  role: Localized;
  platform: Localized;
  services: Localized[];
  /** Tags under the title in the index. */
  tags: Localized[];
  /** The frame the project is presented in: first is the lead. */
  hero: ShowcaseMedia[];
  gallery: ShowcaseMedia[];
  /** Extra captures placed between chapters in the case study. */
  interludes: ShowcaseMedia[];
  facts: Fact[];
  idea?: ShowcaseChapter;
  product: ShowcaseChapter[];
  result?: ShowcaseChapter;
  built?: { title: Localized; areas: Localized[]; note: Localized; media?: ShowcaseMedia };
  technologies?: Fact[];
  scale?: { label: Localized; value: string }[];
  link?: { label: string; href: string };
  demo?: { label: Localized; href: string; note: Localized };
  /** Opens Archon World rather than leaving the site. */
  world?: boolean;
  /** The product's own colour — only ever a glow inside its own frame. */
  accent: string;
};

const media = (screen: Screen): ShowcaseMedia => ({
  image: screen.image,
  alt: screen.caption,
  kind: screen.image.width > screen.image.height ? "screen" : "phone",
  redacted: screen.redacted,
});

const chapter = (section: CaseSection): ShowcaseChapter => ({
  index: section.index,
  title: section.title,
  body: section.body,
});

/** The first chapter is always the problem and the last the outcome. */
function chapters(project: Project) {
  const [first, ...rest] = project.sections;
  const last = rest.length > 1 ? rest[rest.length - 1] : undefined;
  const middle = last ? rest.slice(0, -1) : rest;
  return {
    idea: first ? chapter(first) : undefined,
    product: middle.map(chapter),
    result: last ? chapter(last) : undefined,
  };
}

function fromProject(
  project: Project,
  extra: Pick<ShowcaseProject, "category" | "tagline" | "shortDescription" | "services" | "tags"> & {
    hero: ShowcaseMedia[];
  },
): ShowcaseProject {
  return {
    slug: project.slug,
    title: project.name,
    category: extra.category,
    tagline: extra.tagline,
    shortDescription: extra.shortDescription,
    description: project.standfirst,
    statement: project.statement,
    status: "live",
    role: project.role,
    platform: project.platform,
    services: extra.services,
    tags: extra.tags,
    hero: extra.hero,
    gallery: project.screens.map(media),
    interludes: project.detail.map(media),
    facts: project.facts,
    ...chapters(project),
    built: project.systemAreas
      ? {
          title: project.systemAreas.title,
          areas: project.systemAreas.areas,
          note: project.systemAreas.note,
          media: media(project.systemAreas.screen),
        }
      : undefined,
    technologies: project.stack,
    scale: project.scale,
    link: project.link,
    demo: project.demo,
    accent: project.accent,
  };
}

const byslug = (slug: string) => PROJECTS.find((one) => one.slug === slug)!;

const meetzy = fromProject(byslug("meetzy"), {
  category: { en: "Mobile · Social product", tr: "Mobil · Sosyal ürün" },
  tagline: {
    en: "A social planning app for finding people to go to things with.",
    tr: "Birlikte gidecek insanları bulduran sosyal planlama uygulaması.",
  },
  shortDescription: {
    en: "The event is the excuse; the product's real job is the match. Designed and built end to end, live for about three months, with around 2,000 people signed up.",
    tr: "Etkinlik bahane, ürünün asıl işi eşleştirme. Uçtan uca tasarlanıp geliştirildi; yaklaşık üç aydır canlı ve 2.000 civarında kişi kaydoldu.",
  },
  services: [
    { en: "Product decisions", tr: "Ürün kararları" },
    { en: "Interface design", tr: "Arayüz tasarımı" },
    { en: "Mobile client", tr: "Mobil istemci" },
    { en: "Server & data", tr: "Sunucu ve veri" },
    { en: "Authentication", tr: "Kimlik doğrulama" },
    { en: "Notifications", tr: "Bildirimler" },
  ],
  tags: [
    { en: "Mobile", tr: "Mobil" },
    { en: "Product", tr: "Ürün" },
    { en: "Platform", tr: "Platform" },
  ],
  hero: [MEETZY.problem!, MEETZY.plan!, MEETZY.real!].map(media),
});

const dppano = fromProject(byslug("dppano"), {
  category: { en: "Web platform · Education technology", tr: "Web platformu · Eğitim teknolojisi" },
  tagline: {
    en: "One live board for every screen in a school, run from a single panel.",
    tr: "Okuldaki tüm ekranları tek panelden yöneten canlı okul panosu.",
  },
  shortDescription: {
    en: "Idle smart boards and corridor screens become one live school board: twenty-six modules, each screen in its own layout, updated within seconds from one panel.",
    tr: "Boş duran akıllı tahtalar ve koridor ekranları tek bir canlı okul panosuna dönüşüyor: 26 modül, her ekran kendi düzeniyle, tek panelden saniyeler içinde güncelleniyor.",
  },
  services: [
    { en: "Product", tr: "Ürün" },
    { en: "Design", tr: "Tasarım" },
    { en: "Architecture", tr: "Mimari" },
    { en: "Engineering", tr: "Geliştirme" },
    { en: "Deployment", tr: "Dağıtım" },
  ],
  tags: [
    { en: "Web", tr: "Web" },
    { en: "Real time", tr: "Gerçek zamanlı" },
    { en: "Scheduling", tr: "Çizelgeleme" },
  ],
  hero: [DPPANO.board!, DPPANO.staffroom!, DPPANO.timetable!].map(media),
});

const erden = fromProject(byslug("erden"), {
  category: { en: "Web · Commerce system", tr: "Web · Ticaret sistemi" },
  tagline: {
    en: "A wedding invitation atelier, rebuilt as a storefront and the system behind it.",
    tr: "Bir davetiye atölyesi; vitrini ve arkasındaki yönetim sistemiyle yeniden kuruldu.",
  },
  shortDescription: {
    en: "A storefront that lets a couple choose with confidence, and the admin the atelier runs on — orders, designs, products, coupons, customers, reviews and analytics.",
    tr: "Çiftin gönül rahatlığıyla seçtiği bir vitrin ve atölyenin işini üzerinden yürüttüğü yönetim paneli — sipariş, tasarım, ürün, kupon, müşteri, yorum ve analitik.",
  },
  services: [
    { en: "Product", tr: "Ürün" },
    { en: "Storefront design", tr: "Vitrin tasarımı" },
    { en: "Admin system", tr: "Yönetim paneli" },
    { en: "Engineering", tr: "Geliştirme" },
  ],
  tags: [
    { en: "E-commerce", tr: "E-ticaret" },
    { en: "Admin", tr: "Yönetim" },
    { en: "Mobile first", tr: "Önce mobil" },
  ],
  hero: [ERDEN.home!, ERDEN.products!, ERDEN.admin!].map(media),
});

const scene = (image: StaticImageData, alt: Localized): ShowcaseMedia => ({ image, alt, kind: "scene" });

/**
 * Archon Soft World.
 *
 * The one project on this list whose evidence is the site itself, so it is
 * written only from what the code in this repository does: the stills are
 * frames rendered by the world, unretouched, with its interface hidden; the
 * technology is what `package.json` installs; every feature named is one a
 * visitor can go and use.
 */
const world: ShowcaseProject = {
  slug: "archon-soft-world",
  title: "Archon Soft World",
  category: { en: "WebGL · Interactive 3D", tr: "WebGL · Etkileşimli 3D" },
  tagline: {
    en: "An interactive 3D studio you walk through in the browser.",
    tr: "Tarayıcıda içinde yürüyebildiğin etkileşimli 3D şirket deneyimi.",
  },
  shortDescription: {
    en: "The studio's work, team and services as a place: stations for every shipped product, guides who explain them and offices you can brief — running in the browser, on a phone as well as a desktop.",
    tr: "Stüdyonun işleri, ekibi ve hizmetleri bir mekân olarak: her canlı ürün için bir istasyon, onları anlatan rehberler ve brief bırakabileceğin ofisler — masaüstünde de telefonda da tarayıcıda çalışıyor.",
  },
  description: {
    en: "Archon Soft World is the same site as this one, built as somewhere to walk. A robot explorer crosses a campus of islands; each shipped product has its own station hung with its real screens, a guide introduces it, and each department has an office where a visitor can leave a brief. It is written in three.js on top of the ordinary site and ships to phones, where it adapts its quality to the device.",
    tr: "Archon Soft World, bu sitenin içinde yürünebilen hâli. Bir robot kâşif adalardan oluşan bir kampüsü dolaşıyor; her canlı ürünün gerçek ekranlarıyla asılı kendi istasyonu var, bir rehber onu tanıtıyor ve her departmanın ziyaretçinin brief bırakabildiği bir ofisi var. Sıradan sitenin üzerine three.js ile yazıldı ve telefonlarda da çalışıyor; kalitesini cihaza göre ayarlıyor.",
  },
  statement: {
    en: "A portfolio you read once. A place you come back to.",
    tr: "Portfolyo bir kez okunur. Bir mekâna geri dönülür.",
  },
  status: "live",
  year: "2026",
  role: { en: "Concept, 3D, design and engineering", tr: "Konsept, 3D, tasarım ve mühendislik" },
  platform: { en: "Browser — desktop and mobile", tr: "Tarayıcı — masaüstü ve mobil" },
  services: [
    { en: "Creative direction", tr: "Kreatif yön" },
    { en: "Real-time 3D", tr: "Gerçek zamanlı 3D" },
    { en: "Interaction design", tr: "Etkileşim tasarımı" },
    { en: "Engineering", tr: "Mühendislik" },
    { en: "Performance", tr: "Performans" },
  ],
  tags: [
    { en: "WebGL", tr: "WebGL" },
    { en: "3D", tr: "3D" },
    { en: "Interactive", tr: "Etkileşimli" },
  ],
  hero: [
    scene(worldGate, { en: "The Gate — the robot explorer on the axis", tr: "Kapı — eksendeki robot kâşif" }),
    scene(worldMeetzy, { en: "Meetzy's station, hung with its real screens", tr: "Gerçek ekranlarıyla Meetzy istasyonu" }),
    scene(worldDpPano, { en: "The DP Pano hall", tr: "DP Pano salonu" }),
  ],
  gallery: [
    scene(worldGate, { en: "The Gate — the robot explorer on the axis", tr: "Kapı — eksendeki robot kâşif" }),
    scene(worldMeetzy, { en: "Meetzy's station and its guide", tr: "Meetzy istasyonu ve rehberi" }),
    scene(worldDpPano, { en: "The DP Pano hall, lit by torches", tr: "Meşalelerle aydınlanan DP Pano salonu" }),
    scene(worldErden, { en: "Erden Davetiye's station", tr: "Erden Davetiye istasyonu" }),
  ],
  interludes: [],
  facts: [
    { label: { en: "Status", tr: "Durum" }, value: { en: "Live", tr: "Canlı" } },
    { label: { en: "Languages", tr: "Diller" }, value: { en: "Turkish and English", tr: "Türkçe ve İngilizce" } },
    { label: { en: "Runs on", tr: "Çalıştığı yer" }, value: { en: "Desktop and phone browsers", tr: "Masaüstü ve telefon tarayıcıları" } },
  ],
  idea: {
    index: "01",
    title: { en: "The idea", tr: "Fikir" },
    body: {
      en: [
        "A studio site is read in a minute and forgotten in a day. The same work, set in a place — with a way in, somewhere to stand in front of each product and somebody to ask — is something a visitor explores, and remembers exploring.",
      ],
      tr: [
        "Bir stüdyo sitesi bir dakikada okunur, bir günde unutulur. Aynı işler bir mekâna yerleştirildiğinde — bir girişi, her ürünün önünde durulacak bir yeri ve soru sorulacak birileri olduğunda — ziyaretçi onu keşfeder ve keşfettiğini hatırlar.",
      ],
    },
  },
  product: [
    {
      index: "02",
      title: { en: "The place", tr: "Mekân" },
      body: {
        en: [
          "Islands joined by bridges, each one a part of the studio: a station for every shipped product with its real screens hung in the air, the gallery, the systems island, and department offices along the paths. Six destinations are one key — or one tap — away.",
        ],
        tr: [
          "Köprülerle bağlanan adalar; her biri stüdyonun bir parçası: gerçek ekranları havada asılı duran her canlı ürün için bir istasyon, galeri, sistemler adası ve yollar boyunca departman ofisleri. Altı hedef tek tuş — ya da tek dokunuş — uzakta.",
        ],
      },
    },
    {
      index: "03",
      title: { en: "The people in it", tr: "İçindekiler" },
      body: {
        en: [
          "Guides stand at each product and introduce it in the visitor's language. The team gathers in the lobby. Each office opens a card with its services, and the brief form inside it reaches the studio like any other enquiry.",
        ],
        tr: [
          "Her ürünün başında bir rehber durur ve onu ziyaretçinin dilinde tanıtır. Ekip lobide toplanır. Her ofis hizmetleriyle bir kart açar; içindeki brief formu stüdyoya diğer başvurular gibi ulaşır.",
        ],
      },
    },
    {
      index: "04",
      title: { en: "On a phone", tr: "Telefonda" },
      body: {
        en: [
          "A thumb stick and a jump button replace the keys, and the world chooses its own quality tier for the device: texture sizes are capped for phones, a start the device could not hold comes back in a safe tier, and a lost graphics context rebuilds the scene instead of leaving an empty screen.",
        ],
        tr: [
          "Tuşların yerini bir parmak joystick'i ve zıplama düğmesi alıyor; dünya cihaza göre kendi kalite katmanını seçiyor: telefonlarda texture boyutları sınırlanıyor, cihazın kaldıramadığı bir açılış güvenli katmanda yeniden başlıyor, kaybedilen grafik bağlamı boş ekran bırakmak yerine sahneyi yeniden kuruyor.",
        ],
      },
    },
  ],
  built: {
    title: { en: "What is in it", tr: "İçinde neler var" },
    areas: [
      { en: "Robot explorer, walk and run", tr: "Robot kâşif, yürüme ve koşma" },
      { en: "Teleport to six destinations", tr: "Altı hedefe ışınlanma" },
      { en: "Product stations with real screens", tr: "Gerçek ekranlı ürün istasyonları" },
      { en: "Guides and the lobby team", tr: "Rehberler ve lobi ekibi" },
      { en: "Department offices and brief form", tr: "Departman ofisleri ve brief formu" },
      { en: "Discoveries to find", tr: "Bulunacak keşifler" },
      { en: "Touch joystick and jump", tr: "Dokunmatik joystick ve zıplama" },
      { en: "Adaptive quality, crash-safe start", tr: "Uyarlanır kalite, güvenli açılış" },
    ],
    note: {
      en: "Every item here can be used in the world itself — open it from the button at the top of this page.",
      tr: "Buradaki her şey dünyanın içinde kullanılabilir — bu sayfanın üstündeki düğmeden aç.",
    },
  },
  technologies: [
    { label: { en: "3D", tr: "3D" }, value: { en: "three.js · React Three Fiber · custom GLSL shaders", tr: "three.js · React Three Fiber · özel GLSL shader'lar" } },
    { label: { en: "Application", tr: "Uygulama" }, value: { en: "Next.js · React · TypeScript", tr: "Next.js · React · TypeScript" } },
    { label: { en: "Quality", tr: "Kalite" }, value: { en: "Device tiers, texture caps, context-loss recovery", tr: "Cihaz katmanları, texture sınırları, bağlam kaybı kurtarma" } },
  ],
  world: true,
  accent: "#62D8FF",
};

/** The order is editorial: the product people use, then the place, then the rest. */
export const SHOWCASE: ShowcaseProject[] = [meetzy, world, dppano, erden];

export const getShowcase = (slug: string): ShowcaseProject | undefined =>
  SHOWCASE.find((project) => project.slug === slug);

export const getNextShowcase = (slug: string): ShowcaseProject => {
  const i = SHOWCASE.findIndex((project) => project.slug === slug);
  return SHOWCASE[(i + 1) % SHOWCASE.length]!;
};

export const projectPath = (slug: string) => `/projects/${slug}`;
