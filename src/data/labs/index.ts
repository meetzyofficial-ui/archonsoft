import type { IconName } from "@/components/labs/Icon";
import { CONCEPTS_A } from "@/data/labs/concepts-a";
import { CONCEPTS_B } from "@/data/labs/concepts-b";
import { CONCEPTS_C } from "@/data/labs/concepts-c";
import { EXTRA_VIEWS } from "@/data/labs/extra-views";
import { RELATIONS, STACK_NOTES, STORIES } from "@/data/labs/stories";
import type { Lab, LabBase } from "@/data/labs/types";
import type { Localized } from "@/lib/i18n";

export * from "@/data/labs/types";
export * from "@/data/labs/stories";

/**
 * Ten concept products, assembled.
 *
 * The concept files carry the interface; `stories.ts` carries the five-beat
 * product story, the notes on each system layer and the links back to shipped
 * work; `extra-views.ts` adds the screens a demo normally skips. They are
 * merged here so a concept is complete at the point anything reads it, and so
 * none of those four files has to know about the others.
 *
 * Every one of them is labelled a concept on every surface it appears on.
 * That labelling is not a disclaimer bolted on at the end — it is the reason
 * the section is allowed to exist. A studio with two shipped products can
 * either invent eight more or build eight honestly and say so. This is the
 * second thing.
 */
const BASE: LabBase[] = [...CONCEPTS_A, ...CONCEPTS_B, ...CONCEPTS_C];

export const LABS: Lab[] = BASE.map((lab) => ({
  ...lab,
  views: [...lab.views, ...(EXTRA_VIEWS[lab.slug] ?? [])],
  story: STORIES[lab.slug]!,
  stack: STACK_NOTES[lab.slug] ?? {},
  relations: RELATIONS[lab.slug] ?? [],
}));

export const getLab = (slug: string): Lab | undefined =>
  LABS.find((lab) => lab.slug === slug);

export const getNextLab = (slug: string): Lab => {
  const current = LABS.findIndex((lab) => lab.slug === slug);
  return LABS[(current + 1) % LABS.length] as Lab;
};

/* ------------------------------------------------------------------------ */

export type Domain = {
  id: string;
  index: string;
  icon: IconName;
  title: Localized;
  /** One line. What this actually means when someone buys it. */
  precis: Localized;
  detail: Localized;
};

/**
 * The eight kinds of software, as domains rather than services.
 *
 * A service list describes what a studio sells. This describes what gets
 * built, which is the thing a visitor is actually trying to match against —
 * and every one of them resolves to a working interface further down the
 * page rather than to a paragraph.
 */
export const DOMAINS: Domain[] = [
  {
    id: "products",
    index: "01",
    icon: "box",
    title: { en: "Products", tr: "Ürünler" },
    precis: {
      en: "A thing people open, on a phone or in a browser.",
      tr: "İnsanların telefonda ya da tarayıcıda açtığı bir şey.",
    },
    detail: {
      en: "Defined, designed, built and released as one piece of work rather than handed between a design studio and a development shop.",
      tr: "Bir tasarım stüdyosu ile bir yazılım şirketi arasında devredilmek yerine, tek bir iş olarak tanımlanır, tasarlanır, kurulur ve yayınlanır.",
    },
  },
  {
    id: "systems",
    index: "02",
    icon: "grid",
    title: { en: "Systems", tr: "Sistemler" },
    precis: {
      en: "The admin a business is actually run from.",
      tr: "İşin gerçekten üzerinden yürütüldüğü yönetim tarafı.",
    },
    detail: {
      en: "Records, states, roles and permissions. This is the half that decides whether a project became software or stayed a website.",
      tr: "Kayıtlar, durumlar, roller ve yetkiler. Bir projenin yazılıma mı dönüştüğüne yoksa web sitesi olarak mı kaldığına karar veren yarı bu.",
    },
  },
  {
    id: "commerce",
    index: "03",
    icon: "cart",
    title: { en: "Commerce", tr: "Ticaret" },
    precis: {
      en: "Selling, and everything that has to stay correct while you do.",
      tr: "Satmak ve satarken doğru kalması gereken her şey.",
    },
    detail: {
      en: "Catalogue, variants, stock, checkout, payment states, coupons, returns — and an admin the shop can operate without calling anyone.",
      tr: "Katalog, varyant, stok, ödeme akışı, ödeme durumları, kupon, iade — ve dükkânın kimseyi aramadan yönetebildiği bir panel.",
    },
  },
  {
    id: "ai",
    index: "04",
    icon: "spark",
    title: { en: "AI", tr: "Yapay zekâ" },
    precis: {
      en: "A model inside a process, not beside one.",
      tr: "Sürecin yanına değil, içine yerleştirilmiş bir model.",
    },
    detail: {
      en: "Retrieval over your own records, answers that cite their source, thresholds that decide when not to answer, and a person on the other side of the line.",
      tr: "Kendi kayıtlarınız üzerinde getirme, kaynağını gösteren cevaplar, ne zaman cevap verilmeyeceğine karar veren eşikler ve çizginin öbür tarafında bir insan.",
    },
  },
  {
    id: "automation",
    index: "05",
    icon: "flow",
    title: { en: "Automation", tr: "Otomasyon" },
    precis: {
      en: "The work that repeats, done by the system.",
      tr: "Tekrar eden işi sistemin yapması.",
    },
    detail: {
      en: "Triggers, conditions, approvals and audit. The point is not fewer people — it is that the routine case stops needing one.",
      tr: "Tetikleyiciler, koşullar, onaylar ve denetim. Amaç daha az insan değil; rutin işin insana ihtiyaç duymayı bırakması.",
    },
  },
  {
    id: "data",
    index: "06",
    icon: "chart",
    title: { en: "Data", tr: "Veri" },
    precis: {
      en: "Knowing what happened, in time to do something.",
      tr: "Ne olduğunu, bir şey yapmaya yetecek zamanda bilmek.",
    },
    detail: {
      en: "Events modelled properly at the start, so funnels, cohorts and reports are queries later rather than an afternoon and an export.",
      tr: "Olayların en baştan düzgün modellenmesi; böylece huni, kohort ve raporlar sonradan bir öğleden sonra değil, bir sorgu olur.",
    },
  },
  {
    id: "integrations",
    index: "07",
    icon: "plug",
    title: { en: "Integrations", tr: "Entegrasyonlar" },
    precis: {
      en: "Making the systems you already pay for talk.",
      tr: "Zaten para verdiğiniz sistemleri konuşturmak.",
    },
    detail: {
      en: "Payment, mail, messaging, accounting, shipping and whatever internal thing has an endpoint — with the failure cases handled, which is where integrations are won or lost.",
      tr: "Ödeme, e-posta, mesajlaşma, muhasebe, kargo ve ucu olan hangi iç sistem varsa — hata durumları ele alınmış hâlde; entegrasyonların kazanıldığı ya da kaybedildiği yer orası.",
    },
  },
  {
    id: "infrastructure",
    index: "08",
    icon: "database",
    title: { en: "Infrastructure", tr: "Altyapı" },
    precis: {
      en: "It stays up, and it can be changed on a Tuesday.",
      tr: "Ayakta kalır ve salı günü değiştirilebilir.",
    },
    detail: {
      en: "Data modelling, authentication, environments, releases, backups and the boring correctness that only becomes visible the day it is missing.",
      tr: "Veri modelleme, kimlik doğrulama, ortamlar, sürümler, yedekler ve ancak olmadığı gün görünür hâle gelen o sıkıcı doğruluk.",
    },
  },
];

export const getDomain = (id: string): Domain | undefined =>
  DOMAINS.find((domain) => domain.id === id);

/** Concepts that demonstrate a given domain, in canonical order. */
export const labsForDomain = (id: string): Lab[] =>
  LABS.filter((lab) => lab.domains.includes(id));
