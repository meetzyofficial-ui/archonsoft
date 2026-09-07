import type { DiagramKind } from "@/components/system/Diagram";
import { ERDEN, MEETZY, type Screen } from "@/data/screens";
import type { Localized, LocalizedList } from "@/lib/i18n";

export type Capability = {
  index: string;
  title: Localized;
  precis: Localized;
  detail: Localized;
  methods: LocalizedList;
  /** Drawn when there is no shipped screen that shows this stage. */
  diagram: DiagramKind;
  /** A real screen that evidences this stage, where one exists. */
  evidence?: { screen: Screen; project: string };
};

/**
 * Six stages of one job, not six services.
 *
 * The old list read like an agency menu — web, mobile, SaaS. This one reads
 * as the span of actually building a product, which is the whole argument
 * Archon makes: the same person carries it from the first decision to the
 * release. Four of the six are evidenced with a real screen from shipped
 * work; the two that have no face get a drawing instead.
 */
export const CAPABILITIES: Capability[] = [
  {
    index: "01",
    title: { en: "Product", tr: "Ürün" },
    precis: {
      en: "Deciding what the thing actually is.",
      tr: "Şeyin aslında ne olduğuna karar vermek.",
    },
    detail: {
      en: "What it does, who for, and — harder — what it refuses to do. Meetzy opens on mood rather than a category list because of a decision made here, before anything was drawn.",
      tr: "Ne yaptığı, kimin için olduğu ve daha zoru: neyi yapmayı reddettiği. Meetzy'nin kategori listesiyle değil ruh hâliyle açılması, hiçbir şey çizilmeden önce burada verilmiş bir kararın sonucu.",
    },
    methods: {
      en: ["Definition", "Scope", "Prototyping", "Cutting"],
      tr: ["Tanımlama", "Kapsam", "Prototip", "Eleme"],
    },
    diagram: "planes",
    evidence: { screen: MEETZY.mood!, project: "Meetzy" },
  },
  {
    index: "02",
    title: { en: "Interface", tr: "Arayüz" },
    precis: {
      en: "Hierarchy, type and motion doing the explaining.",
      tr: "Açıklamayı hiyerarşi, tipografi ve hareketin yapması.",
    },
    detail: {
      en: "Art direction and interface design with the craft turned up. Erden Davetiye sells something chosen on feeling, so the storefront gives photography room and keeps the interface quiet enough to let the product be the loudest thing on the page.",
      tr: "Sanat yönetimi ve arayüz tasarımı, işçiliği yükseltilmiş hâliyle. Erden Davetiye hisle seçilen bir şey satıyor; bu yüzden vitrin fotoğrafa yer veriyor ve arayüz, sayfadaki en yüksek sesin ürün olmasına izin verecek kadar sessiz kalıyor.",
    },
    methods: {
      en: ["Art direction", "Design systems", "Motion", "Accessibility"],
      tr: ["Sanat yönetimi", "Tasarım sistemleri", "Hareket", "Erişilebilirlik"],
    },
    diagram: "viewport",
    evidence: { screen: ERDEN.home!, project: "Erden Davetiye" },
  },
  {
    index: "03",
    title: { en: "Frontend", tr: "Frontend" },
    precis: {
      en: "Interfaces that stay fast on the connection people actually have.",
      tr: "İnsanların gerçekten sahip olduğu bağlantıda hızlı kalan arayüzler.",
    },
    detail: {
      en: "Dense, real interfaces rather than marketing pages: lists that stay legible at speed, states that never leave you guessing, layouts built for a thumb before a mouse.",
      tr: "Pazarlama sayfası değil, yoğun ve gerçek arayüzler: hızlı kaydırırken okunur kalan listeler, seni tahmin etmeye bırakmayan durumlar, fareden önce başparmağa göre kurulmuş yerleşimler.",
    },
    methods: {
      en: ["Mobile app", "Web app", "Performance", "Offline states"],
      tr: ["Mobil uygulama", "Web uygulaması", "Performans", "Çevrimdışı durumlar"],
    },
    diagram: "device",
    evidence: { screen: MEETZY.nearby!, project: "Meetzy" },
  },
  {
    index: "04",
    title: { en: "Backend & data", tr: "Backend ve veri" },
    precis: {
      en: "Accounts, permissions, state, and the rules that hold.",
      tr: "Hesaplar, izinler, durum ve tutan kurallar.",
    },
    detail: {
      en: "Sign-in, identity, the shape of the data and who is allowed to touch it. A join request that a host has to accept sounds like an interface decision; most of it is server.",
      tr: "Giriş, kimlik, verinin şekli ve kimin ona dokunabileceği. Etkinlik sahibinin onaylaması gereken bir katılma talebi arayüz kararı gibi duruyor; büyük kısmı sunucu.",
    },
    methods: {
      en: ["Authentication", "Data modelling", "Permissions", "Notifications"],
      tr: ["Kimlik doğrulama", "Veri modelleme", "İzinler", "Bildirimler"],
    },
    diagram: "nodes",
  },
  {
    index: "05",
    title: { en: "Admin systems", tr: "Yönetim sistemleri" },
    precis: {
      en: "The half nobody puts in a pitch, and the half that decides everything.",
      tr: "Kimsenin sunuma koymadığı yarı; ve her şeye karar veren yarı.",
    },
    detail: {
      en: "Orders, products, categories, coupons, customers, reviews, analytics. If the people who run the business cannot change it themselves, you did not build them a product — you built yourself a permanent job.",
      tr: "Siparişler, ürünler, kategoriler, kuponlar, müşteriler, yorumlar, analitik. İşi yürüten insanlar bunu kendileri değiştiremiyorsa, onlara ürün yapmamışsındır — kendine ömürlük iş yapmışsındır.",
    },
    methods: {
      en: ["Operations", "Roles", "Content management", "Reporting"],
      tr: ["Operasyon", "Roller", "İçerik yönetimi", "Raporlama"],
    },
    diagram: "stack",
    evidence: { screen: ERDEN.admin!, project: "Erden Davetiye" },
  },
  {
    index: "06",
    title: { en: "Release", tr: "Yayın" },
    precis: {
      en: "Getting it out, and keeping it out.",
      tr: "Yayına almak ve yayında tutmak.",
    },
    detail: {
      en: "Deployment, environments, the store submission, the things that break at two in the morning. A product that is not live is a prototype, and both of the projects on this site are live.",
      tr: "Yayınlama, ortamlar, mağaza başvurusu, gece ikide bozulan şeyler. Yayında olmayan ürün prototiptir; bu sitedeki iki proje de yayında.",
    },
    methods: {
      en: ["Deployment", "Environments", "Monitoring", "Handover"],
      tr: ["Yayınlama", "Ortamlar", "İzleme", "Devir"],
    },
    diagram: "flow",
  },
];
