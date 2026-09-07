import type { Localized } from "@/lib/i18n";

/** How Archon works, and the facts about it that are actually verified. */

export type Principle = { index: string; title: Localized; body: Localized };

export const PRINCIPLES: Principle[] = [
  {
    index: "01",
    title: { en: "Decide before you build", tr: "Kurmadan önce karar ver" },
    body: {
      en: "Most of the cost of software is set in the week before anyone opens an editor. That week gets spent properly, in the open, with the person who owns the outcome.",
      tr: "Yazılımın maliyetinin çoğu, kimse editörü açmadan önceki hafta belirlenir. O hafta açıkta ve sonucun sahibiyle birlikte düzgün harcanır.",
    },
  },
  {
    index: "02",
    title: { en: "No handovers", tr: "Devir teslim yok" },
    body: {
      en: "Design and engineering are the same conversation held in two notations. One person carrying both means nothing gets lost between the file and the build.",
      tr: "Tasarım ve mühendislik, iki farklı notasyonla yapılan aynı konuşmadır. İkisini tek kişinin taşıması, dosya ile build arasında hiçbir şeyin kaybolmaması demek.",
    },
  },
  {
    index: "03",
    title: { en: "Ship the smallest honest version", tr: "En küçük dürüst sürümü yayınla" },
    body: {
      en: "A narrow product that works beats a broad one that almost does. Scope is the first thing cut and the last thing padded.",
      tr: "Çalışan dar bir ürün, neredeyse çalışan geniş bir üründen iyidir. Kapsam ilk kesilen, en son şişirilen şeydir.",
    },
  },
  {
    index: "04",
    title: { en: "Build the admin too", tr: "Yönetim panelini de yap" },
    body: {
      en: "If the people running the business cannot change it themselves, the project never finished. The operations surface is part of the product, not an extra.",
      tr: "İşi yürütenler kendileri değiştiremiyorsa, proje hiç bitmemiştir. Operasyon ekranı ürünün parçasıdır, ek bir kalem değil.",
    },
  },
  {
    index: "05",
    title: { en: "Write it down", tr: "Yaz" },
    body: {
      en: "Tokens, schemas, decisions and their reasons. A system nobody can read is a system only one person can maintain — and being that person is not a business model.",
      tr: "Tokenlar, şemalar, kararlar ve gerekçeleri. Kimsenin okuyamadığı bir sistem, yalnızca bir kişinin sürdürebileceği bir sistemdir; o kişi olmak da bir iş modeli değil.",
    },
  },
  {
    index: "06",
    title: { en: "Hand it over properly", tr: "Düzgün devret" },
    body: {
      en: "The work is finished when your team can run it without me. Documentation and handover are part of the build, not a line at the end of an invoice.",
      tr: "İş, ekibin onu bensiz yürütebildiğinde biter. Dokümantasyon ve devir, işin parçasıdır; faturanın sonundaki bir satır değil.",
    },
  },
];

export type Phase = { index: string; title: Localized; body: Localized };

export const PROCESS: Phase[] = [
  {
    index: "01",
    title: { en: "Frame", tr: "Çerçeve" },
    body: {
      en: "We agree on the actual problem, the constraints around it and what a good outcome looks like in plain language.",
      tr: "Gerçek problem, etrafındaki kısıtlar ve iyi bir sonucun ne olduğu üzerinde açık bir dille anlaşırız.",
    },
  },
  {
    index: "02",
    title: { en: "Shape", tr: "Biçim" },
    body: {
      en: "Structure, interface and architecture designed together until the product is specific enough to argue with.",
      tr: "Yapı, arayüz ve mimari, ürün tartışılabilecek kadar somut olana dek birlikte tasarlanır.",
    },
  },
  {
    index: "03",
    title: { en: "Build", tr: "Yapım" },
    body: {
      en: "Short cycles against a working build. You see the real thing early and often, not a deck describing it.",
      tr: "Çalışan bir build üzerinden kısa döngüler. Gerçek şeyi erken ve sık görürsün, onu anlatan bir sunumu değil.",
    },
  },
  {
    index: "04",
    title: { en: "Release", tr: "Yayın" },
    body: {
      en: "Launch, document, hand over. Then the part most people skip: the release after the release.",
      tr: "Yayın, dokümantasyon, devir. Sonra çoğu kişinin atladığı kısım: yayından sonraki yayın.",
    },
  },
];

/**
 * Verified facts about the studio. Nothing here was inferred — every line was
 * stated directly. There is deliberately no technology list: none has been
 * confirmed, and guessing one would be the exact kind of claim this site does
 * not make.
 */
export const STUDIO_FACTS: { label: Localized; value: Localized }[] = [
  {
    label: { en: "Studio", tr: "Stüdyo" },
    value: { en: "One person", tr: "Tek kişi" },
  },
  {
    label: { en: "Based in", tr: "Konum" },
    value: { en: "Ankara, Turkey", tr: "Ankara, Türkiye" },
  },
  {
    label: { en: "Working since", tr: "Faaliyet süresi" },
    value: { en: "About two years", tr: "Yaklaşık iki yıl" },
  },
  {
    label: { en: "Live products", tr: "Canlı ürün" },
    value: { en: "Two", tr: "İki" },
  },
];
