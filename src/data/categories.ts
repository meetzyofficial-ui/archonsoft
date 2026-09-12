import type { Screen } from "@/data/screens";
import { ERDEN, MEETZY } from "@/data/screens";
import type { Localized } from "@/lib/i18n";

/**
 * The map of what gets built, in the visitor's own words.
 *
 * The eight `DOMAINS` are how the work is organised internally. These thirteen
 * are how somebody arrives asking for it — "I need a marketplace", "I need
 * internal tools" — and the two lists are deliberately different, because a
 * buyer should not have to learn a studio's taxonomy to find themselves in it.
 *
 * Every category resolves to something that can be opened, and says which kind
 * of thing it is before you open it. A shipped product shows a real screen; a
 * concept mounts its running prototype. Nothing here resolves to a paragraph.
 */

export type CategoryGroup = "build" | "sell" | "operate" | "know";

export type Category = {
  id: string;
  group: CategoryGroup;
  title: Localized;
  /** One line, in the terms someone would use to ask for it. */
  precis: Localized;
} & (
  | {
      /** Real, live work. The screen is a capture of the shipped product. */
      kind: "shipped";
      slug: string;
      name: string;
      screen: Screen;
    }
  | {
      /** A concept. The named view of its prototype is mounted live. */
      kind: "concept";
      slug: string;
      name: string;
      view: string;
    }
);

export const CATEGORY_GROUPS: { id: CategoryGroup; title: Localized }[] = [
  { id: "build", title: { en: "Build", tr: "Kur" } },
  { id: "sell", title: { en: "Sell", tr: "Sat" } },
  { id: "operate", title: { en: "Operate", tr: "Yürüt" } },
  { id: "know", title: { en: "Know", tr: "Bil" } },
];

export const CATEGORIES: Category[] = [
  /* ------------------------------------------------------------------ build */
  {
    id: "products",
    group: "build",
    title: { en: "Products", tr: "Ürünler" },
    precis: {
      en: "An idea, taken all the way to something people open.",
      tr: "Bir fikri, insanların açtığı bir şeye kadar götürmek.",
    },
    kind: "shipped",
    slug: "meetzy",
    name: "Meetzy",
    screen: MEETZY.mood!,
  },
  {
    id: "mobile",
    group: "build",
    title: { en: "Mobile apps", tr: "Mobil uygulamalar" },
    precis: {
      en: "On a phone, in a pocket, working wherever the person is.",
      tr: "Telefonda, cepte; kişi neredeyse orada çalışan.",
    },
    kind: "shipped",
    slug: "meetzy",
    name: "Meetzy",
    screen: MEETZY.map!,
  },
  {
    id: "web",
    group: "build",
    title: { en: "Web products", tr: "Web ürünleri" },
    precis: {
      en: "The application that runs in a browser and holds the accounts.",
      tr: "Tarayıcıda çalışan ve hesapları tutan uygulama.",
    },
    kind: "shipped",
    slug: "erden",
    name: "Erden Davetiye",
    screen: ERDEN.home!,
  },
  {
    id: "saas",
    group: "build",
    title: { en: "SaaS", tr: "SaaS" },
    precis: {
      en: "A product other companies pay to use every month, and everything that has to work for them to keep paying.",
      tr: "Başka şirketlerin her ay ödeyerek kullandığı bir ürün — ve ödemeye devam etmeleri için çalışması gereken her şey.",
    },
    kind: "concept",
    slug: "olcek",
    name: "Ölçek",
    view: "overview",
  },
  {
    id: "custom",
    group: "build",
    title: { en: "Custom software", tr: "Özel yazılım" },
    precis: {
      en: "You have tried the off-the-shelf tools, and the part they cannot do is the part your business runs on.",
      tr: "Hazır araçları denediniz ve yapamadıkları kısım, tam da işinizin üzerinde döndüğü kısım.",
    },
    kind: "concept",
    slug: "esik",
    name: "Eşik",
    view: "projects",
  },

  /* ------------------------------------------------------------------- sell */
  {
    id: "ecommerce",
    group: "sell",
    title: { en: "E-commerce", tr: "E-ticaret" },
    precis: {
      en: "A storefront and the admin a shop is actually run from.",
      tr: "Bir vitrin ve dükkânın işinin gerçekten yürütüldüğü panel.",
    },
    kind: "shipped",
    slug: "erden",
    name: "Erden Davetiye",
    screen: ERDEN.admin!,
  },
  {
    id: "marketplaces",
    group: "sell",
    title: { en: "Marketplaces", tr: "Pazar yerleri" },
    precis: {
      en: "Other people sell on your platform, and at the end of the month everybody has to be paid the right amount.",
      tr: "Başkaları sizin platformunuzda satıyor ve ay sonunda herkese doğru tutarın ödenmesi gerekiyor.",
    },
    kind: "concept",
    slug: "kervan",
    name: "Kervan",
    view: "orders",
  },

  /* ---------------------------------------------------------------- operate */
  {
    id: "business-systems",
    group: "operate",
    title: { en: "Business systems", tr: "İş sistemleri" },
    precis: {
      en: "Customers, work, invoicing and permissions, in one model instead of four tools.",
      tr: "Müşteri, iş, faturalama ve yetkiler; dört araç yerine tek modelde.",
    },
    kind: "concept",
    slug: "divan",
    name: "Divan",
    view: "customers",
  },
  {
    id: "internal-tools",
    group: "operate",
    title: { en: "Internal tools", tr: "İç araçlar" },
    precis: {
      en: "The spreadsheet and the group chat, written down properly.",
      tr: "Tablo ve grup sohbetinin düzgünce yazıya dökülmüş hâli.",
    },
    kind: "concept",
    slug: "atolye",
    name: "Atölye",
    view: "jobs",
  },
  {
    id: "automation",
    group: "operate",
    title: { en: "Automation", tr: "Otomasyon" },
    precis: {
      en: "The routine case stops needing a person, and says so in an audit trail.",
      tr: "Rutin iş insana ihtiyaç duymayı bırakıyor ve bunu denetim izinde söylüyor.",
    },
    kind: "concept",
    slug: "vardiya",
    name: "Vardiya",
    view: "rules",
  },
  {
    id: "integrations",
    group: "operate",
    title: { en: "Integrations", tr: "Entegrasyonlar" },
    precis: {
      en: "Your accounting, your cargo firm, your payment provider — talking to each other instead of to a person copying between them.",
      tr: "Muhasebeniz, kargo firmanız, ödeme sağlayıcınız — aralarında kopyala yapıştır yapan bir insan yerine birbirleriyle konuşuyor.",
    },
    kind: "concept",
    slug: "ulak",
    name: "Ulak",
    view: "sources",
  },

  /* ------------------------------------------------------------------- know */
  {
    id: "ai",
    group: "know",
    title: { en: "AI", tr: "Yapay zekâ" },
    precis: {
      en: "A model that answers from your own records and hands over to a person the moment it cannot.",
      tr: "Kendi kayıtlarınızdan cevap veren ve veremediği anda bir insana devreden bir model.",
    },
    kind: "concept",
    slug: "ulak",
    name: "Ulak",
    view: "assistant",
  },
  {
    id: "data",
    group: "know",
    title: { en: "Data and analytics", tr: "Veri ve analitik" },
    precis: {
      en: "Knowing where people stop, which ones come back, and what a change actually did.",
      tr: "İnsanların nerede durduğunu, hangilerinin geri döndüğünü ve bir değişikliğin gerçekte ne yaptığını bilmek.",
    },
    kind: "concept",
    slug: "olcek",
    name: "Ölçek",
    view: "funnel",
  },
];

export const getCategory = (id: string): Category | undefined =>
  CATEGORIES.find((category) => category.id === id);
